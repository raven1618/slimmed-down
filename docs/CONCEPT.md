# Habitar: concept

A real-estate "video game" for Asunción: a live 3D map of the city with listings from
agencies and agents, buildings that exist or do not exist yet, and units you can live in
before buying: real sunlight, lamps, curtains, the faucet, the TV, moments of everyday life.
On a phone as a magic window or AR portal, on a headset in VR.

Inspired by [God's Eye View](https://github.com/bilawalsidhu/gods-eye-view) (MIT), a
real-time 3D globe on CesiumJS. We keep its ideas (data layers, a cinematic director,
visual modes, a key-hiding proxy, talking to the map) and build on **three.js** instead,
so a single renderer covers the whole trip: orbit → city → street → through the window →
into the unit → into VR.

## Four zoom levels

1. **City (God's-eye view).** Real 3D city (Google Photorealistic 3D Tiles; keyless
   fallback: satellite imagery + OpenStreetMap buildings). Listings glow; browse by agency,
   agent or "surprise me". Later: live layers (price heatmap, transit, traffic, flood/noise)
   and voice search ("3 bedrooms under $250k, 10 minutes' walk from a good school").
2. **Neighbourhood.** Schools, health, shopping and parks from OpenStreetMap as motion
   graphics: pins rising out of the ground, 5/10/15-minute walking rings, routes arcing
   from the building.
3. **Building.** Existing buildings come from the 3D city or a drone splat. Unbuilt ones
   are generated from their data and placed on the real lot (the current lot is flattened
   in photoreal mode). Status reads at a glance: off-plan = hologram, under construction =
   bare top floors and a crane. Floors light up by availability; open a floor to its units.
4. **Unit ("Habitar").** The game layer: walk, switch lamps, close curtains, run the
   faucet, watch the TV light the room, change the time of day and season with the real
   sun for Asunción, play "moments" (Sunday morning, cooking, dinner for two, movie night).

## Photoreal vs interactive

Gaussian splats are photoreal but frozen: their light is baked into the capture. So:

- **Visit**: a splat of the unit as it is today (resale; drone exteriors). Look, don't touch.
- **Live in it**: a modelled unit whose light is pre-computed in **layers**: one lightmap
  per lamp, one for the sky, and one for the *bounced* sunlight at several times of day and
  two seasons. The browser mixes the layers live (a lamp fades its layer in, the time slider
  blends the sun keys) and draws direct sunlight in real time, so the sun patch moves
  across the floor. Near-photoreal at a cost phones and headsets can afford.

## People and emotion

Real-time photoreal humans fall into the uncanny valley quickly. We hint instead: steam
from a pot, two glasses, the TV's glow, a blanket, rain on the window; later silhouettes
and volumetric captures of real actors. Scenes are tagged by buyer profile (couple, young
family, retiree, professional) so the agent picks the story for each client.

## Devices

- **VR**: WebXR in the Meta Quest browser and Apple Vision Pro: same link, "Enter VR".
- **AR portal**: Android Chrome. A doorway appears in your living room; walk through it.
- **iPhone**: Safari has no immersive WebXR, so it gets the gyroscope "magic window".
  A native iOS app can add the true portal later.

## Business shape

A marketplace, not just a tool. The map only impresses when it is full, so listings come
in levels on the same map:

| Level | What it is | Who pays |
|---|---|---|
| Basic | Any listing from an agency feed: pin, data, photos | free / cheap, fills the map |
| 3D | Building placed or highlighted, units and availability, splat visit | agencies |
| Immersive | "Habitar", VR / portal, moments, cinematic tour | developers and premium listings |

Launch city by city, starting with Asunción and the agencies already interested.

## Automation (the Studio)

Brief in → presentation out. Each step runs automatically, with a quick human review at
first:

1. Footage check (blur, exposure, coverage) → accept or ask for a refilm.
2. Plan reading: CAD parsed directly; PDFs and images read by AI → rooms, walls, doors.
3. Splat building on a GPU: frames → camera poses → training → cleanup → compression.
4. Unbuilt units: headless Blender builds the unit from the plan, places furniture from a
   library and bakes the light layers (`pipeline/blender/build_unit.py`, working today
   from a hand-written spec).
5. Alignment of splat ↔ plan ↔ building, with a confidence score.
6. Knowledge layer: floors, units, rooms and walking paths generated from the plans.
7. Auto-director: camera shots from templates.
8. Copy and motion graphics: AI writes the texts (ES/EN) from the brief.
9. Publish: share links with analytics, kiosk mode, video export.

## Phase 0 (this repository)

Three tests, each answering "can this actually work?":

1. **City dive**: Google 3D city in three.js, fly from orbit to a real address in Asunción,
   generated buildings on their lots, listings and nearby services. → `#/ciudad`
2. **Capture**: own footage → splat → loaded in the browser. → `#/captura` +
   `pipeline/splat/process_capture.sh`
3. **Living room**: one unit with light layers, curtains, time of day, a moment of life;
   must run smoothly on a phone and in a Quest browser. → `#/hogar` +
   `pipeline/blender/build_unit.py`

Open questions after Phase 0: real drone/phone footage of a listing, a Google Maps key and
its cost per session, performance on a mid-range Android and a Quest 3, and plan reading
from the agencies' real PDFs.
