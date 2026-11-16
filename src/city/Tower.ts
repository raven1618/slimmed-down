// Procedural buildings for listings, authored in a local East-North-Up frame
// (x = east, y = north, z = up, metres, origin at the lot centre on the ground).
//
// Status tells a story at a glance:
//   pozo (off-plan)      → a hologram: the building does not exist yet
//   construccion         → finished lower floors, bare concrete above, a tower crane
//   estrenar / usado     → finished building; windows light up at night (real local time)
// When selected, floors light up by availability and a floor can be opened to its units.

import {
	AdditiveBlending,
	BoxGeometry,
	Color,
	DoubleSide,
	DynamicDrawUsage,
	Group,
	InstancedMesh,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	Object3D,
	ShaderMaterial,
	Vector3,
	CylinderGeometry,
	EdgesGeometry,
	LineSegments,
	LineBasicMaterial,
	type Material,
} from 'three';
import type { Listing, Unit } from './listings';
import { ease } from '../shared/tween';

const STYLE = {
	glass: { slab: 0xe9e6df, glass: 0x1d2a3a, metal: 0.55, rough: 0.12 },
	concrete: { slab: 0xb9b6b0, glass: 0x2a3036, metal: 0.35, rough: 0.2 },
	warm: { slab: 0xd9c7a8, glass: 0x2f2a24, metal: 0.45, rough: 0.16 },
	brick: { slab: 0xa3593c, glass: 0x1f2226, metal: 0.3, rough: 0.25 },
} as const;

export const STATUS_COLOR = { available: new Color( 0x3ddc97 ), reserved: new Color( 0xf2b45a ), sold: new Color( 0xff5d6c ) };

const box = new BoxGeometry( 1, 1, 1 ).translate( 0, 0, 0.5 );
const _o = new Object3D();

/** Shared uniforms so every building's windows follow the same night level. */
export const cityUniforms = { uNight: { value: 0 }, uTime: { value: 0 } };

function glassMaterial( color: number, metalness: number, roughness: number, seed: number ) {

	const m = new MeshStandardMaterial( { color, metalness, roughness, envMapIntensity: 1.2 } );
	m.onBeforeCompile = shader => {

		shader.uniforms.uNight = cityUniforms.uNight;
		shader.uniforms.uSeed = { value: seed };
		shader.vertexShader = shader.vertexShader
			.replace( '#include <common>', '#include <common>\nvarying vec3 vTowerPos;' )
			.replace( '#include <begin_vertex>', `#include <begin_vertex>
				#ifdef USE_INSTANCING
					vTowerPos = ( instanceMatrix * vec4( position, 1.0 ) ).xyz;
				#else
					vTowerPos = position;
				#endif` );
		shader.fragmentShader = shader.fragmentShader
			.replace( '#include <common>', `#include <common>
				varying vec3 vTowerPos; uniform float uNight; uniform float uSeed;
				float h21( vec2 p ) { return fract( sin( dot( p, vec2( 41.3, 289.1 ) ) + uSeed ) * 45758.5453 ); }` )
			.replace( '#include <emissivemap_fragment>', `#include <emissivemap_fragment>
				{
					float along = vTowerPos.x + vTowerPos.y;
					vec2 cell = vec2( floor( along / 1.55 ), floor( vTowerPos.z / 3.1 ) );
					vec2 f = vec2( fract( along / 1.55 ), fract( vTowerPos.z / 3.1 ) );
					float frame = step( 0.08, f.x ) * step( f.x, 0.92 ) * step( 0.12, f.y ) * step( f.y, 0.88 );
					float lit = step( 1.0 - 0.5 * uNight, h21( cell ) );
					vec3 warm = mix( vec3( 1.0, 0.72, 0.42 ), vec3( 0.85, 0.92, 1.0 ), step( 0.75, h21( cell + 3.1 ) ) );
					totalEmissiveRadiance += warm * lit * frame * uNight * 2.2;
				}` );

	};

	m.customProgramCacheKey = () => 'tower-glass';
	return m;

}

function hologramMaterial( color: Color ) {

	return new ShaderMaterial( {
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending,
		side: DoubleSide,
		uniforms: { uColor: { value: color }, uTime: cityUniforms.uTime },
		vertexShader: /* glsl */`
			varying vec3 vN; varying vec3 vV; varying float vZ;
			void main() {
				vec4 p = vec4( position, 1.0 );
				#ifdef USE_INSTANCING
					p = instanceMatrix * p;
				#endif
				vZ = p.z;
				vec4 mv = modelViewMatrix * p;
				vN = normalize( mat3( viewMatrix ) * ( mat3( modelMatrix ) * normal ) );
				vV = normalize( -mv.xyz );
				gl_Position = projectionMatrix * mv;
			}`,
		fragmentShader: /* glsl */`
			uniform vec3 uColor; uniform float uTime;
			varying vec3 vN; varying vec3 vV; varying float vZ;
			void main() {
				float fres = pow( 1.0 - abs( dot( vN, vV ) ), 2.2 );
				float scan = 0.5 + 0.5 * sin( vZ * 1.2 - uTime * 3.0 );
				float band = smoothstep( 0.92, 1.0, fract( vZ / 3.1 ) );
				gl_FragColor = vec4( uColor * ( 0.025 + 0.42 * fres + 0.2 * band + 0.04 * scan ), 1.0 );
			}`,
	} );

}

export class Tower extends Group {

	readonly listing: Listing;
	readonly floorH: number;
	readonly groundH: number;
	readonly floors: number;
	private slabs: InstancedMesh;
	private glass: InstancedMesh;
	readonly floorPick: InstancedMesh;
	private unitBoxes: InstancedMesh;
	private crane: Group | null = null;
	private outline: LineSegments;
	private reveal = 1;
	private finished: { slab: Material; glass: Material };
	private hologram: { slab: Material; glass: Material };
	/** off-plan buildings show as holograms until you ask to see them finished */
	showFinished = false;
	private revealTween = 0;
	private w: number;
	private d: number;
	selectedFloor = - 1;

	constructor( listing: Listing, agencyColor: string, private units: Unit[] ) {

		super();
		this.listing = listing;
		this.name = `tower:${ listing.id }`;
		const house = listing.kind === 'house';
		this.floorH = house ? 3.2 : 3.1;
		this.groundH = house ? 3.2 : 4.6;
		this.floors = listing.floors;
		const [ w, d ] = listing.footprint;
		this.w = w;
		this.d = d;
		this.rotation.z = - listing.rotation * Math.PI / 180;
		const style = STYLE[ listing.style ] ?? STYLE.glass;
		const seed = ( listing.id.length * 13.37 ) % 7;
		const holo = listing.status === 'pozo';
		const accent = new Color( agencyColor );

		this.finished = {
			slab: new MeshStandardMaterial( { color: style.slab, roughness: 0.8, metalness: 0 } ),
			glass: glassMaterial( style.glass, style.metal, style.rough, seed ),
		};
		this.hologram = {
			slab: hologramMaterial( accent.clone().lerp( new Color( 0xffffff ), 0.15 ).multiplyScalar( 0.75 ) ),
			glass: hologramMaterial( accent.clone().multiplyScalar( 0.3 ) ),
		};
		const look = holo ? this.hologram : this.finished;
		const slabMat = look.slab;
		const glassMat = look.glass;

		const n = this.floors + 2; // + roof parapet + mechanical box
		this.slabs = new InstancedMesh( box, slabMat, n );
		this.glass = new InstancedMesh( box, glassMat, n );
		this.slabs.instanceMatrix.setUsage( DynamicDrawUsage );
		this.glass.instanceMatrix.setUsage( DynamicDrawUsage );
		this.slabs.frustumCulled = this.glass.frustumCulled = false;
		this.add( this.slabs, this.glass );
		this.slabs.userData.tower = this;
		this.glass.userData.tower = this;

		// availability overlay (one box per floor) and unit boxes (4 per floor plate)
		this.floorPick = new InstancedMesh( box, new MeshBasicMaterial( { transparent: true, opacity: 0.26, depthWrite: false, blending: AdditiveBlending } ), this.floors );
		this.floorPick.visible = false;
		this.floorPick.userData.tower = this;
		this.add( this.floorPick );
		this.unitBoxes = new InstancedMesh( box, new MeshBasicMaterial( { transparent: true, opacity: 0.6, depthWrite: false } ), 4 );
		this.unitBoxes.visible = false;
		this.unitBoxes.userData.tower = this;
		this.add( this.unitBoxes );

		// lot plate
		const lot = new Mesh( box, new MeshStandardMaterial( { color: 0x8f8a80, roughness: 0.95 } ) );
		lot.scale.set( w + 10, d + 10, 0.25 );
		lot.position.z = - 0.05;
		this.add( lot );

		// footprint outline in the agency colour, always readable from above
		const outlineGeo = new EdgesGeometry( new BoxGeometry( w + 10, d + 10, 0.4 ).translate( 0, 0, 0.2 ) );
		this.outline = new LineSegments( outlineGeo, new LineBasicMaterial( { color: accent, transparent: true, opacity: 0.9 } ) );
		this.add( this.outline );

		if ( listing.status === 'construccion' ) this.crane = this.makeCrane( accent );
		this.layout( 1 );

	}

	get height() {

		return this.groundH + ( this.floors - 1 ) * this.floorH + 1.5;

	}

	/** z of the bottom of floor f (1 = ground floor). */
	floorZ( f: number ) {

		return f <= 1 ? 0 : this.groundH + ( f - 2 ) * this.floorH;

	}

	private layout( reveal: number ) {

		const { w, d, floorH, groundH } = this;
		const built = this.listing.status === 'construccion' ? Math.ceil( this.floors * 0.62 ) : this.floors;
		let i = 0;
		const visibleFloors = reveal * this.floors;
		for ( let f = 1; f <= this.floors; f ++ ) {

			const z0 = this.floorZ( f );
			const h = f === 1 ? groundH : floorH;
			// floors pop in one after another while revealing
			const k = Math.min( 1, Math.max( 0, visibleFloors - ( f - 1 ) ) );
			const s = ease.outBack( k ) || 0.0001;
			const bare = f > built;
			// slab band
			_o.position.set( 0, 0, z0 + h - 0.38 );
			_o.scale.set( w * s, d * s, 0.38 * Math.max( 0.0001, k ) );
			_o.updateMatrix();
			this.slabs.setMatrixAt( i, _o.matrix );
			// glazing (inset); bare floors under construction have none
			_o.position.set( 0, 0, z0 );
			_o.scale.set( ( w - 0.6 ) * s, ( d - 0.6 ) * s, ( h - 0.38 ) * ( bare ? 0.0001 : Math.max( 0.0001, k ) ) );
			_o.updateMatrix();
			this.glass.setMatrixAt( i, _o.matrix );
			i ++;

		}

		// roof: parapet + mechanical room
		const top = this.floorZ( this.floors ) + floorH;
		const kr = Math.min( 1, Math.max( 0, visibleFloors - this.floors + 1 ) );
		_o.position.set( 0, 0, top );
		_o.scale.set( w * kr || 0.0001, d * kr || 0.0001, 1.1 * kr || 0.0001 );
		_o.updateMatrix();
		this.slabs.setMatrixAt( i, _o.matrix );
		_o.position.set( w * 0.12, - d * 0.1, top );
		_o.scale.set( w * 0.35 * kr || 0.0001, d * 0.3 * kr || 0.0001, 3.2 * kr || 0.0001 );
		_o.updateMatrix();
		this.glass.setMatrixAt( i, _o.matrix );
		i ++;
		_o.scale.set( 0.0001, 0.0001, 0.0001 );
		_o.updateMatrix();
		this.slabs.setMatrixAt( i, _o.matrix );
		this.glass.setMatrixAt( i, _o.matrix );
		this.slabs.instanceMatrix.needsUpdate = true;
		this.glass.instanceMatrix.needsUpdate = true;

		// availability overlay per floor
		const byFloor = new Map<number, Unit[]>();
		for ( const u of this.units ) byFloor.set( u.floor, [ ...( byFloor.get( u.floor ) ?? [] ), u ] );
		for ( let f = 1; f <= this.floors; f ++ ) {

			const us = byFloor.get( f ) ?? [];
			const avail = us.filter( u => u.status === 'available' ).length;
			const c = us.length === 0 ? new Color( 0x6cb6ff ).multiplyScalar( 0.4 )
				: avail === 0 ? new Color( 0xff5d6c ).multiplyScalar( 0.55 )
					: new Color( 0x3ddc97 ).multiplyScalar( 0.35 + 0.65 * ( avail / us.length ) );
			const z0 = this.floorZ( f );
			const h = f === 1 ? groundH : floorH;
			_o.position.set( 0, 0, z0 + 0.15 );
			_o.scale.set( w + 0.8, d + 0.8, h - 0.3 );
			_o.updateMatrix();
			this.floorPick.setMatrixAt( f - 1, _o.matrix );
			this.floorPick.setColorAt( f - 1, f === this.selectedFloor ? new Color( 0xffffff ) : c );

		}

		this.floorPick.instanceMatrix.needsUpdate = true;
		if ( this.floorPick.instanceColor ) this.floorPick.instanceColor.needsUpdate = true;

	}

	private makeCrane( accent: Color ) {

		const g = new Group();
		const mat = new MeshStandardMaterial( { color: 0xf2c94c, roughness: 0.6, metalness: 0.2 } );
		const mastH = this.height + 14;
		const mast = new Mesh( box, mat );
		mast.scale.set( 1.6, 1.6, mastH );
		mast.position.set( this.w / 2 + 4, this.d / 2 - 3, 0 );
		const jib = new Mesh( box, mat );
		jib.scale.set( 42, 1.1, 1.3 );
		jib.position.set( this.w / 2 + 4 - 12, this.d / 2 - 3, mastH );
		const counter = new Mesh( box, new MeshStandardMaterial( { color: 0x555555 } ) );
		counter.scale.set( 5, 2.4, 2.4 );
		counter.position.set( this.w / 2 + 4 + 8, this.d / 2 - 3, mastH - 1 );
		const cable = new Mesh( new CylinderGeometry( 0.05, 0.05, 1, 6 ).rotateX( Math.PI / 2 ).translate( 0, 0, - 0.5 ), new MeshBasicMaterial( { color: 0x222222 } ) );
		cable.position.set( this.w / 2 + 4 - 26, this.d / 2 - 3, mastH );
		cable.scale.z = 22;
		const beacon = new Mesh( new BoxGeometry( 0.8, 0.8, 0.8 ), new MeshBasicMaterial( { color: accent } ) );
		beacon.position.set( this.w / 2 + 4, this.d / 2 - 3, mastH + 2 );
		g.add( mast, jib, counter, cable, beacon );
		g.userData.jib = jib;
		this.add( g );
		return g;

	}

	/** Floors rise one after another (cinematic "build" when a listing is opened). */
	playReveal( duration = 2400 ) {

		cancelAnimationFrame( this.revealTween );
		const t0 = performance.now();
		const step = () => {

			const t = Math.min( 1, ( performance.now() - t0 ) / duration );
			this.reveal = ease.inOutCubic( t );
			this.layout( this.reveal );
			if ( t < 1 ) this.revealTween = requestAnimationFrame( step );

		};

		step();

	}

	setFinished( on: boolean ) {

		this.showFinished = on;
		const look = on || this.listing.status !== 'pozo' ? this.finished : this.hologram;
		this.slabs.material = look.slab;
		this.glass.material = look.glass;

	}

	showAvailability( on: boolean ) {

		this.floorPick.visible = on;
		if ( ! on ) this.selectFloor( - 1 );

	}

	selectFloor( f: number ) {

		this.selectedFloor = f;
		this.unitBoxes.visible = f > 0;
		this.layout( this.reveal );
		if ( f <= 0 ) return;
		const us = this.units.filter( u => u.floor === f );
		const z0 = this.floorZ( f );
		const h = f === 1 ? this.groundH : this.floorH;
		const qx = [ 1, - 1, - 1, 1 ], qy = [ 1, 1, - 1, - 1 ];
		for ( let q = 0; q < 4; q ++ ) {

			const u = us.find( x => x.quadrant === q );
			_o.position.set( qx[ q ] * this.w / 4, qy[ q ] * this.d / 4, z0 + 0.25 );
			_o.scale.set( u ? this.w / 2 - 0.9 : 0.0001, u ? this.d / 2 - 0.9 : 0.0001, h - 0.5 );
			_o.updateMatrix();
			this.unitBoxes.setMatrixAt( q, _o.matrix );
			this.unitBoxes.setColorAt( q, u ? STATUS_COLOR[ u.status ] : new Color( 0 ) );

		}

		this.unitBoxes.instanceMatrix.needsUpdate = true;
		if ( this.unitBoxes.instanceColor ) this.unitBoxes.instanceColor.needsUpdate = true;

	}

	setHighlight( on: boolean ) {

		( this.outline.material as LineBasicMaterial ).opacity = on ? 1 : 0.55;
		this.outline.scale.setScalar( on ? 1.06 : 1 );

	}

	update( time: number ) {

		if ( this.crane ) this.crane.rotation.z = Math.sin( time * 0.08 ) * 0.6;

	}

	/** World position of the top of the building (for labels and camera targets). */
	topLocal( target = new Vector3() ) {

		return target.set( 0, 0, this.height );

	}

	dispose() {

		this.traverse( o => {

			const m = o as Mesh;
			if ( m.isMesh && m.geometry !== box ) m.geometry.dispose();

		} );

	}

}
