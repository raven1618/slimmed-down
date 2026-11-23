# Blender renders

Photoreal stills of the site, built from the same data as the web model and rendered with Cycles.
Trees, grass, textures and the sky are CC0 assets from [Poly Haven](https://polyhaven.com).

## Run it

Blender is used as a Python module, so no Blender install is needed:

```sh
uv venv --python 3.13 blender-env && VIRTUAL_ENV=blender-env uv pip install bpy==5.3.0
python3 ph_fetch.py assets                                   # about 600 MB from Poly Haven
python3 prep.py ../data work layout.json                     # terrain, ground types, trees, cabins
blender-env/bin/python build.py assets work hero.png 1920 1080 96
```

`prep.py` needs numpy, scipy and Pillow. On a 4-core CPU a 1920×1080 frame at 96 samples takes about 15 minutes.

## The shot: quarry cabins

- **Terrain:** 1 m, interpolated from the 10 m elevation model, with the quarry cut from `data/objects.json` and a basin and low berm for the lagoon. The distance uses the 10 m grid with the satellite image.
- **Ground:** scanned grass, red earth and leaf litter, mixed by weights taken from the site photo. The steep quarry face gets an excavated-soil texture tinted to the red-brown of the real wall. Open ground is drawn as lawn, since it will be a landscaped site.
- **Trees:** every canopy top from `data/trees.json` within 1.2 km, as Poly Haven island trees and small trees chosen by height and scaled to it.
- **Cabins and lagoon:** positions, bearings and sizes from `layout.json`, the same cabin and lagoon notes as in the web model's Notes. Rammed-earth walls, glass, steel frames, deck, living roof with grass, and a warm light inside.
- **Light:** a clear evening sky panorama, plus a warm sun 30° up in the east-south-east, as in the web model.

Change the camera with `CAM, TGT` in `build.py` (local metres: x east, z south).

## Free roam: the quarry cabins

The same scene, made walkable in the browser. Blender does the expensive part once; three.js draws the rest live.

```sh
blender-env/bin/python build.py assets work /dev/null 4096 4096 24 bake    # light on the ground, about 20 minutes
blender-env/bin/python build.py assets work /dev/null 4096 2048 8 sky      # the sky alone, in linear light
blender-env/bin/python impostors.py assets work/web 512 24                 # each tree species from eight sides
python3 web_export.py work assets ../data/walk                             # about 7 MB for the web
```

- **Ground light:** Cycles bakes the sun and sky light falling on the ground, with the shadows of the real tree models and the cabins, into a 4096² map (about 9 cm a pixel). The browser multiplies it with the same tiled textures and ground-type mix as the render.
- **Trees:** every tree is a card that turns to face you and shows the real model as seen from the nearest of eight sides, so the forest of almost 18,000 trees costs little to draw.
- **Live:** grass blades that bend in the wind and around your feet, the lagoon (it mirrors the scene on bigger screens and the sky on phones), the cabins with a lit room drawn behind the glass, haze toward the horizon, and the same film grade as the rest of the site.
- **Colour:** both sides use AgX tone mapping with +0.5 exposure, so the browser matches Blender.

## Free roam: the private side

Finca 2663, the surveyed 8.66 ha parcel at the north-west end, with the residence on a homesite 70 m east of
the mango tree: open ground at about 7°, the glass facing east over the valley.

```sh
python3 render/private_site.py data data/walk/private [work/private]   # about 1.5 minutes, no Blender needed
```

The optional third folder also gets the scene for the Blender renders of the tour (`site.npz`, `splat.png`, `far.png`).

- **Terrain:** the elevation model at 1 m, with the fine relief real ground has (stronger on steep ground) and a
  level pad cut into the slope for the house.
- **Ground:** lawn, bare earth and leaf litter from the satellite image, the tree crowns and the slope; the dirt
  tracks show as bare earth.
- **Trees:** every tree of the canopy data within 1.2 km, the mango tree (13 m, 8 m crown) and its two granite
  boulders, from `data/objects.json`.
- **Light:** baked in Python with the sun and sky of the Blender bake: sun shadows of crowns, house, boulders and
  hill ray-marched at 25 cm (leaves let some light through), and how much sky each spot sees, at 1 m.

## The photoreal tour (Explore the site)

Ten 360° views of both sites, rendered from the same terrain, trees and buildings as free roam. The buildings come
straight from the web: `js/cabin.js` is exported to glTF with its materials, so the renders and free roam show the
same cabin and residence, inside and out.

```sh
node render/export_models.cjs work/models                  # cabin.glb and residence.glb, from js/cabin.js
python3 render/tour_spots.py data                          # data/tour.json: where each view stands and looks
blender-env/bin/python build.py assets work ../data/tour 4096 2048 48 tour work/models ../data/tour.json
blender-env/bin/python build.py assets work/private ../data/tour 4096 2048 48 tour work/models ../data/tour.json
```

- **Buildings:** the glTF models placed at the free roam's positions and bearings. Glass and the pool become real
  glass and water, the lamps glow and light the rooms, and grass tufts grow on the living roofs (the roof faces of
  the model, set in from the edge).
- **Ground:** the walk's terrain at 1 m. Around the buildings the meadow is a mown lawn, and no grass grows inside
  a building's footprint.
- **Views:** each `data/tour.json` entry is an equirectangular camera at eye height; the centre of the image faces
  its bearing. A 4096×2048 view at 48 samples takes about 15 minutes on a 4-core CPU.
