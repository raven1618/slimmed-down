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
