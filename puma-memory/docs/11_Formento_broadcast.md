# Daniel Formento · teaser as a news broadcast

**Speaker:** DANIEL FORMENTO · SUPPLY & STRATEGIC PLANNING MANAGER · PUMA PARAGUAY
**Topic:** "Dónde estamos parados: una mirada al mercado y a Puma Energy"
**Source:** Brick deck, slide 8, frames s08_image6 / 16 / 13 / 19 plus the name card s08_image20.

**Story arc:** the first 23 s play like a news broadcast about the oil and fuel market, going world → Paraguay → analysis. In the last placa the noise of the news clears and Puma brings clarity. Then the standard close.

---

## 1 · What each slide contains (transcribed verbatim from the deck)

### F1 · LOS ÚLTIMOS AÑOS / MARCARON EL RUMBO / DE NUESTRA INDUSTRIA — world context
| Element | Content |
|---|---|
| Card 1 (white newspaper) | ECONOMÍA · 04 DE MARZO DE 2026 - 10:51 · "Combustible: sector privado anticipa **posible aumento** por conflicto en Medio Oriente" ("posible aumento" highlighted in green) |
| Card 2 (dark web card, La Nación logo) | 12 jul. 2026 · "Irán anunció el cierre del **estrecho de Ormuz**". Sub: "La medida genera incertidumbre en los mercados internacionales y podría afectar el flujo global de petróleo." Photo: tanker at sea |
| Card 3 (dark web card, Ámbito logo) | 14 jul. 2026 · "El mercado internacional del petróleo **volvió a moverse**". Sub: "Las tensiones en Medio Oriente impulsaron un alza en los precios del crudo." Photo: pumpjacks |
| Data | Green candlestick chart; quotes 74.32 ▲ / 76.85 ▲ / 72.40 ▲; digital globe with glowing network (Middle East / Europe) |
| Footage | Tanker at a lit refinery terminal (night), pumpjacks at sunset |

### F2 · PONIÉNDONOS / FRENTE A / NUEVOS DESAFÍOS — Paraguay
| Element | Content |
|---|---|
| Card 1 (white newspaper) | NACIONALES · "A un mes del último aumento, anuncian nueva suba de Petropar del diésel y la nafta premium" (repeated twice in the deck; we use it once) |
| Card 2 (white newspaper) | ECONOMÍA · 06 DE MARZO DE 2026 - 22:01 · "Combustibles suben hasta G. 700 desde este sábado en emblemas privados" |
| Data | Candlestick chart + 74.32 / 76.85 / 72.40 |
| Footage | Refinery/depot with the Paraguayan flag, silver tanker truck, green fuel nozzle in a car |

### F3 · EXIGIENDO / DECISIONES / ESTRATÉGICAS — analysis
| Element | Content |
|---|---|
| Card 1 (dark torn paper) | GEOPOLÍTICA · "El cierre del Estrecho de Ormuz brinda mayor poder de negociación a Asia Central" |
| Card 2 (dark torn paper) | ECONOMÍA · "Diésel sube por sexta vez y temen más aumentos" |
| Card 3 (white newspaper) | ECONOMÍA · 26 DE AGOSTO DE 2026 - 08:46 · "¿Por qué baja el crudo y suben los combustibles en Paraguay? Petropar explica" |
| Data | Map with route arrows and the label "Estrecho de Ormuz"; fuel price board 95 7.620 · 93 7.260 · D 6.950 · GNV 4.990 |
| Footage | Tanker in the strait, refinery at sunset, a service station at dusk |

### F4 · PARA AVANZAR CON / CLARIDAD EN MEDIO / DE LA COMPLEJIDAD — resolution (deck says "PARRA": typo)
| Element | Content |
|---|---|
| Cards | none: the news stops here |
| Graphics | green light lines; a chalk-style tactics diagram (X, O, arrows) bottom right |
| Footage | Puma Energy station, smiling attendant in the Puma uniform, hand refuelling a white car |

### Close
Name card (s08_image20): **DANIEL / FORMENTO** · SUPPLY & STRATEGIC PLANNING MANAGER · PUMA PARAGUAY. Stage photo with a Puma backdrop.

---

## 2 · Format: DECIDED (user, Nov 13): same teaser format as the other speakers
- **Unchanged:** intro, 4 placas with KV lockups in the centre + black gradient, KV light transitions (never on text), ball/flash into the close, close with the green-screen speaker in both wings + name card, Kolomna music, male voice-over.
- **Only change:** the 4 scene clips are **news footage / news broadcasts** instead of football. Each clip carries the content of its deck slide (headlines, data, places) inside the image: on a newsroom video wall, a printed front page, an analysis screen. Then F4 is clean Puma footage.
- No separate broadcast overlays (no ticker/bug/wing monitors in code). The news lives in the footage.

**Revised Nov 13 with the client's news screenshots** (Drive "Placa 1 y 2" / "Placa 3 y 4"; local copies in `formento/news_in/n01–n10`; the 3 extra files in Placa 3 y 4 duplicate n05–n07, and the 6 "PLACAS adicionales" shortcuts didn't download).
- Placa 1 y 2 screenshots: Hormuz. Tankers anchored under arid cliffs (n03/n05/n07), port cranes (n04), the oil-flow chart (n01), a burning tanker with fireboats (n02/n06).
- Placa 3 y 4 screenshots: Paraguay. Hidrovía barge convoys (n08), a river port with El Niño logistics (n09), stations closing (n10).

| Placa | News clip (footage only, no on-screen text) | Ref |
|---|---|---|
| F1 · INTERNACIONAL | Telephoto of anchored tankers in the Strait of Hormuz, arid cliffs behind | n05 |
| F2 · DESAFÍOS | Tanker superstructure burning, smoke, fireboat water cannons | n06 / n02 |
| F3 · DECISIONES | Aerial view of the Hidrovía Paraguay with barge convoys | n08 |
| F4 · CLARIDAD | Clean Puma station (deck frame, text greyed out and extended) | s08_image19 |

- **Refs:** `production/formento/FOR*_REF_21x9.png` are 3360×1440 photo-only canvases (headlines, outlet logos and the play button removed), with the action placed in the LED band.
- **Prompts:** `production/formento/PROMPTS_frames_GPT26.md`.
- **Lesson:** client news screenshots carry outlet logos, headlines and UI. Crop to the photo and inpaint UI marks before using them as a ref. Never put the headline into the frame: the placa lockup is the text, and AI text garbles.

Media logos (La Nación, Ámbito) are not reproduced: section tags + dates only.

## 5 · Production list
- **4 news-clip frames.** GPT Image 2.6 with the matching deck frame as the reference, then Seedance 2.5 (6 s, subtle camera, slow-mo ramp at about 1 s like the others), then Topaz.
- **Close.** His portrait photo is still needed: the deck photo is 200 px / a stage shot. Green-screen end frame → Seedance → key.
- **Voice-over** (same male voice):
  - "Los últimos años... marcaron el rumbo de nuestra industria."
  - "Poniéndonos frente a nuevos desafíos."
  - "Exigiendo decisiones estratégicas."
  - "Para avanzar con claridad... en medio de la complejidad."
  - "Con ustedes... Daniel Formento."
- **Sound.** Kolomna as with the others, plus a subtle news-ident pulse on the stingers and soft data ticks under the price board, both under the music.

## 3 · Wing headline panels (user, Nov 13): proposal, layout mocked
- The news moves to the side wings: each wing shows 2 real headlines per placa (swap at the mid-point). F4 has no cards.
- `tools/news_wings.py` + `tools/cards_formento.json`:
  - each panel fills the wing's chevron shape (read from the die-cut mask) with a full-bleed photo;
  - the headline is wrapped line by line to the width the chevron allows at that height, centred on the tip;
  - the left wing is left-aligned and the right wing right-aligned;
  - the dark wash sits only behind the text;
  - a thin green edge line follows the V (a graphic, with no glow, and it never touches the text).
- Headlines are retyped from the screenshots, key words in green, with section tag + date. No outlet logos.
- Mock: `formento/mock_F1_wings.jpg`. The old `news_cards.py` (rectangular cards) is superseded.

## 4 · Centre broadcast package (user, Nov 13): mocked
- **`tools/news_broadcast.py`:** a generic news look with no channel or outlet brand, clipped to the centre trapezoid between the V's.
  - **Ticker bar:** at the bottom (master y 622–708) with a green top rule.
  - **LIVE block:** "EN VIVO", red with a pulsing dot, plus a running clock.
  - **Crawl:** headlines and market quotes crawl at 240 px/s, with ▲ drawn as green triangles because Gotham has no glyph for it.
  - **Section tab:** above the bar at the left ("ÚLTIMO MOMENTO | <tema>"), wiping in.
- **Lockup:** moved up (top at about y 90 master) so it clears the tab and ticker.
- **Wings:** a uniform translucent wash over the whole wing (0.58). The user rejected the patchy shadow behind the text.
- **Mock:** `formento/mock_F1_broadcast.mp4`, from `tools/formento_mock_anim.py`.

## 5 · Integrated into the standard pipeline (user, Nov 13): "the format is universal"
- **User rule:** text animation, KV light transitions, pace/rhythm, soundtrack and motion graphics are UNIVERSAL across all teasers. Per speaker only the clips change (and here the side panels). Never mock a speaker's teaser outside the renderer.
- **`tools/storyboard_v25.py`** = v24 plus two hooks; everything else is unchanged.
  - `news_wings`: per-slide wing panels with a slow push (+3.5%). At the slide mid-point the old panel fades off (6 f), then the new one wipes in diagonally along the V (12 f), so two headlines never show at once. The panels sit inside `slide_frame`, so the KV light transitions carry them.
  - `news_overlay`: the centre broadcast layer (tab, EN VIVO, clock, ticker). It's drawn after the text-scrim darkening and before the text. On at f40–56, off at f437–452: placa 4 is the news "switching off".
- **`cfg_formento.json`:**
  - 4-placa grid (40/187/312/437, close at 590), with transitions slit/beam/iris/sweep.
  - Lockups come from `text_layout_formento.py`.
  - Slides carry `news` (F1–F3) and `tab2`.
  - Clips are stand-ins (`formento/clips_in/f1–f4.mp4` = the ref frames with a slow push) until the Seedance clips arrive.
  - Close: `anim_none` (an empty speaker) until Formento's walk-in exists.
- **Headlines without a photo** get a fuel price-board graphic (`board: true`, dimmed to 55%, drawn on the outer side).

## 6 · Real clips in (Nov 13)
- **Clips:** Higgsfield job IDs → CloudFront → `formento/clips_in/F1_ormuz, F2_buque, F3_hidrovia, F4_puma, walkin.mp4`, all 3840×1648 at 30 fps. F1 is 5 s, so the slide speed is 0.84.
- **F2 differs from the reference:** a burning barge on a river with a fireboat. That's what the user generated; it's used as is.
- **Walk-in:** keyed with `speaker_key_green.py` → `formento/anim4k` (203 frames).
- **F4 framing:**
  - `clip_off` 0.6 s, so the attendant is already clear of the left V.
  - dy −0.25 → −0.19, zoom 1.08–1.10, cx 0.46 → 0.50.
  - His head stays in the strip throughout; he walks behind the text mid-shot, as the prompt asks.
- **Lesson:** a subject at the extreme left/right top of the strip falls under the V die-cut even when inside the band. Check the V shape, not just the band.
- Nov 13: client: no fires in the video. F2 is replaced by the Hormuz port terminal (client n04), FOR2b. Wing F2_L2 smoke photo → n07.
- Nov 13: client picked n07 (strait fleet) for F2 → FOR2c. Wing F2_L2 → n04.
