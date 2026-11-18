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
