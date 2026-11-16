import { h, svgIcon, ICONS, brand } from './shared/dom';
import { tr, lang, setLang } from './shared/i18n';

export function mountHub( root: HTMLElement ) {

	const card = ( n: string, href: string, title: string, text: string, cta: string, color: string, icon: string ) =>
		h( 'a', { class: 'hub-card', href },
			h( 'div', { class: 'glow', style: { background: color } } ),
			h( 'div', { class: 'num' }, n ),
			svgIcon( icon, 26 ),
			h( 'h2', {}, title ),
			h( 'p', {}, text ),
			h( 'span', { class: 'go' }, cta, svgIcon( '<path d="M5 12h14M13 6l6 6-6 6"/>', 16 ) ),
		);

	const el = h( 'div', { class: 'hub' },
		h( 'div', { class: 'topbar' }, brand( 'Asunción' ), h( 'div', { class: 'spacer' } ),
			h( 'button', { class: 'btn panel', onclick: () => setLang( lang === 'es' ? 'en' : 'es' ) }, lang === 'es' ? 'EN' : 'ES' ) ),
		h( 'div', { class: 'hub-inner' },
			h( 'div', { class: 'eyebrow' }, tr( 'Fase 0 · prototipo', 'Phase 0 · prototype' ) ),
			h( 'h1', {}, tr( 'Recorré la ciudad. Entrá al edificio. ', 'Fly the city. Enter the building. ' ), h( 'em', {}, tr( 'Viví la unidad.', 'Live in the unit.' ) ) ),
			h( 'p', { class: 'hub-lead' }, tr(
				'Un mapa vivo de Asunción con propiedades por inmobiliaria y agente, edificios que existen o todavía no, y unidades que podés habitar: luz real del sol, lámparas, cortinas, la canilla, la tele. En el teléfono, como ventana mágica; en un visor, en realidad virtual.',
				'A live map of Asunción with listings by agency and agent, buildings that exist or not yet, and units you can live in: real sunlight, lamps, curtains, the faucet, the TV. On a phone as a magic window; on a headset, in VR.',
			) ),
			h( 'div', { class: 'hub-grid' },
				card( '01', '#/ciudad', tr( 'Ciudad', 'City' ), tr( 'Vista de dios sobre Asunción en 3D. Propiedades por agencia, agente o al azar, edificios generados en su lote, servicios cercanos y radios a pie.', "God's-eye view of Asunción in 3D. Listings by agency, agent or at random, buildings generated on their lots, nearby services and walking radii." ), tr( 'Volar sobre Asunción', 'Fly over Asunción' ), '#6cb6ff', ICONS.globe ),
				card( '02', '#/hogar', tr( 'Habitar', 'Live in it' ), tr( 'Una unidad con luz precalculada por capas en Blender: cambiá la hora y la estación, prendé lámparas, cerrá cortinas, abrí la canilla. VR y portal AR.', 'A unit with light pre-computed in layers by Blender: change time and season, switch lamps, close curtains, run the faucet. VR and AR portal.' ), tr( 'Entrar a la unidad', 'Enter the unit' ), '#f2b45a', ICONS.enter ),
				card( '03', '#/captura', tr( 'Captura', 'Capture' ), tr( 'Visor de Gaussian splats para propiedades existentes: arrastrá un archivo .ply / .spz / .splat procesado desde tu video o dron.', 'Gaussian-splat viewer for existing properties: drop a .ply / .spz / .splat processed from your phone or drone footage.' ), tr( 'Probar una captura', 'Try a capture' ), '#3ddc97', ICONS.upload ),
			),
			h( 'p', { class: 'hub-foot' },
				tr( 'Todas las propiedades, inmobiliarias y agentes son ficticios (datos de demostración). Mapa: imágenes © Esri; edificios y servicios © colaboradores de OpenStreetMap; modo fotorrealista con Google Photorealistic 3D Tiles (requiere tu clave). Muebles y texturas: Poly Haven (CC0).',
					'All listings, agencies and agents are fictional (demo data). Map: imagery © Esri; buildings and places © OpenStreetMap contributors; photorealistic mode with Google Photorealistic 3D Tiles (needs your key). Furniture and textures: Poly Haven (CC0).' ),
			),
		),
	);
	root.append( el );
	return () => el.remove();

}
