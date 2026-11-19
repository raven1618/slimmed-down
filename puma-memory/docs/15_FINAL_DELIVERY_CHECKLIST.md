# FINAL 4K DELIVERY CHECKLIST (check every teaser before the client gets the 3840×708 master)

## 1 · Clip / transition sync (user, Nov 18): the clip must NOT stop before the transition
- **The bug:** a slide is on screen from `f0` until the next slide's transition ends (about 45 frames after `f1`). If clip length − offset < that time × speed, the clip froze on its last frame while the transition was still playing.
- **Found in 28 slide/clip pairs across all six teasers (0.1–1.8 s of freeze):**
  - Andrés S2–S4
  - Cepede S1–S3, S4b
  - Carolina S2, S3, S4, S4b
  - Formento S1, S2, S4
  - Manuel all four
  - Wally all four
- **Fix:** `_fit_speed()` in storyboard_v21, v24, v25 and v26 (`TAIL_F` = 45). It lowers each slide's/tile's playback speed just enough to cover the transition; it never speeds anything up.
- **Check on the final render:** scrub every transition frame by frame. The outgoing image must still be moving under the light wipe. Text impacts tied to a clip's speed-ramp may have shifted slightly later, so re-check their timing.
- **Run the audit script:** for each config, need = (f1 + 45 − f0)/25 × speed ≤ clip duration − offset.

## 2 · Other items
- **Ending swap:** the close swap at f690 is on every teaser. Name and title are in the wings, the KV in the centre.
- **Walk-ins:** no back-of-head or turn unless approved. Carolina starts mid-turn; Manuel shows only the last ~2 steps (`off` 150); Wally walks 2 steps facing camera.
- **Brands:** no third-party brands (check jerseys, trucks, balls, boards). The Puma Energy brand is fine.
- **Text:** no garbled AI text in frames. Numbers in AR tags only.
- **Framing:** subjects inside the 43% band; nothing important behind a V.
- **Audio:** Kolomna music stops on the cut to the close. The VO versions use the agreed male voice.
- **Master:** 3840×708 at 30 fps, plus a 1920×356 preview. 30.0 s each.
- Nov 18: all 7 teasers re-rendered with the freeze fix: Andrés v25, Cepede v10, Carolina v7, Formento v7, Manuel v3, Wally v3, Roque+Haedo v1.

## Client round, Nov 18 (via Benjamín, HighBTL)
- **Carolina:** no looking down before smiling. The anim is rebuilt as `carolina/anim4k_v3` (frames 80–84, then a 6-frame blend to 128 onward).
- **Andrés Silva and Cepede:** darken and blur the foreground player faces.
  - `tools/face_dim.py` (YuNet face detection, `models/yunet/yunet.onnx`) is enabled per slide with `face_dim` {min_h 0.15, dark 0.45, blur 0.018}.
  - **Check on the final:** no face pops in or out, and no un-dimmed close-up face.
- **Manuel:**
  - Boardroom: no faces, crop to the table/hands (z 1.7, fy 0.95).
  - Phone stock: remove the blond man's face, crop to the data (z 1.25, fx 1.0).
- **Wally:** the corrected texts are P1 LA IA ESTÁ CAMBIANDO LA INDUSTRIA, P2 TRANSFORMANDO CÓMO ANALIZAMOS DATOS, P3 Y TOMAMOS DECISIONES CON MEJOR PRECISIÓN, P4 EN UN MUNDO CADA VEZ MÁS DINÁMICO Y CONECTADO, LA IA JUEGA EN TU EQUIPO. Clips reordered: refinery AR / data centre / convoy / city. Accents added (the client's doc had none).
- **General rule from the client:** avoid recognisable AI faces in close-up (they read as fake). Prefer hands, backs, silhouettes or crops.
- Nov 18: the face blur was too harsh (user). Softened: mask feather H*0.07, alpha=(m*1.9)^1.3*0.9, dark 0.55, blur 0.015. Carolina's close is now the regenerated walk-in 1cddd0e0 (profile → turn → smile, no look-down), keyed to anim4k_v4.

## Client review folder (Drive, shared by the user)
- TEASERS · Versiones para aprobación: https://drive.google.com/drive/folders/1FIZ7rOZ-5qDWxhe8cXI6pNlyKnOYqEcD (subfolder "Ronda 2026-11-18" is empty).
- The user uploads the files themselves: the Drive connector's limit is about 3 MB per upload from this session.
- **Nov 18 round in the folder:** Andrés Silva v27 (music only), Cepede v12, Carolina v9, Formento v7, Manuel v4, Wally v4, Roque+Haedo v2.

## Client round, Nov 19 (via Benjamín)
- **Wally:** approved. In placa 4, EN UN MUNDO CADA VEZ MÁS / DINÁMICO Y CONECTADO, now reads alone first (~1 s); LA IA JUEGA / EN TU EQUIPO then enters below it (line delays 0/4/30/34 in `text_layout_wally.py`). → Wally v5
- **Manuel:** approved. A small "Y" line was added above TRANSFORMARLAS (`text_layout_manuel.py`). → Manuel v5
- **Andrés Silva and Cepede:** the face blur was reverted (client preferred the earlier version). Instead, the text covers the faces:
  - New beat flags `hold` and `hold_end` in `storyboard_v21.py` / `v24.py`. A held text enters early, stays over the image without an exit animation, and is drawn on the outgoing slide during the next transition, so it leaves with the cut.
  - Andrés: placa 2 text 12 frames earlier; placa 3 (huddle) 18 frames earlier plus hold; placa 4 unchanged apart from removing the blur. → Andrés v28
  - Cepede: every placa's text 12 frames earlier plus hold. Placa 5 (Y SE ATREVEN A JUGAR EN GRANDE) holds until f570 and then fades into the ball flash. → Cepede v13
- **Lesson:** this client prefers text covering faces to face blur.
