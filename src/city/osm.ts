// Live OpenStreetMap data via the Overpass API: nearby services and building footprints.
// Results are cached per browser for a week. Data © OpenStreetMap contributors (ODbL).

import type { LatLon } from './geo';
import { distance } from './geo';

const ENDPOINTS = [ 'https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter' ];
const WEEK = 7 * 24 * 3600 * 1000;

export type PoiCategory = 'education' | 'health' | 'shopping' | 'parks';

export interface Poi extends LatLon {
	id: string;
	name: string;
	category: PoiCategory;
	kind: string;
	distance: number;
}

export interface Footprint {
	id: string;
	ring: LatLon[];
	height: number;
}

export const POI_META: Record<PoiCategory, { label: [ string, string ]; color: string; glyph: string }> = {
	education: { label: [ 'Educación', 'Education' ], color: '#6cb6ff', glyph: 'school' },
	health: { label: [ 'Salud', 'Health' ], color: '#ff5d6c', glyph: 'health' },
	shopping: { label: [ 'Compras', 'Shopping' ], color: '#f2b45a', glyph: 'shop' },
	parks: { label: [ 'Parques', 'Parks' ], color: '#3ddc97', glyph: 'park' },
};

async function overpass( query: string, signal?: AbortSignal ) {

	let lastErr: unknown;
	for ( const url of ENDPOINTS ) {

		try {

			const res = await fetch( url, { method: 'POST', body: new URLSearchParams( { data: query } ), signal } );
			if ( ! res.ok ) throw new Error( `Overpass ${ res.status }` );
			return await res.json();

		} catch ( e ) {

			if ( ( e as Error ).name === 'AbortError' ) throw e;
			lastErr = e;

		}

	}

	throw lastErr;

}

function cached<T>( key: string ): T | null {

	try {

		const raw = localStorage.getItem( key );
		if ( ! raw ) return null;
		const { t, v } = JSON.parse( raw );
		return Date.now() - t < WEEK ? v : null;

	} catch {

		return null;

	}

}

function store( key: string, v: unknown ) {

	try {

		localStorage.setItem( key, JSON.stringify( { t: Date.now(), v } ) );

	} catch { /* quota or private mode: fine, just no cache */ }

}

function classify( tags: Record<string, string> ): { category: PoiCategory; kind: string } | null {

	const a = tags.amenity, s = tags.shop, l = tags.leisure;
	if ( [ 'school', 'kindergarten', 'college', 'university' ].includes( a ) ) return { category: 'education', kind: a };
	if ( [ 'hospital', 'clinic', 'doctors', 'pharmacy' ].includes( a ) ) return { category: 'health', kind: a };
	if ( s === 'mall' || s === 'supermarket' ) return { category: 'shopping', kind: s };
	if ( l === 'park' ) return { category: 'parks', kind: 'park' };
	return null;

}

/** Services within `radius` metres, the closest few per category. */
export async function fetchPois( at: LatLon, radius = 1500, perCategory = 6, signal?: AbortSignal ): Promise<Poi[]> {

	const key = `habitar.pois.${ at.lat.toFixed( 4 ) },${ at.lon.toFixed( 4 ) },${ radius }`;
	const hit = cached<Poi[]>( key );
	if ( hit ) return hit;
	const around = `(around:${ radius },${ at.lat },${ at.lon })`;
	const q = `[out:json][timeout:25];
(
  nwr["amenity"~"^(school|kindergarten|college|university|hospital|clinic|doctors|pharmacy)$"]${ around };
  nwr["shop"~"^(mall|supermarket)$"]${ around };
  nwr["leisure"="park"]["name"]${ around };
);
out center tags 300;`;
	const json = await overpass( q, signal );
	const pois: Poi[] = [];
	for ( const el of json.elements ?? [] ) {

		const tags = el.tags ?? {};
		const c = classify( tags );
		const lat = el.lat ?? el.center?.lat;
		const lon = el.lon ?? el.center?.lon;
		if ( ! c || lat === undefined || lon === undefined ) continue;
		const name = tags.name || tags[ 'name:es' ] || tags.brand || '';
		if ( ! name && c.category !== 'health' ) continue;
		pois.push( { id: `${ el.type }/${ el.id }`, name: name || ( c.kind === 'pharmacy' ? 'Farmacia' : 'Consultorio' ), lat, lon, ...c, distance: distance( at, { lat, lon } ) } );

	}

	const out: Poi[] = [];
	for ( const cat of Object.keys( POI_META ) as PoiCategory[] ) {

		// prefer the big ones: hospitals over pharmacies, malls over supermarkets
		const rank = ( p: Poi ) => p.distance * ( p.kind === 'hospital' || p.kind === 'mall' || p.kind === 'university' ? 0.55 : p.kind === 'pharmacy' ? 1.6 : 1 );
		out.push( ...pois.filter( p => p.category === cat ).sort( ( a, b ) => rank( a ) - rank( b ) ).slice( 0, perCategory ) );

	}

	store( key, out );
	return out;

}

/** Building footprints around a point, with heights from OSM tags (or a sensible default). */
export async function fetchBuildings( at: LatLon, radius = 650, signal?: AbortSignal ): Promise<Footprint[]> {

	const key = `habitar.bldg.${ at.lat.toFixed( 4 ) },${ at.lon.toFixed( 4 ) },${ radius }`;
	const hit = cached<Footprint[]>( key );
	if ( hit ) return hit;
	const q = `[out:json][timeout:25];way["building"](around:${ radius },${ at.lat },${ at.lon });out geom tags 4000;`;
	const json = await overpass( q, signal );
	const out: Footprint[] = [];
	for ( const el of json.elements ?? [] ) {

		if ( ! el.geometry || el.geometry.length < 4 ) continue;
		const t = el.tags ?? {};
		const levels = parseFloat( t[ 'building:levels' ] );
		const height = parseFloat( t.height ) || ( levels ? levels * 3.1 + 1 : t.building === 'apartments' ? 24 : t.building === 'commercial' || t.building === 'office' ? 14 : 6.5 );
		out.push( { id: String( el.id ), ring: el.geometry.map( ( g: { lat: number; lon: number } ) => ( { lat: g.lat, lon: g.lon } ) ), height } );

	}

	store( key, out );
	return out;

}
