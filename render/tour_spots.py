"""The photoreal tour: where each 360° view stands, how high the eye is, and which way the centre of the picture
faces. Placed from the walks' own data (data/walk/, data/walk/private/), so the renders, the tour viewer and
the free roam all agree. Writes data/tour.json; render/build.py renders it.
   python render/tour_spots.py data"""
import base64, json, math, sys
import numpy as np

DATA = sys.argv[1]
def site(path):
    W = json.load(open(f'{path}/world.json'))
    H = np.frombuffer(base64.b64decode(json.load(open(f'{path}/heights.json'))), np.float32).reshape(W['grid'][1], W['grid'][0])
    x0, z0 = W['region'][:2]
    def ground(x, z):
        fx, fz = x - x0, z - z0; i, j = int(fz), int(fx); tx, tz = fx - j, fz - i
        return float(H[i, j] * (1 - tx) * (1 - tz) + H[i, j + 1] * tx * (1 - tz) + H[i + 1, j] * (1 - tx) * tz + H[i + 1, j + 1] * tx * tz)
    return W, ground
bearing = lambda x, z, tx, tz: math.degrees(math.atan2(tx - x, -(tz - z))) % 360
def frame(x, z, rot):                      # a building's own frame (js/cabin.js): u its x (on your left, facing out), v toward its front
    th = math.radians(rot); F, R = (math.sin(th), -math.cos(th)), (-math.cos(th), -math.sin(th))
    return lambda u, v: (x + R[0] * u + F[0] * v, z + R[1] * u + F[1] * v), F

spots = []
def add(site_, id_, name, x, z, y, brg, text, roam=None):      # roam: where free roam starts, for a view inside a building
    spots.append({'site': site_, 'id': id_, 'name': name, 'x': round(x, 2), 'z': round(z, 2), 'y': round(y, 2), 'bearing': round(brg % 360, 1),
                  'file': f'tour/{site_}-{id_}.jpg', 'text': text, **({'roam': [round(roam[0], 2), round(roam[1], 2)]} if roam else {})})

# ---- the quarry cabins
W, g = site(f'{DATA}/walk')
lx, lz = W['lagoon'][:2]
cab = lambda i: W['cabins'][i]                              # x, z, floor, rot, w, d
add('quarry', 'arrival', 'Arrival', 392, 834, g(392, 834) + 1.7, bearing(392, 834, 350, 892),
    'Where the track comes in: the row of cabins set into the old quarry wall, their living roofs level with the forest above.')
add('quarry', 'lagoon', 'Lagoon shore', 384.2, 860.4, g(384.2, 860.4) + 1.7, 280,
    'The natural lagoon, cleaned by plants instead of chlorine. Every cabin faces it through a front of glass, floor to ceiling.')
x, z, fl, rot = cab(3)[:4]; at, F = frame(x, z, rot)
px, pz = at(0, 5.0); add('quarry', 'deck', 'Cabin deck', px, pz, fl + 0.3 + 1.65, bearing(px, pz, lx, lz),
                         'The deck of cabin 4. The roof reaches 1.5 m past the glass with no posts: the summer sun never touches it and nothing blocks the view.')
deck = (px, pz)
px, pz = at(-1.2, -0.8); add('quarry', 'inside', 'Inside the cabin', px, pz, fl + 1.6, math.degrees(math.atan2(F[0], -F[1])),
                            'Inside cabin 4: one bedroom and a kitchen island behind the glass. 45 cm walls of local rammed earth soak up the afternoon heat and give it back at night.', deck)
x, z, fl, rot = cab(1)[:4]; at, F = frame(x, z, rot)
px, pz = at(0, 0.3); add('quarry', 'roof', 'On the living roof', px, pz, fl + 3.58 + 1.7, bearing(px, pz, lx, lz),
                         'On the living roof of cabin 2: native grasses on 20 cm of soil. It insulates and slows the rain, and from the hill the cabin disappears.')
# ---- the private side
W, g = site(f'{DATA}/walk/private')
r = W['residence']; at, F = frame(r['x'], r['z'], r['rot'])
front = math.degrees(math.atan2(F[0], -F[1]))
px, pz = at(16, 14); add('private', 'homesite', 'The homesite', px, pz, g(px, pz) + 1.7, bearing(px, pz, *at(-2, 1)),       # the corner of the pad: pool in front
                         'A homesite of about a hectare on the private side: the protected forest behind, the valley in front. Two earth volumes stepped with the slope.')
px, pz = at(-2, 5.4); add('private', 'terrace', 'The terrace', px, pz, r['floor'] + 0.3 + 1.65, front,
                          'The terrace and the 12 m pool, heated by the sun and filtered without chlorine, looking east over the valley.')
terrace = (px, pz)
px, pz = at(-4.5, 0.5); add('private', 'living', 'The living room', px, pz, r['floor'] + 1.6, front,
                          'The living room: rammed-earth walls and a glass front to the valley. Three bedrooms, about 180 m² in all; the bedroom wing sits back for privacy.', terrace)
px, pz = at(-4, 5.2); add('private', 'roof', 'On the living roof', px, pz, r['floor'] + 3.58 + 1.7, front,
                          'On the living roof: native grasses on 20 cm of soil, the terrace and the pool below, the valley beyond. From the trail above you see grass, not a house.', terrace)
mx, mz = (W['spots'][2]['look'])
px, pz = mx + 22, mz + 8; add('private', 'mango', 'The mango tree', px, pz, g(px, pz) + 1.7, bearing(px, pz, mx, mz),
                              'The old mango tree and its two granite boulders, where the trail across the hill ends.')
json.dump(spots, open(f'{DATA}/tour.json', 'w'), indent=1)
for s in spots: print(s['site'], s['id'], s['x'], s['z'], s['y'], s['bearing'])
