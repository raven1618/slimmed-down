// Small DOM helpers: h() builds elements, plus a toast and a loading screen.

type Child = Node | string | number | null | undefined | false;
type Attrs = Record<string, unknown>;

export function h<K extends keyof HTMLElementTagNameMap>( tag: K, attrs: Attrs = {}, ...children: Child[] ): HTMLElementTagNameMap[ K ] {

	const el = document.createElement( tag );
	for ( const [ k, v ] of Object.entries( attrs ) ) {

		if ( v === undefined || v === null || v === false ) continue;
		if ( k === 'class' ) el.className = String( v );
		else if ( k === 'style' && typeof v === 'object' ) Object.assign( el.style, v );
		else if ( k.startsWith( 'on' ) && typeof v === 'function' ) el.addEventListener( k.slice( 2 ).toLowerCase(), v as EventListener );
		else if ( k === 'html' ) el.innerHTML = String( v );
		else el.setAttribute( k, v === true ? '' : String( v ) );

	}

	for ( const c of children ) {

		if ( c === null || c === undefined || c === false ) continue;
		el.append( c instanceof Node ? c : document.createTextNode( String( c ) ) );

	}

	return el;

}

export function svgIcon( path: string, size = 18 ): HTMLElement {

	const span = document.createElement( 'span' );
	span.style.display = 'inline-flex';
	span.innerHTML = `<svg width="${ size }" height="${ size }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ path }</svg>`;
	return span;

}

export const ICONS = {
	back: '<path d="M15 18l-6-6 6-6"/>',
	sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
	moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
	play: '<path d="M7 5l12 7-12 7z"/>',
	pause: '<path d="M8 5v14M16 5v14"/>',
	bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
	curtain: '<path d="M3 3h18M5 3v18M19 3v18M5 21c3-4 3-12 0-18M19 21c-3-4-3-12 0-18"/>',
	tv: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8"/>',
	drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
	steam: '<path d="M8 3c-1.5 2 1.5 3 0 5M12 3c-1.5 2 1.5 3 0 5M16 3c-1.5 2 1.5 3 0 5M4 12h16v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z"/>',
	vr: '<path d="M3 8h18v8h-6l-2-2h-2l-2 2H3z"/><circle cx="8" cy="12" r="1.5"/><circle cx="16" cy="12" r="1.5"/>',
	phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
	portal: '<path d="M6 21V8a6 6 0 0 1 12 0v13"/><path d="M3 21h18"/>',
	eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
	shuffle: '<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
	filter: '<path d="M3 5h18M6 12h12M10 19h4"/>',
	pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
	building: '<path d="M4 21V5l8-3v19M12 8l8 3v10M8 9h1M8 13h1M8 17h1M16 13h1M16 17h1"/>',
	enter: '<path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/>',
	globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
	key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.5 12.5L21 2M17 6l3 3M14 9l2 2"/>',
	close: '<path d="M6 6l12 12M18 6L6 18"/>',
	walk: '<circle cx="13" cy="4" r="2"/><path d="M9 21l3-7 3 3v5M7 12l3-4 4 1 2 4M10 8l-1 5"/>',
	layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
	upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
};

let toastEl: HTMLElement | null = null;
let toastTimer = 0;

export function toast( msg: string, ms = 2600 ) {

	if ( ! toastEl ) {

		toastEl = h( 'div', { class: 'toast panel', role: 'status', 'aria-live': 'polite' } );
		document.body.append( toastEl );

	}

	toastEl.textContent = msg;
	toastEl.classList.add( 'show' );
	clearTimeout( toastTimer );
	toastTimer = window.setTimeout( () => toastEl?.classList.remove( 'show' ), ms );

}

export class Loader {

	el: HTMLElement;
	private bar: HTMLElement;
	private sub: HTMLElement;

	constructor( parent: HTMLElement, title: string, sub: string ) {

		this.bar = h( 'i' );
		this.sub = h( 'div', { class: 'loader-sub' }, sub );
		this.el = h( 'div', { class: 'loader' },
			h( 'div', { class: 'loader-inner' },
				h( 'div', { class: 'eyebrow' }, 'Habitar' ),
				h( 'div', { class: 'loader-title' }, title ),
				this.sub,
				h( 'div', { class: 'loader-bar' }, this.bar ),
			),
		);
		parent.append( this.el );

	}

	progress( p: number, text?: string ) {

		this.bar.style.width = `${ Math.round( Math.min( 1, Math.max( 0, p ) ) * 100 ) }%`;
		if ( text ) this.sub.textContent = text;

	}

	done() {

		this.progress( 1 );
		this.el.classList.add( 'hide' );
		setTimeout( () => this.el.remove(), 900 );

	}

}

export function brand( sub: string ): HTMLElement {

	return h( 'a', { class: 'brand panel', href: '#/' },
		h( 'span', { class: 'brand-mark' }, 'H' ),
		h( 'b', {}, 'Habitar' ),
		h( 'span', {}, sub ),
	);

}
