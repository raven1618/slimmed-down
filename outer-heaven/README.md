# Outer Heaven · Cerro Kavaju

A static site that pitches the Cerro Kavaju project. It has four views:

- **The hill:** a 3D model of Cerro Kavaju built from real elevation data. You can orbit it, and tapping a place flies the camera there.
- **The cabin:** a glamping cabin you can walk around, with a day/night switch.
- **The residence:** a home on the private side.
- **The plan:** the investor brief, with an interactive return calculator.

There is no build step. It is one `index.html`, plus `terrain.json` (elevation) and `img/` (site photos and the concept render). Three.js loads from jsDelivr.

## Host it for free

Any static host works. Pick one:

- **Netlify Drop:** go to https://app.netlify.com/drop and drag this `outer-heaven` folder onto the page. You get a public URL in seconds.
- **Cloudflare Pages / Netlify / Vercel from GitHub:** connect this repository, set the root (base) directory to `outer-heaven`, leave the build command empty and set the output directory to `outer-heaven` (or `.` if the tool asks relative to the base).
- **GitHub Pages:** this works if the repo is public, or on a paid plan for a private repo. Publish from the branch and open `/outer-heaven/`.

To preview locally, run `npx serve outer-heaven` or `python3 -m http.server -d outer-heaven`, then open the printed URL. Opening the file straight from disk won't work, because the browser blocks loading `terrain.json` that way.

## Links to individual views

Add `#cabin`, `#residence` or `#plan` to the URL to open that view directly.

## Data notes

- **Terrain:** SRTM elevation from the Terrain Tiles open dataset (AWS), zoom 15, resampled to a 12.5 m grid over 3.6 × 3.6 km centred near 25.310° S, 57.123° W. The elevation includes the forest canopy. The 3D view exaggerates heights 2.2× so the hill reads clearly.
- **Property boundary:** traced from the owners' annotated phone screenshot. This is approximate. Replace `GEO.outline`, `GEO.priv` and `GEO.pub` in `index.html` with surveyed coordinates once a KML is available. They are in local metres (x east, z south) from the grid centre.
- **Numbers:** all budgets and sizing in the plan are estimates for discussion. Market comparables and their sources are listed at the bottom of the plan.
