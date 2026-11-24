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
  - check at 100% for gibberish text and third-party brands (EXCEPT vehicle-manufacturer badges on trucks and ships: user said 4+ times to ignore those);
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
- **First + last frame rule:** both frames must share the same sky, light, horizon and camera; only what should change may differ. Different skies = Seedance crossfades (J1→J2 take `9a25942d`). Make the end frame by editing the start frame and verify the match before animating.
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

## 6. Opening timeline (`tools/sphere_render.py`, v6 = 75.2 s)
- Pulses → ball → SOMOS → the path forms (teaser intro plate) → globe → Paraguay → scenes A (KM, ENTREGA ×n, DESTINO ×2, CALIDAD) → CONSTRUIMOS JUNTOS → pulses → kick → KV → logo + puma → end lines → 2027 → KV.
- Kick section: `kick=52.6` (0.4 s dissolve from the neon pulse ball into the clip, played once at 1×), `kv_flash=57.6` (white flash peaks over the clip's last frames), `logo2=57.8` (the flash lands straight on the green KV ball + logo; no frozen frame). Everything after moved +3.2 s: cat_in 59.2, logro 61.4, hoy 63.2, listos 64.8, y2027 67.0, kv 70.6, end 75.2.
- The timing is temporary until the VO exists.
- Viewer: artifact "Esfera LED · visor" (https://claude.ai/artifact/UEdhx8XW4gcntb91oaXymv) plays `apertura_v6.mp4`. Front/back preview: `review_esfera/Esfera_apertura_v6_vista_frente_dorso.mp4`.

## 7. Current asset status
| ID | Frame | Animation | Notes |
|---|---|---|---|
| F1 KM | ✓ | ✓ 5 s clip (truck pulls out) | 10 s take went static; faint sky seam to blend |
| F2 LPG | ✓ | ✓ dolly-in | |
| F3 storage plant | ✓ | 2 takes (push-in, fly-by) | pick one |
| F4 river | ✓ | ✓ fly-by (weak motion) | retake optional, 15 credits |
| F5 service station | ✓ | ✓ push-in + car | |
| F6 airport | ✓ regen (plain white jet) | ✓ track | first frame had an airline livery |
| F7 quality | ✓ | ✓ dolly-in | |
| P8 kick | ✓ start `3935dcac` · end `708df052` (KV ball ref `4b1f5be5`) | ✓ Seedance `cd5f981c` → `K_kick_v5.mp4`, 5 s, no burst | small ball drifts to smaller panels early; KV pattern once large |
| J1 terminal | ✓ `c774b8f1` (client still 5.5 s) | ✓ `8be33fbf` road run + crane up | CONSTRUIMOS JUNTOS |
| J2 tankers | ✓ `16bf97a1` (client still 10 s) | ✓ `75129b83` glide + rise, sun emerges (first take `5546cd69` warped) | CONSTRUIMOS JUNTOS |
| J3 mirrored city | ✓ `a82c77a8` (client still 11 s) | ✓ `2ee35652` forward glide | CONSTRUIMOS JUNTOS |
| Puma | ✓ 4K type B overlay | ✓ | |

## 8. Kick shot: what worked (Nov 21) and the mistakes not to repeat
**Script:** "los pulsos se transforman en pelota, luego viene una persona chuta la pelota y la pelota se transforma en el KV." The ball must BE the KV ball from the first frame.
- **Ball:** the KV ball. It is deep emerald leather with classic pentagon/hexagon soccer panels and glowing lime neon seams, no logos. Never a white ball (it can't turn into the KV) and never volleyball-style strip panels.
- **Camera:** goalkeeper's view, low on the turf in the goalmouth, about 3 m from the ball, with the player **running straight at the lens**. A camera behind the player sends the ball away from the lens, which contradicts the end frame.
- **Pose:** the last stride of the run-up. The front boot lands beside the ball and the back boot pushes off with the heel lifting; the knee is not cocked high. Head down, eyes on the ball, arms swinging naturally.
  - Words like "diagonally from the right side" or "shoulders turned" made him run sideways in profile. Say "running straight toward the camera, front view, chest facing the lens".
  - A symmetrical "ready stance" looked like a mannequin.
- **Whole person:** show the full player at a distance. Cropping or flaring away the head left a "pair of legs without a body". Accept a small, lowered face; dim it in post if needed.
- **Filter:** anatomy-heavy wording ("bare muscular legs", "from the waist down", "hips") got flagged NSFW. Describe the player by kit only.
- **Turf:** "striped turf" plus the fisheye gave incoherent zig-zag colours. Use one even shade of green, no mowing stripes, only the penalty spot and the box line. "Chalk dust" gave a powder cloud; the spot is a small flat painted disc.
- **Stadium:** symmetrical, with the far goal centred behind the player, one continuous ring of stands, four identical floodlight towers, plain boards and dark scoreboards.
- **References:** an attached reference image copies its pose. Don't attach a take whose pose is wrong.
- **End frame:** the ball must fill about 90% of the circle. A generated end frame with the ball at about 55% was fixed for free by zooming 1.65× in post and re-masking the circle (`K9_end_zoom.png`).
- **Animation:** Seedance 2.5 `omni_reference`, start + end image, 480p, 5 s, 15 credits. The prompt came from the Seedance skill (Chinese + English): locked camera, real boot-to-ball contact, about 25% slow motion on impact, then the ball flies at the lens.
- **QC:** before showing the user, check every frame at 100% AND on the sphere (`tools/fish2equi.py` + `TURN=20 sphere_turntable.py`). Show the flat frame first; the turntable takes minutes.
- **Spend on the redo:** frames about 30 credits (10 takes), animation 15. The Kling job with the old white ball (7.5) was never used.

## 9. Motion graphics + effects (Nov 21) — the standard now
The user rejected the numpy-only text and effects as "basic and lame". Everything typographic is now a **browser-rendered motion-graphics layer**.
- **Pipeline:** `tools/mg/mg.html` (canvas, Gotham from `drive-dl/`) + `mg_render.js` (Playwright, 30 fps PNG with alpha) → `mg/seq_<key>/`. `sphere_render.mg_put(fr, key, t - start)` maps a sequence onto the front and back discs. Configs: `tools/mg/cfg_<key>.json`; landing times are in `meta.json`.
- **Entrances:** `rise` (per-letter mask rise with vertical motion blur), `punch` (scale 1.35→1 with overshoot, letters converge), `slide` (from the left, the puma's direction, horizontal smear), `count` (+40 counts up), `grow` (2027 grows until it overflows, with zoom blur).
- **Accents:** lime light sweep masked to the letters, neon underline drawing out from the centre with sparks, lime glow on green words, soft shadow, staggered lift-and-blur exit.
- **The beam answers every landing:** `beam_boost(t)` multiplies the light band by up to 2.1 around each landing.
- **Transitions:** `reveal()` is a seam reveal. The KV ball's net draws onto the outgoing shot and the next shot flips in panel by panel from the centre, with bloom. There are no band wipes any more.
- **Layout (client pitch):** the light band sits low (`PATH_B` 30°). Footage and text take the top; below the band it's black with spilled glow and drifting lime streaks (`lower_black`), from KM through CONSTRUIMOS JUNTOS.
- **Front/back rules learned:**
  - A rotated copy (`SYM`) makes a seam at the side joins. Use it only where content must match front and back (fisheye clips, pulses, the globe zoom with a dark side fade).
  - The KV ball must be the true sphere (`ball_field`), which has no seam.
  - `pole_scaled()` zooms each hemisphere about its own pole.
  - Check side joins with `tools/side_check.py`.
- **Pre-kick:** no KV before the kick. The last pulse condenses onto the ball on the spot (`BALL_DOWN` 0.35 rad), then the stadium opens radially with a lime edge.
- **Kick → KV:** the code ball starts at the filmed ball's panel size (1.33→1), the seams flare, the panels light up to KV green. No white flash and no frozen frame.
- **2027:** pops in small, grows accelerating with zoom blur until it overflows the sphere, then dissolves into lime light over the KV loop.
- **KV ending:** the client's lockup (`kv/kv_logo_rgba.png`) is animated row by row in its original positions (`cfg_kvend.json`): bar rise, CONVOCADOS rise, A JUGAR EN draw-out with its pitch lines, GRANDE punch, two sweeps. Never retype the KV.
- **Closing contrast:** from `logro` the ball sinks to deep emerald (fill x0.5, seams x0.55–1) so white type reads.

## 10. Client preview
- **Viewer artifact:** "Esfera LED · visor" (private).
- **Client link:** Netlify from GitHub. Repo branch `claude/gifted-shannon-c1nwsj`; `netlify.toml` publishes `esfera_site/` (index.html, local three.min.js, apertura.mp4). It autoplays muted on a loop; if autoplay is blocked, the first tap starts it. To update, replace `esfera_site/apertura.mp4` and push.
- **On hold until the client approves the video:** sound, 4K master/upscales, face dim on the kick clip.

## 11. Client round "Cambios 1" (Nov 23–24)
- **Text:** the green = KV #7FFF00. The glow goes UNDER the letters: additive glow over green clips G and pushes R, which reads yellow.
- **Size:** scene lines ~20% smaller, max 0.50 of the disc width, `yTop` 0.17 (the chord near the rim cut the C/S of CON COMBUSTIBLES). The text never overlaps the puma.
- **Closing lines and KV:** centred higher (`logro` 0.33, `hoy` 0.29, `listos` 0.27; KV `cy` 0.45, `w` 0.54).
- **2027:** grows until the sphere is full white, and the KV comes out of the white (renderer white ramp around `kv`).
- **Globe:** "muy planito" → a generated night-earth texture (`geo/earth_tex_4096.png`, Higgsfield `109d098a`) fitted to our land mask (lat 90.5→-86, shift 12/1024). The Paraguay glow and arcs stay on top.
- **J1 terminal:** SUPERSEDED Nov 24 — the puma and beam STAY; the truck is in the clip itself (see doc 19, C4).
- **Pending (needs Higgsfield uploads):**
  - the vector logo-cat run (`review_esfera/upload_nov23/puma_logo_vector.png`, cut from the vector KV). Flattening the chrome puma failed (`VECTOR_FROM_CHROME`);
  - the neon kick from the client sequence (`review_esfera/upload_cierre/`).
- **Unconfirmed:** the truck turning into the tanker ship.
- **White silhouette puma (client, confirmed Nov 24):** ONLY where the cat comes in and lands in the logo: at the start (`logo`, 10.0 s) and at the end (`cat_in`, 59.2 s). The puma running on the beam in between stays CHROME. Source: Higgsfield `72d5cd51` → `esfera_in/puma/puma_vector.mp4` (seamless 3.3 s loop, frame 0 = logo pose); `cat_run_in()` brings it in big from the lower left and lands it on the logo cat's exact box.
- **Vehicle badges:** don't flag manufacturer logos on trucks or ships (user, repeatedly).
