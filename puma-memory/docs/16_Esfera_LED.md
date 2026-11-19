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
