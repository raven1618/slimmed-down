// Traces of life: steam from the pot, water from the faucet, a film on the TV, sound.
// Kept deliberately suggestive: the scene hints at people without showing them.

import {
	AdditiveBlending,
	BufferAttribute,
	BufferGeometry,
	CanvasTexture,
	Color,
	CylinderGeometry,
	Mesh,
	NormalBlending,
	Points,
	ShaderMaterial,
	SRGBColorSpace,
	Vector3,
} from 'three';

// ------------------------------------------------------------------ steam

export class Steam {

	readonly points: Points;
	private pos: Float32Array;
	private life: Float32Array;
	private seed: Float32Array;
	private alive: Float32Array;
	intensity = 0;
	private target = 0;

	constructor( private origin: Vector3, private count = 70 ) {

		this.pos = new Float32Array( count * 3 );
		this.life = new Float32Array( count ).map( () => Math.random() );
		this.seed = new Float32Array( count ).map( () => Math.random() );
		this.alive = new Float32Array( count );
		const g = new BufferGeometry();
		g.setAttribute( 'position', new BufferAttribute( this.pos, 3 ) );
		g.setAttribute( 'life', new BufferAttribute( this.life, 1 ) );
		g.setAttribute( 'seed', new BufferAttribute( this.seed, 1 ) );
		g.setAttribute( 'alive', new BufferAttribute( this.alive, 1 ) );
		const m = new ShaderMaterial( {
			transparent: true,
			depthWrite: false,
			blending: NormalBlending,
			uniforms: { uScale: { value: 1 }, uIntensity: { value: 0 } },
			vertexShader: /* glsl */`
				attribute float life; attribute float seed; attribute float alive;
				uniform float uScale;
				varying float vAlpha;
				void main() {
					vec4 mv = modelViewMatrix * vec4( position, 1.0 );
					gl_Position = projectionMatrix * mv;
					float size = mix( 0.05, 0.32, life ) * ( 0.7 + seed * 0.6 );
					gl_PointSize = size * uScale / -mv.z;
					vAlpha = alive * smoothstep( 0.0, 0.15, life ) * ( 1.0 - smoothstep( 0.55, 1.0, life ) );
				}`,
			fragmentShader: /* glsl */`
				uniform float uIntensity;
				varying float vAlpha;
				void main() {
					vec2 c = gl_PointCoord - 0.5;
					float d = length( c );
					float a = smoothstep( 0.5, 0.0, d );
					gl_FragColor = vec4( vec3( 0.92 ), a * a * vAlpha * 0.32 * uIntensity );
				}`,
		} );
		this.points = new Points( g, m );
		this.points.frustumCulled = false;
		this.points.renderOrder = 5;

	}

	set( on: boolean ) {

		this.target = on ? 1 : 0;

	}

	update( dt: number, time: number, viewportHeight: number ) {

		this.intensity += ( this.target - this.intensity ) * Math.min( 1, dt * 0.8 );
		const m = this.points.material as ShaderMaterial;
		m.uniforms.uIntensity.value = this.intensity;
		m.uniforms.uScale.value = viewportHeight * 0.9;
		if ( this.intensity < 0.002 && this.target === 0 ) {

			this.points.visible = false;
			return;

		}

		this.points.visible = true;
		for ( let i = 0; i < this.count; i ++ ) {

			this.life[ i ] += dt / ( 3.2 + this.seed[ i ] * 1.8 );
			if ( this.life[ i ] >= 1 ) {

				this.life[ i ] -= 1;
				this.alive[ i ] = this.target > 0 ? 1 : 0;

			}

			const L = this.life[ i ];
			const s = this.seed[ i ] * 6.283;
			const rise = L * ( 0.55 + this.seed[ i ] * 0.25 );
			const swirl = 0.03 + L * 0.09;
			this.pos[ i * 3 ] = this.origin.x + Math.sin( s + time * 0.9 + L * 4 ) * swirl;
			this.pos[ i * 3 + 1 ] = this.origin.y + rise;
			this.pos[ i * 3 + 2 ] = this.origin.z + Math.cos( s * 1.3 + time * 0.7 + L * 3 ) * swirl;

		}

		const g = this.points.geometry;
		g.attributes.position.needsUpdate = true;
		g.attributes.life.needsUpdate = true;
		g.attributes.alive.needsUpdate = true;

	}

}

// ------------------------------------------------------------------ water

export class FaucetWater {

	readonly mesh: Mesh;
	private amount = 0;
	private target = 0;

	constructor( spout: Vector3, length = 0.3 ) {

		const g = new CylinderGeometry( 0.0055, 0.0045, length, 10, 12, true );
		g.translate( 0, - length / 2, 0 );
		const m = new ShaderMaterial( {
			transparent: true,
			depthWrite: false,
			blending: AdditiveBlending,
			uniforms: { uTime: { value: 0 }, uAmount: { value: 0 } },
			vertexShader: /* glsl */`
				varying vec2 vUv; varying vec3 vN; varying vec3 vV;
				void main() {
					vUv = uv;
					vec4 mv = modelViewMatrix * vec4( position, 1.0 );
					vN = normalize( normalMatrix * normal );
					vV = normalize( -mv.xyz );
					gl_Position = projectionMatrix * mv;
				}`,
			fragmentShader: /* glsl */`
				uniform float uTime; uniform float uAmount;
				varying vec2 vUv; varying vec3 vN; varying vec3 vV;
				void main() {
					// falling: reveal from the top while turning on
					float reveal = step( 1.0 - uAmount, vUv.y );
					float streak = 0.55 + 0.45 * sin( vUv.y * 90.0 + uTime * 38.0 + vUv.x * 6.283 );
					float fres = pow( 1.0 - abs( dot( vN, vV ) ), 2.0 );
					vec3 c = vec3( 0.75, 0.86, 1.0 ) * ( 0.25 + 0.75 * fres ) * streak;
					gl_FragColor = vec4( c * reveal * uAmount, 1.0 );
				}`,
		} );
		this.mesh = new Mesh( g, m );
		this.mesh.position.copy( spout );
		this.mesh.visible = false;
		this.mesh.renderOrder = 4;

	}

	set( on: boolean ) {

		this.target = on ? 1 : 0;

	}

	get on() {

		return this.target > 0;

	}

	update( dt: number, time: number ) {

		this.amount += ( this.target - this.amount ) * Math.min( 1, dt * 6 );
		const m = this.mesh.material as ShaderMaterial;
		m.uniforms.uTime.value = time;
		m.uniforms.uAmount.value = this.amount;
		this.mesh.visible = this.amount > 0.01;

	}

}

// ------------------------------------------------------------------ TV

/** An abstract "film" drawn on a canvas: slow shots, cuts, letterbox. Exposes its mean colour
 *  so the TV light layer can flicker with the picture. */
export class TVScreen {

	readonly texture: CanvasTexture;
	readonly mean = new Color( 0.3, 0.35, 0.5 );
	private ctx: CanvasRenderingContext2D;
	private shot = 0;
	private nextCut = 0;
	private palette: string[] = [];
	private readonly palettes = [
		[ '#0b1c3d', '#2e5c8a', '#f4a259', '#f7d08a' ],
		[ '#1a0f1f', '#5b2a4a', '#d1495b', '#edae49' ],
		[ '#0f2018', '#2d6a4f', '#95d5b2', '#d8f3dc' ],
		[ '#141414', '#3c3c3c', '#c9c9c9', '#f2f2f2' ],
		[ '#0d1b2a', '#1b263b', '#778da9', '#e0e1dd' ],
		[ '#2b1b0e', '#7f4f24', '#dda15e', '#fefae0' ],
	];

	constructor( w = 256, h = 144 ) {

		const c = document.createElement( 'canvas' );
		c.width = w;
		c.height = h;
		this.ctx = c.getContext( '2d', { willReadFrequently: true } )!;
		this.texture = new CanvasTexture( c );
		this.texture.colorSpace = SRGBColorSpace;
		this.cut( 0 );

	}

	private cut( time: number ) {

		this.shot ++;
		this.palette = this.palettes[ Math.floor( Math.random() * this.palettes.length ) ];
		this.nextCut = time + 3 + Math.random() * 5;

	}

	update( time: number ) {

		if ( time > this.nextCut ) this.cut( time );
		const { ctx } = this;
		const { width: w, height: h } = ctx.canvas;
		const p = this.palette;
		const t = time - ( this.nextCut - 8 );
		const g = ctx.createLinearGradient( 0, 0, w, h );
		g.addColorStop( 0, p[ 0 ] );
		g.addColorStop( 1, p[ 1 ] );
		ctx.fillStyle = g;
		ctx.fillRect( 0, 0, w, h );
		// slow-drifting shapes: silhouettes, lights, a horizon
		const seed = this.shot * 13.37;
		for ( let i = 0; i < 5; i ++ ) {

			const x = ( ( Math.sin( seed + i * 2.1 ) * 0.5 + 0.5 ) * w + t * ( 6 + i * 3 ) ) % ( w + 80 ) - 40;
			const y = ( Math.cos( seed * 0.7 + i ) * 0.5 + 0.5 ) * h * 0.8 + h * 0.1;
			const r = 18 + ( ( i * 37 + this.shot * 11 ) % 50 );
			const rg = ctx.createRadialGradient( x, y, 0, x, y, r );
			rg.addColorStop( 0, i % 2 ? p[ 2 ] : p[ 3 ] );
			rg.addColorStop( 1, 'rgba(0,0,0,0)' );
			ctx.globalAlpha = 0.55;
			ctx.fillStyle = rg;
			ctx.beginPath();
			ctx.arc( x, y, r, 0, Math.PI * 2 );
			ctx.fill();

		}

		ctx.globalAlpha = 1;
		ctx.fillStyle = '#000';
		ctx.fillRect( 0, 0, w, h * 0.11 );
		ctx.fillRect( 0, h * 0.89, w, h * 0.11 );
		// mean colour from a tiny sample (cheap)
		const d = ctx.getImageData( w / 2 - 16, h / 2 - 9, 32, 18 ).data;
		let r = 0, gg = 0, b = 0;
		for ( let i = 0; i < d.length; i += 4 ) {

			r += d[ i ];
			gg += d[ i + 1 ];
			b += d[ i + 2 ];

		}

		const n = d.length / 4 * 255;
		this.mean.setRGB( r / n, gg / n, b / n, SRGBColorSpace );
		this.texture.needsUpdate = true;

	}

}

// ------------------------------------------------------------------ sound

/** Procedural sounds (no audio files): running water and a gentle sizzle. */
export class Sounds {

	private ctx: AudioContext | null = null;
	private gains = new Map<string, GainNode>();

	private ensure() {

		if ( this.ctx ) return this.ctx;
		const AC = window.AudioContext || ( window as unknown as { webkitAudioContext: typeof AudioContext } ).webkitAudioContext;
		if ( ! AC ) return null;
		const ctx = new AC();
		this.ctx = ctx;
		const noise = ctx.createBuffer( 1, ctx.sampleRate * 2, ctx.sampleRate );
		const data = noise.getChannelData( 0 );
		for ( let i = 0; i < data.length; i ++ ) data[ i ] = Math.random() * 2 - 1;

		const make = ( id: string, chain: ( src: AudioNode ) => AudioNode ) => {

			const src = ctx.createBufferSource();
			src.buffer = noise;
			src.loop = true;
			const gain = ctx.createGain();
			gain.gain.value = 0;
			chain( src ).connect( gain ).connect( ctx.destination );
			src.start();
			this.gains.set( id, gain );

		};

		make( 'water', src => {

			const bp = ctx.createBiquadFilter();
			bp.type = 'bandpass';
			bp.frequency.value = 1800;
			bp.Q.value = 0.5;
			const lp = ctx.createBiquadFilter();
			lp.type = 'lowpass';
			lp.frequency.value = 5200;
			src.connect( bp ).connect( lp );
			return lp;

		} );
		make( 'sizzle', src => {

			const hp = ctx.createBiquadFilter();
			hp.type = 'highpass';
			hp.frequency.value = 3500;
			const am = ctx.createGain();
			const lfo = ctx.createOscillator();
			const lfoGain = ctx.createGain();
			lfo.frequency.value = 7;
			lfoGain.gain.value = 0.5;
			lfo.connect( lfoGain ).connect( am.gain );
			lfo.start();
			src.connect( hp ).connect( am );
			return am;

		} );
		return ctx;

	}

	set( id: 'water' | 'sizzle', level: number ) {

		const ctx = this.ensure();
		if ( ! ctx ) return;
		if ( ctx.state === 'suspended' ) ctx.resume();
		const g = this.gains.get( id );
		if ( ! g ) return;
		g.gain.cancelScheduledValues( ctx.currentTime );
		g.gain.setTargetAtTime( level, ctx.currentTime, 0.25 );

	}

	dispose() {

		this.ctx?.close();

	}

}
