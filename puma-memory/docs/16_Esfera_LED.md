# Esfera LED · Ø 2 m (Nov 19)
**Spec (client sheet, "05 Esfera LED"):**
- Reference canvas 2688 × 1296 px (2.074:1), not exactly 2:1.
- Content for spherical mapping: equirectangular 360°×180°, or directly on the equipment's UV map.
- **Do NOT auto-stretch** to the controller map. Check the seam (the two ends meet) and pole distortion.
- **Ask the LED vendor for their mapping template** before export.

**Client reference video:** a Puma ball texture, 1200×576 (2.083:1), 8.3 s loop.

**Visualizer:** `production/esfera/Puma_Esfera_LED_visualizer.html`
- Self-contained: three.js r149 inlined, the reference embedded. Source in `tools/esfera/app.js`.
- **Features:**
  - Drop any video or image onto it.
  - Two mapping modes: stretched to 180°, or true proportion (1296/1344 → 173.6° of latitude, poles uncovered).
  - 30° grid, seam line (red, at u=0/1), auto-spin.
  - Views: audience, from below, close, pole.
  - Human scale: 1.75 m person; sphere centre at 3 m.

## Apertura script (BRICK PDF "Pantalla Esférica", Nov 19)
- **VO:** Somos Puma Energy / Una compañía global presente en + de 40 países, por eso cuando decimos calidad internacional sabemos de qué estamos hablando / Y en Paraguay brindamos soluciones / en cada kilómetro recorrido / en cada entrega / en cada destino / con combustible de calidad / Y esta historia la construimos juntos / Nuestro próximo logro empieza hoy / Listos para jugar en grande / 2027
- **Beats:**
  1. Black sphere, then halo pentagon pulses (×5, with SFX); the pulse opens to the green ball.
  2. SOMOS + Puma logo; the puma runs.
  3. The halo forms a path; the puma runs on the spot while Puma Energy places pass behind it.
  4. Rotating world map: UNA COMPAÑÍA GLOBAL, then +40 PAÍSES (connection lines), then CALIDAD INTERNACIONAL.
  5. Zoom to South America; Paraguay lights up: Y EN PARAGUAY.
  6. Photo scenes, each with text on top and the puma running below: EN CADA KM RECORRIDO, EN CADA ENTREGA (×5 photos), EN CADA DESTINO (×2), CON COMBUSTIBLES DE CALIDAD.
  7. CONSTRUIMOS JUNTOS: video seconds 4–11 (from the truck to the mirrored city), then a photo collage.
  8. Pulses again; the pulses become the ball; a person kicks it; it becomes the KV.
  9. Logo without the puma; the puma runs into the logo.
  10. NUESTRO PRÓXIMO LOGRO, EMPIEZA HOY, LISTOS PARA JUGAR EN GRANDE, then 2027 grows small→full, then the KV loop.
- **Loop 1 (DURANTE):** neon Paraguay map with lines linking Puma Energy stations; placas JUGAMOS EN GRANDE EN TODO EL PAÍS.
- **Materials:** `esfera_in/` (scratchpad) holds 1_km (San Antonio ×3), 2_entrega (cilindro, aerial plant ×3, convoy, Ladario barge, fuel nozzle), 3_destino (station, airport), 4_calidad (station + car), 5_juntos (parar_cargar_seguir_20s.mp4; "PARAR." text burns in around 18 s, so use seconds 4–11). The ball-reference folder `12LaPhxz…` returns not-found (needs sharing).
- **Method:** author each scene as a square "front disc", the same composition as the PDF circles. `tools/sphere_proj.py` `disc_to_equi()` projects it orthographically onto the front and back hemispheres (centres at lon 0/180, feathered limb), producing 2688×1296. Full-wrap equirect is used only for content that should truly wrap (map loop, pulses).
- **Visualizer:** the canvas centre (x = 1344) now faces the audience. `tools/esfera/shot.js` screenshots any equirect frame (headless).
- **Brand QC:** the airport photo shows a third-party airline tail and the car photo shows a car-maker grille. Crop or flag them before using.

## Apertura renderer v1 (Nov 19), `tools/sphere_render.py`, no credits used
- **Run:** `sphere_render.py [scale] [t,t,...]`. Scale 0.5 renders a 1344×648 preview; 1 renders the 2688×1296 master. Passing times renders contact stills (front view + back view + equirect).
- **Outputs:** `Esfera_apertura_equirect*.mp4` (the file for the LED) and `Esfera_apertura_vista_frente_dorso.mp4` (an orthographic preview of the front and back views).
- **Ball:** a true truncated icosahedron (12 pentagons + 20 hexagons) with one pentagon facing the audience. A pixel's panel is the face plane its ray hits first (score = P·n / r, with r_pent = 2.32744 and r_hex = 2.26728). Seams use the score difference between the top two faces and are drawn as multi-strand neon. Hexagon centres = icosahedron face centroids (the first attempt used the wrong dual orientation).
- **Pulse:** the front pentagon in the gnomonic plane, with edge normals pointing at the 5 adjacent hexagons. At scale 1 it matches the real panel, so the pulse opens into the ball and the light spreads outward from the front.
- **Globe:** Natural Earth 50m (public domain), rasterised to 4096×2048 (land, coast, borders, Paraguay), with an azimuthal zoom about the front. Arcs go from Asunción to 40 hubs (decorative).
- **Text:** front-disc lockups in Gotham Condensed, projected onto the front and back hemispheres.
- **Photos:** a glass-ball look, light-sweep wipes between photos, and the KV light path (a tilted great-circle swoosh) as the puma's track. The airport photo is cropped to remove the airline tail; the car photo is cropped to the attendant and pump to remove the grille.
- **Timeline:** `TL` dict, about 72 s. It is temporary until the VO is recorded; retime by editing `TL`.
- **2027:** capped at the visible face to avoid wrap-around ("0202"), then flashes into the KV.
- **Placeholders (Higgsfield later):** the running puma (for now the logo cat slides in) and the person kicking the ball (for now a fast ball spin and a flash).
- **Logo:** the only logo source is `kv_logo_rgba.png`, at about 360 px wide, which is soft on the sphere. Ask for the vector logo.
