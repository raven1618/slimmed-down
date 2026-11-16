// Tiny bilingual helper. Spanish (Paraguay, voseo) by default; English via ?lang=en
// or the toggle, remembered per browser.

export type Lang = 'es' | 'en';

function detect(): Lang {

	const q = new URLSearchParams( location.search ).get( 'lang' );
	if ( q === 'en' || q === 'es' ) return q;
	try {

		const s = localStorage.getItem( 'habitar.lang' );
		if ( s === 'en' || s === 'es' ) return s;

	} catch { /* storage unavailable */ }
	return 'es';

}

export let lang: Lang = detect();

export function setLang( l: Lang ) {

	lang = l;
	try {

		localStorage.setItem( 'habitar.lang', l );

	} catch { /* ignore */ }
	location.reload();

}

/** tr('Disponible', 'Available') */
export function tr( es: string, en: string ): string {

	return lang === 'en' ? en : es;

}

/** Picks from a [es, en] pair as stored in data files. */
export function pick( pair: string | [ string, string ] | undefined ): string {

	if ( ! pair ) return '';
	if ( typeof pair === 'string' ) return pair;
	return lang === 'en' ? pair[ 1 ] : pair[ 0 ];

}

export function formatUSD( v: number ): string {

	return 'US$ ' + Math.round( v ).toLocaleString( lang === 'en' ? 'en-US' : 'es-PY' );

}

export function formatNumber( v: number, digits = 0 ): string {

	return v.toLocaleString( lang === 'en' ? 'en-US' : 'es-PY', { maximumFractionDigits: digits, minimumFractionDigits: digits } );

}
