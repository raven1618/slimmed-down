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
