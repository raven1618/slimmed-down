#!/usr/bin/env node
// Shrinks a unit .glb for the web: WebP textures (room surfaces at 1024 px, everything
// else at 512 px), meshopt-compressed geometry, deduplicated data. Node names, extras
// (roles, light ids) and the lightmap UV set (TEXCOORD_1) are preserved.
//
// Usage: node scripts/optimize-glb.mjs public/home/<unit>/unit.glb [out.glb]

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, textureCompress, meshopt, weld } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import { statSync } from 'node:fs';

const [ input, output = input ] = process.argv.slice( 2 );
if ( ! input ) {

	console.error( 'usage: optimize-glb.mjs in.glb [out.glb]' );
	process.exit( 1 );

}

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
const io = new NodeIO()
	.registerExtensions( ALL_EXTENSIONS )
	.registerDependencies( { 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder } );

const before = statSync( input ).size;
const doc = await io.read( input );

// big architectural surfaces keep more resolution than props
const ROOM = /herringbone|plaster|marble|oak|linen|wool|parquet|floor|wall/i;

await doc.transform(
	dedup(),
	weld(),
	textureCompress( { encoder: sharp, targetFormat: 'webp', quality: 82, resize: [ 1024, 1024 ], pattern: ROOM } ),
	textureCompress( { encoder: sharp, targetFormat: 'webp', quality: 80, resize: [ 512, 512 ] } ),
	prune( { keepAttributes: true, keepLeaves: true, keepExtras: true } ),
	meshopt( { encoder: MeshoptEncoder, level: 'medium' } ),
);

await io.write( output, doc );
const after = statSync( output ).size;
console.log( `${ input }: ${ ( before / 1e6 ).toFixed( 1 ) } MB → ${ ( after / 1e6 ).toFixed( 1 ) } MB` );
