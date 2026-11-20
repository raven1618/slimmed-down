# Sphere LED · production methodology (Nov 20)
Every new frame, animation and render for the 2 m sphere follows these rules. If something needs to break a rule, ask the user first.

## 1. Display
- **Canvas:** 2688×1296 equirectangular. The canvas centre (x = 1344) faces the front audience.
- **Venue:** a 2 m ball hanging with its centre at 3 m. The audience sees it from about 1.65 m eye height, from every side.
- **Front and back show the same content.** It is rotated 180° about the vertical axis, never mirrored (a ball seen from outside reads like a globe).
- **Nothing is mirrored, ever** (lesson: a mirrored back puma ran backwards).

## 2. Asset types (only two)
| Type | Format | Used for |
|---|---|---|
| **A · Scene** | A circular 180° fisheye frame: 1:1, 4K, a perfect circle on pure black, the horizon level through the centre. | Anything that fills the ball: the photo scenes F1–F7, the ball-kick moment, any new scene. |
| **B · Overlay** | On pure black, no floor, no shadow, centred. | Elements that sit on top of a scene: the chrome puma run loop, light plates. |

- A frame that fills the ball is always **type A**. Do not generate a flat or 16:9 frame for a scene.
- Show the user any new type-B overlay before generating it.

## 3. Type A frame recipe (image)
- **Model:** Nano Banana 2 · 1:1 · 4K · 3 credits. Attach the client's real photo for that scene as `image_references` (import it with `media_import_url` from Drive).
- **The prompt is always written by the image skill** (`image-prompt-helper`), never by hand.
- **Fixed lines in every type A prompt:**
  - "A circular 180-degree fisheye photograph filling a perfect circle centred in the frame with pure black outside it."
  - "The horizon perfectly level straight through the centre of the circle."
  - The hero sits at the centre, with the sun or key light directly behind the hero (not at an edge).
  - "The left and right edges of the circle show the identical scenery … so the two sides match perfectly." The circle's right edge meets its own left edge at the side of the ball.
  - Cinematic grade and light; the sky in the top half carries the text, the ground in the bottom half carries the light path and the puma.
- **QC before animating:**
  - check at 100% for gibberish text and third-party brands;
  - a full circle;
  - a level horizon;
  - matching edges;
  - then test on the sphere: front view, 45° and side join.

## 4. Animation recipe (Seedance)
- **Model:** Seedance 2.5 · `omni_reference` · `start_image` = the approved frame (job id) · 1:1 · 480p · audio off. The default length is **5 s (15 credits)**; 10 s costs 30, and it went static after about 6 s on KM.
- **The prompt is always written by the Seedance skill** (`seedance-multishot-prompter`), Chinese prompt plus an English translation, never by hand.
- **Fixed rules in every prompt:**
  - the circle edge, the black border and the level horizon never change;
  - camera movement only forward (dolly or push) or sideways (fly-by or track); never pan, tilt or roll;
  - motion along the horizon (left to right, the same direction as the puma) reads best on the ball;
  - motion toward camera bulges at the centre: avoid it, or keep it slow and stop at the centre;
  - faces and expressions never change; all logos, text and numbers stay static.
- **QC:** check frames at 0, 1.7, 3.4 and 4.9 s, then put the clip on the sphere (section 5) before approving.
- **Upscale (Topaz, about 30 credits each)** only after the user approves the animation.

## 5. Sphere compositing (free, in code)
- **`tools/sphere_fisheye_scene.py <clip> <out> "LINE 1" "LINE 2" 1`:** maps the fisheye onto the front and back halves (trim 0.985 removes the black rim). It adds:
  - the title lockup in the sky, held for the whole scene;
  - the KV plate light band, rising to the right, with its spark kept off the side joins;
  - the chrome puma on the band.
- **Speed changes in post** (for example `setpts=0.5*PTS` for 2×). Never loop a clip that has a direction (the truck jumped back); play it once.
- **`TURN=20 tools/sphere_turntable.py <equi> <out.mp4> <seconds>`:** the client preview from audience height, with 20 s per turn (half speed). It must not be longer than the clip.
- **Edge ribbons** (vertical light at the side joins) appear only during the client footage, if at all. The user found them too obvious; prefer matching edges.
- **Renders run one at a time.** Two jobs writing the same file corrupted KM, and four at once ran out of memory.

## 6. Opening timeline (`tools/sphere_render.py`)
- Pulses → ball → SOMOS → the path forms (teaser intro plate) → globe → Paraguay → scenes A (KM, ENTREGA ×n, DESTINO ×2, CALIDAD) → CONSTRUIMOS JUNTOS → pulses → kick → KV → logo + puma → end lines → 2027 → KV.
- The timing is temporary until the VO exists.

## 7. Current asset status
| ID | Frame | Animation | Notes |
|---|---|---|---|
| F1 KM | ✓ | ✓ 5 s clip (truck pulls out) | 10 s take went static; faint sky seam to blend |
| F2 LPG | ✓ | ✓ dolly-in | |
| F3 storage plant | ✓ | 2 takes (push-in, fly-by) | pick one |
| F4 river | ✓ | running (fly-by) | |
| F5 service station | ✓ | running (push-in + car) | |
| F6 airport | ✓ regen (plain white jet) | running (track) | first frame had an airline livery |
| F7 quality | ✓ | running (dolly-in) | |
| P8 kick | **redo as type A** | — | first version was a flat overlay (breaks rule 2) |
| Puma | ✓ 4K type B overlay | ✓ | |
