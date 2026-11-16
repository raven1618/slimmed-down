// Walk-through controls for an interior:
//  · drag to look around (mouse or touch), wheel / pinch to zoom the lens
//  · tap / click the floor to walk there, WASD / arrows to walk
//  · tap an interactive object: handled by the owner through onTap
// Plus MagicWindow: the phone's gyroscope steers the camera (works on iPhone and Android).

import { Euler, MathUtils, PerspectiveCamera, Quaternion, Vector2, Vector3 } from 'three';
import { clamp, ease, tween, type TweenHandle } from '../shared/tween';

export interface Bounds {
	min: Vector3;
	max: Vector3;
}

export class WalkControls {

	enabled = true;
	yaw = 0;
	pitch = 0;
	eyeHeight = 1.6;
	onTap: ( ndc: Vector2 ) => void = () => {};
	private keys = new Set<string>();
	private pointers = new Map<number, { x: number; y: number }>();
	private downAt = { x: 0, y: 0, t: 0 };
	private moved = 0;
	private pinchDist = 0;
	private move: TweenHandle | null = null;
	private euler = new Euler( 0, 0, 0, 'YXZ' );

	constructor( private camera: PerspectiveCamera, private dom: HTMLElement, private bounds: Bounds ) {

		dom.addEventListener( 'pointerdown', this.onDown );
		dom.addEventListener( 'pointermove', this.onMove );
		dom.addEventListener( 'pointerup', this.onUp );
		dom.addEventListener( 'pointercancel', this.onUp );
		dom.addEventListener( 'wheel', this.onWheel, { passive: false } );
		window.addEventListener( 'keydown', this.onKey );
		window.addEventListener( 'keyup', this.onKey );
		this.syncFromCamera();

	}

	syncFromCamera() {

		this.euler.setFromQuaternion( this.camera.quaternion, 'YXZ' );
		this.yaw = this.euler.y;
		this.pitch = this.euler.x;

	}

	private apply() {

		this.pitch = clamp( this.pitch, - 1.3, 1.3 );
		this.euler.set( this.pitch, this.yaw, 0, 'YXZ' );
		this.camera.quaternion.setFromEuler( this.euler );

	}

	private onDown = ( e: PointerEvent ) => {

		if ( ! this.enabled ) return;
		this.dom.setPointerCapture( e.pointerId );
		this.pointers.set( e.pointerId, { x: e.clientX, y: e.clientY } );
		this.downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
		this.moved = 0;
		if ( this.pointers.size === 2 ) this.pinchDist = this.pinchDistance();

	};

	private onMove = ( e: PointerEvent ) => {

		const p = this.pointers.get( e.pointerId );
		if ( ! p || ! this.enabled ) return;
		const dx = e.clientX - p.x;
		const dy = e.clientY - p.y;
		p.x = e.clientX;
		p.y = e.clientY;
		this.moved += Math.abs( dx ) + Math.abs( dy );
		if ( this.pointers.size === 2 ) {

			const d = this.pinchDistance();
			this.zoom( ( this.pinchDist - d ) * 0.08 );
			this.pinchDist = d;
			return;

		}

		// drag the world: the view follows the finger like Street View
		const k = ( this.camera.fov / 60 ) * 0.0042;
		this.yaw += dx * k;
		this.pitch += dy * k;
		this.apply();
		this.move?.cancel();

	};

	private onUp = ( e: PointerEvent ) => {

		if ( ! this.pointers.has( e.pointerId ) ) return;
		this.pointers.delete( e.pointerId );
		const quick = performance.now() - this.downAt.t < 450;
		if ( this.enabled && quick && this.moved < 8 && this.pointers.size === 0 ) {

			const r = this.dom.getBoundingClientRect();
			this.onTap( new Vector2( ( ( e.clientX - r.left ) / r.width ) * 2 - 1, - ( ( e.clientY - r.top ) / r.height ) * 2 + 1 ) );

		}

	};

	private pinchDistance() {

		const [ a, b ] = [ ...this.pointers.values() ];
		return Math.hypot( a.x - b.x, a.y - b.y );

	}

	private onWheel = ( e: WheelEvent ) => {

		if ( ! this.enabled ) return;
		e.preventDefault();
		this.zoom( e.deltaY * 0.02 );

	};

	zoom( delta: number ) {

		this.camera.fov = clamp( this.camera.fov + delta, 30, 80 );
		this.camera.updateProjectionMatrix();

	}

	private onKey = ( e: KeyboardEvent ) => {

		if ( e.target instanceof HTMLInputElement ) return;
		const k = e.key.toLowerCase();
		if ( e.type === 'keydown' ) this.keys.add( k );
		else this.keys.delete( k );

	};

	/** Smoothly walks to a floor point, keeping the gaze direction. */
	walkTo( p: Vector3, duration?: number ) {

		this.move?.cancel();
		const from = this.camera.position.clone();
		const to = this.clampPoint( new Vector3( p.x, this.eyeHeight, p.z ) );
		const dist = from.distanceTo( to );
		this.move = tween( duration ?? clamp( 450 + dist * 380, 500, 2200 ), t => {

			this.camera.position.lerpVectors( from, to, t );
			// subtle head bob while walking
			this.camera.position.y = this.eyeHeight + Math.sin( t * Math.PI * Math.max( 1, Math.round( dist / 0.7 ) ) * 2 ) * 0.012 * ( 1 - t );

		}, ease.inOutSine );
		return this.move.done;

	}

	/** Cinematic move to a viewpoint (position + look-at point). */
	flyTo( at: Vector3, look: Vector3, duration = 1600 ) {

		this.move?.cancel();
		const from = this.camera.position.clone();
		const q0 = this.camera.quaternion.clone();
		const dir = look.clone().sub( at ).normalize();
		const targetYaw = Math.atan2( - dir.x, - dir.z );
		const targetPitch = Math.asin( clamp( dir.y, - 1, 1 ) );
		const q1 = new Quaternion().setFromEuler( new Euler( targetPitch, targetYaw, 0, 'YXZ' ) );
		const to = this.clampPoint( at.clone() );
		this.move = tween( duration, t => {

			this.camera.position.lerpVectors( from, to, t );
			this.camera.quaternion.slerpQuaternions( q0, q1, t );

		}, ease.inOutQuint );
		this.move.done.then( ok => ok && this.syncFromCamera() );
		return this.move.done;

	}

	private clampPoint( p: Vector3 ) {

		const m = 0.35;
		p.x = clamp( p.x, this.bounds.min.x + m, this.bounds.max.x - m );
		p.z = clamp( p.z, this.bounds.min.z + m, this.bounds.max.z - m );
		return p;

	}

	update( dt: number ) {

		if ( ! this.enabled ) return;
		const f = ( this.keys.has( 'w' ) || this.keys.has( 'arrowup' ) ? 1 : 0 ) - ( this.keys.has( 's' ) || this.keys.has( 'arrowdown' ) ? 1 : 0 );
		const s = ( this.keys.has( 'd' ) ? 1 : 0 ) - ( this.keys.has( 'a' ) ? 1 : 0 );
		const turn = ( this.keys.has( 'arrowleft' ) ? 1 : 0 ) - ( this.keys.has( 'arrowright' ) ? 1 : 0 );
		if ( turn ) {

			this.yaw += turn * dt * 1.6;
			this.apply();

		}

		if ( f || s ) {

			this.move?.cancel();
			const speed = 1.4 * dt;
			const fwd = new Vector3( - Math.sin( this.yaw ), 0, - Math.cos( this.yaw ) );
			const right = new Vector3( Math.cos( this.yaw ), 0, - Math.sin( this.yaw ) );
			this.camera.position.addScaledVector( fwd, f * speed ).addScaledVector( right, s * speed );
			this.clampPoint( this.camera.position );

		}

	}

	dispose() {

		this.dom.removeEventListener( 'pointerdown', this.onDown );
		this.dom.removeEventListener( 'pointermove', this.onMove );
		this.dom.removeEventListener( 'pointerup', this.onUp );
		this.dom.removeEventListener( 'pointercancel', this.onUp );
		this.dom.removeEventListener( 'wheel', this.onWheel );
		window.removeEventListener( 'keydown', this.onKey );
		window.removeEventListener( 'keyup', this.onKey );
		this.move?.cancel();

	}

}

/** Gyroscope "magic window": hold the phone up and move it to look around the unit. */
export class MagicWindow {

	active = false;
	private device = new Quaternion();
	private have = false;
	private offset = new Quaternion();
	private needsOffset = true;
	private readonly zee = new Vector3( 0, 0, 1 );
	private readonly q1 = new Quaternion( - Math.sqrt( 0.5 ), 0, 0, Math.sqrt( 0.5 ) );
	private readonly euler = new Euler();
	private readonly q0 = new Quaternion();

	static get supported() {

		return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window && matchMedia( '(pointer: coarse)' ).matches;

	}

	async enable(): Promise<boolean> {

		const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
		if ( typeof DOE.requestPermission === 'function' ) {

			try {

				if ( ( await DOE.requestPermission() ) !== 'granted' ) return false;

			} catch {

				return false;

			}

		}

		window.addEventListener( 'deviceorientation', this.onOrient );
		this.active = true;
		this.needsOffset = true;
		return true;

	}

	disable() {

		window.removeEventListener( 'deviceorientation', this.onOrient );
		this.active = false;
		this.have = false;

	}

	private onOrient = ( e: DeviceOrientationEvent ) => {

		if ( e.alpha === null || e.beta === null || e.gamma === null ) return;
		const orient = MathUtils.degToRad( ( screen.orientation?.angle ?? ( window as unknown as { orientation?: number } ).orientation ?? 0 ) as number );
		this.euler.set( MathUtils.degToRad( e.beta ), MathUtils.degToRad( e.alpha ), - MathUtils.degToRad( e.gamma ), 'YXZ' );
		this.device.setFromEuler( this.euler ).multiply( this.q1 ).multiply( this.q0.setFromAxisAngle( this.zee, - orient ) );
		this.have = true;

	};

	/** Applies the device orientation, keeping the heading the user had when enabling. */
	update( camera: PerspectiveCamera ) {

		if ( ! this.active || ! this.have ) return;
		if ( this.needsOffset ) {

			const camYaw = new Euler().setFromQuaternion( camera.quaternion, 'YXZ' ).y;
			const devYaw = new Euler().setFromQuaternion( this.device, 'YXZ' ).y;
			this.offset.setFromAxisAngle( new Vector3( 0, 1, 0 ), camYaw - devYaw );
			this.needsOffset = false;

		}

		camera.quaternion.copy( this.offset ).multiply( this.device );

	}

}
