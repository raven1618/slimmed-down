// LightLayers: mixes pre-computed lightmaps ("light layers") on the GPU.
//
// Each layer is an irradiance map baked by pipeline/blender/build_unit.py, stored as
// RGBE in an 8-bit PNG. Every time a weight changes (a lamp fades, the sun moves) we
// render  Σ weight_i · tint_i · layer_i  into one half-float render target, and every
// lightmapped material samples that single texture. Cost per frame when nothing
// changes: zero. Cost of a change: one full-screen pass over a 1024² target.

import {
	Camera,
	Color,
	DataTexture,
	GLSL3,
	HalfFloatType,
	ImageBitmapLoader,
	LinearFilter,
	Mesh,
	NearestFilter,
	NoBlending,
	AdditiveBlending,
	NoColorSpace,
	PlaneGeometry,
	RawShaderMaterial,
	RGBAFormat,
	Scene,
	Texture,
	UnsignedByteType,
	Vector2,
	WebGLRenderer,
	WebGLRenderTarget,
} from 'three';

const MAX_PER_PASS = 8;

export interface LayerInfo {
	id: string;
	kind: 'sky' | 'sun' | 'light';
	/** one file per lightmap atlas (e.g. "arch", "furniture"); `file` is the single-atlas fallback */
	atlases?: Record<string, { file: string; size: number }>;
	file?: string;
	season?: string;
	time?: string;
	label?: [ string, string ];
	color?: [ number, number, number ];
	mean?: number;
}

const vertexShader = /* glsl */`
in vec3 position;
void main() { gl_Position = vec4( position.xy, 0.0, 1.0 ); }
`;

const fragmentShader = /* glsl */`
precision highp float;
precision highp int;
uniform sampler2D layers[ ${ MAX_PER_PASS } ];
uniform vec3 tints[ ${ MAX_PER_PASS } ];
uniform int count;
out vec4 outColor;

uniform vec2 outSize;

vec3 decodeRGBE( vec4 t ) {
	if ( t.a <= 0.0 ) return vec3( 0.0 );
	// (byte + 0.5) / 256 * 2^(e - 128)
	return ( t.rgb * 255.0 + 0.5 ) * exp2( t.a * 255.0 - 136.0 );
}

// RGBE can't be filtered by the GPU (shared exponent), so decode 4 texels and blend.
vec3 sampleLayer( sampler2D tex, vec2 uv ) {
	ivec2 size = textureSize( tex, 0 );
	vec2 st = uv * vec2( size ) - 0.5;
	ivec2 i0 = ivec2( floor( st ) );
	vec2 f = fract( st );
	ivec2 mx = size - 1;
	vec3 a = decodeRGBE( texelFetch( tex, clamp( i0, ivec2( 0 ), mx ), 0 ) );
	vec3 b = decodeRGBE( texelFetch( tex, clamp( i0 + ivec2( 1, 0 ), ivec2( 0 ), mx ), 0 ) );
	vec3 c = decodeRGBE( texelFetch( tex, clamp( i0 + ivec2( 0, 1 ), ivec2( 0 ), mx ), 0 ) );
	vec3 d = decodeRGBE( texelFetch( tex, clamp( i0 + ivec2( 1, 1 ), ivec2( 0 ), mx ), 0 ) );
	return mix( mix( a, b, f.x ), mix( c, d, f.x ), f.y );
}

void main() {
	vec2 uv = gl_FragCoord.xy / outSize;
	vec3 sum = vec3( 0.0 );
	${ Array.from( { length: MAX_PER_PASS }, ( _, i ) => `if ( count > ${ i } ) sum += tints[ ${ i } ] * sampleLayer( layers[ ${ i } ], uv );` ).join( '\n\t' ) }
	outColor = vec4( sum, 1.0 );
}
`;

export class LightLayers {

	readonly target: WebGLRenderTarget;
	readonly layers = new Map<string, { info: LayerInfo; texture: Texture; weight: number; tint: Color }>();
	private material: RawShaderMaterial;
	private quad: Mesh;
	private scene = new Scene();
	private camera = new Camera();
	private dirty = true;
	private black: DataTexture;

	constructor( private renderer: WebGLRenderer, readonly size: number, readonly atlas = 'arch' ) {

		this.target = new WebGLRenderTarget( size, size, {
			type: HalfFloatType,
			format: RGBAFormat,
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			generateMipmaps: false,
			depthBuffer: false,
			colorSpace: NoColorSpace,
		} );
		// lightmaps live in the second UV set (TEXCOORD_1)
		this.target.texture.channel = 1;
		this.black = new DataTexture( new Uint8Array( 4 ), 1, 1, RGBAFormat, UnsignedByteType );
		this.black.needsUpdate = true;
		this.material = new RawShaderMaterial( {
			glslVersion: GLSL3,
			vertexShader,
			fragmentShader,
			uniforms: {
				layers: { value: new Array( MAX_PER_PASS ).fill( this.black ) },
				tints: { value: Array.from( { length: MAX_PER_PASS }, () => new Color( 0, 0, 0 ) ) },
				count: { value: 0 },
				outSize: { value: new Vector2( size, size ) },
			},
			depthTest: false,
			depthWrite: false,
		} );
		this.quad = new Mesh( new PlaneGeometry( 2, 2 ), this.material );
		this.quad.frustumCulled = false;
		this.scene.add( this.quad );

	}

	get texture() {

		return this.target.texture;

	}

	async load( baseUrl: string, infos: LayerInfo[], onProgress?: ( p: number ) => void ) {

		const loader = new ImageBitmapLoader();
		// exact bytes: no premultiplication, no colour conversion, no flip (glTF UV convention)
		loader.setOptions( { imageOrientation: 'none', premultiplyAlpha: 'none', colorSpaceConversion: 'none' } );
		let done = 0;
		await Promise.all( infos.map( async info => {

			const file = info.atlases ? info.atlases[ this.atlas ]?.file : info.file;
			if ( ! file ) return;
			const bitmap = await loader.loadAsync( baseUrl + file );
			const tex = new Texture( bitmap );
			tex.flipY = false;
			tex.premultiplyAlpha = false;
			tex.colorSpace = NoColorSpace;
			tex.magFilter = NearestFilter;
			tex.minFilter = NearestFilter;
			tex.generateMipmaps = false;
			tex.needsUpdate = true;
			this.layers.set( info.id, { info, texture: tex, weight: 0, tint: new Color( 1, 1, 1 ) } );
			onProgress?.( ++ done / infos.length );

		} ) );

	}

	set( id: string, weight: number, tint?: Color | [ number, number, number ] ) {

		const L = this.layers.get( id );
		if ( ! L ) return;
		if ( Math.abs( L.weight - weight ) > 1e-4 ) {

			L.weight = weight;
			this.dirty = true;

		}

		if ( tint ) {

			const c = Array.isArray( tint ) ? new Color( tint[ 0 ], tint[ 1 ], tint[ 2 ] ) : tint;
			if ( ! c.equals( L.tint ) ) {

				L.tint.copy( c );
				this.dirty = true;

			}

		}

	}

	weight( id: string ) {

		return this.layers.get( id )?.weight ?? 0;

	}

	/** Re-mixes into the render target if anything changed. Returns true if it did. */
	update(): boolean {

		if ( ! this.dirty ) return false;
		this.dirty = false;
		const active = [ ...this.layers.values() ].filter( l => l.weight > 1e-4 );
		const r = this.renderer;
		const prevTarget = r.getRenderTarget();
		const prevXr = r.xr.enabled;
		const prevAutoClear = r.autoClear;
		r.xr.enabled = false;
		r.autoClear = false;
		r.setRenderTarget( this.target );
		r.setClearColor( 0x000000, 1 );
		r.clear( true, false, false );
		const u = this.material.uniforms;
		for ( let start = 0; start < Math.max( 1, active.length ); start += MAX_PER_PASS ) {

			const chunk = active.slice( start, start + MAX_PER_PASS );
			u.count.value = chunk.length;
			for ( let i = 0; i < MAX_PER_PASS; i ++ ) {

				const l = chunk[ i ];
				u.layers.value[ i ] = l ? l.texture : this.black;
				( u.tints.value[ i ] as Color ).copy( l ? l.tint : new Color( 0, 0, 0 ) ).multiplyScalar( l ? l.weight : 0 );

			}

			this.material.blending = start === 0 ? NoBlending : AdditiveBlending;
			r.render( this.scene, this.camera );

		}

		r.setRenderTarget( prevTarget );
		r.xr.enabled = prevXr;
		r.autoClear = prevAutoClear;
		return true;

	}

	dispose() {

		this.target.dispose();
		this.material.dispose();
		this.quad.geometry.dispose();
		this.layers.forEach( l => l.texture.dispose() );

	}

}

/** All atlases of a unit, driven together: set() and update() fan out to each atlas. */
export class LightLayerSet {

	readonly atlases = new Map<string, LightLayers>();

	constructor( renderer: WebGLRenderer, sizes: Record<string, number> ) {

		for ( const [ key, size ] of Object.entries( sizes ) ) this.atlases.set( key, new LightLayers( renderer, size, key ) );

	}

	async load( baseUrl: string, infos: LayerInfo[], onProgress?: ( p: number ) => void ) {

		const n = this.atlases.size;
		const progress = new Map<string, number>();
		await Promise.all( [ ...this.atlases.values() ].map( a => a.load( baseUrl, infos, p => {

			progress.set( a.atlas, p );
			onProgress?.( [ ...progress.values() ].reduce( ( x, y ) => x + y, 0 ) / n );

		} ) ) );

	}

	texture( atlas: string ) {

		return ( this.atlases.get( atlas ) ?? [ ...this.atlases.values() ][ 0 ] ).texture;

	}

	set( id: string, weight: number, tint?: Color | [ number, number, number ] ) {

		for ( const a of this.atlases.values() ) a.set( id, weight, tint );

	}

	weight( id: string ) {

		return [ ...this.atlases.values() ][ 0 ]?.weight( id ) ?? 0;

	}

	update() {

		let any = false;
		for ( const a of this.atlases.values() ) any = a.update() || any;
		return any;

	}

	dispose() {

		this.atlases.forEach( a => a.dispose() );

	}

}
