# Outer Heaven · Cerro Kavaju

A static site that pitches the Cerro Kavaju project. It has four views:

- **The hill:** a 4 × 4 km 3D model of Cerro Kavaju built from satellite elevation, imagery, tree heights and map data. Tap the ground to get coordinates, or draw boundaries from the title plans.
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
| `context.json` | Roads, building footprints, named places | Overture Maps 2026-09-23.1 |
| `layers.geojson` | **Surveyed boundaries (title plans)**, WGS84 lon/lat | Added by hand, empty for now |
| `meta.json` | Origin, extent, sources | |

The local scene frame is metres from the origin in `meta.json`: `x = easting − E0` and `z = −(northing − N0)`.

To rebuild (needs Python with rasterio, pyproj, scipy, pyarrow, requests and Pillow):

```sh
cd outer-heaven/data/build
python3 build.py            # or one step: dem chm s2 trees overture export
```

### Adding title-plan boundaries

- **In the browser:** open Boundaries, then paste the corner coordinates from the plan. UTM 21S, latitude/longitude and Paraguayan number formats all work. The area and perimeter are shown as you type. "Copy GeoJSON" exports the boundary.
- **For everyone:** add the feature to `data/layers.geojson` with a `name` property (and an optional `color`) and redeploy. Features in that file show as "Survey" boundaries.

If a plan uses an older datum rather than WGS84/SIRGAS, it has to be converted first.

### Accuracy

- **Elevation:** 30 m radar surface model resampled to 10 m. Ground under forest is estimated, so expect a few metres of error.
- **Imagery:** 10 m pixels.
- **Trees:** positions and heights come from the 1 m canopy model (imagery from 2009–2020).

A drone mapping flight over the property (an orthophoto plus a surface model at a few cm) can replace the terrain and imagery inside the boundary.

## Concept pages notes

- **Numbers:** all budgets and sizing in the plan are estimates for discussion. Market comparables and their sources are listed at the bottom of the plan.
