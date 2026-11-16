// Habitar: hash router. Each view is loaded on demand so the map does not pay for the
// interior (and vice versa).
//   #/            landing
//   #/ciudad      city map (God's-eye view of Asunción)          ?listing=<id>
//   #/hogar       live inside a unit                              ?unit=<id>&from=<listing>
//   #/captura     Gaussian-splat viewer for captured properties   ?src=<url>

import './styles/app.css';
import { mountHub } from './hub';

type Unmount = ( () => void ) | void;

const app = document.getElementById( 'app' )!;
let unmount: Unmount = undefined;
let current = '';

async function route() {

	const hash = location.hash.replace( /^#/, '' ) || '/';
	const [ path, query = '' ] = hash.split( '?' );
	const params = new URLSearchParams( query );
	const key = path;
	// same view, different params: let the view handle it (e.g. selecting another listing)
	if ( key === current && ( window as unknown as { __onParams?: ( p: URLSearchParams ) => void } ).__onParams ) {

		( window as unknown as { __onParams: ( p: URLSearchParams ) => void } ).__onParams( params );
		return;

	}

	if ( typeof unmount === 'function' ) unmount();
	( window as unknown as { __onParams?: unknown } ).__onParams = undefined;
	app.replaceChildren();
	current = key;
	const root = document.createElement( 'div' );
	root.style.cssText = 'position:absolute;inset:0;';
	app.append( root );

	try {

		if ( path === '/ciudad' ) {

			const { mountCity } = await import( './city/CityView' );
			unmount = await mountCity( root, params );

		} else if ( path === '/hogar' ) {

			const { mountHome } = await import( './home/HomeView' );
			unmount = await mountHome( root, params );

		} else if ( path === '/captura' ) {

			const { mountSplat } = await import( './splat/SplatView' );
			unmount = await mountSplat( root, params );

		} else {

			unmount = mountHub( root );

		}

	} catch ( e ) {

		console.error( e );
		root.innerHTML = `<div style="padding:24px;font-family:var(--mono);color:#ff9a9a;white-space:pre-wrap">${ String( ( e as Error )?.stack ?? e ) }</div>`;

	}

}

window.addEventListener( 'hashchange', route );
route();
