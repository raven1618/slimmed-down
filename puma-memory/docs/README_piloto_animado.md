# Andrés Silva teaser — animating the approved pilot (Seedance kit v2)

**Brief:** keep the approved pilot exactly as it is (layout, copy, timing, green panel, speaker card) and animate the four frames so it feels more dynamic. **No music, sound effects only.**
This kit replaces the v4 kit (`production/_superseded_v4/`), which followed the older pptx copy and a 30 s structure.

## 1. The approved pilot (source S09)

| | |
|---|---|
| Length | **49.7 s**, 25 fps. The brief said 30 s max, so confirm the client is fine with ~50 s |
| Picture | Exported at 1280 × 308 with black bars; the picture area is 1280 × 238 = the 7296 × 1344 screen at 1:5.7. Final delivery 3840 × 708 = exactly 3× the pilot's picture area |
| Die-cut | Same shape as Puma's guide (matches my approximation within ~10–15 px), so HighBTL already has the real template |
| Layout | Centre panel: green KV background + Puma logo + copy on the left, photo fading in from the right. Side panels: the same photo, scaled to the panel height |

| Time | Frame | Copy (unchanged) |
|---|---|---|
| 0:00–0:01 | Intro: green panel + logo | — |
| **0:01–0:11.1** | **S1 Boots** (new image: green socks, tunnel) | LOS GRANDES **RESULTADOS** NO EMPIEZAN EN LA CANCHA |
| **0:11.1–0:22** | **S2 Concentration** | EMPIEZAN **EN LA MENTE** |
| **0:22–0:33.2** | **S3 Huddle** | CON LÍDERES **QUE INSPIRAN** |
| **0:33.2–0:44.4** | **S4 Helping up** | Y ENTIENDEN QUE **NINGUNA VICTORIA** SE CONSIGUE SOLO |
| 0:44.4–0:46 | Transition to empty green | — |
| 0:46–0:49.7 | Speaker card | ANDRÉS **SILVA** · DIRECTOR DE PLANIFICACIONES DE PUMA |

## 2. What's in this folder

| File | Use |
|---|---|
| `storyboard_piloto_animado.mp4` | **The pilot with the frames animated**: every pilot pixel kept, only the photos replaced by the animated versions. Info strip: camera, AI action, SFX. For client approval and as the timing master |
| `refs/ref_S1_botines.mp4` … `ref_S4_companerismo.mp4` | 16:9 camera + light references, one per frame → `@Video1` |
| `stills/still_S*_primer_cuadro.png` | Approved frames (first frames) → `@Image1`. **S1 is a low-res placeholder rebuilt from the pilot**; replace it with the original image |
| `prompts/S1…S4.txt` | Seedance prompts (16:9, one generation per frame) |
| `prompts/S5_ficha_luz_OPCIONAL.txt` | Optional light-burst loop behind Andrés (`@Image1` = `stills/still_S5_kv_haces.png`). His photo is never animated: he's a real person and AI would alter his face |

## 3. One generation per frame

All at **16:9**, highest resolution. A 16:9 clip fits the pilot layout directly, because each frame is shown at full panel height.

| Gen | Prompt | @Image1 | @Video1 | Length | Shots | Keep the action inside |
|---|---|---|---|---|---|---|
| S1 | `S1_botines.txt` | `still_S1_botines_primer_cuadro.png` (→ original) | `ref_S1_botines.mp4` | 10.1 s | push-in → macro of the laces + stomp → whip | 22–77 % of frame width |
| S2 | `S2_concentracion.txt` | `still_S2_concentracion_primer_cuadro.png` | `ref_S2_concentracion.mp4` | 10.9 s | dolly-in → eyes open → focus to teammates → whip | 10–66 % |
| S3 | `S3_huddle.txt` | `still_S3_huddle_primer_cuadro.png` | `ref_S3_huddle.mp4` | 11.2 s | orbit → captain close-up + collective shout → whip | 36–92 % |
| S4 | `S4_companerismo.txt` | `still_S4_companerismo_primer_cuadro.png` | `ref_S4_companerismo.mp4` | 11.2 s | crane up (slow-mo) → clasped hands → green flash | 28–84 % |

"Keep the action inside": the three windows of the layout only show that horizontal band of each frame. The reference clips already respect it.

**Transitions:** each clip ends with a left-to-right whip pan and a neon-green light streak, and the next clip starts resolving from it. In post, the same streak crosses all three panels, as shown in the storyboard. S4 ends in a green-white flash that hands over to the pilot's own transition into the speaker card.

## 4. Assembly (in the pilot project, at 3840 × 708)

Place each generated clip scaled to **1341 × 756** (panel height) at **y = −20**, at these x positions (the pilot's own framing ×3):

| Frame | Centre panel | Left panel | Right panel |
|---|---|---|---|
| S1 | 1800 | −288 | 2945 |
| S2 | 1956 | −132 | 3048 |
| S3 | 1607 | −481 | 2817 |
| S4 | 1718 | −370 | 2928 |

The photo-to-green fade in the centre panel stays as in the pilot: it starts ~90–270 px right of the clip's left edge. Copy, logo, green panel, die-cut, intro and speaker card are the pilot's own.

## 5. Sound effects cue sheet (no music)

If Seedance's audio is on, each prompt already asks for these sounds. Otherwise, lay them in post at these times:

| Time | Sound |
|---|---|
| 0:00.0 | Tunnel ambience fades in · low hit when the logo appears (0:00.6) |
| 0:01–0:07 | Tunnel echo, distant crowd, lace friction, sharp lace pull (~0:05) |
| 0:07–0:10.5 | Studs stomping on concrete (~0:08.5), echo |
| 0:10.6–0:11.1 | **Whoosh** (left to right) |
| 0:11.1–0:17.1 | Deep breathing, slow heartbeat, crowd muffled behind walls |
| 0:17.1 | **Low boom**: eyes open |
| 0:19.7–0:21.5 | Heartbeat quickens |
| 0:21.5–0:22.0 | **Whoosh** |
| 0:22–0:29 | Indistinct team voices (no words), crowd swelling |
| 0:29–0:31.7 | Collective shout + crowd roar |
| 0:31.7–0:33.2 | **Whoosh** |
| 0:33.2–0:40.2 | Crowd building, cleats on grass, firm hand grip (~0:36) |
| 0:40.2–0:43 | Crowd erupts |
| 0:43–0:44.4 | Rising whoosh → soft impact on the flash |
| 0:46–0:47 | **Impact + shimmer** as the name appears |
| 0:47–0:49.7 | Shimmer tail, fade out |

## 6. Missing

| Item | Status |
|---|---|
| **Original boots image** (green socks, tunnel) | ❌ Not in the Drive. Placeholder rebuilt from the pilot |
| **Andrés Silva's photo in high resolution** | ❌ Only the pilot's low-res version |
| Confirm the ~50 s length (brief said 30 s max) | ⚠ |
| LED operator's die-cut template | The pilot uses it, so ask HighBTL for the file |
