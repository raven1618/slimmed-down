# Graph Report - puma-memory  (2026-11-11)

## Corpus Check
- 77 files · ~96,059 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 837 nodes · 1936 edges · 36 communities (34 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.83)
- Token cost: 127,513 input · 0 output

## Community Hubs (Navigation)
- Manga Guide Drawing
- Pilot Storyboard Imports
- Base Storyboard Renderer
- Current Renderer v21
- Storyboard v3
- Concept Storyboard
- Renderer v17
- Renderer v18
- Renderer v19
- Renderer v20
- Renderer v16
- Renderer v13
- Renderer v14
- Speaker Teasers & Lessons
- VO Mix & Inking
- Renderer v12
- Renderer v10
- Renderer v11
- KB Index & Versions
- Seedance Kit & Frames
- Delivery Formats & Screens
- SFX v14
- SFX v23 Music Mix
- Renderer v9
- SFX v15
- SFX v16
- SFX v17
- Text Lockup Layout
- SFX v13
- SFX v3
- SFX v5
- Method & Binding Rules
- Reference Generation
- Layout Board
- Quabund

## God Nodes (most connected - your core abstractions)
1. `Knowledge base index` - 34 edges
2. `shot_M()` - 22 edges
3. `render()` - 19 edges
4. `render()` - 17 edges
5. `Seedance kit v2 README (animated pilot)` - 13 edges
6. `shot_C2()` - 12 edges
7. `Teasers Cepede, C. Silva, Formento pack` - 12 edges
8. `Cepede manga-guide prompts CEP1-5` - 12 edges
9. `prog()` - 11 edges
10. `to_np()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `S3 Huddle frame prompt` --conceptually_related_to--> `QC rule: check every AI image at 100%`  [INFERRED]
  prompts/andres_frames_v8.md → docs/00_INDEX.md
- `CEP1 Cancha iluminada prompt` --conceptually_related_to--> `CEP1 = client stadium photo cropped 21:9`  [INFERRED]
  prompts/speakers_frames.md → docs/00_INDEX.md
- `Mensaje al operador LED (ES)` --semantically_similar_to--> `Questions for LED operator`  [INFERRED] [semantically similar]
  docs/07_Mensaje_operador_LED_ES.txt → docs/03_Material_y_preguntas_ES.md
- `Andrés v8 frame prompts (GPT Image 2.6)` --references--> `GPT Image 2.6`  [EXTRACTED]
  prompts/andres_frames_v8.md → docs/00_INDEX.md
- `Cepede manga-guide prompts CEP1-5` --semantically_similar_to--> `Andrés v8 frame prompts (GPT Image 2.6)`  [INFERRED] [semantically similar]
  prompts/speakers_frames.md → prompts/andres_frames_v8.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Andrés Silva Seedance pilot prompt set (S1-S5)** — prompts_andres_seedance_pilot_s1_botines_doc, prompts_andres_seedance_pilot_s2_concentracion_doc, prompts_andres_seedance_pilot_s3_huddle_doc, prompts_andres_seedance_pilot_s4_companerismo_doc, prompts_andres_seedance_pilot_s5_ficha_luz_opcional_doc [EXTRACTED 1.00]
- **Teaser production pipeline: ref → manga guide → GPT Image → Seedance → Topaz → assembly** — docs_09_metodologia_teasers_frames_ref_manga_gpt, docs_00_index_manga_panel_guide, docs_00_index_gpt_image_2_6, docs_00_index_seedance_2_5, docs_00_index_topaz_proteus, docs_09_metodologia_teasers_assembly_renderer, docs_09_metodologia_teasers_sound_chain [EXTRACTED 1.00]
- **Binding user rules for teasers** — docs_00_index_light_never_touches_text, docs_00_index_qc_100_percent_rule, docs_09_metodologia_teasers_credit_approval_rule, docs_10_session_lessons_user_rules_no_third_party_brands, docs_10_session_lessons_user_rules_upload_only_guide, docs_09_metodologia_teasers_client_refs_always_used [INFERRED 0.85]

## Communities (36 total, 2 thin omitted)

### Community 0 - "Manga Guide Drawing"
Cohesion: 0.05
Nodes (45): veil(), band(), bowl_full(), P(), quad(), render(), stadium_side(), cv() (+37 more)

### Community 1 - "Pilot Storyboard Imports"
Cohesion: 0.05
Nodes (20): strip_from(), ht(), xdog(), xdog(), load_cover(), off(), walk(), cam() (+12 more)

### Community 2 - "Base Storyboard Renderer"
Cohesion: 0.14
Nodes (35): bez(), cam(), cam_M1(), cam_M2(), cam_M3(), cam_M4(), clamp(), diag_x() (+27 more)

### Community 3 - "Current Renderer v21"
Cohesion: 0.10
Nodes (22): kv_grade(), mirror_right(), add_light(), beam_M(), Clip, draw_text(), green(), _load() (+14 more)

### Community 4 - "Storyboard v3"
Cohesion: 0.14
Nodes (24): anchor(), bloom(), catmull(), centre_frame(), clamp(), draw_line(), ease(), eio() (+16 more)

### Community 5 - "Concept Storyboard"
Cohesion: 0.15
Nodes (27): anchor(), bloom(), cam_at(), catmull(), clamp(), close_frame(), cover(), ease() (+19 more)

### Community 6 - "Renderer v17"
Cohesion: 0.13
Nodes (18): beam_M(), centre_M(), Clip, draw_text(), green(), pano(), plate_at(), put() (+10 more)

### Community 7 - "Renderer v18"
Cohesion: 0.13
Nodes (18): beam_M(), centre_M(), Clip, draw_text(), green(), pano(), plate_at(), put() (+10 more)

### Community 8 - "Renderer v19"
Cohesion: 0.13
Nodes (18): beam_M(), centre_M(), Clip, draw_text(), green(), pano(), plate_at(), put() (+10 more)

### Community 9 - "Renderer v20"
Cohesion: 0.13
Nodes (18): beam_M(), centre_M(), Clip, draw_text(), green(), pano(), plate_at(), put() (+10 more)

### Community 10 - "Renderer v16"
Cohesion: 0.13
Nodes (18): beam_M(), centre_M(), Clip, draw_text(), green(), pano(), plate_at(), put() (+10 more)

### Community 11 - "Renderer v13"
Cohesion: 0.14
Nodes (19): beam_M(), centre_M(), Clip, draw_text(), green(), outline(), pano(), plate_at() (+11 more)

### Community 12 - "Renderer v14"
Cohesion: 0.14
Nodes (19): beam_M(), centre_M(), Clip, draw_text(), green(), outline(), pano(), plate_at() (+11 more)

### Community 13 - "Speaker Teasers & Lessons"
Cohesion: 0.13
Nodes (18): GPT Image 2.6, Higgsfield (credits platform), Nano Banana 2.1, Daniel Formento (speaker, 'Dónde estamos parados'), Andrés Cepede (Director Comercial), Carolina Silva (speaker), Teasers Cepede, C. Silva, Formento pack, Formento news-montage look (+10 more)

### Community 14 - "VO Mix & Inking"
Cohesion: 0.16
Nodes (18): clean_ink(), curve(), ht(), screen(), xdog(), filt(), frames_feat(), lv() (+10 more)

### Community 15 - "Renderer v12"
Cohesion: 0.16
Nodes (16): centre_M(), Clip, draw_text(), green(), outline(), pano(), plate_at(), put() (+8 more)

### Community 16 - "Renderer v10"
Cohesion: 0.17
Nodes (15): beam_M(), centre_M(), Clip, green(), pano(), plate_at(), put(), render() (+7 more)

### Community 17 - "Renderer v11"
Cohesion: 0.17
Nodes (16): beam_M(), centre_M(), Clip, green(), outline(), pano(), plate_at(), put() (+8 more)

### Community 18 - "KB Index & Versions"
Cohesion: 0.15
Nodes (19): Andrés Silva v20 (delivered preview), Andrés Silva v21 (client feedback S13), Andrés Silva v23 (music version), Concept line 'Convocados a jugar en grande', Knowledge base index, Key visual (KV) PSD, KV-graded Seedance light plates, KV green light beam (main animation element) (+11 more)

### Community 19 - "Seedance Kit & Frames"
Cohesion: 0.17
Nodes (19): Approved pilot (Andrés Silva, 49.7 s), Client review of pilot (S11), Seedance 2.5, Topaz Proteus upscale, Seedance Chinese shotlist prompt format, Assembly positions at 3840x708 (1341x756 clips), Seedance kit v2 README (animated pilot), SFX cue sheet (no music) (+11 more)

### Community 20 - "Delivery Formats & Screens"
Cohesion: 0.19
Nodes (14): LED sphere Ø 2 m (3840x1920 equirect), Main screen die-cut (7296x1344, V-notches), Delivery formats: 3840x708 teasers, 3840x1920 sphere, Video production plan v4, Sphere S1: Running puma loop, Sphere S2: 160-station map, T1 shot list: Daniel Formento, Teaser template: centre hero + side wings (+6 more)

### Community 21 - "SFX v14"
Cohesion: 0.17
Nodes (12): filt(), lv(), noise(), norm(), pan_lr(), put(), room(), smooth_env() (+4 more)

### Community 22 - "SFX v23 Music Mix"
Cohesion: 0.17
Nodes (13): filt(), frames_feat(), lv(), noise(), norm(), pan_lr(), put(), room() (+5 more)

### Community 23 - "Renderer v9"
Cohesion: 0.22
Nodes (10): Clip, green(), outline(), pano(), render(), _Shape, slide_frame(), slide_of() (+2 more)

### Community 24 - "SFX v15"
Cohesion: 0.18
Nodes (12): filt(), lv(), noise(), norm(), pan_lr(), put(), room(), smooth_env() (+4 more)

### Community 25 - "SFX v16"
Cohesion: 0.18
Nodes (12): filt(), lv(), noise(), norm(), pan_lr(), put(), room(), smooth_env() (+4 more)

### Community 26 - "SFX v17"
Cohesion: 0.18
Nodes (12): filt(), lv(), noise(), norm(), pan_lr(), put(), room(), smooth_env() (+4 more)

### Community 27 - "Text Lockup Layout"
Cohesion: 0.24
Nodes (9): asc(), cap(), fit(), font(), g2(), g3(), g4(), stack() (+1 more)

### Community 28 - "SFX v13"
Cohesion: 0.35
Nodes (11): bed(), bp(), env(), halo_hit(), heartbeat(), hp(), lp(), noise() (+3 more)

### Community 29 - "SFX v3"
Cohesion: 0.35
Nodes (11): bed(), bp(), env(), halo_hit(), heartbeat(), hp(), lp(), noise() (+3 more)

### Community 30 - "SFX v5"
Cohesion: 0.35
Nodes (11): bed(), bp(), env(), halo_hit(), heartbeat(), hp(), lp(), noise() (+3 more)

### Community 31 - "Method & Binding Rules"
Cohesion: 0.18
Nodes (9): Puma Energy Convención de Operadores 2026, HighBTL / Brick (agency), Puma Energy (client), Brick deck 'APROBADOS Puma Energy | Speakers', v13 light score (per-transition moves), 5-placa timing grid (close at 23.6 s), Assembly (storyboard_v21 renderer), METHOD: Puma speaker teasers (+1 more)

### Community 32 - "Reference Generation"
Cohesion: 0.36
Nodes (7): E(), L(), overlay(), s1(), s2(), s3(), s4()

### Community 33 - "Layout Board"
Cohesion: 0.38
Nodes (8): draw_copy(), font(), P(), row(), silhouettes(), E(), Line(), Poly()

## Knowledge Gaps
- **10 isolated node(s):** `quabund.ai`, `Project risks & mitigations`, `Timeline to Dec 2 event (content lock Nov 16)`, `Questions for HighBTL / Puma`, `SFX cue sheet (no music)` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 164 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Knowledge base index` connect `KB Index & Versions` to `Pilot Storyboard Imports`, `Base Storyboard Renderer`, `Speaker Teasers & Lessons`, `Seedance Kit & Frames`, `Delivery Formats & Screens`, `Method & Binding Rules`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **What connects `quabund.ai`, `Project risks & mitigations`, `Timeline to Dec 2 event (content lock Nov 16)` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Manga Guide Drawing` be split into smaller, more focused modules?**
  _Cohesion score 0.05300207039337474 - nodes in this community are weakly interconnected._
- **Why does `Cepede manga-guide prompts CEP1-5` connect `Speaker Teasers & Lessons` to `Manga Guide Drawing`, `Pilot Storyboard Imports`, `Seedance Kit & Frames`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Should `Pilot Storyboard Imports` be split into smaller, more focused modules?**
  _Cohesion score 0.05456095481670929 - nodes in this community are weakly interconnected._
- **Why does `Teasers Cepede, C. Silva, Formento pack` connect `Speaker Teasers & Lessons` to `Pilot Storyboard Imports`, `KB Index & Versions`, `Seedance Kit & Frames`, `Method & Binding Rules`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Should `Base Storyboard Renderer` be split into smaller, more focused modules?**
  _Cohesion score 0.14487179487179488 - nodes in this community are weakly interconnected._