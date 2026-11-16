// "Captura": Gaussian-splat viewer for properties that already exist.
// Drop a .ply / .spz / .splat / .ksplat / .rad (produced by pipeline/splat/process_capture.sh
// from a phone walkthrough or drone orbit), or pass ?src=<url>.

import { Box3, PerspectiveCamera, Scene, WebGLRenderer, Clock, Vector3 } from 'three';
import { SparkRenderer, SplatMesh, SparkControls } from '@sparkjsdev/spark';
import { h, svgIcon, ICONS, toast, brand } from '../shared/dom';
import { tr, lang, setLang } from '../shared/i18n';
import '../styles/splat.css';

const SAMPLE = 'https://sparkjs.dev/assets/splats/butterfly.spz';

export async function mountSplat( root: HTMLElement, params: URLSearchParams ) {

	const renderer = new WebGLRenderer( { antialias: false } );
	renderer.setPixelRatio( Math.min( window.devicePixelRatio, 2 ) );
	renderer.setSize( root.clientWidth, root.clientHeight );
	renderer.setClearColor( 0x07090d, 1 );
	renderer.domElement.className = 'stage';
	root.append( renderer.domElement );

	const scene = new Scene();
	const camera = new PerspectiveCamera( 65, root.clientWidth / root.clientHeight, 0.01, 2000 );
	camera.position.set( 0, 0, 3 );
	const spark = new SparkRenderer( { renderer } );
	scene.add( spark );
	const controls = new SparkControls( { canvas: renderer.domElement } );
	( window as unknown as Record<string, unknown> ).__splatView = { camera, get mesh() {

		return mesh;

	} };

	let mesh: SplatMesh | null = null;
	const status = h( 'div', { class: 'splat-status mono' }, tr( 'Sin captura cargada', 'No capture loaded' ) );

	async function show( opts: { url?: string; fileBytes?: ArrayBuffer; fileName?: string }, label: string ) {

		if ( mesh ) {

			scene.remove( mesh );
			mesh.dispose();

		}

		status.textContent = tr( 'Cargando ', 'Loading ' ) + label + '…';
		empty.classList.add( 'hide' );
		const m = new SplatMesh( {
			...opts,
			lod: true,
			onProgress: e => {

				if ( e.total ) status.textContent = `${ tr( 'Cargando', 'Loading' ) } ${ label } · ${ Math.round( ( e.loaded / e.total ) * 100 ) }%`;

			},
		} );
		// COLMAP-style captures are usually y-down: flip to y-up
		m.quaternion.set( 1, 0, 0, 0 );
		scene.add( m );
		mesh = m;
		try {

			await m.initialized;
			status.textContent = `${ label } · ${ tr( 'listo', 'ready' ) }`;
			frameWhenReady( m );

		} catch ( e ) {

			status.textContent = tr( 'No se pudo leer el archivo', 'Could not read the file' );
			toast( String( ( e as Error )?.message ?? e ) );

		}

	}

	/** Frames the capture: a 3/4 view from outside its bounding box. */
	function frame( m: SplatMesh ): boolean {

		m.updateMatrixWorld( true );
		let box = new Box3();
		try {

			box = m.getBoundingBox( true );

		} catch { /* not available for every source */ }
		if ( box.isEmpty() || ! Number.isFinite( box.min.x ) ) {

			// fall back to the splat centres themselves
			box = new Box3();
			// with level of detail on, the loaded data lives in `splats.lodSplats`
			type Iterable = { numSplats?: number; forEachSplat?: SplatMesh[ 'forEachSplat' ] };
			const s = m.splats as ( Iterable & { lodSplats?: Iterable } ) | undefined;
			const src = [ s?.lodSplats, s, m.packedSplats as Iterable ].find( x => x && ( x.numSplats ?? 0 ) > 0 && x.forEachSplat );
			try {

				let i = 0;
				src?.forEachSplat?.( ( _i, c ) => {

					// a sample is enough to frame the camera
					if ( ( i ++ & 7 ) === 0 ) box.expandByPoint( c );

				} );

			} catch { /* ignore */ }

		}

		if ( box.isEmpty() || ! Number.isFinite( box.min.x ) ) return false;

		box.applyMatrix4( m.matrixWorld );
		const size = box.getSize( new Vector3() );
		const centre = box.getCenter( new Vector3() );
		const r = Math.max( 0.5, size.length() / 2 );
		const dist = r / Math.tan( ( camera.fov * Math.PI ) / 360 ) * 1.1;
		camera.position.copy( centre ).add( new Vector3( 0.6, 0.45, 1 ).normalize().multiplyScalar( dist ) );
		camera.near = Math.max( 0.01, dist / 500 );
		camera.far = dist * 50;
		camera.updateProjectionMatrix();
		camera.lookAt( centre );
		return true;

	}

	/** Splats can arrive a moment after `initialized` (level of detail is built in a worker). */
	async function frameWhenReady( m: SplatMesh ) {

		camera.position.set( 0, 0, 3 );
		camera.lookAt( 0, 0, 0 );
		for ( let i = 0; i < 20 && mesh === m; i ++ ) {

			if ( frame( m ) ) return;
			await new Promise( r => setTimeout( r, 400 ) );

		}

	}

	const fileInput = h( 'input', { type: 'file', accept: '.ply,.spz,.splat,.ksplat,.rad,.zip', style: { display: 'none' } } ) as HTMLInputElement;
	fileInput.addEventListener( 'change', async () => {

		const f = fileInput.files?.[ 0 ];
		if ( f ) show( { fileBytes: await f.arrayBuffer(), fileName: f.name }, f.name );

	} );

	const empty = h( 'div', { class: 'splat-empty panel' },
		h( 'div', { class: 'eyebrow' }, tr( 'Captura · Gaussian splatting', 'Capture · Gaussian splatting' ) ),
		h( 'h2', {}, tr( 'Arrastrá acá una captura', 'Drop a capture here' ) ),
		h( 'p', { class: 'muted' }, tr(
			'Formatos: .ply, .spz, .splat, .ksplat, .rad. Generalos desde un video del departamento o un vuelo de dron con pipeline/splat/process_capture.sh.',
			'Formats: .ply, .spz, .splat, .ksplat, .rad. Make them from an apartment walkthrough video or a drone orbit with pipeline/splat/process_capture.sh.',
		) ),
		h( 'div', { class: 'row' },
			h( 'button', { class: 'btn primary', onclick: () => fileInput.click() }, svgIcon( ICONS.upload, 16 ), tr( 'Elegir archivo', 'Choose file' ) ),
			h( 'button', { class: 'btn', onclick: () => show( { url: SAMPLE }, tr( 'ejemplo técnico', 'technical sample' ) ) }, tr( 'Probar con un ejemplo', 'Try a sample' ) ),
		),
		h( 'ul', { class: 'capture-tips' },
			h( 'li', {}, tr( 'Interior: exposición bloqueada, caminá despacio a 2–3 alturas, cubrí cada esquina, sin personas.', 'Interior: locked exposure, walk slowly at 2–3 heights, cover every corner, no people.' ) ),
			h( 'li', {}, tr( 'Exterior: 2–3 órbitas automáticas del dron a distintas alturas + pasadas de fachada (200–400 fotos).', 'Exterior: 2–3 automated drone orbits at different heights + façade passes (200–400 frames).' ) ),
			h( 'li', {}, tr( 'Evitá espejos, vidrio y paredes blancas lisas sin textura cuando puedas.', 'Avoid mirrors, glass and plain featureless white walls where you can.' ) ),
		),
	);

	const onDrop = async ( e: DragEvent ) => {

		e.preventDefault();
		root.classList.remove( 'dragging' );
		const f = e.dataTransfer?.files?.[ 0 ];
		if ( f ) show( { fileBytes: await f.arrayBuffer(), fileName: f.name }, f.name );

	};

	const onDragOver = ( e: DragEvent ) => {

		e.preventDefault();
		root.classList.add( 'dragging' );

	};

	root.addEventListener( 'dragover', onDragOver );
	root.addEventListener( 'dragleave', () => root.classList.remove( 'dragging' ) );
	root.addEventListener( 'drop', onDrop );

	const ui = h( 'div', { class: 'splat-ui' },
		h( 'div', { class: 'topbar' }, brand( tr( 'Captura', 'Capture' ) ), h( 'div', { class: 'spacer' } ),
			h( 'button', { class: 'btn panel', onclick: () => {

				if ( mesh ) {

					mesh.rotateX( Math.PI );
					frameWhenReady( mesh );

				}

			} }, tr( 'Dar vuelta', 'Flip' ) ),
			h( 'button', { class: 'btn panel', onclick: () => fileInput.click() }, svgIcon( ICONS.upload, 16 ), tr( 'Abrir', 'Open' ) ),
			h( 'button', { class: 'btn panel', onclick: () => setLang( lang === 'es' ? 'en' : 'es' ) }, lang === 'es' ? 'EN' : 'ES' ),
		),
		empty,
		h( 'div', { class: 'splat-foot panel' }, status, h( 'span', { class: 'muted' }, tr( ' · arrastrá para girar, WASD para moverte, rueda para acercar', ' · drag to orbit, WASD to move, wheel to zoom' ) ) ),
		fileInput,
	);
	root.append( ui );

	const src = params.get( 'src' );
	if ( src ) show( { url: src }, src.split( '/' ).pop() ?? src );

	const resize = () => {

		camera.aspect = root.clientWidth / root.clientHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( root.clientWidth, root.clientHeight );

	};

	window.addEventListener( 'resize', resize );
	const clock = new Clock();
	renderer.setAnimationLoop( () => {

		clock.getDelta();
		controls.update( camera );
		renderer.render( scene, camera );

	} );

	return () => {

		renderer.setAnimationLoop( null );
		window.removeEventListener( 'resize', resize );
		mesh?.dispose();
		renderer.dispose();
		ui.remove();

	};

}
