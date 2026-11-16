// WebXR for the unit:
//  · VR ("immersive-vr"): Quest browser, Vision Pro, PC VR. Point a controller and pull the
//    trigger to use objects or to teleport across the floor.
//  · Portal ("immersive-ar"): Android Chrome. A doorway appears 1.3 m in front of you, in your
//    own room; you see the unit through it, walk through, and you are inside. From inside,
//    the doorway shows your real room again.
// iPhone Safari has no immersive WebXR; it gets the gyroscope "magic window" instead.

import {
	AlwaysStencilFunc,
	BoxGeometry,
	BufferGeometry,
	EqualStencilFunc,
	Float32BufferAttribute,
	Group,
	Line,
	LineBasicMaterial,
	Material,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	Object3D,
	PerspectiveCamera,
	PlaneGeometry,
	Raycaster,
	ReplaceStencilOp,
	Vector3,
	WebGLRenderer,
	Scene,
} from 'three';

export type XRMode = 'immersive-vr' | 'immersive-ar';

export interface XRHooks {
	/** Try to use an object hit by the ray. Return true if something was used. */
	select( raycaster: Raycaster ): boolean;
	/** Floor meshes for teleporting. */
	floor: Object3D[];
	/** Where the doorway of the unit is (floor point, unit-local coordinates) and the direction it opens into the unit. */
	doorway: { at: Vector3; inward: Vector3; width: number; height: number };
	/** Objects to hide while in portal mode (e.g. the door leaf). */
	hideInPortal: Object3D[];
	onStart?( mode: XRMode ): void;
	onEnd?(): void;
}

export class XRSessionManager {

	session: XRSession | null = null;
	mode: XRMode | null = null;
	readonly rig = new Group();
	private controllers: Group[] = [];
	private raycaster = new Raycaster();
	private portalMask: Mesh | null = null;
	private portalFrame: Group | null = null;
	private placed = false;
	private inside = false;
	private savedUnitMatrix = new Matrix4();
	private stencilMaterials: Material[] = [];

	constructor(
		private renderer: WebGLRenderer,
		scene: Scene,
		private camera: PerspectiveCamera,
		private unitRoot: Object3D,
		private hooks: XRHooks,
	) {

		scene.add( this.rig );
		this.rig.add( camera );
		for ( let i = 0; i < 2; i ++ ) {

			const c = renderer.xr.getController( i );
			const ray = new Line(
				new BufferGeometry().setAttribute( 'position', new Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) ),
				new LineBasicMaterial( { color: 0xf2b45a, transparent: true, opacity: 0.8 } ),
			);
			ray.scale.z = 4;
			c.add( ray );
			c.addEventListener( 'select', () => this.onSelect( c ) );
			this.rig.add( c );
			this.controllers.push( c );

		}

	}

	static async supports( mode: XRMode ): Promise<boolean> {

		try {

			return !! ( navigator.xr && await navigator.xr.isSessionSupported( mode ) );

		} catch {

			return false;

		}

	}

	get presenting() {

		return this.renderer.xr.isPresenting;

	}

	async start( mode: XRMode ) {

		if ( ! navigator.xr ) return false;
		const init: XRSessionInit = mode === 'immersive-ar'
			? { requiredFeatures: [ 'local-floor' ], optionalFeatures: [ 'dom-overlay' ] }
			: { optionalFeatures: [ 'local-floor', 'bounded-floor', 'hand-tracking' ] };
		if ( mode === 'immersive-ar' && init.optionalFeatures ) ( init as XRSessionInit & { domOverlay?: { root: Element } } ).domOverlay = { root: document.body };
		const session = await navigator.xr.requestSession( mode, init );
		this.session = session;
		this.mode = mode;
		this.renderer.xr.setReferenceSpaceType( 'local-floor' );
		await this.renderer.xr.setSession( session );
		session.addEventListener( 'end', this.onEnd );

		// stand where the camera was, on the floor, facing the same way
		const yaw = Math.atan2( - this.camera.getWorldDirection( new Vector3() ).x, - this.camera.getWorldDirection( new Vector3() ).z );
		if ( mode === 'immersive-vr' ) {

			this.rig.position.set( this.camera.position.x, 0, this.camera.position.z );
			this.rig.rotation.set( 0, yaw, 0 );
			this.camera.position.set( 0, 0, 0 );
			this.camera.quaternion.identity();

		} else {

			this.renderer.setClearAlpha( 0 );
			this.savedUnitMatrix.copy( this.unitRoot.matrix );
			this.placed = false;
			this.inside = false;
			this.setupPortal();

		}

		this.hooks.onStart?.( mode );
		return true;

	}

	end() {

		this.session?.end();

	}

	private onEnd = () => {

		const wasAR = this.mode === 'immersive-ar';
		// leave the camera where the head was
		const p = new Vector3();
		this.camera.getWorldPosition( p );
		const dir = this.camera.getWorldDirection( new Vector3() );
		this.rig.position.set( 0, 0, 0 );
		this.rig.rotation.set( 0, 0, 0 );
		this.rig.updateMatrixWorld();
		if ( ! wasAR ) {

			this.camera.position.set( p.x, 1.6, p.z );
			this.camera.lookAt( p.clone().add( new Vector3( dir.x, 0, dir.z ) ) );

		}

		if ( wasAR ) this.teardownPortal();
		this.session = null;
		this.mode = null;
		this.hooks.onEnd?.();

	};

	private onSelect( controller: Group ) {

		const m = new Matrix4().extractRotation( controller.matrixWorld );
		this.raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
		this.raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( m );
		if ( this.hooks.select( this.raycaster ) ) return;
		if ( this.mode !== 'immersive-vr' ) return;
		const hit = this.raycaster.intersectObjects( this.hooks.floor, false )[ 0 ];
		if ( ! hit ) return;
		// teleport so the head (not the play-space origin) lands on the target
		const head = this.camera.position.clone().applyAxisAngle( new Vector3( 0, 1, 0 ), this.rig.rotation.y );
		this.rig.position.set( hit.point.x - head.x, 0, hit.point.z - head.z );

	}

	// ---------------------------------------------------------------- portal (AR)

	private setupPortal() {

		const d = this.hooks.doorway;
		this.hooks.hideInPortal.forEach( o => ( o.visible = false ) );
		// stencil mask: the doorway opening
		const mask = new Mesh(
			new PlaneGeometry( d.width, d.height ),
			new MeshBasicMaterial( {
				colorWrite: false,
				depthWrite: false,
				stencilWrite: true,
				stencilRef: 1,
				stencilFunc: AlwaysStencilFunc,
				stencilZPass: ReplaceStencilOp,
			} ),
		);
		mask.renderOrder = - 100;
		mask.position.copy( d.at ).add( new Vector3( 0, d.height / 2, 0 ) );
		mask.lookAt( mask.position.clone().sub( d.inward ) );
		this.unitRoot.add( mask );
		this.portalMask = mask;
		// a glowing frame so the doorway reads in the real room
		const frame = new Group();
		const mat = new MeshBasicMaterial( { color: 0xf2b45a } );
		const t = 0.04;
		const parts: [ number, number, number, number ][] = [
			[ - d.width / 2 - t / 2, d.height / 2, t, d.height + t ],
			[ d.width / 2 + t / 2, d.height / 2, t, d.height + t ],
			[ 0, d.height + t / 2, d.width + 2 * t, t ],
		];
		for ( const [ x, y, w, h ] of parts ) {

			const m = new Mesh( new BoxGeometry( w, h, t ), mat );
			m.position.set( x, y, 0 );
			frame.add( m );

		}

		frame.position.copy( d.at );
		frame.lookAt( d.at.clone().sub( d.inward ) );
		this.unitRoot.add( frame );
		this.portalFrame = frame;
		this.setStencil( true );

	}

	private setStencil( outside: boolean ) {

		this.stencilMaterials = [];
		this.unitRoot.traverse( o => {

			const m = ( o as Mesh ).material as Material | Material[] | undefined;
			if ( ! m || o === this.portalMask || ( this.portalFrame && this.portalFrame.children.includes( o ) ) ) return;
			( Array.isArray( m ) ? m : [ m ] ).forEach( mat => {

				mat.stencilWrite = outside;
				mat.stencilRef = 1;
				mat.stencilFunc = outside ? EqualStencilFunc : AlwaysStencilFunc;
				this.stencilMaterials.push( mat );

			} );

		} );
		if ( this.portalMask ) {

			// from inside, the doorway becomes a depth-only "hole" showing the real room behind it
			const pm = this.portalMask.material as MeshBasicMaterial;
			pm.depthWrite = ! outside;
			pm.stencilWrite = outside;

		}

	}

	private teardownPortal() {

		this.renderer.setClearAlpha( 1 );
		this.stencilMaterials.forEach( m => {

			m.stencilWrite = false;
			m.stencilFunc = AlwaysStencilFunc;

		} );
		this.portalMask?.removeFromParent();
		this.portalFrame?.removeFromParent();
		this.portalMask = null;
		this.portalFrame = null;
		this.hooks.hideInPortal.forEach( o => ( o.visible = true ) );
		this.unitRoot.matrix.copy( this.savedUnitMatrix );
		this.unitRoot.matrix.decompose( this.unitRoot.position, this.unitRoot.quaternion, this.unitRoot.scale );

	}

	/** Call every frame while presenting. */
	update() {

		if ( this.mode !== 'immersive-ar' ) return;
		const xrCam = this.renderer.xr.getCamera();
		const head = new Vector3().setFromMatrixPosition( xrCam.matrixWorld );
		if ( ! this.placed && head.lengthSq() > 0 ) {

			// put the doorway 1.3 m ahead of the user, facing them
			const fwd = new Vector3( 0, 0, - 1 ).applyQuaternion( xrCam.quaternion );
			fwd.y = 0;
			fwd.normalize();
			const d = this.hooks.doorway;
			const doorWorld = head.clone().addScaledVector( fwd, 1.3 );
			doorWorld.y = 0;
			const yaw = Math.atan2( fwd.x, fwd.z ) - Math.atan2( d.inward.x, d.inward.z );
			this.unitRoot.rotation.set( 0, yaw, 0 );
			this.unitRoot.position.set( 0, 0, 0 );
			this.unitRoot.updateMatrixWorld();
			const doorNow = d.at.clone().applyMatrix4( this.unitRoot.matrixWorld );
			this.unitRoot.position.copy( doorWorld.sub( doorNow ) );
			this.unitRoot.updateMatrixWorld();
			this.placed = true;

		}

		if ( ! this.placed ) return;
		// which side of the doorway is the head on?
		const local = this.unitRoot.worldToLocal( head.clone() ).sub( this.hooks.doorway.at );
		const insideNow = local.dot( this.hooks.doorway.inward ) > 0.05;
		if ( insideNow !== this.inside ) {

			this.inside = insideNow;
			this.setStencil( ! insideNow );

		}

	}

}
