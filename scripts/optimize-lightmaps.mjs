#!/usr/bin/env node
// Re-encodes a unit's RGBE lightmaps from PNG to lossless WebP (bit-exact, smaller) and
// updates its manifest. Usage: node scripts/optimize-lightmaps.mjs public/home/<unit>
import sharp from 'sharp';
import { readFile, writeFile, unlink, stat } from 'node:fs/promises';
import { join } from 'node:path';

const dir = process.argv[ 2 ];
if ( ! dir ) {

	console.error( 'usage: optimize-lightmaps.mjs <unit dir>' );
	process.exit( 1 );

}

const manifestPath = join( dir, 'manifest.json' );
const manifest = JSON.parse( await readFile( manifestPath, 'utf8' ) );
let before = 0, after = 0;
for ( const layer of manifest.layers ) {

	const entries = layer.atlases ? Object.values( layer.atlases ) : [ layer ];
	for ( const e of entries ) {

		if ( ! e.file?.endsWith( '.png' ) ) continue;
		const src = join( dir, e.file );
		const dst = src.replace( /\.png$/, '.webp' );
		// lossless + exact keeps every RGBE byte, including the exponent in alpha
		await sharp( src ).webp( { lossless: true, exact: true, effort: 6 } ).toFile( dst );
		before += ( await stat( src ) ).size;
		after += ( await stat( dst ) ).size;
		await unlink( src );
		e.file = e.file.replace( /\.png$/, '.webp' );

	}

}

await writeFile( manifestPath, JSON.stringify( manifest, null, 2 ) );
console.log( `lightmaps: ${ ( before / 1e6 ).toFixed( 1 ) } MB → ${ ( after / 1e6 ).toFixed( 1 ) } MB` );
