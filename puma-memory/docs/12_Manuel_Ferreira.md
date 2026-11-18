# Manuel Ferreira · teaser (5th speaker)

**Source:**
- **Deck:** "Speakers - Evento Operadores 2026 (3).pptx" (Drive, Nov 12), slides 15–16. SPEECH LIDERAZGO · topic "Economía 2026, Perspectiva 2027".
- **Title for the name card:** not in the deck. Ask the client.

## Script (verbatim placas)
1. **COMPRENDER EL ENTORNO ECONÓMICO.** Collage: global trade, sea routes, ships, oil tanker, US dollars, guaraníes.
2. **ES ANTICIPAR OPORTUNIDADES.** Executives at a work table, a ship on a waterway at dawn, refineries, stock exchange.
3. **TRANSFORMARLAS EN DECISIONES.** Executives deciding from data, a ship's bridge, a logistics control centre.
4. **ES LO QUE GENERA VALOR.** Puma fuel terminal (Drive), barge on the Paraguay river (Drive), Asunción skyline, Paraguay roads, map of Paraguay, Puma stations, Paraguayan farm field, busy highway.

**Client note:** every placa is a COLLAGE of images, not a single image. No football: economic theme.

## Drive material (folder "Manuel Ferreira")
| File | Spec | Use |
|---|---|---|
| Foto Manuel (2).JPG | 5184×3456, EXIF rotated, outdoor | End frame → green → walk-in |
| PUMA ENERGY - IMAGENES PARA WEB.mp4 | 1080p25, 103 s | Real Puma footage: terminal aerials (river), stations day/night, tanker trucks, loading bay → P4 |
| cargo-ship aerial (stock) | 4K, 8 s | P1 |
| close-up of 100 US dollar bills (stock) | 4K, 14 s | P1 |
| adult man talking on phone with data background (stock) | 1.2 GB .mov, not downloaded yet | P3 |

**Brand check on the Puma reel:** avoid truck close-ups (Scania logo), and the station with the "PINEDO SHOPPING" / third-party signs.

## Format (same universal teaser; only the picture layer changes)
- **4-placa grid** (40/187/312/437, close at 590), the same light transitions, lockups, sound and close (walk-in + name card + close swap).
- **Collage layout** (mock: `production/manuel_ferreira/Manuel_collage_layout_mock.jpg`):
  - 4 video tiles per placa: left wing / centre-left / centre-right / right wing.
  - The centre is split by a diagonal seam parallel to the V cut, with a thin KV-green seam line.
  - The text sits on the centre gradient.
  - **Proposed:** each tile changes once mid-placa, so 8 shots per placa.
- **Tiles are small:** Seedance at 480p, then Topaz 1080p is enough (saves credits).

## Nov 18 · build
- **Layout (user):** 3-panel collage, one clip per die-cut panel. Placa 1's centre swaps $ → ₲ (100k only, user choice). `tools/storyboard_v26.py` adds `tiles` per slide (`clip`, `off`, `speed`, `fx`/`fy`, `z`, `push`, swap `until`).
- **P1:** globe 4K | dollars stock → 100k 4K | port 4K.
- **P2:** river ship MF2b | boardroom MF2a (dolly-out prompt) | refinery MF2c.
- **P3:** ship's bridge MF3b | client stock phone/data (MF3a was rejected by Higgsfield as "copyright/IP detected") | control centre MF3c.
- **P4:** Formento Hidrovía | Puma reel terminal aerial (offset 8 s) | soy MF4c.
- **Costs:** images 2.75 each, Seedance 480p 15 each. Unlimited generations are not usable from Claude Code. Avoid over-planning: 11 frames were made, only 7 needed.
- **Still pending:** Manuel's title, walk-in (photo ready), and the 4K upscales of the 6 placa 2–4 clips.
