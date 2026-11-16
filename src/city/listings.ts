// Listing data model + deterministic demo inventory (units per floor, prices, availability).

export type ListingStatus = 'pozo' | 'construccion' | 'estrenar' | 'usado';
export type UnitStatus = 'available' | 'reserved' | 'sold';

export interface Agency { id: string; name: string; color: string; kind: [ string, string ] }
export interface Agent { id: string; name: string; agency: string; phone: string }

export interface Listing {
	id: string;
	name: string;
	barrio: string;
	lat: number;
	lon: number;
	agency: string;
	agent: string;
	kind: 'tower' | 'house';
	status: ListingStatus;
	floors: number;
	footprint: [ number, number ];
	rotation: number;
	style: 'glass' | 'concrete' | 'warm' | 'brick';
	delivery?: string;
	pricePerM2?: number;
	price?: number;
	area?: number;
	bedrooms?: number;
	amenities: string[];
	units?: { demo?: { unit: string; home: string } };
}

export interface Unit {
	id: string; // e.g. "12B"
	floor: number;
	letter: string;
	bedrooms: number;
	area: number;
	price: number;
	status: UnitStatus;
	orientation: string;
	/** quadrant on the floor plate: 0..3 (NE, NW, SW, SE) */
	quadrant: number;
	home?: string;
}

export interface CityData {
	city: { name: string; lat: number; lon: number; utcOffset: number; currency: string };
	disclaimer: string;
	agencies: Agency[];
	agents: Agent[];
	listings: Listing[];
}

export const STATUS_LABEL: Record<ListingStatus, [ string, string ]> = {
	pozo: [ 'En pozo', 'Off-plan' ],
	construccion: [ 'En construcción', 'Under construction' ],
	estrenar: [ 'A estrenar', 'Brand new' ],
	usado: [ 'Usado', 'Resale' ],
};

/** mulberry32: small deterministic PRNG so every visitor sees the same inventory */
function rng( seed: number ) {

	return () => {

		seed |= 0;
		seed = ( seed + 0x6d2b79f5 ) | 0;
		let t = Math.imul( seed ^ ( seed >>> 15 ), 1 | seed );
		t = ( t + Math.imul( t ^ ( t >>> 7 ), 61 | t ) ) ^ t;
		return ( ( t ^ ( t >>> 14 ) ) >>> 0 ) / 4294967296;

	};

}

function hashString( s: string ) {

	let h = 2166136261;
	for ( let i = 0; i < s.length; i ++ ) h = Math.imul( h ^ s.charCodeAt( i ), 16777619 );
	return h >>> 0;

}

const TYPES = [
	{ letter: 'A', bedrooms: 3, area: 128, orientation: 'NE', quadrant: 0 },
	{ letter: 'B', bedrooms: 2, area: 86, orientation: 'N', quadrant: 1 },
	{ letter: 'C', bedrooms: 1, area: 52, orientation: 'SO', quadrant: 2 },
	{ letter: 'D', bedrooms: 2, area: 92, orientation: 'SE', quadrant: 3 },
];

export function unitsOf( l: Listing ): Unit[] {

	if ( l.kind === 'house' ) {

		return [ { id: '—', floor: 0, letter: '', bedrooms: l.bedrooms ?? 3, area: l.area ?? 200, price: l.price ?? 0, status: 'available', orientation: '—', quadrant: 0 } ];

	}

	const r = rng( hashString( l.id ) );
	const units: Unit[] = [];
	const soldBias = l.status === 'usado' ? 0.75 : l.status === 'estrenar' ? 0.55 : l.status === 'construccion' ? 0.4 : 0.25;
	for ( let f = 2; f <= l.floors; f ++ ) {

		for ( const t of TYPES ) {

			const id = `${ f }${ t.letter }`;
			// lower floors sell first in pre-sales; resale buildings are mostly occupied
			const p = soldBias * ( 1.15 - ( f / l.floors ) * 0.6 ) + ( r() - 0.5 ) * 0.35;
			const roll = r();
			let status: UnitStatus = roll < p ? 'sold' : roll < p + 0.12 ? 'reserved' : 'available';
			const premium = 1 + 0.011 * f + ( t.orientation.includes( 'N' ) ? 0.04 : 0 );
			const price = Math.round( ( l.pricePerM2 ?? 2000 ) * t.area * premium / 500 ) * 500;
			const demo = l.units?.demo?.unit === id ? l.units.demo : undefined;
			if ( demo ) status = 'available';
			units.push( { id, floor: f, letter: t.letter, bedrooms: t.bedrooms, area: t.area, price, status, orientation: t.orientation, quadrant: t.quadrant, home: demo?.home } );

		}

	}

	return units;

}

export function priceFrom( l: Listing ): number {

	if ( l.kind === 'house' ) return l.price ?? 0;
	const avail = unitsOf( l ).filter( u => u.status === 'available' );
	return Math.min( ...( avail.length ? avail : unitsOf( l ) ).map( u => u.price ) );

}

export function availability( l: Listing ) {

	const u = unitsOf( l );
	return {
		total: u.length,
		available: u.filter( x => x.status === 'available' ).length,
		reserved: u.filter( x => x.status === 'reserved' ).length,
		sold: u.filter( x => x.status === 'sold' ).length,
	};

}

export async function loadCity( base: string ): Promise<CityData> {

	const res = await fetch( `${ base }data/asuncion/listings.json` );
	return res.json();

}
