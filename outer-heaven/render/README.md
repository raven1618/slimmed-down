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
