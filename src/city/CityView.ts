// "Ciudad": a God's-eye view of Asunción for real estate.
//  · photorealistic Google 3D Tiles with your key, or keyless satellite imagery + OSM buildings
//  · listings by agency, agent or at random, each a generated building on its lot
//  · cinematic flights, real-time sun and night lights for Asunción
//  · open a building: floors by availability, units per floor, nearby services with walking
//    rings and animated routes, and a door into the unit ("Habitar")

import {
	AdditiveBlending,
	BackSide,
	Clock,
	Color,
	CylinderGeometry,
	DirectionalLight,
	ExtrudeGeometry,
	FogExp2,
	Group,
	HemisphereLight,
	Matrix3,
	Matrix4,
	Mesh,
	MeshStandardMaterial,
	Object3D,
	PerspectiveCamera,
	PlaneGeometry,
	PMREMGenerator,
	Ray,
	Raycaster,
	Scene,
	ShaderMaterial,
	Shape,
	SphereGeometry,
	SRGBColorSpace,
	Vector2,
	Vector3,
	WebGLRenderer,
	type Material,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { TilesRenderer, GlobeControls } from '3d-tiles-renderer';
import {
	GoogleCloudAuthPlugin,
	GLTFExtensionsPlugin,
	TileCompressionPlugin,
	TilesFadePlugin,
	UnloadTilesPlugin,
	TileFlatteningPlugin,
	GeneratedSurfacePlugin,
	XYZTilesOverlay,
} from '3d-tiles-renderer/plugins';
import { ELLIPSOID, ecef, enuFrame, enuAxes, toCartographic, distance, offsetMetres, walkMinutes, type LatLon } from './geo';
import { loadCity, unitsOf, priceFrom, availability, STATUS_LABEL, type CityData, type Listing, type Unit } from './listings';
import { Tower, cityUniforms, STATUS_COLOR } from './Tower';
import { PoiLayer } from './PoiLayer';
import { fetchPois, fetchBuildings, POI_META, type Poi, type PoiCategory } from './osm';
import { LabelLayer } from './labels';
import { h, svgIcon, ICONS, toast, Loader, brand } from '../shared/dom';
import { tr, pick, lang, setLang, formatUSD, formatNumber } from '../shared/i18n';
import { sunPosition, sunENU, formatClock, localHoursNow } from '../shared/solar';
import { clamp, ease, lerp, smoothstep, tween, type TweenHandle } from '../shared/tween';
import '../styles/city.css';

const BASE = import.meta.env.BASE_URL;
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const KEY_STORAGE = 'habitar.googleKey';
const RAD = Math.PI / 180;

interface Orbit { lat: number; lon: number; h: number; dist: number; heading: number; pitch: number }

const nodes = ( ...xs: ( Node | null )[] ) => xs.filter( ( x ): x is Node => x !== null );

function readKey(): string {

	try {

		return localStorage.getItem( KEY_STORAGE ) || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

	} catch {

		return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

	}

}

export async function mountCity( root: HTMLElement, params: URLSearchParams ) {

	const loader = new Loader( root, tr( 'Asunción en 3D', 'Asunción in 3D' ), tr( 'Conectando con el mapa…', 'Connecting to the map…' ) );
	const data: CityData = await loadCity( BASE );
	const city = data.city;
	const agencyById = new Map( data.agencies.map( a => [ a.id, a ] ) );
	const agentById = new Map( data.agents.map( a => [ a.id, a ] ) );

	// ------------------------------------------------------------ renderer & scene
	const renderer = new WebGLRenderer( { antialias: true, powerPreference: 'high-performance' } );
	renderer.setPixelRatio( Math.min( window.devicePixelRatio, 2 ) );
	renderer.setSize( root.clientWidth, root.clientHeight );
	renderer.outputColorSpace = SRGBColorSpace;
	renderer.domElement.className = 'stage';
	root.append( renderer.domElement );

	const scene = new Scene();
	const camera = new PerspectiveCamera( 50, root.clientWidth / root.clientHeight, 1, 1e8 );
	scene.fog = new FogExp2( 0x9fb3c8, 0.00001 );
	scene.background = new Color( 0x05070c );

	// World frame: Asunción's centre at the origin, local up = +y, north = -z.
	// (keeps coordinates small for precision and lets lights and reflections be "normal")
	const toWorld = new Matrix4().makeRotationX( - Math.PI / 2 ).multiply( enuFrame( city.lat, city.lon, 0 ).invert() );
	const toWorldRot = new Matrix3().setFromMatrix4( toWorld );
	const worldOf = ( p: Vector3 ) => p.clone().applyMatrix4( toWorld );
	const fromWorld = toWorld.clone().invert();

	// ------------------------------------------------------------ tiles
	const googleKey = readKey();
	const photoreal = !! googleKey;
	const tiles = new TilesRenderer();
	const draco = new DRACOLoader().setDecoderPath( `${ BASE }draco/` );
	let flattening: TileFlatteningPlugin | null = null;
	if ( photoreal ) {

		tiles.registerPlugin( new GoogleCloudAuthPlugin( { apiToken: googleKey, autoRefreshToken: true } ) );
		tiles.registerPlugin( new GLTFExtensionsPlugin( { dracoLoader: draco } ) );
		tiles.registerPlugin( new TileCompressionPlugin() );
		flattening = new TileFlatteningPlugin();
		tiles.registerPlugin( flattening );

	} else {

		tiles.registerPlugin( new GeneratedSurfacePlugin( {
			overlay: new XYZTilesOverlay( { url: ESRI, levels: 19 } ),
			projection: 'ellipsoid',
			applyOverlayTexture: true,
		} ) );

	}

	tiles.registerPlugin( new TilesFadePlugin() );
	tiles.registerPlugin( new UnloadTilesPlugin() );
	tiles.errorTarget = photoreal ? 12 : 2;
	tiles.group.matrixAutoUpdate = false;
	tiles.group.matrix.copy( toWorld );
	tiles.group.updateMatrixWorld( true );
	scene.add( tiles.group );
	tiles.setCamera( camera );
	tiles.setResolutionFromRenderer( camera, renderer );

	let tileErrors = 0;
	tiles.addEventListener( 'load-error', () => {

		tileErrors ++;
		if ( photoreal && tileErrors === 3 ) toast( tr( 'Google rechazó la clave o el servicio no está habilitado. Revisá la clave (Map Tiles API).', 'Google rejected the key or the service is not enabled. Check the key (Map Tiles API).' ), 7000 );

	} );

	// tint tiles for night and focus mode
	let tileTint = new Color( 1, 1, 1 );
	const tintObject = ( o: Object3D ) => o.traverse( c => {

		const m = ( c as Mesh ).material as ( Material & { color?: Color; userData: Record<string, unknown> } ) | undefined;
		if ( ! m || ! m.color ) return;
		if ( ! m.userData.baseColor ) m.userData.baseColor = m.color.clone();
		m.color.copy( m.userData.baseColor as Color ).multiply( tileTint );

	} );
	tiles.addEventListener( 'load-model', ( e: { scene: Object3D } ) => tintObject( e.scene ) );

	// ------------------------------------------------------------ our content
	const content = new Group();
	content.matrixAutoUpdate = false;
	content.matrix.copy( toWorld );
	scene.add( content );

	const sun = new DirectionalLight( 0xffffff, 2.2 );
	const hemi = new HemisphereLight( 0xcfe2ff, 0x3a3226, 0.9 );
	scene.add( sun, sun.target, hemi );

	// soft sky reflections for glass
	const pmrem = new PMREMGenerator( renderer );
	const skyScene = new Scene();
	skyScene.add( new Mesh( new SphereGeometry( 10, 32, 16 ), new ShaderMaterial( {
		side: BackSide,
		vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
		fragmentShader: 'varying vec3 vP; void main(){ float t = vP.y; vec3 c = t > 0.0 ? mix(vec3(0.85,0.9,0.97), vec3(0.32,0.5,0.78), pow(t,0.6)) : mix(vec3(0.6,0.62,0.6), vec3(0.18,0.17,0.16), pow(-t,0.5)); gl_FragColor = vec4(c,1.0); }',
	} ) ) );
	scene.environment = pmrem.fromScene( skyScene ).texture;

	const units = new Map<string, Unit[]>();
	const towers = new Map<string, Tower>();
	const sites = new Map<string, Group>();
	const beams = new Map<string, Mesh>();
	const ground = new Map<string, number>();
	const groundEstimate = photoreal ? 95 : 0;

	const beamMat = ( color: string ) => new ShaderMaterial( {
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending,
		fog: false,
		uniforms: { uColor: { value: new Color( color ) }, uTime: cityUniforms.uTime, uOpacity: { value: 1 } },
		vertexShader: 'varying float vZ; void main(){ vZ = position.z; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
		fragmentShader: `uniform vec3 uColor; uniform float uTime; uniform float uOpacity; varying float vZ;
			void main(){ float a = (1.0 - vZ) * (0.55 + 0.45 * sin(uTime * 2.2 - vZ * 6.0)); gl_FragColor = vec4(uColor * a * uOpacity, 1.0); }`,
	} );
	const beamGeo = new CylinderGeometry( 1, 1, 1, 12, 1, true ).rotateX( Math.PI / 2 ).translate( 0, 0, 0.5 );

	for ( const l of data.listings ) {

		const us = unitsOf( l );
		units.set( l.id, us );
		const site = new Group();
		site.matrixAutoUpdate = false;
		site.matrix.copy( enuFrame( l.lat, l.lon, groundEstimate ) );
		content.add( site );
		sites.set( l.id, site );
		const agency = agencyById.get( l.agency )!;
		const t = new Tower( l, agency.color, us );
		site.add( t );
		towers.set( l.id, t );
		const beam = new Mesh( beamGeo, beamMat( agency.color ) );
		beam.renderOrder = 40;
		beam.frustumCulled = false;
		site.add( beam );
		beams.set( l.id, beam );

	}

	content.updateMatrixWorld( true );

	// ------------------------------------------------------------ controls & camera flights
	const controls = new GlobeControls( scene, camera, renderer.domElement );
	controls.setEllipsoid( tiles.ellipsoid, tiles.group );
	controls.enableDamping = true;

	const ray = new Ray();
	function currentOrbit(): Orbit {

		camera.updateMatrixWorld();
		ray.origin.copy( camera.position ).applyMatrix4( fromWorld );
		ray.direction.set( 0, 0, - 1 ).transformDirection( camera.matrixWorld ).transformDirection( fromWorld );
		const hit = new Vector3();
		let target = ELLIPSOID.intersectRay( ray, hit );
		const camEcef = camera.position.clone().applyMatrix4( fromWorld );
		if ( ! target ) target = ELLIPSOID.getPositionToSurfacePoint( camEcef, hit );
		const c = toCartographic( target );
		const { e, n, u } = enuAxes( c.lat, c.lon );
		const v = camEcef.clone().sub( target );
		const dist = v.length();
		const look = v.clone().negate().normalize();
		const pitch = Math.asin( clamp( - look.dot( u ), - 1, 1 ) );
		const heading = Math.atan2( look.dot( e ), look.dot( n ) );
		return { lat: c.lat, lon: c.lon, h: c.height, dist, heading, pitch };

	}

	function applyOrbit( o: Orbit ) {

		const P = ecef( o.lat, o.lon, o.h );
		const { e, n, u } = enuAxes( o.lat, o.lon );
		const look = e.clone().multiplyScalar( Math.sin( o.heading ) * Math.cos( o.pitch ) )
			.addScaledVector( n, Math.cos( o.heading ) * Math.cos( o.pitch ) )
			.addScaledVector( u, - Math.sin( o.pitch ) );
		const C = P.clone().addScaledVector( look, - o.dist );
		camera.position.copy( worldOf( C ) );
		camera.up.copy( u ).applyMatrix3( toWorldRot ).normalize();
		camera.lookAt( worldOf( P ) );
		camera.up.set( 0, 1, 0 );
		camera.updateMatrixWorld();

	}

	let flight: TweenHandle | null = null;
	function flyTo( to: Orbit, duration?: number ) {

		flight?.cancel();
		const from = currentOrbit();
		let dh = to.heading - from.heading;
		dh = Math.atan2( Math.sin( dh ), Math.cos( dh ) );
		const hop = distance( from, to );
		const boost = clamp( hop / Math.max( from.dist, to.dist ), 0, 6 );
		const dur = duration ?? clamp( 1800 + Math.log10( 1 + hop ) * 650, 1800, 6500 );
		controls.enabled = false;
		flight = tween( dur, t => {

			const arc = Math.sin( Math.PI * t );
			applyOrbit( {
				lat: lerp( from.lat, to.lat, t ),
				lon: lerp( from.lon, to.lon, t ),
				h: lerp( from.h, to.h, t ),
				dist: Math.exp( lerp( Math.log( from.dist ), Math.log( to.dist ), t ) ) * ( 1 + boost * 0.55 * arc ),
				heading: from.heading + dh * t,
				pitch: lerp( from.pitch, to.pitch, t ) + ( Math.PI / 2.4 - lerp( from.pitch, to.pitch, t ) ) * arc * clamp( boost / 3, 0, 0.7 ),
			} );
			controls.adjustCamera( camera );

		}, ease.inOutCubic );
		flight.done.then( () => {

			controls.enabled = true;
			controls.resetState();

		} );
		return flight.done;

	}

	const OVERVIEW: Orbit = { lat: -25.2905, lon: -57.5905, h: 0, dist: 7200, heading: 18 * RAD, pitch: 50 * RAD };

	// ------------------------------------------------------------ ground heights (photoreal mode)
	const raycaster = new Raycaster();
	function sampleGround( l: LatLon ): number | null {

		const top = worldOf( ecef( l.lat, l.lon, 1500 ) );
		const bottom = worldOf( ecef( l.lat, l.lon, - 200 ) );
		raycaster.set( top, bottom.sub( top ).normalize() );
		raycaster.far = 2000;
		const hit = raycaster.intersectObject( tiles.group, true )[ 0 ];
		if ( ! hit ) return null;
		return toCartographic( hit.point.clone().applyMatrix4( fromWorld ) ).height;

	}

	function placeSite( l: Listing, h: number ) {

		ground.set( l.id, h );
		const site = sites.get( l.id )!;
		site.matrix.copy( enuFrame( l.lat, l.lon, h ) );
		site.updateMatrixWorld( true );

	}

	// ------------------------------------------------------------ UI
	const labels = new LabelLayer( root );
	const ui = h( 'div', { class: 'city-ui' } );
	root.append( ui );

	type FilterMode = 'all' | 'agency' | 'agent';
	let filterMode: FilterMode = 'all';
	let filterId: string | null = null;
	let selected: Listing | null = null;
	let poiLayer: PoiLayer | null = null;
	let osmLayer: Group | null = null;
	let focus = false;
	let poiAbort: AbortController | null = null;

	const visibleListing = ( l: Listing ) => filterMode === 'all' || ! filterId || ( filterMode === 'agency' ? l.agency === filterId : l.agent === filterId );

	// listing labels
	const listingLabels = new Map<string, HTMLElement>();
	for ( const l of data.listings ) {

		const ag = agencyById.get( l.agency )!;
		const el = h( 'button', { class: 'listing-label', style: { '--c': ag.color } as unknown as Record<string, string>, onclick: () => select( l ) },
			h( 'span', { class: 'll-dot' } ),
			h( 'span', { class: 'll-name' }, l.name ),
			h( 'span', { class: 'll-price mono' }, ( l.kind === 'house' ? '' : tr( 'desde ', 'from ' ) ) + formatUSD( priceFrom( l ) ) ),
		);
		listingLabels.set( l.id, el );
		const tw = towers.get( l.id )!;
		labels.add( el, () => tw.localToWorld( new Vector3( 0, 0, tw.height + 18 ) ), { maxDistance: 9000, minDistance: 80, declutter: true } );

	}

	// left panel: browse
	const tabs = h( 'div', { class: 'segmented wide' } );
	const chips = h( 'div', { class: 'chip-row' } );
	const list = h( 'div', { class: 'listing-list' } );
	const countEl = h( 'span', { class: 'muted' } );
	const browse = h( 'div', { class: 'browse panel' },
		h( 'div', { class: 'browse-head' },
			h( 'div', {}, h( 'div', { class: 'eyebrow' }, city.name ), h( 'div', { class: 'browse-title' }, tr( 'Propiedades', 'Listings' ), ' ', countEl ) ),
			h( 'button', { class: 'btn primary', onclick: surprise, title: tr( 'Ir a una propiedad al azar', 'Go to a random listing' ) }, svgIcon( ICONS.shuffle, 16 ), tr( 'Sorprendeme', 'Surprise me' ) ),
		),
		tabs, chips, list,
		h( 'div', { class: 'demo-note' }, tr( 'Datos ficticios de demostración', 'Fictional demo data' ) ),
	);
	const browseToggle = h( 'button', { class: 'btn browse-toggle', onclick: () => ui.classList.toggle( 'browse-open' ) }, svgIcon( ICONS.filter, 16 ), tr( 'Propiedades', 'Listings' ) );

	function renderTabs() {

		tabs.replaceChildren( ...( [ [ 'all', tr( 'Todas', 'All' ) ], [ 'agency', tr( 'Inmobiliarias', 'Agencies' ) ], [ 'agent', tr( 'Agentes', 'Agents' ) ] ] as [ FilterMode, string ][] ).map( ( [ m, label ] ) =>
			h( 'button', { class: `seg ${ filterMode === m ? 'on' : '' }`, onclick: () => {

				filterMode = m;
				filterId = null;
				renderBrowse();

			} }, label ) ) );

	}

	function renderBrowse() {

		renderTabs();
		chips.replaceChildren();
		if ( filterMode === 'agency' ) {

			for ( const a of data.agencies ) chips.append( h( 'button', { class: `chip-btn ${ filterId === a.id ? 'on' : '' }`, style: { '--c': a.color } as unknown as Record<string, string>, onclick: () => {

				filterId = filterId === a.id ? null : a.id;
				renderBrowse();

			} }, h( 'span', { class: 'dot' } ), a.name ) );

		} else if ( filterMode === 'agent' ) {

			for ( const a of data.agents ) {

				const ag = agencyById.get( a.agency )!;
				chips.append( h( 'button', { class: `chip-btn ${ filterId === a.id ? 'on' : '' }`, style: { '--c': ag.color } as unknown as Record<string, string>, onclick: () => {

					filterId = filterId === a.id ? null : a.id;
					renderBrowse();

				} }, h( 'span', { class: 'avatar' }, a.name.split( ' ' ).map( s => s[ 0 ] ).join( '' ) ), a.name ) );

			}

		}

		const shown = data.listings.filter( visibleListing );
		countEl.textContent = `· ${ shown.length }`;
		list.replaceChildren( ...shown.map( l => {

			const ag = agencyById.get( l.agency )!;
			const av = availability( l );
			return h( 'button', { class: `listing-card ${ selected?.id === l.id ? 'on' : '' }`, style: { '--c': ag.color } as unknown as Record<string, string>, onclick: () => select( l ) },
				h( 'div', { class: 'lc-top' }, h( 'span', { class: 'lc-name' }, l.name ), h( 'span', { class: `status s-${ l.status }` }, pick( STATUS_LABEL[ l.status ] ) ) ),
				h( 'div', { class: 'lc-meta muted' }, `${ l.barrio } · ${ l.kind === 'house' ? tr( 'Casa', 'House' ) : `${ l.floors } ${ tr( 'pisos', 'floors' ) }` } · ${ ag.name }` ),
				h( 'div', { class: 'lc-bottom' },
					h( 'span', { class: 'mono' }, ( l.kind === 'house' ? '' : tr( 'desde ', 'from ' ) ) + formatUSD( priceFrom( l ) ) ),
					l.kind === 'house' ? null : h( 'span', { class: 'muted small' }, `${ av.available } ${ tr( 'disponibles', 'available' ) }` ),
				),
			);

		} ) );
		for ( const l of data.listings ) {

			const on = visibleListing( l );
			beams.get( l.id )!.visible = on;
			listingLabels.get( l.id )!.classList.toggle( 'dim', ! on );
			towers.get( l.id )!.setHighlight( on && filterMode !== 'all' && !! filterId );

		}

	}

	function surprise() {

		const pool = data.listings.filter( visibleListing ).filter( l => l.id !== selected?.id );
		const l = pool[ Math.floor( Math.random() * pool.length ) ];
		if ( l ) select( l );

	}

	// right panel: detail
	const detail = h( 'div', { class: 'detail panel' } );

	function renderDetail( l: Listing, floor: number | null = null ) {

		const ag = agencyById.get( l.agency )!;
		const agent = agentById.get( l.agent )!;
		const us = units.get( l.id )!;
		const av = availability( l );
		const floors = [ ...new Set( us.map( u => u.floor ) ) ].sort( ( a, b ) => b - a );
		const floorUnits = floor ? us.filter( u => u.floor === floor ) : [];
		const demo = us.find( u => u.home );
		const bar = ( n: number, c: string ) => h( 'i', { style: { width: `${ ( n / Math.max( 1, av.total ) ) * 100 }%`, background: c } } );
		detail.replaceChildren( ...nodes(
			h( 'button', { class: 'btn icon close', onclick: deselect, 'aria-label': tr( 'Cerrar', 'Close' ) }, svgIcon( ICONS.close, 16 ) ),
			h( 'div', { class: 'eyebrow', style: { color: ag.color } }, `${ ag.name } · ${ pick( ag.kind ) }` ),
			h( 'h2', { class: 'detail-title' }, l.name ),
			h( 'div', { class: 'muted' }, `${ l.barrio }, ${ city.name }` ),
			h( 'div', { class: 'detail-chips' },
				h( 'span', { class: `status s-${ l.status }` }, pick( STATUS_LABEL[ l.status ] ) ),
				l.delivery ? h( 'span', { class: 'chip' }, `${ tr( 'Entrega', 'Delivery' ) } ${ l.delivery }` ) : null,
				h( 'span', { class: 'chip' }, l.kind === 'house' ? `${ l.area } m² · ${ l.bedrooms } ${ tr( 'dorm.', 'bed' ) }` : `${ l.floors } ${ tr( 'pisos', 'floors' ) }` ),
			),
			h( 'div', { class: 'price-row' }, h( 'span', { class: 'muted small' }, l.kind === 'house' ? tr( 'Precio', 'Price' ) : tr( 'Desde', 'From' ) ), h( 'span', { class: 'price mono' }, formatUSD( priceFrom( l ) ) ) ),
			l.kind === 'house' ? null : h( 'div', { class: 'avail' },
				h( 'div', { class: 'avail-bar' }, bar( av.available, 'var(--available)' ), bar( av.reserved, 'var(--reserved)' ), bar( av.sold, 'var(--sold)' ) ),
				h( 'div', { class: 'avail-legend small' },
					h( 'span', {}, h( 'b', { style: { color: 'var(--available)' } }, av.available ), ' ', tr( 'disponibles', 'available' ) ),
					h( 'span', {}, h( 'b', { style: { color: 'var(--reserved)' } }, av.reserved ), ' ', tr( 'reservadas', 'reserved' ) ),
					h( 'span', {}, h( 'b', { style: { color: 'var(--sold)' } }, av.sold ), ' ', tr( 'vendidas', 'sold' ) ),
				),
			),
			l.status === 'pozo' ? h( 'button', { class: `btn finish-toggle ${ towers.get( l.id )!.showFinished ? 'on' : '' }`, onclick: () => {

				const tw = towers.get( l.id )!;
				tw.setFinished( ! tw.showFinished );
				renderDetail( l, floor );
				renderPoisIfAny();

			} }, svgIcon( ICONS.building, 16 ), towers.get( l.id )!.showFinished ? tr( 'Ver como proyecto (holograma)', 'Show as project (hologram)' ) : tr( 'Ver el edificio terminado', 'See the finished building' ) ) : null,
			demo ? h( 'a', { class: 'btn primary enter', href: `#/hogar?unit=${ demo.home }&from=${ l.id }` }, svgIcon( ICONS.enter, 16 ), tr( `Entrar a la unidad ${ demo.id }`, `Enter unit ${ demo.id }` ) ) : null,
			l.kind === 'house' ? null : h( 'div', { class: 'section' },
				h( 'div', { class: 'eyebrow' }, tr( 'Pisos', 'Floors' ) ),
				h( 'div', { class: 'floor-strip' }, ...floors.map( f => {

					const fu = us.filter( u => u.floor === f );
					const a = fu.filter( u => u.status === 'available' ).length;
					return h( 'button', { class: `floor-btn ${ floor === f ? 'on' : '' } ${ a === 0 ? 'full' : '' }`, onclick: () => openFloor( l, f ), title: `${ a }/${ fu.length }` }, String( f ) );

				} ) ),
			),
			floor ? h( 'div', { class: 'section' },
				h( 'div', { class: 'eyebrow' }, `${ tr( 'Piso', 'Floor' ) } ${ floor }` ),
				h( 'div', { class: 'unit-table' }, ...floorUnits.map( u => h( 'div', { class: 'unit-row' },
					h( 'span', { class: 'u-dot', style: { background: `#${ STATUS_COLOR[ u.status ].getHexString() }` } } ),
					h( 'b', {}, u.id ),
					h( 'span', { class: 'muted' }, `${ u.bedrooms } ${ tr( 'dorm.', 'bed' ) } · ${ u.area } m² · ${ u.orientation }` ),
					h( 'span', { class: 'mono' }, u.status === 'sold' ? tr( 'Vendida', 'Sold' ) : formatUSD( u.price ) ),
					u.home ? h( 'a', { class: 'btn tiny', href: `#/hogar?unit=${ u.home }&from=${ l.id }` }, tr( 'Habitar', 'Live in it' ) ) : null,
				) ) ),
			) : null,
			h( 'div', { class: 'section' }, h( 'div', { class: 'eyebrow' }, tr( 'Amenities', 'Amenities' ) ), h( 'div', { class: 'chip-row' }, ...l.amenities.map( a => h( 'span', { class: 'chip' }, a ) ) ) ),
			h( 'div', { class: 'section nearby' }, h( 'div', { class: 'eyebrow' }, tr( 'Cerca de acá', 'Nearby' ) ), poiSummary ),
			h( 'div', { class: 'agent-card' },
				h( 'span', { class: 'avatar big', style: { background: ag.color } }, agent.name.split( ' ' ).map( s => s[ 0 ] ).join( '' ) ),
				h( 'div', {}, h( 'b', {}, agent.name ), h( 'div', { class: 'muted small' }, `${ ag.name } · ${ agent.phone }` ) ),
				h( 'button', { class: 'btn', onclick: () => toast( tr( 'En la versión real: WhatsApp / agenda de visita con el agente', 'In the real version: WhatsApp / book a visit with the agent' ) ) }, tr( 'Contactar', 'Contact' ) ),
			),
		) );

	}

	// nearby services summary (filled when POIs arrive)
	const poiSummary = h( 'div', { class: 'poi-summary' }, h( 'span', { class: 'muted small' }, tr( 'Buscando servicios cercanos…', 'Looking for nearby services…' ) ) );
	let poiFilter: PoiCategory | null = null;

	function renderPois( pois: Poi[] ) {

		const cats = Object.keys( POI_META ) as PoiCategory[];
		poiSummary.replaceChildren( ...nodes(
			h( 'div', { class: 'poi-cats' }, ...cats.map( c => {

				const n = pois.filter( p => p.category === c ).length;
				return h( 'button', { class: `chip-btn ${ poiFilter === c ? 'on' : '' }`, style: { '--c': POI_META[ c ].color } as unknown as Record<string, string>, onclick: () => {

					poiFilter = poiFilter === c ? null : c;
					poiLayer?.filter( poiFilter );
					renderPois( pois );

				} }, h( 'span', { class: 'dot' } ), `${ pick( POI_META[ c ].label ) } ${ n }` );

			} ) ),
			h( 'div', { class: 'poi-list' }, ...pois.filter( p => ! poiFilter || p.category === poiFilter ).sort( ( a, b ) => a.distance - b.distance ).slice( 0, 12 ).map( p =>
				h( 'button', { class: 'poi-row', onclick: () => focusPoi( p ) },
					h( 'span', { class: 'u-dot', style: { background: POI_META[ p.category ].color } } ),
					h( 'span', { class: 'poi-name' }, p.name ),
					h( 'span', { class: 'mono muted small' }, `${ Math.max( 1, Math.round( walkMinutes( p.distance ) ) ) } min · ${ formatNumber( p.distance / 1000, 1 ) } km` ),
				) ) ),
			pois.length === 0 ? h( 'span', { class: 'muted small' }, tr( 'Sin datos de OpenStreetMap cerca.', 'No OpenStreetMap data nearby.' ) ) : null,
		) );

	}

	function focusPoi( p: Poi ) {

		if ( ! selected ) return;
		poiLayer?.highlight( p );
		const o = offsetMetres( selected, p );
		const mid = { lat: ( selected.lat + p.lat ) / 2, lon: ( selected.lon + p.lon ) / 2 };
		flyTo( { ...mid, h: ground.get( selected.id ) ?? groundEstimate, dist: Math.max( 600, Math.hypot( o.x, o.y ) * 2.1 ), heading: Math.atan2( o.x, o.y ) + Math.PI / 2, pitch: 52 * RAD }, 2200 );
		toast( `${ p.name } · ${ Math.max( 1, Math.round( walkMinutes( p.distance ) ) ) } ${ tr( 'min a pie', 'min walk' ) }` );

	}

	// ------------------------------------------------------------ selection
	async function select( l: Listing, opts: { instant?: boolean } = {} ) {

		if ( selected?.id === l.id && ! opts.instant ) return;
		clearSelection();
		selected = l;
		ui.classList.add( 'has-detail' );
		ui.classList.remove( 'browse-open' );
		history.replaceState( null, '', `#/ciudad?listing=${ l.id }` );
		renderBrowse();
		poiSummary.replaceChildren( h( 'span', { class: 'muted small' }, tr( 'Buscando servicios cercanos…', 'Looking for nearby services…' ) ) );
		renderDetail( l );
		const tw = towers.get( l.id )!;
		const dist = clamp( tw.height * 2.9, 170, 720 );
		const orbit: Orbit = { lat: l.lat, lon: l.lon, h: ( ground.get( l.id ) ?? groundEstimate ) + tw.height * 0.5, dist, heading: ( 35 + l.rotation ) * RAD, pitch: 17 * RAD };
		const flown = opts.instant ? ( applyOrbit( orbit ), Promise.resolve( true ) ) : flyTo( orbit );
		tw.playReveal( l.status === 'pozo' ? 3200 : 2200 );
		tw.showAvailability( l.kind !== 'house' );
		beams.get( l.id )!.visible = false;
		listingLabels.get( l.id )!.classList.add( 'selected' );

		// nearby services
		poiAbort?.abort();
		poiAbort = new AbortController();
		const signal = poiAbort.signal;
		fetchPois( l, 1500, 6, signal ).then( pois => {

			if ( selected?.id !== l.id ) return;
			poiLayer = new PoiLayer( l, pois, tw.height );
			sites.get( l.id )!.add( poiLayer );
			renderPois( pois );
			for ( const m of poiLayer.markers ) {

				const el = h( 'div', { class: 'poi-label', style: { '--c': POI_META[ m.poi.category ].color } as unknown as Record<string, string> },
					h( 'b', {}, m.poi.name ), h( 'span', { class: 'mono' }, `${ Math.max( 1, Math.round( m.minutes ) ) } min` ) );
				poiLabelCleanup.push( labels.add( el, () => m.group.parent ? m.group.localToWorld( m.top.clone().sub( m.group.position ) ) : new Vector3( 1e9, 0, 0 ), { maxDistance: 5000 } ) );

			}

			for ( const r of poiLayer.ringTops ) {

				const el = h( 'div', { class: 'ring-label mono' }, `${ r.minutes } min` );
				poiLabelCleanup.push( labels.add( el, () => poiLayer ? poiLayer.localToWorld( r.at.clone() ) : new Vector3( 1e9, 0, 0 ), { maxDistance: 6000 } ) );

			}

		} ).catch( e => {

			if ( ( e as Error ).name === 'AbortError' ) return;
			poiSummary.replaceChildren( h( 'span', { class: 'muted small' }, tr( 'No se pudo consultar OpenStreetMap (Overpass). Probá de nuevo en un rato.', 'Could not reach OpenStreetMap (Overpass). Try again shortly.' ) ) );

		} );

		await flown;
		if ( selected?.id !== l.id ) return;
		if ( photoreal ) {

			const gh = sampleGround( l );
			if ( gh !== null ) placeSite( l, gh );
			if ( flattening ) {

				// flatten whatever stands on the lot today, so the project can stand there
				const [ w, d ] = l.footprint;
				const shape = new Mesh( new PlaneGeometry( w + 12, d + 12 ) );
				shape.matrixAutoUpdate = false;
				shape.matrix.copy( enuFrame( l.lat, l.lon, ground.get( l.id ) ?? groundEstimate ) ).multiply( new Matrix4().makeRotationZ( - l.rotation * RAD ) );
				shape.updateMatrixWorld( true );
				const { u } = enuAxes( l.lat, l.lon );
				// the published types still describe the old (number) signature
				( flattening as unknown as { addShape( m: Mesh, d: Vector3, o: { threshold: number } ): void } ).addShape( shape, u, { threshold: Infinity } );
				flattenShapes.push( shape );

			}

		} else {

			loadOsmBuildings( l, signal );

		}

	}

	const poiLabelCleanup: ( () => void )[] = [];
	const flattenShapes: Mesh[] = [];

	function clearSelection() {

		if ( ! selected ) return;
		const tw = towers.get( selected.id )!;
		tw.showAvailability( false );
		beams.get( selected.id )!.visible = visibleListing( selected );
		listingLabels.get( selected.id )!.classList.remove( 'selected' );
		poiLayer?.removeFromParent();
		poiLayer?.dispose();
		poiLayer = null;
		poiFilter = null;
		poiLabelCleanup.splice( 0 ).forEach( f => f() );
		osmLayer?.removeFromParent();
		osmLayer = null;
		flattenShapes.splice( 0 ).forEach( s => flattening?.deleteShape( s ) );
		selected = null;

	}

	function deselect() {

		clearSelection();
		ui.classList.remove( 'has-detail' );
		history.replaceState( null, '', '#/ciudad' );
		renderBrowse();
		flyTo( { ...currentOrbit(), dist: 3800, pitch: 48 * RAD } );

	}

	function openFloor( l: Listing, f: number ) {

		const tw = towers.get( l.id )!;
		tw.selectFloor( f );
		renderDetail( l, f );
		renderPoisIfAny();
		const z = tw.floorZ( f ) + 1.5;
		flyTo( { lat: l.lat, lon: l.lon, h: ( ground.get( l.id ) ?? groundEstimate ) + z, dist: Math.max( l.footprint[ 0 ], l.footprint[ 1 ] ) * 2.6, heading: ( 35 + l.rotation ) * RAD, pitch: 14 * RAD }, 1600 );

	}

	function renderPoisIfAny() {

		// the detail panel was rebuilt: keep the nearby summary element in it
		const slot = detail.querySelector( '.nearby' );
		if ( slot && ! slot.contains( poiSummary ) ) slot.append( poiSummary );

	}

	// keyless mode: OSM building footprints extruded around the selection
	async function loadOsmBuildings( l: Listing, signal: AbortSignal ) {

		try {

			const fps = await fetchBuildings( l, 650, signal );
			if ( selected?.id !== l.id ) return;
			const geos = [];
			const [ w, d ] = l.footprint;
			const lotR = Math.hypot( w, d ) / 2 + 6;
			for ( const fp of fps ) {

				const pts = fp.ring.map( p => offsetMetres( l, p ) );
				const cx = pts.reduce( ( s, p ) => s + p.x, 0 ) / pts.length, cy = pts.reduce( ( s, p ) => s + p.y, 0 ) / pts.length;
				if ( Math.hypot( cx, cy ) < lotR ) continue;
				const shape = new Shape( pts.map( p => new Vector2( p.x, p.y ) ) );
				geos.push( new ExtrudeGeometry( shape, { depth: fp.height, bevelEnabled: false, curveSegments: 1 } ) );

			}

			if ( ! geos.length ) return;
			const merged = mergeGeometries( geos, false );
			geos.forEach( g => g.dispose() );
			if ( ! merged ) return;
			merged.computeVertexNormals();
			const mesh = new Mesh( merged, new MeshStandardMaterial( { color: 0xd8d4cc, roughness: 0.9, transparent: true, opacity: 0.92 } ) );
			const g = new Group();
			g.add( mesh );
			g.scale.set( 1, 1, 0.001 );
			sites.get( l.id )!.add( g );
			osmLayer = g;
			tween( 1600, t => g.scale.set( 1, 1, Math.max( 0.001, t ) ), ease.outCubic );

		} catch ( e ) {

			if ( ( e as Error ).name !== 'AbortError' ) console.warn( 'OSM buildings', e );

		}

	}

	// ------------------------------------------------------------ picking
	const pointer = { x: 0, y: 0, t: 0 };
	renderer.domElement.addEventListener( 'pointerdown', e => Object.assign( pointer, { x: e.clientX, y: e.clientY, t: performance.now() } ) );
	renderer.domElement.addEventListener( 'pointerup', e => {

		if ( Math.hypot( e.clientX - pointer.x, e.clientY - pointer.y ) > 6 || performance.now() - pointer.t > 500 ) return;
		const r = renderer.domElement.getBoundingClientRect();
		const ndc = new Vector2( ( ( e.clientX - r.left ) / r.width ) * 2 - 1, - ( ( e.clientY - r.top ) / r.height ) * 2 + 1 );
		raycaster.setFromCamera( ndc, camera );
		raycaster.far = Infinity;
		const hits = raycaster.intersectObjects( [ ...towers.values() ], true );
		for ( const hit of hits ) {

			const tw = hit.object.userData.tower as Tower | undefined;
			if ( ! tw ) continue;
			if ( hit.object === tw.floorPick && hit.instanceId !== undefined && selected?.id === tw.listing.id ) {

				openFloor( tw.listing, hit.instanceId + 1 );
				return;

			}

			select( tw.listing );
			return;

		}

	} );

	// ------------------------------------------------------------ HUD, modes, key
	const hud = h( 'div', { class: 'hud mono' } );
	const attribution = h( 'div', { class: 'attribution' } );
	const focusBtn = h( 'button', { class: 'btn panel', onclick: () => {

		focus = ! focus;
		focusBtn.classList.toggle( 'on', focus );
		updateTint();

	} }, svgIcon( ICONS.eye, 16 ), tr( 'Foco', 'Focus' ) );
	const keyBtn = h( 'button', { class: `btn panel ${ photoreal ? 'on' : '' }`, onclick: () => openKeyDialog() }, svgIcon( ICONS.key, 16 ), photoreal ? tr( 'Fotorrealista', 'Photoreal' ) : tr( 'Activar fotorrealista', 'Enable photoreal' ) );
	const homeBtn = h( 'button', { class: 'btn panel icon', title: tr( 'Vista general', 'Overview' ), onclick: () => ( selected ? deselect() : flyTo( OVERVIEW ) ) }, svgIcon( ICONS.globe, 16 ) );

	function openKeyDialog() {

		const input = h( 'input', { class: 'key-input mono', type: 'password', placeholder: 'AIza…', value: readKey(), autocomplete: 'off' } ) as HTMLInputElement;
		const dlg = h( 'div', { class: 'modal' }, h( 'div', { class: 'modal-card panel' },
			h( 'div', { class: 'eyebrow' }, 'Google Photorealistic 3D Tiles' ),
			h( 'h3', {}, tr( 'Asunción fotorrealista', 'Photorealistic Asunción' ) ),
			h( 'p', { class: 'muted small' }, tr( 'Pegá una clave de Google Maps Platform con "Map Tiles API" habilitada. Se guarda solo en este navegador. Restringila a tus dominios en Google Cloud.', 'Paste a Google Maps Platform key with "Map Tiles API" enabled. It is stored only in this browser. Restrict it to your domains in Google Cloud.' ) ),
			input,
			h( 'div', { class: 'row' },
				h( 'button', { class: 'btn primary', onclick: () => {

					try {

						if ( input.value.trim() ) localStorage.setItem( KEY_STORAGE, input.value.trim() );
						else localStorage.removeItem( KEY_STORAGE );

					} catch { /* ignore */ }
					location.reload();

				} }, tr( 'Guardar y recargar', 'Save and reload' ) ),
				h( 'button', { class: 'btn', onclick: () => {

					try {

						localStorage.removeItem( KEY_STORAGE );

					} catch { /* ignore */ }
					location.reload();

				} }, tr( 'Usar mapa sin clave', 'Use keyless map' ) ),
				h( 'button', { class: 'btn', onclick: () => dlg.remove() }, tr( 'Cancelar', 'Cancel' ) ),
			),
		) );
		root.append( dlg );
		input.focus();

	}

	ui.append(
		h( 'div', { class: 'topbar' }, brand( city.name ), homeBtn, h( 'div', { class: 'spacer' } ), focusBtn, keyBtn,
			h( 'button', { class: 'btn panel', onclick: () => setLang( lang === 'es' ? 'en' : 'es' ) }, lang === 'es' ? 'EN' : 'ES' ) ),
		browse, browseToggle, detail, hud, attribution,
	);
	renderBrowse();

	// ------------------------------------------------------------ real-time sun & night
	let night = 0;
	function updateSun() {

		const now = new Date();
		const sp = sunPosition( now, city.lat, city.lon );
		const enu = sunENU( sp );
		const dir = new Vector3( enu[ 0 ], enu[ 2 ], - enu[ 1 ] ); // ENU → world (city frame)
		sun.position.copy( dir ).multiplyScalar( 5000 );
		sun.target.position.set( 0, 0, 0 );
		const day = smoothstep( - 4, 8, sp.elevation );
		sun.intensity = 0.15 + 2.3 * day;
		hemi.intensity = 0.25 + 0.75 * day;
		night = 1 - smoothstep( - 6, 2, sp.elevation );
		cityUniforms.uNight.value = night;
		updateTint();
		return sp;

	}

	function updateTint() {

		const n = new Color( 1, 1, 1 ).lerp( new Color( 0.22, 0.25, 0.36 ), night );
		if ( focus ) n.multiplyScalar( 0.45 );
		if ( ! n.equals( tileTint ) ) {

			tileTint = n;
			tintObject( tiles.group );

		}

	}

	let sunPos = updateSun();
	setInterval( () => ( sunPos = updateSun() ), 60000 );

	// ------------------------------------------------------------ loop
	const clock = new Clock();
	let elapsed = 0;
	let groundTick = 0;
	const resize = () => {

		camera.aspect = root.clientWidth / root.clientHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( root.clientWidth, root.clientHeight );
		tiles.setResolutionFromRenderer( camera, renderer );

	};

	window.addEventListener( 'resize', resize );

	// start from orbit, then dive into Asunción
	applyOrbit( { lat: -23.4, lon: -58.4, h: 0, dist: 9.5e6, heading: 0, pitch: 89 * RAD } );
	controls.adjustCamera( camera );
	let introDone = false;
	const initial = params.get( 'listing' ) ? data.listings.find( l => l.id === params.get( 'listing' ) ) : null;
	setTimeout( () => {

		loader.done();
		const go = initial ? select( initial ) : flyTo( OVERVIEW, 6500 );
		Promise.resolve( go ).then( () => ( introDone = true ) );

	}, 900 );

	( window as unknown as { __onParams?: ( p: URLSearchParams ) => void } ).__onParams = p => {

		const l = data.listings.find( x => x.id === p.get( 'listing' ) );
		if ( l && l.id !== selected?.id ) select( l );

	};

	renderer.setAnimationLoop( () => {

		const dt = Math.min( 0.1, clock.getDelta() );
		elapsed += dt;
		cityUniforms.uTime.value = elapsed;
		if ( controls.enabled ) controls.update( dt );
		camera.updateMatrixWorld();
		tiles.update();

		// altitude-dependent atmosphere
		const camEcef = camera.position.clone().applyMatrix4( fromWorld );
		const alt = Math.max( 1, toCartographic( camEcef ).height );
		const daySky = new Color( 0x9fb6cf ).lerp( new Color( 0x0b1020 ), night );
		const space = new Color( 0x04060b );
		const sky = daySky.clone().lerp( space, smoothstep( 30000, 400000, alt ) );
		( scene.background as Color ).copy( sky );
		( scene.fog as FogExp2 ).color.copy( sky );
		( scene.fog as FogExp2 ).density = 0.3 / Math.max( alt * 9, 2500 );

		// beams: big from afar, gone up close
		for ( const [ id, beam ] of beams ) {

			const tw = towers.get( id )!;
			const p = tw.localToWorld( new Vector3( 0, 0, tw.height ) );
			const d = p.distanceTo( camera.position );
			const s = clamp( d * 0.0022, 1.2, 60 );
			beam.position.z = tw.height;
			beam.scale.set( s, s, clamp( d * 0.08, 120, 2400 ) );
			( beam.material as ShaderMaterial ).uniforms.uOpacity.value = smoothstep( 250, 1400, d ) * ( 1 - smoothstep( 60000, 200000, d ) );
			tw.update( elapsed );

		}

		poiLayer?.update( elapsed );

		// photoreal: settle buildings on the real ground once the tiles are detailed enough
		if ( photoreal && introDone && ++ groundTick % 45 === 0 && alt < 6000 ) {

			for ( const l of data.listings ) {

				if ( ground.has( l.id ) && l.id !== selected?.id ) continue;
				const p = sites.get( l.id )!.localToWorld( new Vector3() );
				if ( p.distanceTo( camera.position ) > 4500 ) continue;
				const gh = sampleGround( l );
				if ( gh !== null && Math.abs( gh - ( ground.get( l.id ) ?? groundEstimate ) ) > 0.5 ) placeSite( l, gh );

			}

		}

		renderer.render( scene, camera );
		labels.update( camera, root.clientWidth, root.clientHeight );

		// HUD
		if ( Math.floor( elapsed * 4 ) !== Math.floor( ( elapsed - dt ) * 4 ) ) {

			const o = currentOrbit();
			hud.textContent = `${ city.name.toUpperCase() } · ${ o.lat.toFixed( 4 ) }, ${ o.lon.toFixed( 4 ) } · ALT ${ alt > 2000 ? `${ formatNumber( alt / 1000, 1 ) } km` : `${ Math.round( alt ) } m` } · ${ formatClock( localHoursNow( city.utcOffset ) ) } PYT · ☀ ${ sunPos.elevation.toFixed( 0 ) }°`;
			const attrs = tiles.getAttributions().filter( a => a.type === 'string' ).map( a => a.value as string );
			attribution.textContent = [ photoreal ? 'Google' : tr( 'Imágenes © Esri, Maxar, Earthstar Geographics', 'Imagery © Esri, Maxar, Earthstar Geographics' ), ...attrs, '© OpenStreetMap' ].filter( ( v, i, a ) => v && a.indexOf( v ) === i ).join( ' · ' );

		}

	} );

	( window as unknown as Record<string, unknown> ).__city = { select: ( id: string ) => {

		const l = data.listings.find( x => x.id === id );
		if ( l ) select( l );

	}, openFloor: ( id: string, f: number ) => {

		const l = data.listings.find( x => x.id === id );
		if ( l ) openFloor( l, f );

	}, flyTo, currentOrbit, deselect, camera, tiles };

	return () => {

		renderer.setAnimationLoop( null );
		window.removeEventListener( 'resize', resize );
		flight?.cancel();
		poiAbort?.abort();
		controls.dispose();
		tiles.dispose();
		draco.dispose();
		pmrem.dispose();
		labels.clear();
		renderer.dispose();
		ui.remove();

	};

}
