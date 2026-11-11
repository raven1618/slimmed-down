"""Download Poly Haven assets (CC0) for the Blender renders: models as .blend with textures, textures as 2K maps, one HDRI."""
import json, os, sys, urllib.request
OUT = sys.argv[1]
UA = {'User-Agent': 'outer-heaven-render/1.0'}
def get(u): return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120)
def save(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 0: return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with get(url) as r, open(path + '.part', 'wb') as f:
        while (b := r.read(1 << 20)): f.write(b)
    os.replace(path + '.part', path)
MODELS = ['island_tree_01', 'island_tree_02', 'island_tree_03', 'tree_small_02', 'jacaranda_tree', 'shrub_01', 'shrub_03', 'fern_02', 'grass_medium_01', 'grass_medium_02']
TEXTURES = ['excavated_soil_wall', 'cracked_red_ground', 'leafy_grass', 'forest_leaves_02', 'clay_plaster', 'brown_planks_05']
HDRI = 'evening_road_01_puresky'
for m in MODELS:
    f = json.load(get(f'https://api.polyhaven.com/files/{m}'))['blend']['1k']['blend']
    d = os.path.join(OUT, 'models', m)
    save(f['url'], os.path.join(d, os.path.basename(f['url'])))
    for rel, inc in f.get('include', {}).items(): save(inc['url'], os.path.join(d, rel))
    print('model', m, flush=True)
for t in TEXTURES:
    f = json.load(get(f'https://api.polyhaven.com/files/{t}'))
    for key, name in (('Diffuse', 'diff'), ('nor_gl', 'nor'), ('Rough', 'rough')):
        save(f[key]['2k']['jpg']['url'], os.path.join(OUT, 'tex', t, f'{name}.jpg'))
    print('texture', t, flush=True)
f = json.load(get(f'https://api.polyhaven.com/files/{HDRI}'))
save(f['hdri']['4k']['hdr']['url'], os.path.join(OUT, 'hdri', HDRI + '.hdr'))
print('hdri', HDRI, 'done', flush=True)
