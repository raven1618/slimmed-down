"""Turn the site data into arrays for the Blender scene: a 1 m terrain around the quarry cabins and the homestead west
of them (with the cut, the lagoon bowl and the homestead's pond), a coarse 10 m terrain for the distance, ground-type
weights from the site photo, trees, cabins."""
import base64, json, math, struct, sys
import numpy as np
from PIL import Image
from scipy import ndimage

DATA, OUT = sys.argv[1], sys.argv[2]
ter = json.load(open(f'{DATA}/terrain.json'))
n, res = ter['grid'], ter['res']
dem = ter['base'] + np.frombuffer(base64.b64decode(ter['data']), dtype='<u2').reshape(n, n).astype(np.float64) / ter['scale']
HALF = (n - 1) * res / 2
def height(x, z, order=3):
    return ndimage.map_coordinates(dem, [(np.asarray(z) + HALF) / res, (np.asarray(x) + HALF) / res], order=order, mode='nearest')

# Detail region, 1 m.
DX0, DX1, DZ0, DZ1 = 150, 560, 660, 1060           # from the homestead (x 215-250) to past the quarry row
xs, zs = np.arange(DX0, DX1 + 1, 1.0), np.arange(DZ0, DZ1 + 1, 1.0)
X, Z = np.meshgrid(xs, zs)
Hd = height(X, Z)

# The quarry cut, as in the web model: lowered inside its ring, steep along the wall.
def seg_dist(px, pz, ax, az, bx, bz):
    dx, dz = bx - ax, bz - az
    t = np.clip(((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz + 1e-9), 0, 1)
    return np.hypot(px - ax - t * dx, pz - az - t * dz)
def in_poly(px, pz, ring):
    inside = np.zeros(px.shape, bool)
    for i in range(len(ring)):
        (ax, az), (bx, bz) = ring[i], ring[(i + 1) % len(ring)]
        cross = ((az > pz) != (bz > pz)) & (px < (bx - ax) * (pz - az) / (bz - az + 1e-12) + ax)
        inside ^= cross
    return inside
objects = json.load(open(f'{DATA}/objects.json'))['objects']
cut = next(o for o in objects if o.get('type') == 'cut')
ring, wall = cut['ring'], cut['wall']
same = lambda a, b: abs(a[0] - b[0]) < 0.05 and abs(a[1] - b[1]) < 0.05
walls, other = [], []
for i, a in enumerate(ring):
    b = ring[(i + 1) % len(ring)]
    isw = any(same(w, a) and same(wall[j + 1], b) or same(w, b) and same(wall[j + 1], a) for j, w in enumerate(wall[:-1]))
    (walls if isw else other).append((*a, *b))
inside = in_poly(X, Z, ring)
dw = np.min([seg_dist(X, Z, *s) for s in walls], axis=0)
de = np.min([seg_dist(X, Z, *s) for s in other], axis=0)
cutd = np.where(inside, cut['depth'] * np.clip(1 - dw / cut['reach'], 0, 1) * np.clip(de / 8, 0, 1), 0)
Hd -= cutd

# The homestead's pond, dug into the slope (data/objects.json): the water 0.7 m under the lowest point of its rim, as on
# the hill, and banks that slope down to it. The shore is rounded as on the hill (Chaikin).
def round_ring(r, n=3):
    for _ in range(n):
        r = [p for i, (a, b) in enumerate(zip(r, r[1:] + r[:1])) for p in ((0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]), (0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]))]
    return r
pond = next((o for o in objects if o.get('type') == 'pond'), None)
pond_ring, pond_level = [], 0.0
if pond:
    pond_ring = round_ring([tuple(p) for p in pond['ring']])
    pr = np.array(pond_ring); pond_level = float(height(pr[:, 0], pr[:, 1], 1).min()) - 0.7
    pin = in_poly(X, Z, pond_ring)
    pdist = np.min([seg_dist(X, Z, *a, *b) for a, b in zip(pond_ring, pond_ring[1:] + pond_ring[:1])], axis=0)
    Hd = np.where(pin, np.minimum(Hd, pond_level - 0.15 - np.minimum(pdist * 0.45, 1.2)), Hd)
    rim = ~pin & (pdist < 2.5)                                  # the cut bank: from the ground down to the water's edge
    Hd = np.where(rim, np.minimum(Hd, pond_level + 0.1 + pdist * 0.9), Hd)

# Cabins and the lagoon, from the owner's notes.
notes = json.load(open(sys.argv[3]))
loc = lambda E, N: (E - 487570.0, -(N - 7200720.0))
cabins, lagoon = [], None
for w in notes:
    d = w['data']; x, z = loc(d['E'], d['N'])
    if d['kind'] == 'cabin': cabins.append((x, z, d['rot'], d['w'], d['d']))
    elif d['kind'] == 'pond': lagoon = (x, z, d['rot'], d['w'], d['d'])
lx, lz, lrot, lw, ld = lagoon
b = math.radians(lrot); fx, fz = math.sin(b), -math.cos(b)     # along the long side (bearing)
u = (X - lx) * fx + (Z - lz) * fz; v = (X - lx) * -fz + (Z - lz) * fx
q = (u / (ld / 2)) ** 2 + (v / (lw / 2)) ** 2
water = float(np.median(Hd[q < 1])) - 0.35
Hd = np.where(q < 0.98, np.minimum(Hd, water - 1.4 * np.clip(1.0 - q, 0.03, 1)), Hd)
Hd = np.where((q >= 0.98) & (q < 1.6), np.maximum(Hd, water + 0.1 + 0.25 * np.clip((1.6 - q) / 0.6, 0, 1) * np.clip((q - 0.98) / 0.1, 0, 1)), Hd)   # a low berm all round
cab = []
for x, z, rot, w, dd in cabins:
    floor = float(height(np.array([x]), np.array([z]), 1)[0] - ndimage.map_coordinates(cutd, [[z - DZ0], [x - DX0]], order=1)[0])
    cab.append((x, z, floor, rot, w, dd))

# Ground types from the site photo (sharper) or the satellite image: grass, bare red earth, leaf litter.
site = json.load(open(f'{DATA}/sites.json'))['patches'][0]
photo = np.asarray(Image.open(f'{DATA}/{site["file"]}').convert('RGBA')).astype(np.float32) / 255
img = np.asarray(Image.open(f'{DATA}/imagery.jpg').convert('RGB')).astype(np.float32) / 255
def colour(x, z):
    ni = img.shape[0]
    c = np.stack([ndimage.map_coordinates(img[..., k], [(z + HALF) / (2 * HALF) * ni - 0.5, (x + HALF) / (2 * HALF) * ni - 0.5], order=1) for k in range(3)], -1)
    pr = (site['x1'] - site['x0']) / photo.shape[1]
    pu, pv = (x - site['x0']) / pr - 0.5, (z - site['z0']) / pr - 0.5
    p = np.stack([ndimage.map_coordinates(photo[..., k], [pv, pu], order=1, mode='constant') for k in range(4)], -1)
    return c * (1 - p[..., 3:]) + p[..., :3] * p[..., 3:]
C = colour(X, Z)
l = C.mean(-1)
wg = np.clip((C[..., 1] - np.maximum(C[..., 0], C[..., 2])) * 14 + 0.25, 0, 1)
ws = np.clip((C[..., 0] - C[..., 1]) * 9 + (l - 0.35) * 2, 0, 1)
wl = np.clip((0.16 - l) * 9, 0, 1) * wg; wg *= 1 - wl
ws = np.maximum(ws, np.clip(cutd / 1.5, 0, 1))          # the quarry floor is bare
s = wg + ws + wl + 1e-3
splat = np.stack([wg / s, ws / s, wl / s], -1)
splat = ndimage.gaussian_filter(splat, (1.2, 1.2, 0))
Image.fromarray((splat[::-1] * 255).astype(np.uint8)).save(f'{OUT}/splat.png')   # row 0 = north edge = top of image

# Camera: north-east of the row, looking south-west along the cabins with the lagoon in the middle distance.
cam = np.array([424.0, 0, 792.0]); cam[1] = height(cam[[0]], cam[[2]], 1)[0] + 7.5
tgt = np.array([350.0, 0, 902.0]); tgt[1] = height(tgt[[0]], tgt[[2]], 1)[0] - 1.0
# Grass within reach of every viewpoint: the hero camera, and the 360° views from the lagoon shore and a cabin deck.
near = np.max([np.clip(1 - (np.hypot(X - vx, Z - vz) - 110) / 50, 0, 1) for vx, vz in ((390, 836), (384, 860), (353, 868), (249, 760), (246, 744))], axis=0)   # the last two: the homestead
grass = np.clip(1 - splat[..., 2] * 1.5, 0, 1) * near
grass *= np.clip(q - 1.2, 0, 1)                                    # none in the water or on the quarry floor
if pond: grass *= ~in_poly(X, Z, pond_ring)
for o in objects:                                               # none through the homestead's floors, porch and drive
    if o.get('type') in ('house', 'solar', 'cabin', 'quincho', 'tent', 'trampoline', 'oven'): grass *= np.clip((np.hypot(X - o['x'], Z - o['z']) - 6) / 2, 0, 1)
    elif o.get('type') == 'gravel':
        for a_, b_ in zip(o['path'], o['path'][1:]): grass *= np.clip((seg_dist(X, Z, *a_, *b_) - o.get('w', 3) / 2) / 1.5, 0, 1)
for x, z, *_ in cab: grass *= np.clip((np.hypot(X - x, Z - z) - 10) / 3, 0, 1)      # clear under the cabins and their decks

# Coarse terrain for the distance, 10 m, over 2.4 km around the shot.
CX0, CX1, CZ0, CZ1 = -800, 1600, -400, 2000
cxs, czs = np.arange(CX0, CX1 + 1, 10.0), np.arange(CZ0, CZ1 + 1, 10.0)
CXg, CZg = np.meshgrid(cxs, czs)
Hc = height(CXg, CZg, 1)
under = (CXg > DX0 + 5) & (CXg < DX1 - 5) & (CZg > DZ0 + 5) & (CZg < DZ1 - 5)
Hc[under] -= 3.0                                                                     # tucked under the detail terrain
ni = img.shape[0]
crop = img[int((CZ0 + HALF) / (2 * HALF) * ni):int((CZ1 + HALF) / (2 * HALF) * ni), int((CX0 + HALF) / (2 * HALF) * ni):int((CX1 + HALF) / (2 * HALF) * ni)]
Image.fromarray((crop * 255).astype(np.uint8)).save(f'{OUT}/far.png')

# Trees from the canopy model, kept off the quarry floor, the cabins, the lagoon and the camera.
raw = base64.b64decode(json.load(open(f'{DATA}/trees.json'))['data'])
T = np.array(struct.unpack('<' + 'hhBB' * (len(raw) // 6), raw), dtype=np.float64).reshape(-1, 4) / 10
T = T[(T[:, 0] > CX0) & (T[:, 0] < CX1) & (T[:, 1] > CZ0) & (T[:, 1] < CZ1) & (T[:, 2] >= 2.5)]
ok = np.ones(len(T), bool)
ok &= ~(in_poly(T[:, 0], T[:, 1], ring) & (T[:, 2] < 99))
for x, z, *_ in cab: ok &= np.hypot(T[:, 0] - x, T[:, 1] - z) > 9
ok &= np.hypot(T[:, 0] - lx, T[:, 1] - lz) > ld / 2 + 4
ok &= np.hypot(T[:, 0] - cam[0], T[:, 1] - cam[2]) > 15
FOOT = {'house': 7, 'solar': 8, 'cabin': 5, 'quincho': 6, 'tent': 3.5, 'trampoline': 3, 'oven': 2, 'mast': 2, 'palm': 1.5}
for o in objects:                                               # the homestead's ground is kept clear, as on the hill
    if o.get('type') in FOOT: ok &= np.hypot(T[:, 0] - o['x'], T[:, 1] - o['z']) > FOOT[o['type']]
    elif o.get('type') == 'gravel':
        for a, b in zip(o['path'], o['path'][1:]): ok &= seg_dist(T[:, 0], T[:, 1], *a, *b) > o.get('w', 3) / 2 + 1.5
if pond: ok &= ~in_poly(T[:, 0], T[:, 1], pond_ring) & (np.min([seg_dist(T[:, 0], T[:, 1], *a, *b) for a, b in zip(pond_ring, pond_ring[1:] + pond_ring[:1])], axis=0) > 3)
T = T[ok]
# The homestead stands in a clearing in thick forest (the owner's drone photos), but the canopy model has none of the
# trees at the clearing's edge. Where the site photo shows dark canopy within 90 m of the house, trees are added.
house = next((o for o in objects if o.get('type') == 'house'), None)
if house:
    r_ = np.random.default_rng(5); add = []
    for x in np.arange(house['x'] - 90, house['x'] + 90, 3.5):
        for z in np.arange(house['z'] - 90, house['z'] + 90, 3.5):
            x_, z_ = x + r_.uniform(-1.5, 1.5), z + r_.uniform(-1.5, 1.5)
            if not (DX0 < x_ < DX1 - 1 and DZ0 < z_ < DZ1 - 1) or math.hypot(x_ - house['x'], z_ - house['z']) > 90: continue
            c_ = C[int(z_ - DZ0), int(x_ - DX0)]
            if not (c_[1] - max(c_[0], c_[2]) > 0.06 and c_.mean() < 0.4): continue      # not forest canopy in the photo (green and dark)
            if any(math.hypot(x_ - o['x'], z_ - o['z']) < FOOT[o['type']] + 4 for o in objects if o.get('type') in FOOT): continue
            if any(seg_dist(np.array(x_), np.array(z_), *a, *b) < o.get('w', 3) / 2 + 3 for o in objects if o.get('type') == 'gravel' for a, b in zip(o['path'], o['path'][1:])): continue
            if pond and (in_poly(np.array([x_]), np.array([z_]), pond_ring)[0] or min(math.hypot(x_ - p[0], z_ - p[1]) for p in pond_ring) < 5): continue
            if len(T) and np.hypot(T[:, 0] - x_, T[:, 1] - z_).min() < 3: continue
            add.append((x_, z_, r_.uniform(9, 15), r_.uniform(3, 5)))
    if add: T = np.vstack([T, np.column_stack([np.array(add)[:, 0], np.array(add)[:, 1], np.array(add)[:, 2], np.array(add)[:, 3]])])
    # The canopy model's own trees there are 3 to 8 m; the photos show a forest of 10 to 15 m.
    ix = np.clip((T[:, 0] - DX0).astype(int), 0, X.shape[1] - 1); iz = np.clip((T[:, 1] - DZ0).astype(int), 0, X.shape[0] - 1)
    cc = C[iz, ix]; forest = (np.hypot(T[:, 0] - house['x'], T[:, 1] - house['z']) < 120) & (cc[:, 1] - np.maximum(cc[:, 0], cc[:, 2]) > 0.06) & (cc.mean(-1) < 0.4)
    T[forest, 2] = np.maximum(T[forest, 2], r_.uniform(9, 14, forest.sum())); T[forest, 3] = np.maximum(T[forest, 3], 3.0)
    print('trees added at the homestead clearing edge:', len(add))
ty = height(T[:, 0], T[:, 1], 1)
dmask = (T[:, 0] > DX0) & (T[:, 0] < DX1) & (T[:, 1] > DZ0) & (T[:, 1] < DZ1)
ty[dmask] -= ndimage.map_coordinates(cutd, [T[dmask, 1] - DZ0, T[dmask, 0] - DX0], order=1)
np.savez_compressed(f'{OUT}/site.npz', Hd=Hd.astype(np.float32), dorig=np.array([DX0, DZ0]), Hc=Hc.astype(np.float32), corig=np.array([CX0, CZ0, CX1, CZ1]),
                    grass=grass.astype(np.float32), trees=np.column_stack([T[:, 0], T[:, 1], ty, T[:, 2], T[:, 3]]).astype(np.float32),
                    cabins=np.array(cab, np.float32), lagoon=np.array([lx, lz, water, lrot, lw, ld], np.float32), cam=cam, tgt=tgt,
                    pond=np.array(pond_ring, np.float32), pond_level=np.float32(pond_level),
                    palms=np.array([[o['x'], o['z'], o.get('h', 12)] for o in objects if o.get('type') == 'palm'], np.float32))
print('detail', Hd.shape, 'coarse', Hc.shape, 'trees', len(T), 'cabins', len(cab), 'water', round(water, 2), 'cam', cam.round(1))
