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

Add `#cabin`, `#residence` or `#plan` to the URL to open that view directly.

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
- **Add a note** drops a pin anywhere.
- Every mark has a name and a free-text note. Tap a mark or its label to open it.

Inside the Claude viewer the marks are saved in the artifact's shared database (collection `notes`: kind, name, text, UTM 21S `E`/`N`, `rot` bearing, `w`/`d` in metres), where Claude can read them. Elsewhere they stay in that browser. **Copy all as text** gives a plain summary to paste anywhere.

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
- A `pond` takes a `ring` of corners.
- A `gravel` drive takes a `path` and a width `w`.

The viewer builds a 3D model for each type. Ponds are cut into the ground with their own banks. Tap a structure for its details; **Homestead** in the bar flies to the camera of the wide drone photo.

The positions came from two drone photos:

1. Each photo's camera was fitted with `data/build/drone_fit.py` so that, projected onto the terrain, the photo lines up with the overhead site photo.
2. Two roofs that both views show (the house and the wooden cabin) pinned the fit.
3. The points where things meet the ground were then located from that camera, to about ±3 m.

To move something, change its `x` and `z` and reload. To place something new from another drone photo, run `drone_fit.py` with a rough camera and an anchor or two, then `--locate` the pixels. The drone photos themselves are not in the repository.

## Concept pages notes

- **Numbers:** all budgets and sizing in the plan are estimates for discussion. Market comparables and their sources are listed at the bottom of the plan.
