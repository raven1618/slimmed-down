// Sun position: low-precision NOAA-style algorithm (good to ~0.5°), the same one the
// Blender pipeline uses (pipeline/blender/build_unit.py: sun_position).

const RAD = Math.PI / 180;

export interface SunPosition {
	/** degrees from north, clockwise (east = 90) */
	azimuth: number;
	/** degrees above the horizon */
	elevation: number;
}

export function sunPosition( date: Date, latDeg: number, lonDeg: number ): SunPosition {

	const jd = date.getTime() / 86400000 + 2440587.5;
	const n = jd - 2451545.0;
	const L = ( 280.46 + 0.9856474 * n ) % 360;
	const g = ( ( 357.528 + 0.9856003 * n ) % 360 ) * RAD;
	const lambda = ( L + 1.915 * Math.sin( g ) + 0.02 * Math.sin( 2 * g ) ) * RAD;
	const eps = ( 23.439 - 0.0000004 * n ) * RAD;
	const ra = Math.atan2( Math.cos( eps ) * Math.sin( lambda ), Math.cos( lambda ) );
	const dec = Math.asin( Math.sin( eps ) * Math.sin( lambda ) );
	const gmst = ( ( 18.697374558 + 24.06570982441908 * n ) % 24 + 24 ) % 24;
	const ha = ( gmst * 15 + lonDeg ) * RAD - ra;
	const phi = latDeg * RAD;
	const el = Math.asin( Math.sin( phi ) * Math.sin( dec ) + Math.cos( phi ) * Math.cos( dec ) * Math.cos( ha ) );
	const az = Math.atan2(
		- Math.sin( ha ) * Math.cos( dec ),
		Math.sin( dec ) * Math.cos( phi ) - Math.cos( dec ) * Math.sin( phi ) * Math.cos( ha ),
	);
	return { azimuth: ( ( az / RAD ) % 360 + 360 ) % 360, elevation: el / RAD };

}

/** Builds a Date for a local wall-clock time at a fixed UTC offset (Paraguay: UTC-3 all year). */
export function localDate( isoDate: string, hours: number, utcOffset: number ): Date {

	const [ y, m, d ] = isoDate.split( '-' ).map( Number );
	const ms = Date.UTC( y, m - 1, d, 0, 0, 0 ) + ( hours - utcOffset ) * 3600000;
	return new Date( ms );

}

/** Current wall-clock hour (fractional) at a UTC offset. */
export function localHoursNow( utcOffset: number ): number {

	const now = new Date();
	const h = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600 + utcOffset;
	return ( h + 24 ) % 24;

}

export function formatClock( hours: number ): string {

	const h = Math.floor( ( ( hours % 24 ) + 24 ) % 24 );
	const m = Math.floor( ( hours - Math.floor( hours ) ) * 60 );
	return `${ String( h ).padStart( 2, '0' ) }:${ String( m ).padStart( 2, '0' ) }`;

}

/** Unit vector towards the sun in an east-north-up frame. */
export function sunENU( p: SunPosition ): [ number, number, number ] {

	const a = p.azimuth * RAD;
	const e = p.elevation * RAD;
	return [ Math.sin( a ) * Math.cos( e ), Math.cos( a ) * Math.cos( e ), Math.sin( e ) ];

}

/** Approximate daylight colour of direct sunlight for a given elevation (linear RGB). */
export function sunColor( elevation: number ): [ number, number, number ] {

	const t = Math.min( 1, Math.max( 0, elevation / 25 ) );
	// low sun: warm orange; high sun: near-white
	return [ 1.0, 0.62 + 0.34 * t, 0.36 + 0.54 * t ];

}
