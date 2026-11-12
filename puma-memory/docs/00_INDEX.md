# Puma Energy · Convención de Operadores 2026 — Knowledge base index

Everything we know about this project, indexed by source. Each new piece of content gets a source ID (S06, S07, …) and notes on what was extracted. The documents in `docs/` are rebuilt from these sources.

**Our scope:** 9 videos only: 7 speaker teasers (≤ 30 s, main screen) + 2 sphere videos (running puma; 160-station map). Delivered in 4K, fitted to each screen.
**Last updated:** November 9, 2026 · 12 sources

---

## Sources

| ID | Source | Type | From | Received | Reliability | Key content |
|---|---|---|---|---|---|---|
| **S01** | [Drive "VIDEOS EVENTO PUMA"](https://drive.google.com/drive/folders/1KNZDqXy78V_WHR1iclhZ40vYyfkLQ7A-) → `sources/S01-drive-videos-evento-puma/` | Drive folder | HighBTL (benja@highbtl.com) | Nov 7 (re-checked Nov 7: **no changes since Nov 6**) | ✅ Client material | Teaser scripts for Andrés Silva + Daniel Formento, 4 images, editable KV (PSD), Gotham Condensed, music references, AE transition pack |
| **S02** | Quote "Cotización modular" → `sources/S02-cotizacion-quabund/` | PDF, 4 p. | quabund.ai → Puma | Nov 7 | Context only (**out of scope**) | Event facts (Dec 2, Sheraton, ~200); wristband/WhatsApp packs |
| **S03** | "Pantallas y materiales para proveedor" → `sources/S03-guia-pantallas/` | PDF, 2 p. | Puma (content guide) | Nov 7 | ✅ Client spec · schematics not to scale | Main screen 7296 × 1344 with die-cut; sphere Ø 2 m, 2688 × 1296; salón 2, pórtico, tunnel |
| **S04** | Demo video "Convocados a jugar en grande" → `sources/S04-demo-video/` | Video 3:05 | quabund.ai | Nov 7 | Context only (**out of scope**, sample data) | Event concept line, football theme, sample run of show |
| **S05** | User decisions (chat) | Messages | User | Nov 7 | ✅ | ① Scope: only the 7 teasers + 2 sphere videos; HighBTL writes scripts and sends hi-res images. ② "Fit it to size and we deliver in 4K" → teasers 3840 × 708 (screen ratio), sphere 3840 × 1920 equirect master |
| **S06** | User update (chat) | Message | User | Nov 8 | ✅ | **Andrés Silva's script is the only approved one** (Daniel Formento's is not approved yet). Next: redo Andrés's teaser, then animate the frames HighBTL sent |
| **S07** | User direction (chat) | Message | User | Nov 8 | ✅ | **The KV's green light beam is the main animation element:** used for transitions and as background motion where it fits the context |
| **S08** | User direction (chat) + Drive download | Message + files | User / HighBTL | Nov 8 | ✅ | **Everything is made with Seedance 2.5, beam included**; ideally AI-only, background removal in post only if needed; an animated storyboard is the visual prompt and keeps all 7 intros consistent. KV opened: 1920 × 1080, light ribbons tracing football seams, concept line **"Convocados a jugar en grande" confirmed on the KV**. Images: 1672×941 to 7680×4050 |
| **S09** | **Approved pilot** (Andrés Silva) → `sources/S09-piloto-aprobado/` | Video 49.7 s | HighBTL / client | Nov 8 | ✅ **Approved — master for Andrés** | Final copy, order, layout and timing; request: animate the frames, more dynamic. Role "Director de Planificaciones de Puma" confirmed; new boots image |
| **S10** | User direction (chat) | Message | User | Nov 8 | ✅ | **No background music, sound effects only** |
| **S11** | **Client review of the pilot** (3 phone recordings) → `sources/S11-observaciones-cliente/` | Video + transcripts | Client meeting | Nov 8 | ✅ **Binding corrections** | Text centred in the centre panel, images on the sides, stretched green fade, two-beat phrases, typographic play (KV lockup), light from the sides into the centre with the same behaviour, screen glows on halos, no music: light SFX + **AI voice-over** ending "Con ustedes, Andrés Silva" |
| **S12** | Andrés Silva photos → Drive [folder](https://drive.google.com/drive/folders/1qbAZZ6OYrJUM2yE99-6oHGPlltYbvFiF) | 12 studio portraits (gray backdrop) | diego.buteler@gmail.com | Nov 8 | ✅ | DSC00594 (crossed arms, as in the pilot) cut out → `production/andres_silva_v4/andres_DSC00594_recorte.png` |

**Precedence when sources disagree:** user decisions (S05) > client material/spec (S01, S03) > our proposal (S02) > demo sample data (S04).

---

## Documents

| Doc | Purpose | Audience | Language |
|---|---|---|---|
| `docs/01_Project_brief.md` | Scope, event context, delivery formats, speakers, timeline, risks | Internal | English |
| `docs/02_Video_production_plan.md` | **Have-vs-missing per video**, template at 3840 × 708, shot lists, sphere approach at 3840 × 1920, timeline | Internal / production | English |
| `docs/03_Material_y_preguntas_ES.md` | What we have, what's missing per video, questions for HighBTL/Puma and the LED operator | Reference (long version) | Spanish |
| `docs/04_Mensaje_HighBTL_ES.txt` | The same checklist as a message to paste into WhatsApp/email | **Client-facing**, ready to send | Spanish |
| `docs/05_Screen_fit_pipeline.jpg` | How 21:9 AI clips are cropped to the 5.43:1 screen strip (43% of frame height), upscaled and composited | Internal / production | English |
| `production/andres_silva_piloto/` | **Seedance kit v2 (current)**: the approved pilot with animated frames (`storyboard_piloto_animado.mp4`), 4 reference clips, approved first frames, 4 prompts + optional light-burst prompt, SFX cue sheet, assembly positions — `README_piloto_animado.md` | Production | English |
| `production/_superseded_v4/` | Earlier 30 s kit and script v4 (pptx copy) — superseded by the approved pilot | Archive | — |
| `production/tools/` | `storyboard.py` (rebuilds storyboard, refs and stills per speaker from a config), `psd_layers.py` (splits the KV) | Production | — | | Production / can be shared with HighBTL | Spanish |

---

## Open items (summary)
0. **Andrés Silva: pilot approved (49.7 s)** — animate the 4 frames, SFX only. Missing: original boots image, Andrés hi-res photo; confirm ~50 s vs. the 30 s brief. Other 6 speakers pending
1. **Missing material:** 5 scripts, Daniel's images/footage, 7 speaker photos, 160-station list, final music
2. Speaker roles ("Director de Planificaciones" on both scripts) and running order
3. ~~Concept line~~ confirmed by the KV: "Convocados a jugar en grande"
4. LED operator: die-cut template, sphere mapping template, OK on 3840 × 708 delivery, codec/fps
5. Price for the 9 videos (not in the existing quote)

---

## Changelog
- **Nov 7:** S01–S04 indexed; brief, video plan and Spanish questions created.
- **Nov 7:** S05 added (scope = 9 videos only; 4K delivery fitted to each screen). Drive re-checked: no new files. Brief v2, plan v4, Spanish doc rebuilt as a material checklist + questions (wristband/WhatsApp questions removed).
- **Nov 8:** S06 added (only Andrés's script approved). Production script v2 for Andrés written; HighBTL message saved as 04.
- **Nov 8:** S07 added (KV green light beam as the main animation element). Andrés script v3 replaces v2.
- **Nov 8:** S08 added. Drive access enabled; KV split into layers. Seedance kit for Andrés built (storyboard, refs, stills, prompts). Script v4 replaces v3.
- **Nov 8:** S09 (approved pilot) + S10 (SFX only) added. Pilot analysed (die-cut, framing, fades); animated-pilot storyboard + Seedance kit v2 built; v4 kit archived.
- **Nov 8:** S11 (client review) transcribed and applied: storyboard v3 with temp VO + SFX (`production/andres_silva_v3/`); concept storyboard and v2 kit archived.
- **Nov 8:** S12 (Andrés photos). User: v3 side panels were split crops that made no sense → v4: one image per slide, same framing and same move on both side panels; centre fully green for light + text; real Andrés cutout. v3 archived.
- **Nov 8:** User rejected v4 (same image split across the two side chevrons still reads as fragments). New concept board v5 "una imagen, una pantalla": one image per slide across the full 19 m, die-cut as a frame; per slide: image moment → light pulls the KV green over the centre → text in two beats → dissolve. `production/andres_silva_v5/Concepto_una_imagen_una_pantalla.jpg`. Awaiting approval before animating.
- **Nov 8:** v5 animated ("una imagen, una pantalla"): `production/andres_silva_v5/Andres_Silva_propuesta_v5.mp4` (+ annotated), retimed temp VO + SFX. Images are 16:9 crops to the screen ratio until AI-extended; boots still the pilot placeholder.
- **Nov 8:** v6 (`production/andres_silva_v6/`): user feedback — no green block over the animated frames (text now on a soft translucent shadow), no 'bell' SFX (tonal shimmers removed), light trails short-lived. Higgsfield: 30.7 credits (free plan); outpaint to 21:9 = 2 credits/image (also at 3840×1646). Concentración imported as media ee9b0932-2ae5-4604-9d74-e1578faabf29. Awaiting go-ahead to extend the frames.
- **Nov 9:** v7 (`production/andres_silva_v7/`): frames extended with AI (Higgsfield outpaint, 2 credits/job; 7 jobs = 14 credits, balance 16.7). Concentración + compañerismo: 2 passes (1:1 → 21:9) clean. Huddle: 2-pass version rejected (pasted centre + invented stadium with Champions League-style boards); 1-pass 21:9 retake used — seam at the top stays outside the screen band. Subtle KV green on the side panels. Boots still the pilot placeholder (original needed). Panoramas in `panoramas_21x9/`.
- **Nov 9:** QC failure flagged by user (extra hands). Full-res check: huddle panorama unusable (floating hands on shoulders — already in client original, amplified + one added; seams inside the screen band); compañerismo: fused clasped hands + Nike swoosh on seated player's jersey (both in client original); concentración OK. Fix proposal: rebuild huddle and compañerismo as clean 21:9 with GPT Image 2.6 (2.75 credits each at high/2k; balance 16.7). QC rule from now on: every AI image checked at 100% for hands/fingers, limbs, faces, seams, text/logos/brands before use.
- **Nov 9:** v8 (`production/andres_silva_v8/`): huddle and compañerismo rebuilt as clean 21:9 frames with Nano Banana 2.1 (2 credits each; GPT Image 2.6 high/2k needs a paid plan). QC at 100% (`QC_imagenes_v8.jpg`): huddle has 7 visible hands, each with a plausible owner, with no loose hands, extra fingers, seams or logos. Compañerismo has a clean two-hand clasp and correct legs and boots; one small tick-shaped mark on the seated player's chest was removed with a local retouch, and the background boards are illegible and outside the screen band. S3 light is now born at the captain's raised finger, and the S4 camera was raised so the standing player's head isn't cut. Balance: 12.7 credits.
- **Nov 9:** Screen-fit pipeline defined (`docs/05_Screen_fit_pipeline.jpg`). No model outputs wider than 21:9, so each slide is generated at 21:9 from its extended panorama with a level camera, then a 5.43:1 strip (43% of the height) is cropped out. Upscale ×2 → strip ~5040×928 → 3840×708. Layers are composited on top at delivery resolution. Higgsfield prices (8 s, 21:9): Seedance 2.5 draft 480p = 24 credits, 1080p = 128, Seedance 2.0 4K = 176 (Plus plan). Rough estimate: ~500 credits per speaker (4 clips, ~26 s), before upscaling.
- **Nov 9:** Screen-fitted frames approved: S1 botines (kneeling leg, concrete tunnel), S2 concentración (rebuilt from a manga-panel composition guide, mint kit), S3 huddle (manga guide plus edit: stray hand and duplicate 9 removed), S4 compañerismo (manga guide). Start frames are in `frames_screen/seedance_start/` at 3840×1646. Seedance 2.5 prompts were rewritten in the Chinese shotlist format (real-time camera, slowed subject motion).
- **Nov 9:** Clips: Seedance 2.5 at **480p** (896×384 target, 992×432 actual). The first Topaz pass had no enhancement model, so it returned 992×432. The second pass with Proteus (prob-4), 30 fps, gives 3840×1648 (`clips_4k/`). v9 preview (`production/andres_silva_v9/`) uses the clips in place of the stills, keeping the v8 timing, light, text and sound. Post fixes: S1 gets a slow push and drift (its clip is static), S2 a slow upward reframe to keep the head in the strip, and the S2/S3 impact flashes are softened so they don't wash out faces. Open items: S4 swooshes in the first frames still need painting out; 4K master render pending.
- **Nov 9:** v10 (`production/andres_silva_v10/`): every drawn light effect has been replaced with the 7 Seedance 2.5 light clips (Topaz 3840×1648, in `plates_4k/`): intro, birth, beam, halo, sweep, ball and close. Each clip is on pure black, screen-blended, then positioned, scaled and retimed onto the v8/v9 beats. Speeds: intro 1.6×, beam 2.6×, halo 2.5×, sweep 3.5×, ball 2.8×; the close clip loops. The sweep clip is rotated from 17° to the 45° die-cut angle. The die-cut outline trace was dropped, since there's no clip for it. Text glow and the screen brighten on impact are still done in post. The same 7 clips serve all 7 speakers.
- **Nov 9:** v10 rejected by the user. The Seedance light was laid over the text (beams into each phrase, rings on every phrase), which the approved pilot never did. The light clips are only for transitions and accents. **v9 (`production/andres_silva_v9/`) is the working version again**: animated scenes plus the light placement from the approved storyboard. No light effects over the text.
- **Nov 9:** v11 (`production/andres_silva_v11/`): the storyboard's light behaviour reproduced with the Seedance clips, at the same moments with matched size and length. Intro waves from the side panels; a small spark at each subject; a thin beam to each phrase that fades within 0.4 s; a small, short halo (smaller than v9's drawn bloom); the 45° sweep at scene changes; the ball over the S4 pull-up; rays behind Andrés. The die-cut outline trace (intro and close) is still drawn. A first frame for an 8th clip that would replace it is ready: `frames_screen/seedance_start/OUTLINE_first_frame_3840x1646.png`.
- **Nov 9:** User rule (binding): **light effects never interact with the text.** They serve the piece as a whole: transitions, tension and release, and dynamic motion. Phrases appear only with their own type animation (scale in, stretch out), with no beam, halo, glow, white flash or screen brighten. v11 was rejected because it still sent a beam and a ring to every phrase. v12 (`production/andres_silva_v12/`): the light is limited to the intro, the spark on each subject, the 45° scene sweeps, the S4 ball, the rays behind Andrés and the die-cut outline. Note: in the client review (S11), the client mentioned light entering from the side panels and the screen glowing with the halo. The user has decided against both.
- **Nov 9:** v12 rejected: the spark on the subject read as tied to the phrase and crossed faces, the same sweep was used for every transition, and the piece felt stiff and rushed. v13 (`production/andres_silva_v13/`) is a light score built for pacing:
  - Intro: the waves meet as the logo lands, then settle into one line.
  - Intro → S1 (18 frames): the line splits open like an eye.
  - S1 → S2 (24 frames): one beam runs the full 19 m along the floor line and pulls the dressing room in behind it.
  - S2 → S3 (30 frames): a ring opens from the centre, revealing the huddle (circle motif).
  - S3 → S4 (24 frames): the 45° three-line sweep, used only here.
  - S4 → close: the light network builds into the ball and flashes on the cut.
  - Close: rays behind Andrés.

  No light on subjects or phrases. Each scene's last phrase now leaves before its transition begins. Sound rebuilt (`tools/sfx_v13.py`) with one sound per transition and nothing on the phrases.
- **Nov 9:** v14 (`production/andres_silva_v14/`):
  - The background behind the copy is removed; letters keep only a faint, tight edge shadow.
  - Sound rebuilt (`tools/sfx_v14.py`) to be subtle and varied, with one texture per move: intro air swells from both edges and a low bloom; the slit as air opening outward; the beam as a doppler pass-by panned with the light across the 19 m; the iris as an inhale, then a low expansion widening into stereo; the sweep as three thin air cuts; the ball as a fine crackle gathering, then a deep soft bloom; the close as a soft shimmer.
  - Shared large-room reverb, effects 13–20 dB under the VO, no music, no heartbeat, no fake crowds, nothing on the phrases.
- **Nov 9:** Final voice-over: an ElevenLabs take by the user, voice **"Leonor Cabal – Soft Calm Comforting"** (stability 50, similarity 75, model v4), read in one take of 13.7 s. v15 (`production/andres_silva_v15/`) uses the v14 picture. The take is cut at its natural pauses into 6 pieces, each placed on its phrase: "Los grandes resultados no empiezan en la cancha" 2.96 s · "Empiezan… en la mente" 8.86 s · "Con líderes… que inspiran" 13.86 s · "Y entienden que ninguna victoria se consigue solo" 18.86 s · "Con ustedes" 24.36 s · "Andrés Silva" 25.40 s. Polish: rumble cut, low-mid clean-up, light presence, de-ess, 2.5:1 compression and a touch of the effects' room reverb. Effects stay 13–20 dB under. Use the same voice and settings for the other 6 speakers.
- **Nov 9:** v16 (`production/andres_silva_v16/`):
  - **Border clip:** the Seedance border-trace clip (`plates_4k/outline.mp4`) is aligned to the exact die-cut (ECC affine, 3% scale plus a shift, 100% line overlap). It runs over the close card (27.0–30.0 s) and replaces the last drawn effect.
  - **Effects audio:** switched to pink noise, rolled off above 6.5 kHz, with lower levels. Swooshes sit 19–22 dB under the VO, with energy above 4 kHz down from up to 83% to under 8%. Mono-compatible (−0.3 dB). Added a soft border-trace sound.
  - **Found:** a 25/30 fps mismatch. The timeline is 25 fps and the clips are 30 fps, so one clip frame is dropped every 5 frames, causing judder on camera moves. Fix: render at 30 fps, or at the LED processor's rate.
- **Nov 9:** v17 (`production/andres_silva_v17/`):
  - **30 fps output:** the 25 fps timeline is sampled at 30 fps, so every clip frame is used once and the 25/30 judder is gone.
  - **Close:** a slow 7% push on Andrés's cut-out in both side panels; his mask follows the move.
  - **"Y ENTIENDEN QUE":** a stronger edge shadow on that line only, over the bright S4 sky.
  - **Voice:** VO reverb halved, per the user.
  - **LED questions:** drafted in `docs/07_Mensaje_operador_LED_ES.txt` (pixel map, delivery resolution, fps, codec, player, sphere template, audio, deadline).
  - **S4 brand marks:** the clean-up was stopped by the user. It's still pending, and only the sock tick and the white blip in the '0' remain.
- **Nov 9:** v18 (`production/andres_silva_v18/`): behind Andrés in both side panels, the background is now KV green with the Seedance star-rays clip radiating from behind his head. It replaces the static rays that were baked into the panel image. End frame for animating him prepared at `frames_screen/andres_close/Andres_ENDFRAME_1x1_2048.png`: the original photo, framed exactly as in the panels, on flat studio gray. It comes with a Seedance prompt (walks in from about 3 m, stops, crosses his arms; 7 s, 1:1). Once the clip arrives, he'll be keyed out and placed over this background.
- **Nov 9:** v19 (`production/andres_silva_v19/`): "Y ENTIENDEN QUE" enlarged from 44 to 60 px, the same size as "SE CONSIGUE SOLO". The S1 → S2 beam transition now runs along the bottom edge of the screen (y = 0.965 H) instead of across the players.
- **Nov 9:** v20 (`production/andres_silva_v20/`): Andrés is animated. The user's Seedance + Topaz clip (`andres_anim/andres_clip.mp4`, 3840×1648, 7 s) shows him walking in from the back, stopping and crossing his arms into the photo pose.
  - **Cut-out:** keyed frame by frame (rembg u2net_human_seg, 3-frame temporal smoothing, edge colour decontamination), with no studio background.
  - **Placement:** in both side panels, his final head position matches the photo. He's scaled about 11% larger so the clip's bottom edge reaches the panel bottom.
  - **Timing:** the clip starts with the close (23.6 s), he reaches the pose at about 28.8 s and holds it to the end.
  - **Background:** the star rays stay fixed behind his final head position.
- **Nov 9:** **v20 delivered to the client** as the Andrés Silva teaser preview; awaiting feedback. Still to do: the 4K master (3840×708, text and light rendered at full resolution) once approved; the LED operator's answers (`docs/07`); the other 6 speakers, which reuse the same light clips, voice (Leonor Cabal) and pipeline; and the 2 sphere videos.
- **Nov 10:** **S13 · Client feedback on v20** (Brick / HighBTL deck `Devo teaser speaker - Evento Operadores 2026`, saved at `feedback_in/fb1/devo.pptx`). Applied in v21 (`production/andres_silva_v21/`):
  - **Light green:** every Seedance light clip is regraded to the KV greens (value ramp black → KV green (0,138,62) → KV line (137,240,168) → near-white core; `tools/kv_grade.py`).
  - **Intro:** logo removed from behind the light.
  - **Copy:** rebuilt as KV-style justified lockups with tight leading (`tools/text_layout_v21.py`). Rules are plain lines with no squares, and a soft black gradient sits behind each phrase (max 72%).
  - **S2 → S3:** the circular opening is now a KV hexagon (the Seedance halo remapped onto a hexagon).
  - **Ball:** made symmetric (right half mirrored, so the circular swirl is gone) and fully faded before the cut, so it no longer overlaps the close.
  - **Close:** the ball's hexagon network sits behind Andrés in both panels, replacing the star; logo truly centred (the logo crop had a stray beam pixel); role changed to "ESPECIALISTA EN DIRECCIÓN DE EMPRESA" as written by the client; card centred.
- **Nov 10:** The client switched the VO to a male voice (`vo_final/male_take.mp3`, 13.1 s single take) and asked for de-essing and fewer exaggerated breaths ("suspiros"). v22 (`production/andres_silva_v22/`) keeps the v21 picture with a new mix (`tools/sfx_v22.py`):
  - **Breath/sigh reduction:** quiet unvoiced tails are cut 14 dB, and long unvoiced stretches keep only their first 100 ms (the consonant), then drop 12 dB. Exhale after "resultados" −10 dB, "ustedes" tail −15 dB, "cancha" tail −8 dB.
  - **De-esser:** zero-phase split band at 4.5–12 kHz, with 3 dB static and up to 10 dB dynamic reduction. Sibilants are 10 dB less bright; the whole-voice high band is down 5 dB.
  - **Same polish as before:** EQ, 2.5:1 compression, half-strength room reverb.
  - **Placement:** cut at its pauses and placed on the same phrases, onsets 2.96 / 8.86 / 13.86 / 18.86 / 24.36 / 25.40 s; loudness matched to the previous VO (−24.2 dBFS RMS).
  - **Brightness:** an extra 3 dB cut is available if it's still too bright.
- **Nov 10:** The client uploaded a soundtrack to the event Drive (`VIDEOS EVENTO PUMA/MUSICA`: StudioKolomna 30 sec / 60 sec / Main Track, downloaded to `music_in/`). The "30 sec" edit is 26.0 s long: a 0.7 s fade-in, a hard stop at 23.35 s and a ringing tail to 26 s. v23 (`production/andres_silva_v23/Andres_Silva_v23_musica_preview.mp4`) is the music comparison version. It keeps the v21 picture and the v22 voice, with the voice at exactly v22's level. Mix script: `tools/sfx_v23.py` (4th argument is the music file). How it's mixed:
  - The track starts at 0.25 s, so its stop lands on the cut to the close card (frame 590, 23.60 s) and "Andrés Silva" is spoken over the tail.
  - The music bed sits at −18 dB, with a further −7 dB duck and a 1.2–4.5 kHz scoop while the voice speaks. Speech runs about −21 dBFS, the music between lines about −29.5 dBFS.
  - SFX are 4 dB lower and the room beds 9 dB lower.
  - The output is 30.0 s, peak −1.7 dBFS. v22 stays as the no-music version for the comparison.
- **Nov 10:** Added a music-only version, `production/andres_silva_v23/Andres_Silva_v23_musica_sin_locucion_preview.mp4`. It has the soundtrack and SFX with no voice. Same music timing as v23, no ducking, the whole bed raised 9 dB (−18.4 LUFS, peak −4.4 dBFS). Run `tools/sfx_v23.py … novo`.
- **Nov 11:** Brick shared the deck "APROBADOS Puma Energy | Speakers". It lists 4 speakers: Andrés Cepede (Director Comercial, opening), Daniel Formento (planning, news montage), Carolina Silva and Andrés Silva (done). The production pack for the 3 new teasers is in `docs/08_Teasers_Cepede_CSilva_Formento.md`:
  - 5-placa timing, with the close kept at 23.6 s so the music sync carries over.
  - Verbatim placa texts and the VO takes.
  - 10 GPT Image 2.6 frame prompts in the approved v8 style.
  - Formento's teaser is blocked until the headlines arrive. Carolina's card role is unknown. No speaker photos are in Drive yet. The deck's images can't be read through the connector.
- **Nov 11:** The deck's reference images were found:
  - I added `docs.google.com` and `doc-0c-24-slides.googleusercontent.com` to the "One Way" environment, exported the link-shared deck as PPTX, and extracted the images to `feedback_in/speakers_deck/media/`.
  - The refs:
    - Cepede: 5 frames, plus a stage photo.
    - Carolina: 5 frames, plus an office photo.
    - Formento: 4 finished news-montage frames that carry his 4 placa texts, a name card ("Supply & Strategic Planning Manager, Puma Paraguay") and a 200 px photo.
  - The Cepede and Carolina refs are placed on 21:9 canvases for GPT Image 2.6 edge expansion (`tools/expand_speakers.py`, `frames_screen/speakers/`), with prompts in `frames_screen/speakers/PROMPTS_GPT_Image_2.6.md`. Doc 08 is updated.
- **Nov 11:** The method is now locked in `docs/09_METODOLOGIA_teasers.md`, which is binding for every speaker: inputs, frames, Seedance, assembly, sound and timing.
  - The user caught that I had skipped the approved manga-guide step for Cepede.
  - I tested auto-inking the raw refs with grey margins (`tools/manga_speakers.py`). It gives streaks and junk margins, so those guides were not sent.
  - The order, matching what really happened with Andrés, is: expansion pass → approve directly if right (like S1) → otherwise ink the extended frame into a manga guide and regenerate (like S2–S4).
- **Nov 11:** The user ruled that the manga-panel guide is the image reference from the start, so the expansion pass is dropped. The Cepede guides CEP1–5 are built with `tools/manga_speakers.py` + `tools/manga_margins.py`: the ref inked in place, perspective margins drawn per scene, and FX lines kept off people. Prompts are in `frames_screen/speakers/PROMPTS_GPT_Image_2.6.md` ("Turn the attached manga panel into a photorealistic…" format). Method doc 09 is updated.
- **Nov 11:** The CEP1 test came out letterboxed. The screen overlay had been uploaded with the guide, and the model rendered its dimmed bands. Rule: upload only the MANGA_guide, at high quality and 4K (the test ran at medium, 1344×576).
- **Nov 11:** CEP1 re-run: a generic stadium came back with its lights above the screen band. The guide is now fully drawn (`drawn=True`), with a black sky, the floodlight ring dipping to 36% inside the band, seat rows, goal, stripes and touchline. The prompt is rewritten with an explicit top-to-bottom LAYOUT section giving %-positions. This pattern applies to scenes with no people.
- **Nov 11:** The user rejected the drawn CEP1 guide v2 (incoherent perspective, no pitch). Procedural/drawn guides are abandoned for good. The user's second CEP1 render (the empty lit stadium) was checked on the strip: the floodlight row sits at the top of the band, with empty stands and the pitch with its lines. It works as is and is proposed as the CEP1 frame, pending the 4K download.
- **Nov 11:** CEP1 guide v3 inked from the user's full stadium render with `tools/manga_full.py` (CLAHE 24×24 local contrast, fine XDoG ink, screentone), the same as the Andrés S3/S4 technique of inking a full frame.
- **Nov 11:** CEP1 switched to the client's own stadium photo cropped to 21:9 (`frames_screen/speakers/CEP1_crop_21x9.png`, centre at ref row 0.50), with no generation or extension, after the generated stadiums came back structurally incoherent. Brands and colours are to be fixed with an edit-only pass that keeps the geometry locked. Local recolour/inpaint was tried and rejected (JPEG blocks, smears). Trade-off: on the LED strip the crop shows the floodlights, roof and upper stands, but no pitch.
- **Nov 11:** Blender headless blockout tool built (`tools/blockout.py`, bpy 5.3). First scene CEP1 renders with correct perspective. See method doc 09, section 6.
- **Nov 12:** Andrés Cepede teaser v1 (`production/andres_cepede_v1/`): first full edit to the v21–v23 standards.
  - Picture: 5 Seedance + Topaz clips (stadium drone, tunnel, penalty, coach, celebration; from Higgsfield job IDs, the Drive copies are private), 5-placa grid (40/150/260/370/480, close 590), clips at 0.88× so they cover the transitions.
  - Renderer `tools/storyboard_v24.py` (v21 + per-slide clip speed + mirrored sweep), config `tools/cfg_cepede.json`, lockups `tools/text_layout_cepede.py`.
  - Transitions: slit, beam, hex iris, sweep, mirrored sweep, then ball + flash into the close.
  - Close: placeholder cut-out from the deck's stage photo (`cepede/anim`), name card ANDRÉS CEPEDE · DIRECTOR COMERCIAL.
  - Sound: `tools/sfx_v24.py` (room tones from the config), music + effects only. No Cepede voice-over exists yet.
