// "Habitar": live inside a unit. Baked light layers mixed live, real sun for Asunción,
// switchable lamps, curtains, TV, faucet, steam; walk, magic window, VR and AR portal.

import {
	AgXToneMapping,
	BackSide,
	Box3,
	Clock,
	Color,
	CubeCamera,
	DirectionalLight,
	DoubleSide,
	HalfFloatType,
	Material,
	Mesh,
	MeshPhysicalMaterial,
	MeshStandardMaterial,
	Object3D,
	PCFSoftShadowMap,
	PerspectiveCamera,
	PMREMGenerator,
	Raycaster,
	Scene,
	ShaderChunk,
	ShaderMaterial,
	SphereGeometry,
	SRGBColorSpace,
	Texture,
	TextureLoader,
	Vector3,
	WebGLCubeRenderTarget,
	WebGLRenderer,
	type WebGLRenderTarget,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { LightLayerSet, type LayerInfo } from './LightLayers';
import { WalkControls, MagicWindow } from './WalkControls';
import { Steam, FaucetWater, TVScreen, Sounds } from './life';
import { XRSessionManager } from './xr';
import { h, svgIcon, ICONS, toast, Loader, brand } from '../shared/dom';
import { tr, pick, lang, setLang } from '../shared/i18n';
import { sunPosition, localDate, localHoursNow, formatClock, sunENU, sunColor } from '../shared/solar';
import { clamp, lerp, smoothstep } from '../shared/tween';
import '../styles/home.css';

const BASE = import.meta.env.BASE_URL;

interface Manifest {
	id: string;
	title: string;
	location: { lat: number; lon: number; utcOffset: number; city: string };
	floorHeight?: number;
	model: string;
	lightmap: { size?: number; encoding: string; atlases?: Record<string, number> };
	layers: LayerInfo[];
	sun: { strength: number; seasons: Record<string, { date: string; keys: { time: string; azimuth: number; elevation: number; layer?: string }[] }> };
	sky: { color: [ number, number, number ]; strength: number };
	room: { min: [ number, number, number ]; max: [ number, number, number ] };
	window: { min: [ number, number, number ]; max: [ number, number, number ] };
	background: { day?: string; night?: string; offset?: number };
	views: { id: string; label: [ string, string ]; at: [ number, number, number ]; look: [ number, number, number ] }[];
	lights: { id: string; label: [ string, string ]; color: [ number, number, number ]; at: [ number, number, number ] | null }[];
	interactive: { faucet: { at: [ number, number, number ] } };
}

type Season = string;

interface SceneState {
	hours: number;
	season: Season;
	curtains: number; // 0 open .. 1 closed
	lights: Record<string, number>;
	tv: boolean;
	cooking: boolean;
	faucet: boolean;
}

const SCENES: { id: string; label: [ string, string ]; state: Partial<SceneState> }[] = [
	{ id: 'domingo', label: [ 'Domingo a la mañana', 'Sunday morning' ], state: { hours: 9.2, curtains: 0, lights: { lamp: 0, pendant: 0, ceiling: 0, kitchen: 0, tv: 0 }, tv: false, cooking: true, faucet: false } },
	{ id: 'cocinando', label: [ 'Cocinando', 'Cooking' ], state: { hours: 19.4, curtains: 0, lights: { lamp: 0.6, pendant: 0, ceiling: 0.35, kitchen: 1, tv: 0 }, tv: false, cooking: true, faucet: false } },
	{ id: 'cena', label: [ 'Cena para dos', 'Dinner for two' ], state: { hours: 20.8, curtains: 0, lights: { lamp: 0.7, pendant: 1, ceiling: 0, kitchen: 0.3, tv: 0 }, tv: false, cooking: false, faucet: false } },
	{ id: 'pelicula', label: [ 'Noche de película', 'Movie night' ], state: { hours: 22.3, curtains: 1, lights: { lamp: 0.45, pendant: 0, ceiling: 0, kitchen: 0, tv: 1 }, tv: true, cooking: false, faucet: false } },
];

/** glTF node extras land in userData; multi-material meshes keep them on the parent group. */
function tag( o: Object3D, key: string ): string | undefined {

	return ( o.userData[ key ] ?? o.parent?.userData[ key ] ) as string | undefined;

}

function v3( a: [ number, number, number ] ) {

	return new Vector3( a[ 0 ], a[ 1 ], a[ 2 ] );

}

function parseHours( t: string ) {

	const [ hh, mm ] = t.split( ':' ).map( Number );
	return hh + mm / 60;

}

/** Removes image-based diffuse lighting from lightmapped materials (the lightmap already has it). */
function patchNoIBLDiffuse( mat: MeshStandardMaterial ) {

	const chunk = ShaderChunk.lights_fragment_maps.replace( 'iblIrradiance += getIBLIrradiance( geometryNormal );', '' );
	mat.onBeforeCompile = shader => {

		shader.fragmentShader = shader.fragmentShader.replace( '#include <lights_fragment_maps>', chunk );

	};
	mat.customProgramCacheKey = () => 'lm-no-ibl-diffuse';

}

export async function mountHome( root: HTMLElement, params: URLSearchParams ) {

	const unitId = params.get( 'unit' ) || 'demo-unit-villa-morra';
	const fromListing = params.get( 'from' );
	const unitBase = `${ BASE }home/${ unitId }/`;

	// ---------------------------------------------------------------- renderer
	const renderer = new WebGLRenderer( { antialias: true, alpha: true, stencil: true, powerPreference: 'high-performance' } );
	renderer.setPixelRatio( Math.min( window.devicePixelRatio, 2 ) );
	renderer.setSize( root.clientWidth, root.clientHeight );
	renderer.outputColorSpace = SRGBColorSpace;
	renderer.toneMapping = AgXToneMapping;
	renderer.toneMappingExposure = 1.0;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = PCFSoftShadowMap;
	renderer.xr.enabled = true;
	renderer.setClearColor( 0x07090d, 1 );
	renderer.domElement.className = 'stage';
	renderer.domElement.tabIndex = 0;
	root.append( renderer.domElement );

	const scene = new Scene();
	const camera = new PerspectiveCamera( 62, root.clientWidth / root.clientHeight, 0.05, 400 );
	const unitRoot = new Object3D();
	scene.add( unitRoot );

	const loader = new Loader( root, tr( 'Preparando la unidad', 'Preparing the unit' ), tr( 'Cargando geometría y luz…', 'Loading geometry and light…' ) );

	// ---------------------------------------------------------------- data
	let manifest: Manifest;
	try {

		manifest = await ( await fetch( unitBase + 'manifest.json' ) ).json();

	} catch {

		loader.progress( 0, tr( 'No se encontró la unidad. Corré el pipeline de Blender (ver README).', 'Unit not found. Run the Blender pipeline (see README).' ) );
		return () => renderer.dispose();

	}

	const loc = manifest.location;
	const seasons = Object.keys( manifest.sun.seasons );
	const startSeason = seasons.includes( 'invierno' ) ? 'invierno' : seasons[ 0 ];
	const loadedSeasons = new Set( [ startSeason ] );

	const layers = new LightLayerSet( renderer, manifest.lightmap.atlases ?? { arch: manifest.lightmap.size ?? 1024 } );
	const draco = new DRACOLoader().setDecoderPath( `${ BASE }draco/` );
	const gltfLoader = new GLTFLoader().setDRACOLoader( draco ).setMeshoptDecoder( MeshoptDecoder );

	let p1 = 0, p2 = 0;
	const report = () => loader.progress( 0.1 + 0.45 * p1 + 0.45 * p2 );
	const [ gltf ] = await Promise.all( [
		gltfLoader.loadAsync( unitBase + manifest.model, e => {

			if ( e.total ) p1 = e.loaded / e.total;
			report();

		} ),
		// only the starting season's sun layers up front; the other season loads on demand
		layers.load( unitBase, manifest.layers.filter( L => L.kind !== 'sun' || L.season === startSeason ), p => {

			p2 = p;
			report();

		} ),
	] );
	unitRoot.add( gltf.scene );
	gltf.scene.updateMatrixWorld( true );

	// ---------------------------------------------------------------- materials & roles
	const interactive: Object3D[] = [];
	const floorMeshes: Object3D[] = [];
	const curtains: Object3D[] = [];
	const emitters: { mesh: Mesh; light: string; mat: MeshStandardMaterial }[] = [];
	const lampshades: { mat: MeshStandardMaterial; light: string }[] = [];
	const hideInPortal: Object3D[] = [];
	let tvMat: MeshStandardMaterial | null = null;
	let pendantMats: MeshStandardMaterial[] = [];
	let potTop: Vector3 | null = null;
	const tvScreen = new TVScreen();

	gltf.scene.traverse( o => {

		const mesh = o as Mesh;
		if ( ! mesh.isMesh ) return;
		const role = tag( mesh, 'role' );
		const fid = tag( mesh, 'fid' );
		const mats = ( Array.isArray( mesh.material ) ? mesh.material : [ mesh.material ] ) as MeshStandardMaterial[];
		const hasLightmap = !! mesh.geometry.attributes.uv1;
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mats.forEach( m => {

			if ( hasLightmap ) {

				m.lightMap = layers.texture( tag( mesh, 'atlas' ) ?? 'arch' );
				m.lightMapIntensity = Math.PI;
				patchNoIBLDiffuse( m );

			}

			m.envMapIntensity = hasLightmap ? 0.9 : 1.0;

		} );

		if ( role === 'static' ) floorMeshes.push( mesh );
		if ( role === 'glass' ) {

			mesh.material = new MeshPhysicalMaterial( { color: 0xffffff, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.1, depthWrite: false, envMapIntensity: 1.4 } );
			mesh.castShadow = false;
			mesh.renderOrder = 3;

		}

		if ( role === 'curtain' ) {

			curtains.push( mesh );
			interactive.push( mesh );
			mats.forEach( m => {

				m.side = DoubleSide;
				m.transparent = false;

			} );

		}

		if ( role === 'door' ) hideInPortal.push( mesh );
		if ( role === 'faucet' ) interactive.push( mesh );
		if ( role === 'lampshade' ) {

			interactive.push( mesh );
			mats.forEach( m => {

				m.side = DoubleSide;
				m.emissive = new Color( 1.0, 0.72, 0.42 );
				m.emissiveIntensity = 0;
				lampshades.push( { mat: m, light: tag( mesh, 'light' ) ?? 'lamp' } );

			} );

		}

		if ( role === 'emitter' ) {

			mesh.castShadow = false;
			mats.forEach( m => {

				m.emissive = new Color( 1.0, 0.86, 0.66 );
				m.emissiveIntensity = 0;
				emitters.push( { mesh, light: tag( mesh, 'light' ) ?? '', mat: m } );

			} );
			interactive.push( mesh );

		}

		if ( role === 'tv' ) {

			const m = new MeshStandardMaterial( { color: 0x050506, roughness: 0.08, metalness: 0, emissive: 0xffffff, emissiveMap: tvScreen.texture, emissiveIntensity: 0 } );
			mesh.material = m;
			tvMat = m;
			mesh.castShadow = false;
			interactive.push( mesh );

		}

		if ( fid === 'pendant' ) {

			pendantMats = mats;
			mats.forEach( m => {

				m.emissive = new Color( 1.0, 0.78, 0.5 );
				m.emissiveIntensity = 0;

			} );
			interactive.push( mesh );

		}

		if ( fid === 'pot' ) {

			const b = new Box3().setFromObject( mesh );
			potTop = new Vector3( ( b.min.x + b.max.x ) / 2, b.max.y + 0.01, ( b.min.z + b.max.z ) / 2 );
			interactive.push( mesh );

		}

	} );

	// ---------------------------------------------------------------- sun, sky, background
	const roomMin = v3( manifest.room.min );
	const roomMax = v3( manifest.room.max );
	const bounds = { min: new Vector3( Math.min( roomMin.x, roomMax.x ), 0, Math.min( roomMin.z, roomMax.z ) ), max: new Vector3( Math.max( roomMin.x, roomMax.x ), 3, Math.max( roomMin.z, roomMax.z ) ) };
	const roomCenter = bounds.min.clone().add( bounds.max ).multiplyScalar( 0.5 ).setY( 1.3 );

	const sun = new DirectionalLight( 0xffffff, 0 );
	sun.castShadow = true;
	sun.shadow.mapSize.set( 2048, 2048 );
	sun.shadow.bias = - 0.0004;
	sun.shadow.normalBias = 0.025;
	const sc = sun.shadow.camera;
	sc.left = - 7; sc.right = 7; sc.top = 7; sc.bottom = - 7; sc.near = 0.5; sc.far = 40;
	sun.target.position.copy( roomCenter );
	unitRoot.add( sun, sun.target );

	const texLoader = new TextureLoader();
	const loadTex = ( f?: string ) => f ? texLoader.loadAsync( unitBase + f ).then( t => {

		t.colorSpace = SRGBColorSpace;
		return t;

	} ).catch( () => null ) : Promise.resolve( null );
	const bgDay = await loadTex( manifest.background.day );
	const bgMat = new ShaderMaterial( {
		side: BackSide,
		depthWrite: false,
		toneMapped: false,
		uniforms: {
			uDay: { value: bgDay as Texture | null },
			uHasDay: { value: bgDay ? 1 : 0 },
			uOffset: { value: manifest.background.offset ?? 0 },
			uMix: { value: 0 },
			uIntensity: { value: 1 },
			uTint: { value: new Color( 1, 1, 1 ) },
		},
		vertexShader: /* glsl */`
			varying vec2 vUv;
			void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }`,
		fragmentShader: /* glsl */`
			uniform sampler2D uDay; uniform float uHasDay; uniform float uOffset;
			uniform float uMix; uniform float uIntensity; uniform vec3 uTint;
			varying vec2 vUv;
			float hash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }
			// night over the city: deep sky, warm horizon glow, streets of lights below
			vec3 night( vec2 uv ) {
				float e = ( uv.y - 0.5 ) * 3.14159;
				vec3 c;
				if ( e > 0.0 ) {
					c = mix( vec3( 0.09, 0.07, 0.12 ), vec3( 0.006, 0.01, 0.03 ), pow( e / 1.5708, 0.35 ) );
					vec2 sc = floor( uv * vec2( 900.0, 450.0 ) );
					c += step( 0.9975, hash( sc ) ) * 0.25 * smoothstep( 0.05, 0.4, e );
				} else {
					float d = -e;
					c = vec3( 0.012, 0.012, 0.018 ) + vec3( 0.07, 0.045, 0.03 ) * exp( -d * 9.0 );
					float density = mix( 220.0, 40.0, smoothstep( 0.0, 0.6, d ) );
					vec2 g = uv * vec2( density * 4.0, density * 2.0 );
					vec2 cell = floor( g );
					vec2 f = fract( g ) - 0.5;
					float h = hash( cell );
					float street = step( 0.72, hash( vec2( cell.y, 3.0 ) ) ) + step( 0.8, hash( vec2( cell.x, 7.0 ) ) );
					float lit = step( 0.62 - 0.25 * street, h );
					float r = mix( 0.12, 0.3, hash( cell + 1.7 ) );
					float dotv = smoothstep( r, 0.0, length( f ) ) * lit;
					vec3 col = mix( vec3( 1.0, 0.72, 0.4 ), vec3( 0.85, 0.9, 1.0 ), step( 0.7, hash( cell + 5.3 ) ) );
					c += col * dotv * mix( 0.9, 0.35, smoothstep( 0.0, 0.5, d ) );
				}
				return c;
			}
			void main() {
				vec2 uv = vec2( fract( 1.0 - vUv.x + uOffset ), vUv.y );
				vec3 day = uHasDay > 0.5 ? texture2D( uDay, uv ).rgb : vec3( 0.6, 0.72, 0.85 );
				vec3 c = mix( day * uIntensity * uTint, night( uv ), uMix );
				gl_FragColor = vec4( c, 1.0 );
				#include <colorspace_fragment>
			}`,
	} );
	const bgSphere = new Mesh( new SphereGeometry( 150, 48, 24 ), bgMat );
	bgSphere.renderOrder = - 10;
	bgSphere.position.copy( roomCenter );
	// floor height: look slightly down onto the city
	bgSphere.position.y = roomCenter.y + 6;
	unitRoot.add( bgSphere );

	// ---------------------------------------------------------------- environment (reflections)
	const cubeRT = new WebGLCubeRenderTarget( 128, { type: HalfFloatType } );
	const cubeCam = new CubeCamera( 0.05, 300, cubeRT );
	cubeCam.position.copy( roomCenter );
	const pmrem = new PMREMGenerator( renderer );
	let envRT: WebGLRenderTarget | null = null;
	let envDirty = true;
	let lastEnv = 0;
	const captureEnv = () => {

		const xr = renderer.xr.enabled;
		renderer.xr.enabled = false;
		cubeCam.update( renderer, scene );
		renderer.xr.enabled = xr;
		const next = pmrem.fromCubemap( cubeRT.texture );
		scene.environment = next.texture;
		envRT?.dispose();
		envRT = next;

	};

	// ---------------------------------------------------------------- life
	const steam = new Steam( potTop ?? new Vector3( 1.55, 0.95, 2.69 ) );
	unitRoot.add( steam.points );
	const water = new FaucetWater( v3( manifest.interactive.faucet.at ), 0.31 );
	unitRoot.add( water.mesh );
	const sounds = new Sounds();

	// ---------------------------------------------------------------- state
	const state: SceneState = {
		hours: 15.5,
		season: startSeason,
		curtains: 0,
		lights: Object.fromEntries( manifest.lights.map( l => [ l.id, 0 ] ) ),
		tv: false,
		cooking: false,
		faucet: false,
	};
	// smoothed values that follow the state
	const live = { curtains: 0, lights: { ...state.lights } as Record<string, number> };
	let playing = false;

	const sunKeys = () => manifest.sun.seasons[ state.season ].keys.map( k => ( { ...k, hours: parseHours( k.time ) } ) );

	function sunNow() {

		const date = localDate( manifest.sun.seasons[ state.season ].date, state.hours, loc.utcOffset );
		return sunPosition( date, loc.lat, loc.lon );

	}

	function applyLighting( time: number ) {

		const sp = sunNow();
		const el = sp.elevation;
		const windowFactor = 1 - 0.8 * live.curtains;

		// --- real-time direct sun (moves across the floor)
		const enu = sunENU( sp );
		const dir = new Vector3( enu[ 0 ], enu[ 2 ], - enu[ 1 ] );
		sun.position.copy( roomCenter ).addScaledVector( dir, 20 );
		const vis = smoothstep( - 0.5, 5, el );
		const sc = sunColor( el );
		sun.color.setRGB( sc[ 0 ], sc[ 1 ], sc[ 2 ] );
		sun.intensity = manifest.sun.strength * vis * ( 1 - 0.85 * live.curtains );
		sun.visible = vis > 0.001;

		// --- bounced sun from the baked keys around the current time
		const keys = sunKeys().filter( k => k.layer );
		for ( const L of manifest.layers ) if ( L.kind === 'sun' && L.season !== state.season ) layers.set( L.id, 0 );
		const tint: [ number, number, number ] = [ sc[ 0 ] * windowFactor, sc[ 1 ] * windowFactor, sc[ 2 ] * windowFactor ];
		const weights = new Map<string, number>();
		if ( keys.length ) {

			const hNow = state.hours;
			if ( hNow <= keys[ 0 ].hours ) {

				weights.set( keys[ 0 ].layer!, clamp( el / Math.max( 1, keys[ 0 ].elevation ), 0, 1 ) );

			} else if ( hNow >= keys[ keys.length - 1 ].hours ) {

				const last = keys[ keys.length - 1 ];
				weights.set( last.layer!, clamp( el / Math.max( 1, last.elevation ), 0, 1 ) );

			} else {

				for ( let i = 0; i < keys.length - 1; i ++ ) {

					const a = keys[ i ], b = keys[ i + 1 ];
					if ( hNow >= a.hours && hNow <= b.hours ) {

						const f = ( hNow - a.hours ) / ( b.hours - a.hours );
						weights.set( a.layer!, 1 - f );
						weights.set( b.layer!, f );

					}

				}

			}

		}

		for ( const k of keys ) layers.set( k.layer!, weights.get( k.layer! ) ?? 0, tint );

		// --- sky through the windows: bright by day, blue at dusk, faint city glow at night
		const day = smoothstep( - 6, 12, el );
		const dusk = smoothstep( - 8, 0, el ) * ( 1 - smoothstep( 0, 10, el ) );
		const skyLevel = 0.04 + 0.96 * day;
		const skyTint = new Color( lerp( 0.55, 1.0, day ), lerp( 0.6, 1.0, day ), lerp( 0.85, 1.0, day ) ).lerp( new Color( 1.0, 0.72, 0.55 ), dusk * 0.5 );
		layers.set( 'sky', skyLevel * windowFactor, skyTint.multiplyScalar( 1 ) );

		// --- artificial lights
		for ( const l of manifest.lights ) {

			if ( l.id === 'tv' ) continue;
			layers.set( l.id, live.lights[ l.id ] ?? 0 );

		}

		// TV lights the room with the colour of the picture
		const tvLevel = live.lights.tv ?? 0;
		if ( tvLevel > 0.001 ) {

			const m = tvScreen.mean;
			const lum = 0.2126 * m.r + 0.7152 * m.g + 0.0722 * m.b;
			const n = Math.max( 0.05, Math.max( m.r, m.g, m.b ) );
			layers.set( 'tv', tvLevel * ( 0.3 + 2.2 * lum ), [ m.r / n, m.g / n, m.b / n ] );

		} else layers.set( 'tv', 0 );

		// emissive fixtures follow their lights
		for ( const e of emitters ) e.mat.emissiveIntensity = ( live.lights[ e.light ] ?? 0 ) * 6;
		for ( const s of lampshades ) s.mat.emissiveIntensity = ( live.lights[ s.light ] ?? 0 ) * 0.9;
		for ( const m of pendantMats ) m.emissiveIntensity = ( live.lights.pendant ?? 0 ) * 0.7;
		if ( tvMat ) ( tvMat as MeshStandardMaterial ).emissiveIntensity = tvLevel * 1.6;

		// curtains: gather to the sides when open
		for ( const c of curtains ) c.scale.x = lerp( 0.13, 1, live.curtains );

		// window view: day / night photo, dimmer at dusk
		bgMat.uniforms.uMix.value = 1 - smoothstep( - 4, 3, el );
		bgMat.uniforms.uIntensity.value = lerp( 0.55, 1.0, smoothstep( - 4, 15, el ) ) * ( 1 - 0.9 * live.curtains );
		( bgMat.uniforms.uTint.value as Color ).set( 1, 1, 1 ).lerp( new Color( 1.0, 0.82, 0.68 ), dusk * 0.6 );

		// exposure: open up a little at night, like an eye adapting
		renderer.toneMappingExposure = lerp( 1.35, 1.0, smoothstep( - 6, 10, el ) );

		if ( layers.update() ) envDirty = true;
		if ( envDirty && time - lastEnv > 0.35 && ! renderer.xr.isPresenting ) {

			envDirty = false;
			lastEnv = time;
			captureEnv();

		}

	}

	// ---------------------------------------------------------------- controls
	camera.position.set( 0, 1.6, 0 );
	const firstView = manifest.views.find( v => v.id === 'entrada' ) ?? manifest.views[ 0 ];
	camera.position.copy( v3( firstView.at ) );
	camera.lookAt( v3( firstView.look ) );
	const walk = new WalkControls( camera, renderer.domElement, bounds );
	const magic = new MagicWindow();
	const raycaster = new Raycaster();

	function useObject( o: Object3D | null ): boolean {

		while ( o && ! interactive.includes( o ) ) o = o.parent;
		if ( ! o ) return false;
		const role = tag( o, 'role' );
		const fid = tag( o, 'fid' );
		if ( role === 'curtain' ) setCurtains( state.curtains > 0.5 ? 0 : 1 );
		else if ( role === 'faucet' ) setFaucet( ! state.faucet );
		else if ( role === 'tv' ) setTV( ! state.tv );
		else if ( role === 'lampshade' || role === 'emitter' ) toggleLight( tag( o, 'light' ) ?? '' );
		else if ( fid === 'pendant' ) toggleLight( 'pendant' );
		else if ( fid === 'pot' ) setCooking( ! state.cooking );
		else return false;
		return true;

	}

	walk.onTap = ndc => {

		raycaster.setFromCamera( ndc, camera );
		const hits = raycaster.intersectObjects( unitRoot.children, true ).filter( h => h.object !== bgSphere && h.object.visible && h.object !== steam.points );
		const hit = hits[ 0 ];
		if ( ! hit ) return;
		if ( useObject( hit.object ) ) return;
		// floor → walk there
		if ( hit.face && hit.face.normal.y > 0.8 && hit.point.y < 0.2 ) walk.walkTo( hit.point );

	};

	const xr = new XRSessionManager( renderer, scene, camera, unitRoot, {
		select: rc => {

			const hit = rc.intersectObjects( interactive, true )[ 0 ];
			return hit ? useObject( hit.object ) : false;

		},
		floor: floorMeshes,
		doorway: { at: new Vector3( - 2.425, 0, 3.0 ), inward: new Vector3( 0, 0, - 1 ), width: 0.95, height: 2.15 },
		hideInPortal,
		onStart: () => {

			walk.enabled = false;
			ui.classList.add( 'in-xr' );

		},
		onEnd: () => {

			walk.enabled = true;
			walk.syncFromCamera();
			ui.classList.remove( 'in-xr' );

		},
	} );

	// ---------------------------------------------------------------- actions
	function toggleLight( id: string ) {

		state.lights[ id ] = state.lights[ id ] > 0.01 ? 0 : 1;
		if ( id === 'tv' ) state.tv = state.lights[ id ] > 0;
		syncUI();

	}

	function setCurtains( v: number ) {

		state.curtains = v;
		syncUI();

	}

	function setTV( on: boolean ) {

		state.tv = on;
		state.lights.tv = on ? 1 : 0;
		syncUI();

	}

	function setFaucet( on: boolean ) {

		state.faucet = on;
		water.set( on );
		sounds.set( 'water', on ? 0.22 : 0 );
		syncUI();

	}

	function setCooking( on: boolean ) {

		state.cooking = on;
		steam.set( on );
		sounds.set( 'sizzle', on ? 0.05 : 0 );
		syncUI();

	}

	function applyScene( s: Partial<SceneState> ) {

		if ( s.hours !== undefined ) animateHours( s.hours );
		if ( s.curtains !== undefined ) state.curtains = s.curtains;
		if ( s.lights ) Object.assign( state.lights, s.lights );
		if ( s.tv !== undefined ) setTV( s.tv );
		if ( s.cooking !== undefined ) setCooking( s.cooking );
		if ( s.faucet !== undefined ) setFaucet( s.faucet );
		syncUI();

	}

	let hourAnim = 0;
	function animateHours( target: number ) {

		cancelAnimationFrame( hourAnim );
		const from = state.hours;
		const t0 = performance.now();
		const step = () => {

			const t = Math.min( 1, ( performance.now() - t0 ) / 2200 );
			const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow( - 2 * t + 2, 3 ) / 2;
			state.hours = lerp( from, target, e );
			syncTimeUI();
			if ( t < 1 ) hourAnim = requestAnimationFrame( step );

		};

		step();

	}

	// ---------------------------------------------------------------- UI
	const ui = h( 'div', { class: 'home-ui' } );
	root.append( ui );

	const clockEl = h( 'div', { class: 'clock mono' } );
	const sunIcon = h( 'span', { class: 'clock-icon' } );
	const slider = h( 'input', { type: 'range', min: '0', max: '24', step: '0.05', class: 'time-slider', 'aria-label': tr( 'Hora del día', 'Time of day' ) } ) as HTMLInputElement;
	slider.addEventListener( 'input', () => {

		cancelAnimationFrame( hourAnim );
		state.hours = parseFloat( slider.value );
		syncTimeUI();

	} );
	const playBtn = h( 'button', { class: 'btn icon', title: tr( 'Ver el día pasar', 'Watch the day go by' ), onclick: () => {

		playing = ! playing;
		syncUI();

	} } );
	const nowBtn = h( 'button', { class: 'btn', onclick: () => {

		const month = new Date().getUTCMonth() + 1;
		const southSummer = month >= 10 || month <= 3;
		if ( southSummer && seasons.includes( 'verano' ) ) setSeason( 'verano' );
		else if ( seasons.includes( 'invierno' ) ) setSeason( 'invierno' );
		animateHours( localHoursNow( loc.utcOffset ) );
		syncUI();
		toast( tr( `Hora actual en ${ loc.city }`, `Current time in ${ loc.city }` ) );

	} }, tr( 'Ahora', 'Now' ) );
	async function setSeason( s: string ) {

		if ( ! loadedSeasons.has( s ) ) {

			loadedSeasons.add( s );
			toast( tr( 'Cargando la luz de esa estación…', 'Loading that season\'s light…' ) );
			await layers.load( unitBase, manifest.layers.filter( L => L.kind === 'sun' && L.season === s ) );

		}

		state.season = s;
		syncUI();

	}

	const seasonBtns = seasons.map( s => h( 'button', { class: 'seg', 'data-season': s, onclick: () => setSeason( s ) }, s === 'invierno' ? tr( 'Invierno', 'Winter' ) : s === 'verano' ? tr( 'Verano', 'Summer' ) : s ) );
	const dateEl = h( 'div', { class: 'date-note' } );

	const timePanel = h( 'div', { class: 'time-panel panel' },
		h( 'div', { class: 'time-row' }, sunIcon, clockEl, h( 'div', { class: 'segmented' }, ...seasonBtns ), h( 'div', { class: 'spacer' } ), nowBtn, playBtn ),
		slider,
		dateEl,
	);

	const lightBtns = new Map<string, HTMLButtonElement>();
	const lightsList = h( 'div', { class: 'ctrl-list' } );
	for ( const l of manifest.lights ) {

		if ( l.id === 'tv' ) continue;
		const b = h( 'button', { class: 'btn ctrl', onclick: () => toggleLight( l.id ) }, svgIcon( ICONS.bulb, 16 ), pick( l.label ) ) as HTMLButtonElement;
		lightBtns.set( l.id, b );
		lightsList.append( b );

	}

	const curtainBtn = h( 'button', { class: 'btn ctrl', onclick: () => setCurtains( state.curtains > 0.5 ? 0 : 1 ) }, svgIcon( ICONS.curtain, 16 ), tr( 'Cortinas', 'Curtains' ) ) as HTMLButtonElement;
	const tvBtn = h( 'button', { class: 'btn ctrl', onclick: () => setTV( ! state.tv ) }, svgIcon( ICONS.tv, 16 ), tr( 'Televisor', 'TV' ) ) as HTMLButtonElement;
	const faucetBtn = h( 'button', { class: 'btn ctrl', onclick: () => setFaucet( ! state.faucet ) }, svgIcon( ICONS.drop, 16 ), tr( 'Canilla', 'Faucet' ) ) as HTMLButtonElement;
	const cookBtn = h( 'button', { class: 'btn ctrl', onclick: () => setCooking( ! state.cooking ) }, svgIcon( ICONS.steam, 16 ), tr( 'Olla al fuego', 'Pot on the stove' ) ) as HTMLButtonElement;
	lightsList.append( curtainBtn, tvBtn, faucetBtn, cookBtn );

	const sceneBtns = SCENES.map( s => h( 'button', { class: 'btn scene', onclick: () => {

		applyScene( s.state );
		toast( pick( s.label ) );

	} }, pick( s.label ) ) );
	const viewBtns = manifest.views.map( v => h( 'button', { class: 'btn', onclick: () => walk.flyTo( v3( v.at ), v3( v.look ) ) }, pick( v.label ) ) );

	const controlsPanel = h( 'div', { class: 'controls-panel panel' },
		h( 'div', { class: 'eyebrow' }, tr( 'Luz y objetos', 'Light & objects' ) ),
		lightsList,
		h( 'div', { class: 'eyebrow', style: { marginTop: '14px' } }, tr( 'Escenas de vida', 'Moments' ) ),
		h( 'div', { class: 'ctrl-list' }, ...sceneBtns ),
		h( 'div', { class: 'eyebrow', style: { marginTop: '14px' } }, tr( 'Ir a', 'Go to' ) ),
		h( 'div', { class: 'ctrl-list' }, ...viewBtns ),
	);
	const toggleControls = h( 'button', { class: 'btn controls-toggle', onclick: () => ui.classList.toggle( 'controls-open' ) }, svgIcon( ICONS.layers, 16 ), tr( 'Controles', 'Controls' ) );

	// modes: VR, portal, magic window
	const modeBar = h( 'div', { class: 'mode-bar' } );
	const [ canVR, canAR ] = await Promise.all( [ XRSessionManager.supports( 'immersive-vr' ), XRSessionManager.supports( 'immersive-ar' ) ] );
	if ( canVR ) modeBar.append( h( 'button', { class: 'btn', onclick: () => xr.start( 'immersive-vr' ).catch( e => toast( String( e?.message ?? e ) ) ) }, svgIcon( ICONS.vr, 16 ), tr( 'Entrar en VR', 'Enter VR' ) ) );
	if ( canAR ) modeBar.append( h( 'button', { class: 'btn', onclick: () => xr.start( 'immersive-ar' ).catch( e => toast( String( e?.message ?? e ) ) ) }, svgIcon( ICONS.portal, 16 ), tr( 'Portal en tu casa', 'Portal in your home' ) ) );
	if ( MagicWindow.supported ) {

		const mb = h( 'button', { class: 'btn', onclick: async () => {

			if ( magic.active ) {

				magic.disable();
				walk.enabled = true;
				walk.syncFromCamera();
				mb.classList.remove( 'on' );

			} else if ( await magic.enable() ) {

				walk.enabled = false;
				mb.classList.add( 'on' );
				toast( tr( 'Mové el teléfono para mirar alrededor', 'Move your phone to look around' ) );

			} else toast( tr( 'Permiso de movimiento denegado', 'Motion permission denied' ) );

		} }, svgIcon( ICONS.phone, 16 ), tr( 'Ventana mágica', 'Magic window' ) );
		modeBar.append( mb );

	}

	const back = fromListing
		? h( 'a', { class: 'btn panel', href: `#/ciudad?listing=${ encodeURIComponent( fromListing ) }` }, svgIcon( ICONS.back, 16 ), tr( 'Volver al edificio', 'Back to building' ) )
		: h( 'a', { class: 'btn panel', href: '#/ciudad' }, svgIcon( ICONS.globe, 16 ), tr( 'Mapa', 'Map' ) );
	const titleChip = h( 'div', { class: 'unit-title panel' },
		h( 'div', { class: 'eyebrow' }, tr( 'Habitar', 'Live in it' ) ),
		h( 'div', { class: 'unit-name' }, manifest.title ),
		h( 'div', { class: 'muted small' }, `${ loc.city } · ${ tr( 'piso', 'floor' ) } ${ manifest.floorHeight ? Math.round( manifest.floorHeight / 2.9 ) : '—' } · ${ tr( 'datos de demostración', 'demo data' ) }` ),
	);
	const langBtn = h( 'button', { class: 'btn panel', onclick: () => setLang( lang === 'es' ? 'en' : 'es' ) }, lang === 'es' ? 'EN' : 'ES' );
	ui.append(
		h( 'div', { class: 'topbar' }, brand( tr( 'Habitar', 'Live in it' ) ), back, h( 'div', { class: 'spacer' } ), modeBar, langBtn ),
		titleChip,
		controlsPanel,
		toggleControls,
		timePanel,
		h( 'div', { class: 'hint panel' }, tr( 'Arrastrá para mirar · tocá el piso para caminar · tocá lámparas, cortinas, TV, canilla u olla', 'Drag to look · tap the floor to walk · tap lamps, curtains, TV, faucet or pot' ) ),
	);

	function syncTimeUI() {

		slider.value = String( state.hours );
		clockEl.textContent = formatClock( state.hours );
		const sp = sunNow();
		sunIcon.replaceChildren( svgIcon( sp.elevation > - 2 ? ICONS.sun : ICONS.moon, 18 ) );
		const sd = manifest.sun.seasons[ state.season ];
		dateEl.textContent = `${ tr( 'Sol real de', 'Real sun for' ) } ${ loc.city } · ${ sd.date } · ${ tr( 'elevación', 'elevation' ) } ${ sp.elevation.toFixed( 0 ) }° · ${ tr( 'azimut', 'azimuth' ) } ${ sp.azimuth.toFixed( 0 ) }°`;
		const pct = ( state.hours / 24 ) * 100;
		slider.style.setProperty( '--p', `${ pct }%` );

	}

	function syncUI() {

		for ( const [ id, b ] of lightBtns ) b.classList.toggle( 'on', state.lights[ id ] > 0.01 );
		curtainBtn.classList.toggle( 'on', state.curtains > 0.5 );
		curtainBtn.lastChild!.textContent = state.curtains > 0.5 ? tr( 'Abrir cortinas', 'Open curtains' ) : tr( 'Cerrar cortinas', 'Close curtains' );
		tvBtn.classList.toggle( 'on', state.tv );
		faucetBtn.classList.toggle( 'on', state.faucet );
		cookBtn.classList.toggle( 'on', state.cooking );
		seasonBtns.forEach( b => b.classList.toggle( 'on', b.dataset.season === state.season ) );
		playBtn.replaceChildren( svgIcon( playing ? ICONS.pause : ICONS.play, 16 ) );
		syncTimeUI();

	}

	syncUI();

	// ---------------------------------------------------------------- loop
	const clock = new Clock();
	let elapsed = 0;
	const resize = () => {

		const w = root.clientWidth, hgt = root.clientHeight;
		camera.aspect = w / hgt;
		camera.updateProjectionMatrix();
		renderer.setSize( w, hgt );

	};

	window.addEventListener( 'resize', resize );

	// a first render so the environment exists before the reveal
	applyLighting( 0 );
	captureEnv();
	loader.done();
	setTimeout( () => ui.querySelector( '.hint' )?.classList.add( 'fade' ), 6000 );

	renderer.setAnimationLoop( () => {

		const dt = Math.min( 0.25, clock.getDelta() );
		elapsed += dt;
		if ( playing ) {

			state.hours = ( state.hours + dt * 0.6 ) % 24;
			syncTimeUI();

		}

		// ease live values toward the state
		const k = 1 - Math.exp( - dt * 4 );
		live.curtains += ( state.curtains - live.curtains ) * ( 1 - Math.exp( - dt * 1.6 ) );
		for ( const id in state.lights ) live.lights[ id ] = ( live.lights[ id ] ?? 0 ) + ( state.lights[ id ] - ( live.lights[ id ] ?? 0 ) ) * k;
		if ( state.tv ) tvScreen.update( elapsed );

		walk.update( dt );
		magic.update( camera );
		xr.update();
		steam.update( dt, elapsed, renderer.domElement.height );
		water.update( dt, elapsed );
		applyLighting( elapsed );
		renderer.render( scene, camera );

	} );

	// test / automation hook
	( window as unknown as Record<string, unknown> ).__habitar = { state, applyScene, setCurtains, toggleLight, camera, walk, layers, renderer };

	return () => {

		renderer.setAnimationLoop( null );
		window.removeEventListener( 'resize', resize );
		walk.dispose();
		magic.disable();
		sounds.dispose();
		layers.dispose();
		pmrem.dispose();
		cubeRT.dispose();
		envRT?.dispose();
		draco.dispose();
		scene.traverse( o => {

			const m = o as Mesh;
			if ( m.isMesh ) {

				m.geometry.dispose();
				( Array.isArray( m.material ) ? m.material : [ m.material ] ).forEach( ( x: Material ) => x.dispose() );

			}

		} );
		renderer.dispose();
		ui.remove();
		renderer.domElement.remove();

	};

}
