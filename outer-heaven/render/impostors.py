"""Tree sprites for the walkable web world: each species seen from 8 directions (every 45°, starting from the north),
lit by the same sun as the bake, on a transparent background, packed into one sheet (8 columns, one row per species).
   python impostors.py ASSETS OUT_DIR SIZE SAMPLES"""
import glob, json, math, os, sys
import bpy
import numpy as np
from mathutils import Vector
A, OUT, PX, SPP = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
SPECIES = [('island_tree_01', ['island_tree_01_LOD0']), ('island_tree_02', ['island_tree_02_LOD0']),
           ('tree_small_02', ['tree_small_02_LOD0', 'tree_small_02_trunk']), ('island_tree_03', ['island_tree_03_LOD0'])]
SUN = Vector((0.86, -0.41, 0)).normalized(); e = math.radians(30); SUN = Vector((SUN.x * math.cos(e), SUN.y * math.cos(e), math.sin(e)))
os.makedirs(OUT, exist_ok=True)
sheet = np.zeros((PX * len(SPECIES), PX * 8, 4), np.float32)
meta = []
for row, (model, names) in enumerate(SPECIES):
    bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
    with bpy.data.libraries.load(glob.glob(f'{A}/models/{model}/*.blend')[0], link=False) as (src, dst): dst.objects = [n for n in src.objects if n in names]
    objs = [o for o in dst.objects if o]
    for o in objs: sc.collection.objects.link(o)
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    H = max(p.z for p in pts); Rr = max(math.hypot(p.x, p.y) for p in pts)
    S = max(H, 2 * Rr) * 1.04
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
    for k in range(8):
        b = math.radians(k * 45)                                  # the viewer stands at this bearing from the tree
        d = Vector((math.sin(b), math.cos(b), 0))
        cam.location = Vector((0, 0, H / 2)) + d * (S * 3); cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
        path = os.path.join(OUT, f'_{model}_{k}.exr'); sc.render.filepath = path
        bpy.ops.render.render(write_still=True)
        im = bpy.data.images.load(path); a = np.empty(PX * PX * 4, np.float32); im.pixels.foreach_get(a)
        sheet[row * PX:(row + 1) * PX, k * PX:(k + 1) * PX] = a.reshape(PX, PX, 4)[::-1]          # top row first
        bpy.data.images.remove(im); os.remove(path)
    meta.append({'model': model, 'frame': S / H, 'base': 0.5 - H / (2 * S)})
    print(model, 'height', round(H, 2), 'frame', round(S / H, 3), flush=True)
np.save(os.path.join(OUT, 'trees_sheet.npy'), sheet.astype(np.float16))
json.dump({'views': 8, 'species': meta}, open(os.path.join(OUT, 'trees.json'), 'w'))
print('sprites done', flush=True)
