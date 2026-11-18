# Roque Santa Cruz + Nelson Haedo Valdez · SPEECH MOTIVACIONAL (7th teaser)
**Source:** deck "Speakers - Evento Operadores 2026 (3).pptx", slides 19–26. Drive folder "Roque + Haedo" holds only the deck.
- **Concept:** "Una charla para JUGAR EN GRANDE". After the video comes a Kahoot-style trivia, "Team Roque vs. Team Haedo".
- **Placas:**
  1. DOS HISTORIAS QUE EMPEZARON CON UN SUEÑO (young photos)
  2. CON DESAFÍOS QUE LOS OBLIGARON A SUPERARSE (effort, training, first clubs)
  3. PORQUE SER GRANDE ES SABER SEGUIR ADELANTE (big club moments)
  4. Y ENTENDER QUE LAS GRANDES VICTORIAS NUNCA SE CONSIGUEN SOLOS (Paraguay national team)
  - Slide 21 also has "PORQUE SER GRANDE ES HACER HISTORIA" (alternate line?).
- **Client comments:**
  - "REPLANTEAR GUION: CONFIRMADO"
  - "tenemos que tener mejores imágenes de ellos, que no sean IA"
  - "FALTA FOTO EN EL BAYERN"
- **Real photos in the deck (10):** image55, image53 (young); image52, image60 (training); image58, image47, image54, image57 (clubs); image62, image61 (Paraguay). Several are low-res (431–760 px). Copies are in `roque_haedo/`.
- **Brand issue:** sponsor logos on most shirts (Opel, Tigo, Personal, Young Spirit, Fly Emirates-style).

## Nov 18 · approach proposed
- **Client wants real photos, not AI.** So no Seedance "frozen-time orbit" on their faces: AI view synthesis changes the faces of real famous people, and Higgsfield already rejected an AI executive face as "IP".
- **`tools/photo_parallax.py`** (local, free): BiRefNet cut-out of the player, inpainted background, and the background and player pushed at different speeds (2.5D). A prototype on image62 works.
- **Proposed layout:**
  - Left wing = Roque, right wing = Haedo ("Team Roque vs Team Haedo"), the same life stage per placa.
  - Centre = the text over the KV light. The player is cut out onto the KV / blurred-stadium background, which also removes the sponsor boards.
- **Still needed:** the client to label which photo is which player, 4 photos per player (young, training, club, Paraguay), the missing Bayern photo, and a decision on shirt sponsors.
- **Upscale:** photos under ~1000 px need an AI upscaler (Topaz image via Higgsfield; the user must upload, since upload from Claude Code is blocked).
- **Nov 18 v1 (for presentation, the script as is):**
  - **Mapping by club/number context, not faces:** Roque = 53 Olimpia, 52 training (guess), 54 Bayern, 62 Paraguay #24. Haedo = 55 "HAEDO" shirt, 60 training (guess), 58 Werder, 61 Paraguay #18. Client to confirm.
  - Built with storyboard_v26 tiles: L Roque parallax, C KV push, R Haedo parallax.
  - **Close:** two speakers (`andres_anim.dir_L` / `dir_R`; `outro.wing_names` per side: ROQUE SANTA CRUZ · TEAM ROQUE / NELSON HAEDO VALDEZ · TEAM HAEDO). Card: ROQUE + HAEDO · UNA CHARLA PARA JUGAR EN GRANDE.
- **Nov 18 · FINAL approved script (client):**
  1. Dos historias que empezaron con un sueño
  2. con desafíos que los obligaron a superarse
  3. porque toda gran historia se construye
  4. con quienes se atreven a jugar en grande

  Placas 1–2 unchanged; lockups for 3–4 updated. Render v2.
- Nov 18: user wants the photos upscaled, extended to 21:9 and animated as a slow-mo bullet-time orbit (AI, the user's call). Prompts in production/roque_haedo/PROMPTS_bullet_time.md. The user uploads (upload from Claude Code is blocked). Risk: identity drift / IP rejection on real players.
- **Nov 18 v3:** photos upscaled to 21:9 by the user (GPT 2.6) and animated in Seedance (super slow motion on the player, camera orbiting at normal speed, faces frozen).
  - **Clips:** R1 2c29ffd8, R2 53866812, R3 7a19c87c, R4 832fea34, H1 9e4fc18c (interview, dolly-in, talking), H2 39d4f800, H3 3e86fdb0, H4 3f6525f1.
  - Panel crops per tile: z 1.3–1.8, fy 0.3–0.45.
  - **Lessons:** a 21:9 frame for a narrow side panel needs the crop set in the edit; never ask for expression changes (faces morph); a talking shot needs ~80% speed and an explicit mic-to-mouth.
