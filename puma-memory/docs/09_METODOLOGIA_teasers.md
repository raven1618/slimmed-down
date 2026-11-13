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

## 6 · Blender blockout (reference frames with correct perspective) — added Nov 11
- **Tool:** `tools/blockout.py`, run with the Blender Python module (bpy 5.3, in `bvenv`): `bvenv/bin/python tools/blockout.py blockout/<SCENE>.json blockout/<SCENE> [--draft]`.
- **Scene file:** a small JSON in metres: camera (`pos`, `look_at`, `lens` mm), `night`, and a list of objects. Building blocks: `pitch`, `goal`, `stand` (tiers, roof, floodlights), `tunnel`, `lockers`, `board`, `ball`, `box`, `cyl`, and `person` with poses `stand / run / kick / kneel / sit / arms_up / point` plus a squad number.
- **Outputs:** `<SCENE>_render.png` (3360×1440 grey clay render) and `<SCENE>_strip.png` (the rows that reach the LED).
- **Use:** the render is the image reference for GPT Image 2.6 (it replaces the manga guide where perspective matters). The prompt keeps "COMPOSITION (locked)" and says the grey blocks are a 3D layout guide.
- **Install note:** pip's download of the 428 MB bpy wheel stalls here; fetch it in parallel ranges and install from the file (`_bpy/dl.py`).
- **First scene:** `blockout/CEP1_cancha.json` (4 stands around the pitch, camera 1.7 m high, 15 mm). Draft render 17 s.
- **Blockout rules (enforced by the tool):**
  - Grounding: every object must rest on the ground or touch another object. The tool groups objects by contact and refuses to render if any group floats (`GROUNDING FAILED`).
  - Real sizes only: pitch 105 × 68 m, goal 7.32 × 2.44 m, people 1.8 m, tiers 0.85 m deep × 0.45 m high. No scaling a block to "fit the frame"; move the camera or change the lens instead.
  - Camera at a height a real camera could be (≥ 0.3 m), level horizon unless a roll is asked for.
  - Roofs are carried by columns and end walls; lights are mounted on a structure.
- **Lens variants:** `--lenses 15,24,35` renders one frame per lens from the same camera position.
- **Walk-around viewer:** `--viewer` writes `<SCENE>_viewer.html` (self-contained, opens offline in any browser: drag to look, WASD to move, lens slider, LED strip overlay, Save PNG, Copy camera) and `<SCENE>.blend` for Blender itself. The user pastes the copied camera JSON back and the final frame is rendered from it.

## 7 · Learned on Cepede and Carolina (Nov 12) — binding from now on
**Getting the clips**
- Drive uploads are private, so download them directly fails. Every Higgsfield file name contains its job ID (`hf_<date>_<time>_<job-id>.mp4`), and `jobs_wait` with that ID returns the CloudFront URL.
- Some clips come back 16:9 (3840×2160). Centre-crop them to 21:9 (3840×1648) before editing: `crop=3840:1648:0:256`.
- Every Seedance/Topaz clip and light plate has a black border about 28 px wide down both sides. `storyboard_v24.py` skips 32 px on each side. Without this, a dark strip shows at both outer edges of the screen.

**Framing on the LED (renderer `tools/storyboard_v24.py`, per slide)**
- `dy_keys`, `cx_keys`, `zoom_keys`: lists of [clip-second, value]. The crop follows the action over time: heads inside the strip, the camera "with" the player or the ball.
- `cx` only works when `zoom` is above 1. Each 0.1 of zoom narrows the strip height by about 7%, so a jump plus the ball needs zoom 1.25 or less.
- Keep the subject left or right of the centre text block (x 735–1185 of 1920) while the text is up.
- `speed` (clip playback rate, usually 0.88), `clip_off` (clip start offset) and `grade` (LAB fix for hazy clips: `k` contrast, `Loff`, `sat`, `da`/`db` tint).
- Measure each clip's speed-ramp time (frame-difference motion) and put that slide's text impact right after it. Text impact and out are set per beat in the config.

**Text**: `tools/text_layout_<speaker>.py` builds the 5 lockups. Small lines carry the rules, at 0.30–0.40 of the first big line; keep the smallest line at 20 px or more.

**Speaker close**
- The cut-out uses BiRefNet (`tools/matte_birefnet.py` with the lite ONNX model; the full fp16 model runs out of memory here) and `tools/speaker_key_v3.py`.
- The end frame is cut with BiRefNet, placed on flat chroma green #00B140, 21:9 3840×1648, and checked at full size, whole frame, before sending. The Seedance prompt says green background, no floor line, no shadows, no green spill.
- Full-body walk-in: start with the back to camera, about 4 m away, turn, walk in and settle into the photo pose.

**Prompts (Seedance)**
- Camera moves must be small relative to the start frame. Big dives or pushes make the model abandon the frame.
- Lock the grade in words and say "no fog/haze": hazy grey-teal fog is a recurring model bug.
- State real-world sizes: goal 7.32 × 2.44 m, net mesh about 12 cm, ball 22 cm.
- With an end frame, describe the state before the action too. For example, a flat, still net before the ball arrives, otherwise the model bends it from the first frame.
- Brand checks on every clip: balls (logos), kits (three stripes, swoosh), boards. The fix is an image edit of the frame, then re-animating.
- **Tracking must be subtle and smooth (user, Nov 13):**
  - The renderer averages every key track (`dy_keys`, `cx_keys`, `zoom_keys`) over ±0.35 s, so moves ease in and out with no kinks.
  - Keep zoom at 1.15 or less (scene pushes 1.0 → 1.05–1.15); use horizontal follow only as a gentle drift.
  - **Priority when it doesn't all fit:** the ball first, then the bodies. A slightly cropped head is acceptable; a cropped ball is not.
- **Speaker close from a green-screen clip:**
  - `tools/speaker_key_green.py`: colour-difference key (green minus max(r, b)) plus despill. It beats every model-based cut-out, with clean hair and no fringe.
  - Wing placement uses the last frame's head position, so the final pose matches the photo.
  - Applies to all speakers from now on: end frame on green → Seedance → Topaz → this key.
- **Zoom-out of a clip that came out too tight:**
  - Place its first frame small on a grey 21:9 canvas (`carolina/s4/`) so the action falls inside the band, crop off any baked-in letterbox first, and outpaint it with GPT Image.
  - Then use that frame as the start frame and the old clip as a video reference to regenerate the shot (Seedance 2.0 takes a video reference).
  - A text-only "pull the camera back" edit did nothing.
