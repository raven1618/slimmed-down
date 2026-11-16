// Minimal tweening on requestAnimationFrame. Enough for cinematic camera moves and
// motion-graphics reveals without pulling in an animation library.

export type Ease = ( t: number ) => number;

export const ease = {
	linear: ( t: number ) => t,
	outCubic: ( t: number ) => 1 - Math.pow( 1 - t, 3 ),
	inOutCubic: ( t: number ) => ( t < 0.5 ? 4 * t * t * t : 1 - Math.pow( - 2 * t + 2, 3 ) / 2 ),
	inOutQuint: ( t: number ) => ( t < 0.5 ? 16 * t ** 5 : 1 - Math.pow( - 2 * t + 2, 5 ) / 2 ),
	outExpo: ( t: number ) => ( t === 1 ? 1 : 1 - Math.pow( 2, - 10 * t ) ),
	inOutSine: ( t: number ) => - ( Math.cos( Math.PI * t ) - 1 ) / 2,
	outBack: ( t: number ) => {

		const c1 = 1.70158, c3 = c1 + 1;
		return 1 + c3 * Math.pow( t - 1, 3 ) + c1 * Math.pow( t - 1, 2 );

	},
};

export interface TweenHandle {
	cancel(): void;
	done: Promise<boolean>;
}

/** Calls onUpdate(eased t) every frame for `duration` ms. Resolves true when finished, false if cancelled. */
export function tween( duration: number, onUpdate: ( t: number ) => void, easing: Ease = ease.inOutCubic, delay = 0 ): TweenHandle {

	let raf = 0;
	let cancelled = false;
	let resolve!: ( v: boolean ) => void;
	const done = new Promise<boolean>( r => ( resolve = r ) );
	const start = performance.now() + delay;
	const step = ( now: number ) => {

		if ( cancelled ) return;
		const t = Math.min( 1, Math.max( 0, ( now - start ) / Math.max( 1, duration ) ) );
		if ( now >= start ) onUpdate( easing( t ) );
		if ( t < 1 ) raf = requestAnimationFrame( step );
		else resolve( true );

	};

	raf = requestAnimationFrame( step );
	return {
		cancel() {

			if ( cancelled ) return;
			cancelled = true;
			cancelAnimationFrame( raf );
			resolve( false );

		},
		done,
	};

}

export const lerp = ( a: number, b: number, t: number ) => a + ( b - a ) * t;
export const clamp = ( v: number, a: number, b: number ) => Math.min( b, Math.max( a, v ) );
export const smoothstep = ( a: number, b: number, v: number ) => {

	const t = clamp( ( v - a ) / ( b - a ), 0, 1 );
	return t * t * ( 3 - 2 * t );

};
