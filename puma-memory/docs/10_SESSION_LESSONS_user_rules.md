# Puma teasers · user rules and lessons learned (binding)

## Standing user rules
- Light FX never touch, accent or interact with the text. Light is for transitions, tension/release and dynamic motion only.
- Never change the scenes beyond the approved storyboard. Don't apply recommendations the user hasn't asked for.
- Don't spend Higgsfield credits without stating the cost and getting approval.
- No third-party brands or logos. Plain kits, plain boards.
- Check every AI image at 100%, and against the LED strip (rows 28–72% of a 21:9 frame, die-cut V's at the sides), before showing it.
- Be efficient: no token burning, search the web instead of long investigations, give one recommendation instead of surveys.
- Commit or push only when asked. Don't work around safety blocks.
- Deliverables go as individual files, each with its own prompt (not zips, not mixed lists).

## Frames: what failed on Nov 11 (don't repeat)
- Prompting from text alone when client refs exist. The refs are inside the Brick Slides deck (export PPTX via docs.google.com + doc-0c-24-slides.googleusercontent.com).
- Building manga guides from raw 16:9 refs with grey margins: auto-filled margins give streaks; procedurally drawn margins and drawn panels give incoherent perspective. REJECTED.
- Uploading the screen overlay with the guide: the model renders the dimmed bands as letterbox bars. Upload ONLY the guide.
- Generated stadiums (CEP1) came back structurally incoherent: floating light rows, disconnected roofs, warped scale. Inking a flawed render carries its errors into the guide.
- Local recolour/inpaint of JPEG refs: block artefacts and smears.

## What works
- Andrés S2–S4: the manga guide was inked from a COMPLETE, coherent 21:9 frame, then "Turn the attached manga panel into a photorealistic…" with COMPOSITION (locked) / SCENE / KIT / SET / LIGHT & LENS / STYLE.
- For scenes where coherence matters (architecture, stadiums): start from a real, coherent image (the client's photo cropped to 21:9) and use edit-only prompts that keep the geometry locked.
- Proposed next tool: a Blender headless blockout (basic blocks, controlled camera and lens) that renders a perspective-correct reference frame for each scene, then gets inked into the guide.

## Speakers status (Nov 11)
- Andrés Silva: done. v21 picture; v22 male VO, no music; v23 with Kolomna music; v23 music only.
- Andrés Cepede: CEP1 base = the client's stadium photo cropped to 21:9 (`CEP1_crop_21x9.png`), edit prompt pending. CEP2–CEP5 not started.
- Carolina Silva: refs extracted, role on the card unknown.
- Daniel Formento: 4 news-montage frames with texts, role "Supply & Strategic Planning Manager, Puma Paraguay". Needs a new photo.
