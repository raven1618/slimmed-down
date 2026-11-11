"""Pack the baked site for the walkable web world (index.html, the Walk view): heights, baked light, ground types,
sky, tree sprites and positions, web-sized textures, and one description file.
   python web_export.py WORK ASSETS ../data/walk"""
import json, math, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage
WORK, A, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
WEB = os.path.join(WORK, 'web'); os.makedirs(os.path.join(OUT, 'tex'), exist_ok=True)
D = np.load(os.path.join(WORK, 'site.npz'))
Hd, Hc = D['Hd'].astype(np.float32), D['Hc'].astype(np.float32)
dx0, dz0 = (float(v) for v in D['dorig']); nz, nx = Hd.shape
cx0, cz0, cx1, cz1 = (float(v) for v in D['corig'])
Hd.tofile(os.path.join(OUT, 'heights.bin')); Hc.tofile(os.path.join(OUT, 'far.bin'))          # rows run north to south
Image.open(os.path.join(WORK, 'far.png')).convert('RGB').save(os.path.join(OUT, 'far.jpg'), quality=85)

# Ground types, north at the top, and where live grass grows: not in the lagoon, not at the cabins.
sp = np.asarray(Image.open(os.path.join(WORK, 'splat.png')).convert('RGB'))[::-1].astype(np.float32) / 255
X, Z = np.meshgrid(dx0 + np.arange(nx), dz0 + np.arange(nz))
lx, lz, water, lrot, lw, ld = (float(v) for v in D['lagoon'])
b = math.radians(lrot); fx, fz = math.sin(b), -math.cos(b)
u = (X - lx) * fx + (Z - lz) * fz; v = (X - lx) * -fz + (Z - lz) * fx
q = (u / (ld / 2)) ** 2 + (v / (lw / 2)) ** 2
grass = np.clip(1 - sp[..., 2] * 1.5, 0, 1) * np.clip((q - 1.15) / 0.3, 0, 1)
for x, z, *_ in D['cabins']: grass *= np.clip((np.hypot(X - x, Z - z) - 10) / 3, 0, 1)
# Stored as RGB (live grass, soil, litter): browsers may spoil colour where alpha is zero.
Image.fromarray((np.dstack([grass, sp[..., 1], sp[..., 2]]) * 255 + 0.5).astype(np.uint8), 'RGB').save(os.path.join(OUT, 'splat.png'))

# Baked light: irradiance, smoothed a touch, stored as (L / 2.5) ^ (1 / 2.2). Row 0 is the north edge.
L = np.load(os.path.join(WEB, 'lightmap.npy')).astype(np.float32)
L = ndimage.gaussian_filter(L, (1.2, 1.2, 0))
Lm = np.stack([ndimage.zoom(L[..., c], (nz / L.shape[0], nx / L.shape[1]), order=1) for c in range(3)], -1)   # on the 1 m grid
Image.fromarray((np.clip(L / 2.5, 0, 1) ** (1 / 2.2) * 255 + 0.5).astype(np.uint8)).save(os.path.join(OUT, 'light.jpg'), quality=88)

# The sky in linear light (build.py ... sky), stored like the light: (sky / 4) ^ (1 / 2.2). Centre of the image = north.
SKY = np.load(os.path.join(WEB, 'sky.npy')).astype(np.float32)
Image.fromarray((np.clip(SKY / 4, 0, 1) ** (1 / 2.2) * 255 + 0.5).astype(np.uint8)).save(os.path.join(OUT, 'sky.jpg'), quality=90)

# The light out in the open: light = a * max(n . sun, 0) + b, per colour.
# The web uses it for the far terrain and to set the strength of its live sun on the cabins.
s3 = json.load(open(os.path.join(WEB, 'bake.json')))['sun']; sun = np.array([s3[0], s3[2], -s3[1]])
gz, gx = np.gradient(Hd); nrm = np.dstack([-gx, np.ones_like(Hd), -gz]); nrm /= np.linalg.norm(nrm, axis=2, keepdims=True)
ndl = np.clip(nrm @ sun, 0, 1)
a_sun = 7.5 * np.array([1.0, 0.72, 0.48]) / np.pi                            # build.py's sun lamp, as light on a level surface
m_ = (sp[..., 2] < 0.2) & (ndl > 0.45) & (ndl < 0.7)                        # open ground, not under the forest
lum = Lm.mean(-1); m_ &= lum >= np.percentile(lum[m_], 60)                  # and out of the shadows
coef = np.stack([a_sun, np.median(Lm[m_] - a_sun * ndl[m_][:, None], 0)])   # rows: a, b (the sky and the bounce)
print('light = a * n.sun + b:  a', coef[0].round(3), ' b', coef[1].round(3))
Image.open(os.path.join(WEB, 'trees.webp')).save(os.path.join(OUT, 'trees.webp'), quality=90, method=6)

# Trees: the same set and species as the renders and the bake (species 0-3 = rows of the sprite sheet).
T = D['trees'].astype(np.float32)
T = T[(np.hypot(T[:, 0] - 390.0, T[:, 1] - 836.0) > 28) & (np.hypot(T[:, 0] - 384.2, T[:, 1] - 860.4) > 15)]
h = T[:, 3]; r = np.random.default_rng(7).random(len(T))
spc = np.where(h >= 14, 1, np.where(h >= 8, np.where(r < 0.5, 1, 2), np.where(h >= 4.5, np.where(r < 0.6, 3, 2), 4))) - 1
np.column_stack([T[:, 0], T[:, 1], T[:, 2] - 0.2, h, spc]).astype(np.float32).tofile(os.path.join(OUT, 'trees.bin'))

for name, src in (('grass', 'leafy_grass'), ('soil', 'cracked_red_ground'), ('litter', 'forest_leaves_02'), ('wall', 'excavated_soil_wall'), ('plaster', 'clay_plaster'), ('planks', 'brown_planks_05')):
    Image.open(os.path.join(A, 'tex', src, 'diff.jpg')).convert('RGB').resize((1024, 1024), Image.LANCZOS).save(os.path.join(OUT, 'tex', name + '.jpg'), quality=85)

g_ = (np.asarray(Image.open(os.path.join(OUT, 'tex', 'grass.jpg')), np.float32) / 255) ** 2.2
galb = g_.reshape(-1, 3).mean(0) * np.array([0.6, 0.9, 0.48])           # the lawn's colour, for the live blades
bake = json.load(open(os.path.join(WEB, 'bake.json'))); sprites = json.load(open(os.path.join(WEB, 'trees.json')))
s = bake['sun']
world = {
    'region': [dx0, dz0, dx0 + nx - 1, dz0 + nz - 1], 'grid': [nx, nz], 'far': [cx0, cz0, cx1, cz1], 'farGrid': [Hc.shape[1], Hc.shape[0]],
    'sun': [s[0], s[2], -s[1]],                                   # local frame: x east, y up, z south
    'lagoon': [lx, lz, water, lrot, lw, ld], 'cabins': [[float(v) for v in c] for c in D['cabins']],
    'trees': len(T), 'sprites': sprites['species'], 'lightScale': 2.5, 'skyScale': 4.0, 'spriteScale': 1.6, 'sunLight': [float(v) for v in coef[0]], 'ambient': [float(v) for v in coef[1]], 'grassAlbedo': [float(v) for v in galb],
    'start': [392.0, 834.0, 222.0],
    'credits': 'Trees, textures and sky: Poly Haven (CC0). Terrain, trees and layout: the site data and the owner\'s notes.',
}
json.dump(world, open(os.path.join(OUT, 'world.json'), 'w'), indent=1)
tot = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(OUT) for f in fs)
print('exported', len(T), 'trees;', round(tot / 1e6, 1), 'MB')
