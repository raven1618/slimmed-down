# Standards + client request register (single source of truth)
Updated: 2026-11-24. Binding for every task. Read with `/CLAUDE.md`. When a request or rule is added or changes status, update this file in the same turn.

## A. Quality standard
- The audience is the client's decision makers; the job is a pitch for more work. Every frame must look art-directed and intentional.
- One idea per transition/effect, describable in one sentence. Reject anything that reads as "effects thrown at it".
- Generated assets come from the client's own material whenever it exists (their photos, their vector KV, their neon video). Never redraw what the client already has.
- Verification = frames at 100% + on the sphere (front, back, side joins) + a motion clip, compared against the reference. Only then show it.

## B. Client request register — sphere opening
Status: ✅ done and verified · 🔶 in progress · ⛔ rejected approach (don't repeat) · ❓ unconfirmed

| # | Client request (their words / source) | Exactly what it means | Status | Where |
|---|---|---|---|---|
| C1 | "Se ve amarillo en vez de verde algunas palabras" (Cambios 1) | All green text = KV #7FFF00; glow UNDER the letters | ✅ v13 | `mg/mg.html` |
| C2 | Ball appears "en otro espacio" / start the pentagon "con la punta mirando hacia arriba" | Front pentagon point UP on EVERY KV ball (opening AND closing); back pentagon points down (true geometry) | ✅ opening v13 · ✅ closing v14 (was missed until Nov 24) | `RZ_UP` everywhere `ball_field` is used |
| C3 | "Este hombre de negro no… tiene q ser como la referencia… todo el KV en verde" + "silueta de la persona que chuta con los halos de luces" | Closing = the client's OWN neon sequence (Higgsfield `242e14fe`, 4K), fitted to the circle in code, NOT regenerated | ✅ v14 | `tools/esfera/closing_circ.py`, `K_neon.mp4` |
| C3a | (user) fill the poles, no empty stripes | Circle = full video height (sides trimmed) | ✅ v14 | |
| C3b | (user) stop the video exactly where the ball lines match the KV ball | Push-in + freeze on frame 139, KV ball takes over on its seams; back copy rolled 36° | ✅ v14 | `K_neon.mp4`, `KICK_BACK_ROT` |
| C4 | "Aquí es importante q se vea el camión como está en el video" | The client's white tanker truck visible in J1, driving to the horizon; puma + beam STAY | ✅ v14 | `J1_anim.mp4` (Higgsfield `72fa9c2c`) |
| C4a | (user) truck→ship at the same size and spot as the J2 tanker | Truck width = ship width at the change (measured) | ✅ v14 (panel flip) | `CLIP_DELAY` |
| C4b | (user) improve truck→sea transition, "land to sea" | One continuous generated shot: the road becomes the sea, truck silhouette becomes the tanker. Start/end frames in `review_esfera/upload_transicion/` | 🔶 waiting for generation | prompt in doc 18 / chat Nov 24 |
| C4c | Code "tide" overlay transition | Flat water, white blob glint, streak, panel-grid flash | ⛔ rejected Nov 24 (`TIDE = False`) | |
| C5 | Map "muy planito" + Paraguay outline must match the background and not look flat | Night-earth texture; Paraguay traced on the TEXTURE's own borders; neon outline + inner glow | ✅ v14 | `geo/py_tex_mask.png` |
| C5a | (user) fill Paraguay with a light beam moving horizontally; text smaller and higher so the full outline is visible | Horizontal laser strands + sweep inside; `cfg_py` yTop 0.10, widths ×0.75; zoom 3.6 | ✅ v14 | |
| C6 | (user) beam lower, puma stepping on the beam's centre | `PATH_B` 33°, paws on the centre line through the gallop | ✅ v14 | `PUMA_FOOT`, `PUMA_DROP` |
| C7 | White silhouette of the puma "when it comes in at the beginning and at the end" | ONLY the logo entrances: start (`logo` 10.0 s) and end (`cat_in` 59.2 s). The puma on the beam stays CHROME | ✅ v15 | `cat_run_in()`, Higgsfield `72d5cd51` |
| C7x | Replacing the beam puma with the silhouette everywhere | Misread of C7 | ⛔ Nov 24 | |
| C8 | 2027 → full white → KV | | ✅ v13 | |
| C9 | Closing text: bad contrast, "basic and outdated" | Closing lines higher, ball darkens to deep emerald | ✅ v13 | |
| C10 | Photo collage (script p.13) | It IS a client request (script page 13) | ✅ in timeline | |
| C11 | Truck turning into the oil tanker | Was unconfirmed; now covered by C4a/C4b | ❓→🔶 | |

## C. User rules (permanent)
- Credits: state the cost first; no waste; no upscales before approval.
- Prompts via skills; always pasted in full in the chat (Chinese + English for Seedance).
- Send files with SendUserFile; never make the user look for paths.
- Ignore vehicle-manufacturer badges on trucks/ships.
- Text/numbers static; light never on text; never change faces; no recognisable AI close-up faces.
- Renders one at a time; push only to `claude/gifted-shannon-c1nwsj`.
- Short answers, one recommendation; say what's NOT done first.

## D. Mistakes made on this project (never again)
1. Claimed the kick ball design changed when it hadn't (no direct comparison).
2. Removed the puma and beam from J1 "for no reason" (client only asked for the truck to be visible).
3. Applied the upright-pentagon fix to the opening only; the closing KV ball stayed point-down for two versions.
4. Drew a debug overlay with my own projection, it came out flipped, and I almost "corrected" the ball based on it. Always verify against the actual render.
5. Forgot the white-silhouette integration in v14, then misread it as "replace the chrome puma everywhere".
6. Put prompts only in a file and made the user search for them.
7. Built a code transition from stacked overlays (tide) without a clear idea; it looked improvised.
8. Flagged vehicle badges repeatedly after being told to ignore them.
9. A panel-grid flash appeared after the tide transition (overlapping transitions not checked in motion).
