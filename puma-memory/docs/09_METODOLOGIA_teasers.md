# METHOD · Puma speaker teasers (binding for every speaker)

Approved with Andrés Silva (v8 → v23). **Read this before starting any speaker.** If a step changes, update this file in the same session and log the change in `00_INDEX.md`.

## 0 · Inputs per speaker
- **Script, client refs and photo:**
  - They come from the Brick deck "APROBADOS … Speakers". The deck is link-shared: export it as PPTX via docs.google.com and extract `ppt/media` per slide (`feedback_in/speakers_deck/`). The connector returns text only.
  - **Client refs are always used.** A frame is never generated from text alone when a ref exists.
- **Speaker photo:** high-res, in Drive. If possible the user animates it in Seedance, using the end-frame prompt from Andrés v18.

## 1 · Frames: client ref → manga-panel guide → GPT Image 2.6
1. **Screen placement** (`tools/expand_speakers.py`):
   - Choose the ref rows that must reach the 5.39:1 strip (y0, y1) and the horizontal centre.
   - The script writes the 21:9 canvas, the strip preview with the die-cut (`qc/screen_<SPK>.jpg`) and `placement.json`.
   - Check that faces, numbers, the ball and the goal are clear of the die-cut V's.
2. **The manga-panel guide is the image reference from the start (the user's decision, Nov 11).** No separate expansion pass.
   - The ref is inked in place: XDoG ink, 3-step screentone, solid blacks. People are kept bold and the background goes one tone lighter.
   - ⚠️ Nov 11: procedurally drawn margins and drawn panels were REJECTED by the user (incoherent). Only ink real, full images, never draw scenes in code.
   - Never auto-fill the grey margins (edge-replicate or blur). Tested on Nov 11, that gives streaks and junk.
3. **Guide build** (`tools/manga_speakers.py NAME`):
   - 3360×1440: the ref at its screen placement, then paint-outs of errors and brands.
   - Inking: XDoG ink, 3-step screentone, solid blacks.
   - **Depth and perspective:** subjects inked bold, the background in softer tone. The margins are clean flat tone with the scene's structure (tiers, roof, tunnel, pitch lines) carried across in perspective.
   - Manga FX lines go only over the dark background, never over people.
   - Outputs: `<NAME>__MANGA_guide.png` (the user uploads this) and `<NAME>__MANGA_with_overlay.png` (for checking).
   - Look at it before sending. No smears, no stray lines, nothing over faces. The prompts are in `frames_screen/speakers/PROMPTS_GPT_Image_2.6.md`.
4. **Prompt "around" the guide** (GPT Image 2.6 · 21:9 · 4K · quality high · single upload: ONLY the MANGA_guide, never the overlay, which becomes letterbox bars), with these sections:
   - Opening line: `Turn the attached manga panel into a photorealistic …`
   - **COMPOSITION (locked):** exact layout, camera, perspective, and the position, size and pose of every subject. No zoom, crop or reframe.
   - **SCENE · KIT · STADIUM/SET · LIGHT & LENS:** a full description that matches the ref. Kit as in the client's ref.
   - **STYLE:** "ink lines, screentone and FX lines are guides only; render real …". No text, logos or brand marks.
   - **Fixes:** hands with 5 fingers on their own arms, unique squad numbers, no third-party brands (boards become plain panels).
5. **Edits:** if a result is close, use a short Higgsfield edit prompt on that image, not a full re-roll.
6. **QC:** every result is checked at 100% (hands, faces, numbers, brands) and against the screen overlay before it's approved.

## 2 · Animation: Seedance 2.5
- **Format:** Chinese shotlist prompts.
  - `@image1（首帧）` describing the approved frame.
  - Single shot, no cuts.
  - **Speed rule:** subject at about 80% (slight slow motion, no ramps or freezes). The camera moves in real time and never stops.
  - Key action stays in the middle 43% band.
  - Numbered action beats with seconds.
  - Micro-performance notes.
  - Hand rule.
  - Style block: 8K IMAX, Lubezki × Deakins, on-set light only, no light FX, no text or logos, no music.
- **Settings:** 21:9, 5 s per placa (5-placa grid) or 6 s (4-placa grid).
- **Pipeline:** draft at 480p → Topaz Proteus → 3840×1648 at 30 fps.
- **Credits:** state the cost before generating. Never spend credits without approval.

## 3 · Assembly (renderer `tools/storyboard_v21.py` + cfg)
- **Canvas:** 1920×356 preview, master 3840×708. Strip = rows 408–1031 of 1440 (43%).
- **Light plates:** the 8 KV-graded plates (`tools/kv_grade.py`). They are used for transitions, tension/release and motion. **They never touch or accent the text.** Each transition gets its own move.
- **Text:** justified KV lockups (`tools/text_layout_v21.py`) with the black elliptical gradient behind them (max 0.72) and plain rules.
- **Close:** the speaker keyed (rembg u2net_human_seg) in both wings over the hex/rays background, then the name card and the border trace.
- **Scenes:** never changed beyond the approved storyboard.

## 4 · Sound (`tools/sfx_v22.py` / `tools/sfx_v23.py`)
- **Voice-over:** male voice, breath gating, split-band de-esser, EQ, 2.5:1 compression, RMS −24.3 dBFS.
- **SFX:** subtle and varied, 15–22 dB under the voice.
- **Versions:** without music (v22 style); with music (Kolomna 30 s, its stop on the cut to the close card, bed −18 dB, −7 dB duck); music only.

## 5 · Timing
- **4 placas:** 1.6 / 7.48 / 12.48 / 17.48 s, close at 23.6 s.
- **5 placas:** 1.6 / 6.0 / 10.4 / 14.8 / 19.2 s, close at 23.6 s.
- Voice lines start about 1.0–1.3 s into each placa. "Con ustedes..." at 24.3 s, name at 25.35 s.
