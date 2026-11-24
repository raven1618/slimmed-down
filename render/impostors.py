"""Tree sprites: each species photographed (rendered) from 8 directions, every 45° from the north, lit by the same sun as
the bake, on a transparent background, packed into one sheet.
   python impostors.py ASSETS OUT_DIR SIZE SAMPLES            free roam: eye level only (8 columns, a row per species)
   python impostors.py ASSETS OUT_DIR SIZE SAMPLES aerial     the hill, seen from the air: three heights (12°, 40° and 72°
                                                              above the horizon) per species, and a palm; writes
                                                              OUT_DIR/trees.webp and trees.json for js/site/hill.js"""
import glob, json, math, os, sys
import bpy
import numpy as np
from mathutils import Vector
A, OUT, PX, SPP = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
AERIAL = len(sys.argv) > 5 and sys.argv[5] == 'aerial'
SPECIES = [('island_tree_01', ['island_tree_01_LOD0']), ('island_tree_02', ['island_tree_02_LOD0']),
           ('tree_small_02', ['tree_small_02_LOD0', 'tree_small_02_trunk']), ('island_tree_03', ['island_tree_03_LOD0'])]
if AERIAL: SPECIES = SPECIES[:3] + [('palm', None)]         # from the air: no island_tree_03 (it stands on a rock); Poly Haven has no palm, built below
ELEV = [12, 40, 72] if AERIAL else [0]                       # degrees above the horizon
SUN = Vector((0.86, -0.41, 0)).normalized(); e = math.radians(30); SUN = Vector((SUN.x * math.cos(e), SUN.y * math.cos(e), math.sin(e)))

def palm(sc, H=11.0, seed=3):
    """A coconut palm: a slightly curved ringed trunk and a crown of arching fronds, each a spine with leaflets."""
    rng = np.random.default_rng(seed)
    bark = bpy.data.materials.new('bark'); bark.use_nodes = True; nt = bark.node_tree; b = nt.nodes['Principled BSDF']
    wave = nt.nodes.new('ShaderNodeTexWave'); wave.wave_type = 'BANDS'; wave.bands_direction = 'Z'; wave.inputs['Scale'].default_value = 9.0
    wave.inputs['Distortion'].default_value = 2.0; bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.6
    nt.links.new(wave.outputs['Fac'], bump.inputs['Height']); nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])
    ramp = nt.nodes.new('ShaderNodeValToRGB'); ramp.color_ramp.elements[0].color = (0.16, 0.13, 0.1, 1); ramp.color_ramp.elements[1].color = (0.42, 0.37, 0.3, 1)
    nt.links.new(wave.outputs['Fac'], ramp.inputs['Fac']); nt.links.new(ramp.outputs['Color'], b.inputs['Base Color']); b.inputs['Roughness'].default_value = 0.9
    leaf = bpy.data.materials.new('leaf'); leaf.use_nodes = True; lb = leaf.node_tree.nodes['Principled BSDF']
    lb.inputs['Base Color'].default_value = (0.09, 0.2, 0.04, 1); lb.inputs['Roughness'].default_value = 0.55
    lb.inputs['Subsurface Weight'].default_value = 0.0
    try: lb.inputs['Transmission Weight'].default_value = 0.15
    except KeyError: pass
    dead = bpy.data.materials.new('dead'); dead.use_nodes = True; db = dead.node_tree.nodes['Principled BSDF']
    db.inputs['Base Color'].default_value = (0.32, 0.22, 0.11, 1); db.inputs['Roughness'].default_value = 0.8
    # trunk: rings of 16 around a gentle curve
    V, F = [], []
    n_r, n_s = 40, 16
    for i in range(n_r + 1):
        t = i / n_r; z = H * t; off = 0.6 * t * t; r = 0.2 - 0.06 * t
        for j in range(n_s):
            a = 2 * math.pi * j / n_s; V.append((off + r * math.cos(a), r * math.sin(a), z))
    for i in range(n_r):
        for j in range(n_s): a0, a1 = i * n_s + j, i * n_s + (j + 1) % n_s; F.append((a0, a1, a1 + n_s, a0 + n_s))
    me = bpy.data.meshes.new('trunk'); me.from_pydata(V, [], F); me.update()
    tr = bpy.data.objects.new('trunk', me); tr.data.materials.append(bark); sc.collection.objects.link(tr)
    for poly in me.polygons: poly.use_smooth = True
    top = Vector((0.6, 0, H))
    LV, LF, LM = [], [], []
    def frond(az, lift, L, mat):
        d = Vector((math.cos(az), math.sin(az), 0)); side = Vector((-d.y, d.x, 0))
        pts = []
        for k in range(26):
            t = k / 25; pts.append(top + d * (L * t) + Vector((0, 0, L * (lift * t - 0.75 * t * t))))
        for k in range(2, 25):
            t = k / 25; p = pts[k]; tang = (pts[k + 1] - pts[k - 1]).normalized()
            ll = 1.0 * (1 - 0.75 * t) + 0.15
            for sgn in (-1, 1):
                out = (side * sgn * 0.8 + Vector((0, 0, -0.55)) + tang * 0.35).normalized()
                w = tang * 0.05
                base = len(LV); LV.extend([p - w, p + w, p + w + out * ll, p - w + out * ll]); LF.append((base, base + 1, base + 2, base + 3)); LM.append(mat)
    for f in range(16):
        frond(2 * math.pi * f / 16 + rng.uniform(-0.15, 0.15), rng.uniform(0.15, 0.75), rng.uniform(3.6, 4.6), 0)
    for f in range(4):
        frond(2 * math.pi * f / 4 + 0.4, -0.9, 2.6, 1)                                         # dead fronds hanging under the crown
    me = bpy.data.meshes.new('fronds'); me.from_pydata(LV, [], LF); me.update()
    fr = bpy.data.objects.new('fronds', me); fr.data.materials.append(leaf); fr.data.materials.append(dead); sc.collection.objects.link(fr)
    for poly, m_ in zip(me.polygons, LM): poly.material_index = m_
    return [tr, fr]

os.makedirs(OUT, exist_ok=True)
sheet = np.zeros((PX * len(SPECIES) * len(ELEV), PX * 8, 4), np.float32)
meta = []
for row, (model, names) in enumerate(SPECIES):
    bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
    if names is None: objs = palm(sc)
    else:
        with bpy.data.libraries.load(glob.glob(f'{A}/models/{model}/*.blend')[0], link=False) as (src, dst): dst.objects = [n for n in src.objects if n in names]
        objs = [o for o in dst.objects if o]
        for o in objs: sc.collection.objects.link(o)
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    H = max(p.z for p in pts); Rr = max(math.hypot(p.x, p.y) for p in pts)
    S = max(H, 2 * Rr) * 1.04
    if AERIAL:                                                    # framed tightly on the tree as seen from every height and side
        P = np.concatenate([np.array([o.matrix_world @ v.co for v in o.data.vertices]) for o in objs if o.type == 'MESH']) - np.array([0, 0, H / 2])
        ext = 0
        for el in ELEV:
            for k in range(8):
                b, c = math.radians(k * 45), math.radians(el)
                d = np.array([math.sin(b) * math.cos(c), math.cos(b) * math.cos(c), math.sin(c)])
                rt = np.cross(d, [0, 0, 1]); rt /= np.linalg.norm(rt); up = np.cross(rt, d)
                ext = max(ext, np.abs(P @ rt).max(), np.abs(P @ up).max())
        S = 2 * ext * 1.03
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sc.collection.objects.link(sun)
    sun.rotation_euler = (-SUN).to_track_quat('-Z', 'Y').to_euler(); sun.data.energy = 7.5; sun.data.color = (1.0, 0.72, 0.48)
    sc.world = bpy.data.worlds.new('w'); sc.world.use_nodes = True
    bg = sc.world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (0.55, 0.65, 0.8, 1); bg.inputs['Strength'].default_value = 0.7
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = S
    sc.render.engine = 'CYCLES'; sc.cycles.samples = SPP; sc.cycles.use_denoising = True; sc.cycles.transparent_max_bounces = 24
    sc.render.film_transparent = True; sc.render.resolution_x = sc.render.resolution_y = PX
    sc.view_settings.view_transform = 'Standard'                 # linear light: the web tone-maps it with everything else
    sc.render.image_settings.file_format = 'OPEN_EXR'; sc.render.image_settings.color_depth = '16'
    for ei, el in enumerate(ELEV):
      r_ = row * len(ELEV) + ei
      for k in range(8):
        b, c = math.radians(k * 45), math.radians(el)             # the viewer stands at this bearing from the tree, this high
        d = Vector((math.sin(b) * math.cos(c), math.cos(b) * math.cos(c), math.sin(c)))
        cam.location = Vector((0, 0, H / 2)) + d * (S * 3); cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
        path = os.path.join(OUT, f'_{model}_{ei}_{k}.exr'); sc.render.filepath = path
        bpy.ops.render.render(write_still=True)
        im = bpy.data.images.load(path); a = np.empty(PX * PX * 4, np.float32); im.pixels.foreach_get(a)
        sheet[r_ * PX:(r_ + 1) * PX, k * PX:(k + 1) * PX] = a.reshape(PX, PX, 4)[::-1]          # top row first
        bpy.data.images.remove(im); os.remove(path)
    cell = sheet[row * len(ELEV) * PX:(row + 1) * len(ELEV) * PX]; m_ = cell[..., 3] > 0.5
    mean = (cell[..., :3][m_] / cell[..., 3:][m_]).mean(0) if m_.any() else np.ones(3)
    meta.append({'model': model, 'frame': S / H, 'base': 0.5 - H / (2 * S), 'height': H, 'radius': Rr, 'mean': [round(float(v), 4) for v in mean]})
    print(model, 'height', round(H, 2), 'frame', round(S / H, 3), flush=True)
if not AERIAL:
    np.save(os.path.join(OUT, 'trees_sheet.npy'), sheet.astype(np.float16))
    json.dump({'views': 8, 'species': meta}, open(os.path.join(OUT, 'trees.json'), 'w'))
else:
    # As free roam's sheet: colour = (light / 1.6) ^ (1 / 2.2), straight alpha. Colours are spread into the clear
    # pixels around each crown, so smaller mipmaps do not darken the edges.
    from PIL import Image
    rgb, al = sheet[..., :3] / np.maximum(sheet[..., 3:], 1e-4), sheet[..., 3]
    have = al > 0.02
    for _ in range(12):
        acc, cnt = np.zeros_like(rgb), np.zeros(al.shape, np.float32)
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            m = np.roll(have, (dy, dx), (0, 1)); acc += np.roll(rgb, (dy, dx), (0, 1)) * m[..., None]; cnt += m
        fill = ~have & (cnt > 0); rgb[fill] = acc[fill] / cnt[fill][:, None]; have |= fill
    enc = np.clip(np.clip(rgb, 0, None) / 1.6, 0, 1) ** (1 / 2.2)
    Image.fromarray((np.dstack([enc, al.clip(0, 1)]) * 255 + 0.5).astype(np.uint8)).save(os.path.join(OUT, 'trees.webp'), quality=88, method=6)
    json.dump({'views': 8, 'elevations': ELEV, 'scale': 1.6, 'species': meta}, open(os.path.join(OUT, 'trees.json'), 'w'), indent=1)
print('sprites done', flush=True)
