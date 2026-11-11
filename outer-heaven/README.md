# Outer Heaven · Cerro Kavaju

A static site that pitches the Cerro Kavaju project. It has four views:

- **The hill:** a 4 × 4 km 3D model of Cerro Kavaju built from satellite elevation, imagery, tree heights and map data. Tap the ground to get coordinates, slope and land cover, or draw boundaries from the title plans. **Display** switches the base map (satellite, topographic, shaded relief, slope, land cover, tree height, vegetation index, infrared) and what else the map shows.
- **The cabin:** a glamping cabin you can walk around, with a day/night switch.
- **The residence:** a home on the private side.
- **The plan:** the investor brief, with an interactive return calculator.

There is no build step for the site. It is one `index.html`, plus `data/` (the 3D hill) and `img/` (site photos and the concept render). Three.js loads from jsDelivr.

## Host it for free

Any static host works. Pick one:

- **Netlify Drop:** go to https://app.netlify.com/drop and drag this `outer-heaven` folder onto the page. You get a public URL in seconds.
- **Cloudflare Pages / Netlify / Vercel from GitHub:** connect this repository, set the root (base) directory to `outer-heaven`, leave the build command empty and set the output directory to `outer-heaven` (or `.` if the tool asks relative to the base).
- **GitHub Pages:** this works if the repo is public, or on a paid plan for a private repo. Publish from the branch and open `/outer-heaven/`.

To preview locally, run `npx serve outer-heaven` or `python3 -m http.server -d outer-heaven`, then open the printed URL. Opening the file straight from disk won't work, because the browser blocks loading the files in `data/` that way.

## Links to individual views

Add `#cabin`, `#residence`, `#trail` or `#plan` to the URL to open that view directly. `#pano-lagoon` and `#pano-deck` open the 360° views.

## 360° photoreal views

Panoramas rendered in Blender (see `render/README.md`) at the quality of the stills, because nothing is drawn live: each is one 4096×2048 image on the inside of a sphere. They are listed in `data/panos.json` (position in local metres, the bearing at the centre of the image, a caption), appear on the hill as **360°** markers and under **360° views** in the bar, and open full screen: drag to look around, scroll or pinch to zoom. Render another with `build.py … 4096 2048 32 <view>` after adding the viewpoint to `PANOS` in `render/build.py`.

## The trail: Mala Visión, playable

**The trail** tab is a browser version of the fight planned for the trail's midpoint: a ring of whitewashed trees around one white tree, where Mala Visión lives. On the real trail it would run on the phone's camera, motion sensors and flash; here you drag to look around and buttons stand in for the rest.

1. **The circle.** Answer her cry three times (E) to walk in. She steps out of the centre tree, then hides among the white trees.
2. **Find her.** Take her picture (Space) while she hides. The flash throws her back to the centre.
3. **Three rounds.** Each round she charges her white gaze three times. Look away (L) before it lands: if she is on screen when it does, you lose one of three eyes. When her light is spent, turn your back with the mirror (M) and shoot her in the selfie view. Shooting her straight on once she is awake costs an eye. Round 2 adds a feint and she hides; round 3 is faster and fills the ring with copies that the mirror does not show.
4. **The end.** Take the last picture and she breaks into moths (dark path), or lay the phone down for ten seconds without touching it and she tells you her name (light path).

The story follows option B from the myth map: Mala Visión is Porâsý, the woman whose fire sealed the seven sons. Sound (wind, crickets, her cry and whispers, all made in the browser) is placed in 3D, so headphones help. The view has its own renderer, built the first time the tab opens; the hill pauses while it is open.

## The 3D hill: real data

`data/` holds everything the hill view loads. All of it is built by `data/build/build.py` from open datasets, on one grid in **UTM zone 21S (EPSG:32721)**, the projection Paraguayan title plans use.

| File | What | Source |
| --- | --- | --- |
| `terrain.json` | Ground heights on a 10 m grid, 4 × 4 km | Copernicus DEM GLO-30, with forest canopy subtracted |
| `imagery.jpg` | Ground colour, 2048 px | Sentinel-2 L2A, cloud-masked median of 7 passes from Mar–Apr 2026, sharpened with the canopy model |
| `trees.json` | About 38k tree tops with height and crown size | Meta & WRI 1 m global canopy height map |
| `canopy.jpg` | Tree height base map | Same canopy height map, coloured 0–20+ m |
| `landcover.png` | Land cover base map | ESA WorldCover 2021, 10 m |
| `ndvi.jpg`, `falsecolor.jpg` | Vegetation index and infrared base maps | Same Sentinel-2 passes, near-infrared band |
| `basemaps.json` | Legend data for those maps (colour ramps, class shares) | |
| `site-*.webp`, `sites.json` | Sharper site photos draped over parts of the hill | The owner's own satellite screenshots (see below) |
| `objects.json` | The homestead: house, solar array, pond, quincho, cabin and more | Placed from the owner's drone photos (see below) |
| `context.json` | Roads, building footprints, named places | Overture Maps 2026-09-23.1 |
| `layers.geojson` | **Surveyed boundaries (title plans)**, WGS84 lon/lat | Added by hand, empty for now |
| `meta.json` | Origin, extent, sources | |

The local scene frame is metres from the origin in `meta.json`: `x = easting − E0` and `z = −(northing − N0)`.

To rebuild (needs Python with rasterio, pyproj, scipy, pyarrow, requests and Pillow):

```sh
cd outer-heaven/data/build
python3 build.py            # or one step: dem chm s2 trees layers site overture export
```

### Notes and the cabin layout

Open **Notes** in the hill view to lay out the site:

- **Add a cabin** or **Add a building**, then tap where it goes. It appears as a 3D footprint (cabins with their deck) facing downhill.
- Turn it with the slider or **Turn 15°**, change its width and depth, or tap **Move** and then the new spot.
- **Add a pond** marks open water, such as the natural lagoon in front of the cabins.
- **Add a note** drops a pin anywhere.
- Every mark has a name and a free-text note. Tap a mark or its label to open it.

Two kinds of note do more than mark a spot:

- **The trail.** Notes named *Start of the trail* and *Checkpoint 1*, *Checkpoint 2*, … are joined by a walking trail, routed over the terrain on the gentlest ground between each pair. The overview gives its length, climb and steepest stretch per leg. Move a checkpoint and the trail follows.
- **Installations.** A note can carry a first-draft model of an art installation (`model`: `stone-tower` for the lookout at checkpoint 1, `plaza` for the central plaza at checkpoint 4). The other checkpoints stay as pins until their designs are chosen.

The cabins sit in the area marked *Cabañas glamping/laguna natural*, with their backs dug into the quarry wall so the green roofs line up with the top of it.

Inside the Claude viewer the marks are saved in the artifact's shared database (collection `notes`: kind, name, text, UTM 21S `E`/`N`, `rot` bearing, `w`/`d` in metres, optional `model`), where Claude can read them. Elsewhere they stay in that browser. **Copy all as text** gives a plain summary to paste anywhere.

### Setting the property limits

Open **Property limits** in the hill view. There are two ways to add a boundary:

- **Draw on the map:** tap each corner in order and tap the first corner again (or press Finish) to close the shape.
- **Paste coordinates from a title plan:** UTM 21S, latitude/longitude and Paraguayan number formats all work.

To adjust a boundary afterwards, use **Edit corners**:

- Drag a corner to move it.
- Tap the small dot between two corners to add a corner there.
- Select a corner and press Remove corner to delete it.
- Undo reverses the last change.

Every boundary has a name and a type (Whole property, Public side, Private side, Homesite or Other), and its area and perimeter update live.

Where the limits are saved:

- **Inside the Claude viewer:** in the artifact's shared database (collection `boundaries`, corners as a flat list of UTM 21S easting/northing pairs). Everyone with access sees the same limits. Only the owner and editors can change them.
- **Anywhere else** (a static host, a signed-out visitor): in that browser only.

Signed-out visitors can't read the shared database. To show final limits to everyone, copy each boundary's GeoJSON into `data/layers.geojson` with a `name` property (and an optional `color`) and redeploy. Features in that file show as "Survey" boundaries.

If a plan uses an older datum rather than WGS84/SIRGAS, it has to be converted first.

### Accuracy

- **Elevation:** 30 m radar surface model resampled to 10 m. Ground under forest is estimated, so expect a few metres of error.
- **Imagery:** 10 m pixels.
- **Trees:** positions and heights come from the 1 m canopy model (imagery from 2009–2020).

A drone mapping flight over the property (an orthophoto plus a surface model at a few cm) can replace the terrain and imagery inside the boundary.

### Light and materials

- **Sky and light.** The hill and the concept scenes use a physically based sky (three.js `Sky`) at golden hour: early morning, the sun low in the east-south-east. The same sky, over a brown-green ground, is the light that fills shadows and shows in glass and water.
- **The game look.** Every 3D view renders through a post-processing chain: ambient occlusion in creases, under eaves and between trees (`GTAOPass`, skipped on phones), bloom on the brightest light, ACES tone mapping, then a film grade (warm highlights, cool shadows, contrast, vignette, a little grain). The grade is switched off on the data base maps so their colours still match their legends.
- **Shadows** cover the whole model from far away. Zoom in and they tighten to a box around the view, so roofs, cabins and trees cast crisp shadows. They are redrawn only when the view moves well away from the last fit.
- **Ground up close.** One procedural tile, 6 m across, holds grass, red earth with pebbles, and leaf litter. The terrain shader picks among them by the colour of the satellite or site photo underneath, and adds matching relief. It fades out past about 300 m, where the photo carries the detail. The photo itself gets a little more contrast and colour than the hazy source. Data maps such as topographic or land cover are left untouched apart from a fine grain.
- **Trees** share one leaf shader: clumps of light and shade across each crown, light coming through when you look toward the sun, and a slow breeze.

### Base maps

Topographic, shaded relief and slope are drawn in the browser from `terrain.json`. The topographic map numbers the 50 m contours and turns the contour lines on. Each base map comes with the layers that suit it: trees are on for satellite and off for the others, because the crowns would cover the data. Any layer can be switched back on in **Display**.

### Site photos

A phone screenshot of a satellite map of part of the site can be laid onto the hill at about 0.25 m per pixel. That is 40 times sharper than the Sentinel-2 imagery. The first one covers the public sector.

To add another:

1. Save it in `data/build/sources/`.
2. Add an entry to `data/build/sites.json` with:
   - `near`: rough local x and z in metres.
   - `bearing_hint`: the compass bearing the top of the screen faces. Read it from the map's compass; 0 if the map is north-up.
   - `hide`: pixel boxes `[x0, y0, x1, y1]` over the map's buttons and logo.
   - `marks`: pixel boxes around labels and the blue location dot.
   - `pins`: pixel boxes around place pins.
3. Run `python3 build.py site`.

The step finds the screenshot's scale, rotation and position by matching it to the Sentinel-2 imagery, and saves that fit into `sites.json`. Expect about ±5 m. It then:

- covers the buttons, pins and labels with texture from beside them
- matches the photo's colours to the satellite base
- removes 3D trees standing where the photo shows open ground
- adds trees where it shows woods that the canopy model missed

The photo shows only on the Satellite base map and can be switched off under **Display**. Credit the imagery's owner wherever the site is shown. Screenshots of Google Maps are © Google, and a drone orthophoto of your own would remove that restriction.

### The homestead

`data/objects.json` lists what is built on the site. Each entry has a `type` and a position in local metres:

- `house`, `cabin`, `quincho`, `solar`, `tent`, `trampoline`, `oven`, `mast` and `palm` take `x`, `z` and `rot`, the compass bearing the front faces.
- A `mango` takes a height `h` and crown radius `r`; a `boulder` takes `w`, `d`, `h` and `rot`.
- A `pond` takes a `ring` of corners.
- A `cut` lowers the ground inside its `ring` by `depth` metres, easing back up over `reach` metres, with a steep face along the corners listed in `wall`. The old quarry by the cabins is one (about 3 m, estimated from the photos).
- A `gravel` drive takes a `path` and a width `w`.

The viewer builds a 3D model for each type. Ponds are cut into the ground with their own banks. Tap a structure for its details; **Homestead** in the bar flies to the camera of the wide drone photo.

The positions came from two drone photos:

1. Each photo's camera was fitted with `data/build/drone_fit.py` so that, projected onto the terrain, the photo lines up with the overhead site photo.
2. Two roofs that both views show (the house and the wooden cabin) pinned the fit.
3. The points where things meet the ground were then located from that camera, to about ±3 m.

To move something, change its `x` and `z` and reload. To place something new from another drone photo, run `drone_fit.py` with a rough camera and an anchor or two, then `--locate` the pixels. The drone photos themselves are not in the repository.

## Concept pages notes

- **Numbers:** all budgets and sizing in the plan are estimates for discussion. Market comparables and their sources are listed at the bottom of the plan.
