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
