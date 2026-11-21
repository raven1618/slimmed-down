"""The private side (Finca 2663) as a walkable site, for js/walk.js:
- terrain at 1 m from the elevation model, with the fine relief real ground has, and a level pad cut into the
  slope for the residence;
- ground types (lawn, bare earth, leaf litter) from the satellite image, the tree crowns and the slope;
- every tree of the canopy data, the mango tree and its two boulders (from the owner's notes);
- a light bake in Python with the sun and sky of the Blender bake (render/build.py): sun shadows of trees,
  house and hill, ray-marched at 25 cm, and the sky each spot of ground can see, at 1 m.
   python render/private_site.py data data/walk/private"""
import base64, json, math, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

DATA, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
QW = json.load(open(f'{DATA}/walk/world.json'))          # the sun, the sky light and the tree pictures of the quarry walk
E0, N0 = 487570, 7200720
local = lambda E, N: (E - E0, -(N - N0))

ter = json.load(open(f'{DATA}/terrain.json'))
n, res = ter['grid'], ter['res']
dem = ter['base'] + np.frombuffer(base64.b64decode(ter['data']), dtype='<u2').reshape(n, n).astype(np.float64) / ter['scale']
HALF = (n - 1) * res / 2
def height(x, z, order=3):
    x, z = np.asarray(x, float), np.asarray(z, float)
    out = ndimage.map_coordinates(dem, [(np.atleast_1d(z) + HALF) / res, (np.atleast_1d(x) + HALF) / res], order=order, mode='nearest')
    return out.reshape(x.shape) if x.ndim else float(out[0])

# ------------------------------------------------------------------ the parcel and the area to walk
parcel = next(f for f in json.load(open(f'{DATA}/layers.geojson'))['features'] if f['properties'].get('id') == 'finca-2663')
RING = [local(E, N) for E, N in parcel['properties']['utm_21s']]
X0, X1, Z0, Z1 = -400, 40, -680, -220
xs, zs = np.arange(X0, X1 + 1, 1.0), np.arange(Z0, Z1 + 1, 1.0)
X, Z = np.meshgrid(xs, zs)
H = height(X, Z)

# The elevation model is 30 m data: smooth. Real ground has hummocks and small rills; add them, larger on steep ground.
rng = np.random.default_rng(11)
def noise(scale):
    g = rng.standard_normal((int((Z1 - Z0) / scale) + 4, int((X1 - X0) / scale) + 4))
    return ndimage.map_coordinates(g, [(Z - Z0) / scale + 1, (X - X0) / scale + 1], order=3, mode='nearest')
gz, gx = np.gradient(H)
steep = np.clip(np.hypot(gx, gz) / 0.4, 0, 1)
H = H + noise(26) * 0.4 + noise(9) * (0.14 + 0.2 * steep) + noise(3.5) * 0.05

# ------------------------------------------------------------------ the homesite and its pad
RES = {'x': -120.0, 'z': -565.0, 'rot': 90.0}            # open, about 7 degrees, 70 m east of the mango tree; glass to the valley (east)
th = math.radians(RES['rot']); F = (math.sin(th), -math.cos(th)); R_ = (math.cos(th), math.sin(th))
U = (X - RES['x']) * R_[0] + (Z - RES['z']) * R_[1]; V = (X - RES['x']) * F[0] + (Z - RES['z']) * F[1]
ex = [-15, -9, 16, 13]                                     # js/cabin.js RESIDENCE.extent: across, then toward the front
du = np.maximum(np.maximum(ex[0] - U, U - ex[2]), 0); dv = np.maximum(np.maximum(ex[1] - V, V - ex[3]), 0)
d = np.hypot(du, dv)
pad = float(height(RES['x'], RES['z'])) + 0.1
w = np.clip(1 - d / 7, 0, 1); w = w * w * (3 - 2 * w)
H = H * (1 - w) + pad * w                                  # cut into the slope behind, a little fill in front
RES['floor'] = pad

# ------------------------------------------------------------------ trees, the mango tree, the boulders
tr = json.load(open(f'{DATA}/trees.json'))
a = np.frombuffer(base64.b64decode(tr['data']), dtype=np.dtype([('x', '<i2'), ('z', '<i2'), ('h', 'u1'), ('r', 'u1')]))
tx, tz, th_, tr_ = a['x'] / 10, a['z'] / 10, a['h'] / 10, a['r'] / 10
cx, cz = (X0 + X1) / 2, (Z0 + Z1) / 2
keep = np.hypot(tx - cx, tz - cz) < 1200
tx, tz, th_, tr_ = tx[keep], tz[keep], th_[keep], tr_[keep]
objs = json.load(open(f'{DATA}/objects.json'))['objects']
mango = next(o for o in objs if o.get('type') == 'mango')
mx, mz = mango['x'], mango['z']
rocks = [[o['x'], o['z'], o['w'], o['d'], o['h'], o.get('rot', 0)] for o in objs if o.get('type') == 'boulder']      # granite, from the owner's photos
ru = (tx - RES['x']) * R_[0] + (tz - RES['z']) * R_[1]; rv = (tx - RES['x']) * F[0] + (tz - RES['z']) * F[1]
clear = (ru > ex[0] - 8) & (ru < ex[2] + 8) & (rv > ex[1] - 6) & (rv < ex[3] + 14)                     # the homesite, and its view
clear |= np.hypot(tx - mx, tz - mz) < 9                                                               # the mango has the place to itself
tx, tz, th_, tr_ = tx[~clear], tz[~clear], th_[~clear], tr_[~clear]
tx, tz = np.append(tx, mx), np.append(tz, mz)
th_, tr_ = np.append(th_, float(mango['h'])), np.append(tr_, float(mango['r']))                     # a big, round mango crown
inside = (tx >= X0) & (tx <= X1) & (tz >= Z0) & (tz <= Z1)
ty = np.where(inside, ndimage.map_coordinates(H, [tz - Z0, tx - X0], order=1, mode='nearest'), height(tx, tz))
r = np.random.default_rng(7).random(len(tx))
sp = np.where(th_ >= 14, 1, np.where(th_ >= 8, np.where(r < 0.5, 1, 2), np.where(th_ >= 4.5, np.where(r < 0.6, 3, 2), 4))) - 1
sp[-1] = 0                                                                                           # the mango: the broad island tree
rock_y = [float(ndimage.map_coordinates(H, [[z - Z0], [x - X0]], order=1)[0]) for x, z, *_ in rocks]

# ------------------------------------------------------------------ ground types, from the satellite image, crowns and slope
img = np.asarray(Image.open(f'{DATA}/imagery.jpg').convert('RGB'), np.float32) / 255
S = img.shape[0] / 4000.0
rgb = np.stack([ndimage.map_coordinates(img[..., k], [(Z + 2000) * S, (X + 2000) * S], order=1) for k in range(3)], -1)
green = rgb[..., 1] / (rgb.sum(-1) + 1e-3); bare = np.clip((rgb[..., 0] - rgb[..., 1]) * 6 + (rgb.sum(-1) - 1.1) * 0.8, 0, 1)
from scipy.spatial import cKDTree
kd = cKDTree(np.c_[tx, tz]); dist, idx = kd.query(np.c_[X.ravel(), Z.ravel()])
crown = np.clip(1.4 - dist.reshape(X.shape) / np.maximum(tr_[idx].reshape(X.shape), 1), 0, 1)
gz, gx = np.gradient(H); slope = np.degrees(np.arctan(np.hypot(gx, gz)))
litter = np.clip(crown * 1.2, 0, 1)
soil = np.clip(bare * 0.8 + np.clip((slope - 24) / 12, 0, 1) * 0.6, 0, 1) * (1 - litter)
grass = np.clip(1 - litter * 1.3 - soil * 0.8, 0, 1) * np.clip(green * 3 - 0.6, 0.3, 1)
house = (U > ex[0] - 0.5) & (U < ex[2] + 0.5) & (V > ex[1] - 0.5) & (V < ex[3] + 0.5)
grass[house] = 0
for x, z, w_, d_, *_ in rocks: grass[np.hypot(X - x, Z - z) < max(w_, d_) * 0.6] = 0
Image.fromarray((np.dstack([grass, soil / 0.3, litter]).clip(0, 1) * 255 + 0.5).astype(np.uint8), 'RGB').save(f'{OUT}/splat.png')   # the shader takes 30% of green

# ------------------------------------------------------------------ the light bake
# Occluders: the ground, the tree crowns (leafy, so light thins through them) and the house (solid).
STEP = 0.25
bx, bz = np.arange(X0, X1 + 1e-6, STEP), np.arange(Z0, Z1 + 1e-6, STEP)
gH = lambda px, pz: ndimage.map_coordinates(H, [(pz - Z0), (px - X0)], order=1, mode='nearest')
NB = (len(bz), len(bx))
top, bot = np.full(NB, -1e9, np.float32), np.full(NB, 1e9, np.float32)
for x, z, h, rr, y in zip(tx, tz, th_, tr_, ty):
    if x < X0 - rr or x > X1 + rr or z < Z0 - rr or z > Z1 + rr: continue
    rv_ = min(0.45 * h, rr * 1.1); yc = y + h - rv_
    i0, i1 = max(0, int((z - rr - Z0) / STEP)), min(NB[0], int((z + rr - Z0) / STEP) + 2)
    j0, j1 = max(0, int((x - rr - X0) / STEP)), min(NB[1], int((x + rr - X0) / STEP) + 2)
    if i0 >= i1 or j0 >= j1: continue
    gx_, gz_ = np.meshgrid(bx[j0:j1], bz[i0:i1])
    q = 1 - ((gx_ - x) ** 2 + (gz_ - z) ** 2) / (rr * rr)
    m = q > 0; e = np.sqrt(np.clip(q, 0, 1)) * rv_
    top[i0:i1, j0:j1] = np.where(m, np.maximum(top[i0:i1, j0:j1], yc + e), top[i0:i1, j0:j1])
    bot[i0:i1, j0:j1] = np.where(m, np.minimum(bot[i0:i1, j0:j1], yc - e), bot[i0:i1, j0:j1])
BX, BZ = np.meshgrid(bx, bz)
bu = (BX - RES['x']) * R_[0] + (BZ - RES['z']) * R_[1]; bv = (BX - RES['x']) * F[0] + (BZ - RES['z']) * F[1]
solid = np.zeros(NB, np.float32)                                     # house tops above the pad (walls to the roof), and the boulders
for (x, z, w_, d_, h_, rot), y in zip(rocks, rock_y):
    c, s_ = math.cos(math.radians(rot)), math.sin(math.radians(rot)); lu = ((BX - x) * c + (BZ - z) * s_) / (w_ / 2); lv = (-(BX - x) * s_ + (BZ - z) * c) / (d_ / 2)
    q = 1 - lu * lu - lv * lv; solid = np.where(q > 0, np.maximum(solid, y + h_ * np.sqrt(np.clip(q, 0, 1))), solid)
for u0, v0, u1, v1, hgt in [(-12.6, -4.6, 4.2, 6.2, 3.6), (3.4, -7.0, 14.2, 3.3, 3.9)]:      # living room and wing, with their roofs
    solid[(bu > u0) & (bu < u1) & (bv > v0) & (bv < v1)] = pad + hgt
eave = np.zeros(NB, bool)                                            # under the front roofs: open to the side, roofed above
for u0, v0, u1, v1 in [(-12.6, 4.0, 4.2, 6.2), (3.4, 1.5, 14.2, 3.3)]: eave |= (bu > u0) & (bu < u1) & (bv > v0) & (bv < v1)

s3 = QW['sun']; sun = np.array(s3) / np.linalg.norm(s3)                # local x, y, z
def march(px, pz, py, d, length, step, sigma=0.55, house=True):
    """Light reaching (px, py, pz) from direction d: 0 behind ground or house, thinned through crowns."""
    T = np.ones(px.shape, np.float32)
    for t in np.arange(step, length, step):
        qx, qy, qz = px + d[0] * t, py + d[1] * t, pz + d[2] * t
        fi, fj = (qz - Z0) / STEP, (qx - X0) / STEP
        ii, jj = np.clip(fi.astype(int), 0, NB[0] - 1), np.clip(fj.astype(int), 0, NB[1] - 1)
        out = (fi < 0) | (fj < 0) | (fi >= NB[0] - 1) | (fj >= NB[1] - 1)
        g = np.where(out, height(qx, qz, 1), gH(qx, qz))
        T *= np.where(qy < g, 0, 1)
        leaf = (qy >= bot[ii, jj]) & (qy <= top[ii, jj]) & ~out
        T *= np.where(leaf, math.exp(-sigma * step), 1)
        if house: T *= np.where((qy < solid[ii, jj]) & ~out, 0, 1)
        if d[1] > 0.95: break
    return T
gy = gH(BX, BZ) + 0.05
gy = np.where(eave, pad + 0.35, gy)
print('sun shadows ...', flush=True)
Vsun = ndimage.gaussian_filter(march(BX, BZ, gy, sun, 70, 0.5), 1.4)             # soft-edged: leaves, and the sun's width
# Sky: 24 directions, weighted by the cosine to the zenith, at 1 m, then smoothed up to the 25 cm grid.
print('sky ...', flush=True)
sx, sz_ = np.arange(X0, X1 + 1e-6, 1.0), np.arange(Z0, Z1 + 1e-6, 1.0)
SX, SZ = np.meshgrid(sx, sz_); sy = gH(SX, SZ) + 0.05
acc, wsum = np.zeros(SX.shape, np.float32), 0.0
for el, k in [(12, 8), (32, 8), (58, 6), (82, 2)]:
    for i in range(k):
        az = 2 * math.pi * (i + 0.5 * (el > 20)) / k; e = math.radians(el)
        d = (math.cos(e) * math.sin(az), math.sin(e), -math.cos(e) * math.cos(az))
        wgt = math.sin(e) * math.cos(e) / k
        acc += wgt * march(SX, SZ, sy, d, 40, 1.0); wsum += wgt
Vsky = ndimage.zoom(acc / wsum, (NB[0] / SX.shape[0], NB[1] / SX.shape[1]), order=1)[:NB[0], :NB[1]]
Vsky = np.where(eave, Vsky * 0.55, Vsky)
# Light = sun on the slope x what reaches it + sky x how much of it the spot sees (open ground in the quarry bake saw ~90%).
nH = ndimage.map_coordinates(H, [(BZ - Z0), (BX - X0)], order=1)
gzb, gxb = np.gradient(nH, STEP); nrm = np.dstack([-gxb, np.ones_like(nH), -gzb]); nrm /= np.linalg.norm(nrm, axis=2, keepdims=True)
ndl = np.clip(nrm @ sun, 0, 1)
ndl = np.where(eave, sun[1], ndl)
A, Bk = np.array(QW['sunLight']), np.array(QW['ambient'])
Lt = ndl[..., None] * Vsun[..., None] * A + (Vsky / 0.9)[..., None] * Bk
Lt += 0.08 * (ndl * Vsun)[..., None] * A * np.array([1.0, 0.9, 0.7])      # a little light bounced off sunlit ground
Image.fromarray((np.clip(Lt / QW['lightScale'], 0, 1) ** (1 / 2.2) * 255 + 0.5).astype(np.uint8)).save(f'{OUT}/light.jpg', quality=90)

# ------------------------------------------------------------------ the land beyond, and the files
FX0, FZ0, FX1, FZ1 = -1400, -1660, 1000, 740
fxs, fzs = np.arange(FX0, FX1 + 1, 10.0), np.arange(FZ0, FZ1 + 1, 10.0)
FX, FZ = np.meshgrid(fxs, fzs); Hc = height(FX, FZ)
crop = Image.open(f'{DATA}/imagery.jpg').convert('RGB').crop((int((FX0 + 2000) * S * 4000 / 4000), int((FZ0 + 2000) * S), int((FX1 + 2000) * S), int((FZ1 + 2000) * S)))
crop.save(f'{OUT}/far.jpg', quality=85)
def f32(name, arr):
    json.dump(base64.b64encode(np.ascontiguousarray(arr, np.float32).tobytes()).decode(), open(f'{OUT}/{name}', 'w'))
f32('heights.json', H); f32('far.json', Hc)
f32('trees.json', np.column_stack([tx, tz, ty - 0.2, th_, sp]))
spot = lambda name, x, z, lx, lz: {'name': name, 'x': round(x, 1), 'z': round(z, 1), 'look': [round(lx, 1), round(lz, 1)]}
at = lambda u, v: (RES['x'] + R_[0] * u + F[0] * v, RES['z'] + R_[1] * u + F[1] * v)
world = {
    'title': 'The private side', 'eyebrow': 'Walk the site · Finca 2663, the private side',
    'region': [X0, Z0, X1, Z1], 'grid': [len(xs), len(zs)], 'far': [FX0, FZ0, FX1, FZ1], 'farGrid': [len(fxs), len(fzs)],
    **{k: QW[k] for k in ('sun', 'sunLight', 'ambient', 'lightScale', 'skyScale', 'spriteScale', 'sprites', 'grassAlbedo')},
    'trees': len(tx), 'residence': RES, 'rocks': [[x, z, y, w_, d_, h_, rot] for (x, z, w_, d_, h_, rot), y in zip(rocks, rock_y)],
    'parcel': [[round(x, 2), round(z, 2)] for x, z in RING],
    'spots': [spot('The homesite', *at(-1, 30), *at(-1, 0)), spot('The terrace', *at(-2, 5.4), *at(-2, 60)), {**spot('The mango tree', mx + 22, mz + 8, mx, mz), 'pitch': 0.12}],
    'credits': 'Trees, textures and sky: Poly Haven (CC0). Terrain, trees and parcel: the site data and the survey.',
}
json.dump(world, open(f'{OUT}/world.json', 'w'), indent=1)
print('pad', round(pad, 1), 'm; trees', len(tx), '; light', Lt.shape[:2], '; files',
      round(sum(os.path.getsize(f'{OUT}/{f}') for f in os.listdir(OUT)) / 1e6, 1), 'MB')
