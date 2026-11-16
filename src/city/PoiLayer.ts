// Nearby services around a selected property, shown as motion graphics:
//  · walking rings (5 / 10 / 15 minutes) ripple out from the building
//  · each place rises out of the ground as a glowing pin, staggered
//  · animated routes arc from the building to each place
// Everything lives in the listing's local East-North-Up frame (metres, z up).

import {
	AdditiveBlending,
	BufferAttribute,
	BufferGeometry,
	CanvasTexture,
	Color,
	CylinderGeometry,
	Group,
	Line,
	Mesh,
	MeshBasicMaterial,
	RingGeometry,
	ShaderMaterial,
	SRGBColorSpace,
	Sprite,
	SpriteMaterial,
	Vector3,
	QuadraticBezierCurve3,
} from 'three';
import { offsetMetres, walkMinutes, type LatLon } from './geo';
import { POI_META, type Poi, type PoiCategory } from './osm';
import { ease, tween } from '../shared/tween';

const GLYPHS: Record<string, ( c: CanvasRenderingContext2D ) => void> = {
	school: c => {

		c.beginPath(); c.moveTo( 32, 18 ); c.lineTo( 50, 27 ); c.lineTo( 32, 36 ); c.lineTo( 14, 27 ); c.closePath(); c.fill();
		c.fillRect( 22, 31, 20, 10 ); c.fillRect( 47, 27, 2.5, 12 );

	},
	health: c => {

		c.fillRect( 28, 17, 8, 30 ); c.fillRect( 17, 28, 30, 8 );

	},
	shop: c => {

		c.fillRect( 19, 27, 26, 19 ); c.lineWidth = 3.5; c.beginPath(); c.arc( 32, 27, 7, Math.PI, 0 ); c.stroke();

	},
	park: c => {

		c.beginPath(); c.arc( 32, 26, 11, 0, Math.PI * 2 ); c.fill(); c.fillRect( 30, 30, 4, 16 );

	},
};

const textureCache = new Map<string, CanvasTexture>();

function iconTexture( category: PoiCategory ) {

	const hit = textureCache.get( category );
	if ( hit ) return hit;
	const meta = POI_META[ category ];
	const cv = document.createElement( 'canvas' );
	cv.width = cv.height = 64;
	const c = cv.getContext( '2d' )!;
	c.fillStyle = meta.color;
	c.beginPath(); c.arc( 32, 32, 29, 0, Math.PI * 2 ); c.fill();
	c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 3; c.stroke();
	c.fillStyle = '#0b0d12'; c.strokeStyle = '#0b0d12';
	GLYPHS[ meta.glyph ]( c );
	const t = new CanvasTexture( cv );
	t.colorSpace = SRGBColorSpace;
	textureCache.set( category, t );
	return t;

}

export interface PoiMarker {
	poi: Poi;
	group: Group;
	top: Vector3;
	route: Line;
	minutes: number;
}

export const RING_MINUTES = [ 5, 10, 15 ];

export class PoiLayer extends Group {

	readonly markers: PoiMarker[] = [];
	readonly ringTops: { minutes: number; at: Vector3 }[] = [];
	private routeMat: ShaderMaterial;
	private tweens: { cancel(): void }[] = [];

	constructor( origin: LatLon, pois: Poi[], private buildingHeight: number ) {

		super();
		this.routeMat = new ShaderMaterial( {
			transparent: true,
			depthWrite: false,
			depthTest: false,
			blending: AdditiveBlending,
			uniforms: { uTime: { value: 0 }, uReveal: { value: 0 } },
			vertexShader: /* glsl */`
				attribute float t; attribute vec3 color;
				varying float vT; varying vec3 vColor;
				void main() { vT = t; vColor = color; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }`,
			fragmentShader: /* glsl */`
				uniform float uTime; uniform float uReveal;
				varying float vT; varying vec3 vColor;
				void main() {
					if ( vT > uReveal ) discard;
					float dash = 0.35 + 0.65 * step( 0.5, fract( vT * 14.0 - uTime * 0.9 ) );
					gl_FragColor = vec4( vColor * dash * 0.9, 1.0 );
				}`,
		} );

		// walking rings
		RING_MINUTES.forEach( ( min, i ) => {

			const r = ( min * 80 ) / 1.25;
			const ring = new Mesh(
				new RingGeometry( r - 2.2, r + 2.2, 160 ),
				new MeshBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.55 - i * 0.12, depthTest: false, depthWrite: false } ),
			);
			const fill = new Mesh(
				new RingGeometry( i === 0 ? 0 : ( ( RING_MINUTES[ i - 1 ] * 80 ) / 1.25 ), r, 160 ),
				new MeshBasicMaterial( { color: 0x6cb6ff, transparent: true, opacity: 0.05, depthTest: false, depthWrite: false } ),
			);
			ring.renderOrder = fill.renderOrder = 20;
			ring.position.z = fill.position.z = 3;
			ring.scale.setScalar( 0.001 );
			fill.scale.setScalar( 0.001 );
			this.add( fill, ring );
			this.tweens.push( tween( 1400, t => {

				ring.scale.setScalar( Math.max( 0.001, t ) );
				fill.scale.setScalar( Math.max( 0.001, t ) );

			}, ease.outExpo, 250 + i * 260 ) );
			this.ringTops.push( { minutes: min, at: new Vector3( 0, - r, 4 ) } );

		} );

		// places
		const lineGeo = new CylinderGeometry( 0.7, 0.7, 1, 6 ).rotateX( Math.PI / 2 ).translate( 0, 0, 0.5 );
		pois.forEach( ( poi, i ) => {

			const o = offsetMetres( origin, poi );
			const color = new Color( POI_META[ poi.category ].color );
			const g = new Group();
			g.position.set( o.x, o.y, 0 );
			const h = 38 + ( i % 3 ) * 9;
			const stem = new Mesh( lineGeo, new MeshBasicMaterial( { color, transparent: true, opacity: 0.85, depthWrite: false } ) );
			stem.scale.set( 1, 1, 0.001 );
			const base = new Mesh( new RingGeometry( 6, 9, 40 ), new MeshBasicMaterial( { color, transparent: true, opacity: 0.8, depthTest: false, depthWrite: false } ) );
			base.position.z = 2;
			base.renderOrder = 21;
			const icon = new Sprite( new SpriteMaterial( { map: iconTexture( poi.category ), sizeAttenuation: false, depthTest: false, transparent: true } ) );
			icon.renderOrder = 30;
			icon.scale.setScalar( 0.0001 );
			icon.position.z = h;
			g.add( stem, base, icon );
			this.add( g );

			// route arc from the building to the place
			const from = new Vector3( 0, 0, Math.min( 40, this.buildingHeight * 0.5 ) );
			const to = new Vector3( o.x, o.y, 4 );
			const apex = from.clone().lerp( to, 0.5 ).setZ( 60 + poi.distance * 0.12 );
			const pts = new QuadraticBezierCurve3( from, apex, to ).getPoints( 64 );
			const geo = new BufferGeometry().setFromPoints( pts );
			const tt = new Float32Array( pts.length ).map( ( _, k ) => k / ( pts.length - 1 ) );
			const cols = new Float32Array( pts.length * 3 );
			for ( let k = 0; k < pts.length; k ++ ) color.toArray( cols, k * 3 );
			geo.setAttribute( 't', new BufferAttribute( tt, 1 ) );
			geo.setAttribute( 'color', new BufferAttribute( cols, 3 ) );
			const route = new Line( geo, this.routeMat );
			route.renderOrder = 25;
			this.add( route );

			const delay = 700 + i * 70;
			this.tweens.push( tween( 900, t => {

				stem.scale.z = Math.max( 0.001, h * t );
				icon.scale.setScalar( Math.max( 0.0001, 0.045 * ease.outBack( t ) ) );

			}, ease.outCubic, delay ) );
			this.markers.push( { poi, group: g, top: new Vector3( o.x, o.y, h + 6 ), route, minutes: walkMinutes( poi.distance ) } );

		} );

		this.tweens.push( tween( 1800, t => ( this.routeMat.uniforms.uReveal.value = t ), ease.inOutCubic, 1200 ) );

	}

	/** Only show one category (or all with null). */
	filter( category: PoiCategory | null ) {

		for ( const m of this.markers ) {

			const on = ! category || m.poi.category === category;
			m.group.visible = on;
			m.route.visible = on;

		}

	}

	highlight( poi: Poi | null ) {

		for ( const m of this.markers ) {

			const on = ! poi || m.poi.id === poi.id;
			( m.group.children[ 2 ] as Sprite ).material.opacity = on ? 1 : 0.35;
			m.route.visible = on && m.group.visible;

		}

	}

	update( time: number ) {

		this.routeMat.uniforms.uTime.value = time;

	}

	dispose() {

		this.tweens.forEach( t => t.cancel() );
		this.traverse( o => {

			const m = o as Mesh;
			if ( m.isMesh || ( o as Line ).isLine ) {

				m.geometry?.dispose();

			}

		} );

	}

}
