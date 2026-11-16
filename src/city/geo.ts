// Geodesy helpers on top of 3d-tiles-renderer's WGS84 ellipsoid.
// "Tileset frame" = Earth-centred, Earth-fixed (ECEF) metres, z towards the north pole.
// The tiles group is rotated -90° about x so the scene is y-up; our own content lives in
// a sibling group with the same rotation, so both share coordinates.

import { Matrix4, Vector3, MathUtils } from 'three';
import { WGS84_ELLIPSOID } from '3d-tiles-renderer';

export const ELLIPSOID = WGS84_ELLIPSOID;
const RAD = MathUtils.DEG2RAD;

export interface LatLon {
	lat: number;
	lon: number;
}

/** ECEF position of a geographic point (degrees, metres above the ellipsoid). */
export function ecef( lat: number, lon: number, h = 0, target = new Vector3() ) {

	return ELLIPSOID.getCartographicToPosition( lat * RAD, lon * RAD, h, target );

}

/** East-North-Up frame at a point: x = east, y = north, z = up, in the tileset frame. */
export function enuFrame( lat: number, lon: number, h = 0, target = new Matrix4() ) {

	return ELLIPSOID.getEastNorthUpFrame( lat * RAD, lon * RAD, h, target );

}

export function enuAxes( lat: number, lon: number ) {

	const e = new Vector3(), n = new Vector3(), u = new Vector3();
	ELLIPSOID.getEastNorthUpAxes( lat * RAD, lon * RAD, e, n, u );
	return { e, n, u };

}

export function toCartographic( p: Vector3 ) {

	const r = { lat: 0, lon: 0, height: 0 };
	ELLIPSOID.getPositionToCartographic( p, r );
	return { lat: r.lat / RAD, lon: r.lon / RAD, height: r.height };

}

/** Great-circle distance in metres. */
export function distance( a: LatLon, b: LatLon ) {

	const R = 6371008.8;
	const dLat = ( b.lat - a.lat ) * RAD;
	const dLon = ( b.lon - a.lon ) * RAD;
	const s = Math.sin( dLat / 2 ) ** 2 + Math.cos( a.lat * RAD ) * Math.cos( b.lat * RAD ) * Math.sin( dLon / 2 ) ** 2;
	return 2 * R * Math.asin( Math.min( 1, Math.sqrt( s ) ) );

}

/** Local planar offset (metres east, north) of b relative to a. Fine within a city. */
export function offsetMetres( a: LatLon, b: LatLon ) {

	const R = 6371008.8;
	return {
		x: ( b.lon - a.lon ) * RAD * R * Math.cos( a.lat * RAD ),
		y: ( b.lat - a.lat ) * RAD * R,
	};

}

/** Walking time in minutes at an urban pace (~80 m/min, with a 1.25 detour factor). */
export function walkMinutes( metres: number ) {

	return ( metres * 1.25 ) / 80;

}
