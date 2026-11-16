#!/usr/bin/env node
// Downloads the CC0 assets (models, textures, HDRIs) used by the Blender unit builder
// from Poly Haven (https://polyhaven.com, all assets CC0 / public domain).
//
// Usage: npm run assets:polyhaven            (reads pipeline/blender/specs/*.json)
//        node scripts/fetch-polyhaven.mjs spec.json [more specs...]
//
// Behind an HTTPS proxy on Node 22, run with NODE_USE_ENV_PROXY=1.

import { mkdir, writeFile, readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve( dirname( new URL( import.meta.url ).pathname ), '..' );
const CACHE = join( ROOT, 'pipeline/.cache/polyhaven' );
const API = 'https://api.polyhaven.com';
const HEADERS = { 'User-Agent': 'habitar-pipeline/0.1 (real-estate 3D prototype)' };

async function exists( p ) {

	try {

		await stat( p );
		return true;

	} catch {

		return false;

	}

}

async function getJSON( url ) {

	const res = await fetch( url, { headers: HEADERS } );
	if ( ! res.ok ) throw new Error( `${ res.status } ${ url }` );
	return res.json();

}

async function download( url, dest ) {

	if ( await exists( dest ) ) return false;
	await mkdir( dirname( dest ), { recursive: true } );
	for ( let attempt = 0; attempt < 4; attempt ++ ) {

		try {

			const res = await fetch( url, { headers: HEADERS } );
			if ( ! res.ok ) throw new Error( `${ res.status } ${ url }` );
			await writeFile( dest, Buffer.from( await res.arrayBuffer() ) );
			return true;

		} catch ( e ) {

			if ( attempt === 3 ) throw e;
			await new Promise( r => setTimeout( r, 2000 * 2 ** attempt ) );

		}

	}

}

async function fetchModel( id, res = '1k' ) {

	const files = await getJSON( `${ API }/files/${ id }` );
	const entry = files.gltf?.[ res ]?.gltf ?? files.gltf?.[ '1k' ]?.gltf;
	if ( ! entry ) throw new Error( `no gltf for ${ id }` );
	const dir = join( CACHE, 'models', id );
	await download( entry.url, join( dir, `${ id }.gltf` ) );
	for ( const [ rel, inc ] of Object.entries( entry.include ?? {} ) ) {

		await download( inc.url, join( dir, rel ) );

	}

	return dir;

}

async function fetchTexture( id, res = '1k' ) {

	const files = await getJSON( `${ API }/files/${ id }` );
	const dir = join( CACHE, 'textures', id );
	const maps = { Diffuse: 'diff', nor_gl: 'nor_gl', Rough: 'rough', AO: 'ao' };
	for ( const [ key, short ] of Object.entries( maps ) ) {

		const file = files[ key ]?.[ res ]?.jpg ?? files[ key ]?.[ res ]?.png;
		if ( ! file ) continue;
		const ext = file.url.split( '.' ).pop();
		await download( file.url, join( dir, `${ id }_${ short }_${ res }.${ ext }` ) );

	}

	return dir;

}

async function fetchHDRI( id, res = '1k' ) {

	const files = await getJSON( `${ API }/files/${ id }` );
	const file = files.hdri?.[ res ]?.hdr;
	if ( ! file ) throw new Error( `no hdr for ${ id }` );
	const dest = join( CACHE, 'hdris', `${ id }_${ res }.hdr` );
	await download( file.url, dest );
	// sharp, tonemapped equirect used as the view through the windows
	if ( files.tonemapped?.url ) await download( files.tonemapped.url, join( CACHE, 'hdris', `${ id }_tonemapped.jpg` ) );
	return dest;

}

async function main() {

	let specs = process.argv.slice( 2 );
	if ( specs.length === 0 ) {

		const dir = join( ROOT, 'pipeline/blender/specs' );
		specs = ( await readdir( dir ) ).filter( f => f.endsWith( '.json' ) ).map( f => join( dir, f ) );

	}

	const want = { models: new Set(), textures: new Set(), hdris: new Set() };
	for ( const s of specs ) {

		const spec = JSON.parse( await readFile( s, 'utf8' ) );
		const ph = spec.polyhaven ?? {};
		( ph.models ?? [] ).forEach( m => want.models.add( m ) );
		( ph.textures ?? [] ).forEach( m => want.textures.add( m ) );
		( ph.hdris ?? [] ).forEach( m => want.hdris.add( m ) );

	}

	for ( const id of want.textures ) {

		await fetchTexture( id );
		console.log( 'texture', id );

	}

	for ( const id of want.hdris ) {

		await fetchHDRI( id );
		console.log( 'hdri', id );

	}

	for ( const id of want.models ) {

		try {

			await fetchModel( id );
			console.log( 'model', id );

		} catch ( e ) {

			console.warn( `skipped model ${ id }: ${ e.message }` );

		}

	}

	console.log( `done → ${ CACHE }` );

}

main().catch( e => {

	console.error( e );
	process.exit( 1 );

} );
