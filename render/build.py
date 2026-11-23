"""The site at sunrise, from the site data and Poly Haven assets, rendered with Cycles: the quarry cabins (render/prep.py)
or the private side (render/private_site.py ... WORK).
   python build.py ASSETS SITE_DIR OUT.png WIDTH HEIGHT SAMPLES [VIEW]
   python build.py ASSETS SITE_DIR OUT_DIR 4096 2048 SAMPLES tour MODELS_DIR TOUR_JSON
The tour renders every 360° view of data/tour.json for this site into OUT_DIR, with the buildings exported from the
web (render/export_models.cjs) so the renders show exactly what you walk around."""
import glob, math, sys, time
import numpy as np
import bpy
from mathutils import Matrix, Vector

A, SITE, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
W, H, SPP = int(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6])
VIEW = sys.argv[7] if len(sys.argv) > 7 else 'hero'      # hero, a 360° panorama (lagoon, deck), the tour, or for the web world: bake, sky
MODELS = sys.argv[8] if len(sys.argv) > 8 else None      # cabin.glb and residence.glb from render/export_models.cjs
TOUR = sys.argv[9] if len(sys.argv) > 9 else None
# 360° viewpoints, local metres; eye height above the ground (or the deck); bearing at the centre of the panorama.
PANOS = {'lagoon': ((384.2, 860.4), 1.7, 280), 'deck': None}                  # the deck view is placed from cabin 4 below
t0 = time.time()
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
D = np.load(f'{SITE}/site.npz')
QUARRY = 'lagoon' in D.files                                 # else the private side
import json
SPOTS = [p for p in json.load(open(TOUR)) if p['site'] == ('quarry' if QUARRY else 'private')] if TOUR else []
bl = lambda x, z, y: (float(x), float(-z), float(y))           # local (x east, z south, y up) to Blender (X east, Y north, Z up)

# ---------------------------------------------------------------- helpers
def grid_mesh(name, Hs, x0, z0, step, uv_rect=None, flip_v=False):
    nz, nx = Hs.shape
    xs, zs = x0 + np.arange(nx) * step, z0 + np.arange(nz) * step
    X, Z = np.meshgrid(xs, zs)
    co = np.column_stack([X.ravel(), -Z.ravel(), Hs.ravel()]).astype(np.float32)
    i = (np.arange(nz - 1)[:, None] * nx + np.arange(nx - 1)[None, :]).ravel()
    quads = np.column_stack([i, i + nx, i + nx + 1, i + 1]).astype(np.int32)
    me = bpy.data.meshes.new(name)
    me.vertices.add(len(co)); me.vertices.foreach_set('co', co.ravel())
    me.loops.add(quads.size); me.loops.foreach_set('vertex_index', quads.ravel())
    me.polygons.add(len(quads)); me.polygons.foreach_set('loop_start', np.arange(0, quads.size, 4, dtype=np.int32)); me.polygons.foreach_set('loop_total', np.full(len(quads), 4, np.int32))
    me.update(); me.validate()
    if uv_rect:
        ux0, uz0, ux1, uz1 = uv_rect
        u = (X.ravel() - ux0) / (ux1 - ux0); v = (Z.ravel() - uz0) / (uz1 - uz0)
        if flip_v: v = 1 - v
        vuv = np.column_stack([u, v]).astype(np.float32)
        lay = me.uv_layers.new(name='UVMap'); lay.data.foreach_set('uv', vuv[quads.ravel()].ravel())
    me.polygons.foreach_set('use_smooth', np.ones(len(quads), bool))
    ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob)
    return ob

def mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; return m, nt, nt.nodes, nt.links, nt.nodes['Principled BSDF']

def pbr(nt, tex, scale, coord, blend=0.25):
    """Box-projected PBR set: returns (colour, roughness, normal colour) sockets."""
    N, L = nt.nodes, nt.links
    mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1 / scale,) * 3; L.new(coord, mp.inputs['Vector'])
    out = []
    for k, cs in (('diff', 'sRGB'), ('rough', 'Non-Color'), ('nor', 'Non-Color')):
        im = N.new('ShaderNodeTexImage'); im.image = bpy.data.images.load(f'{A}/tex/{tex}/{k}.jpg', check_existing=True)
        im.image.colorspace_settings.name = cs; im.projection = 'BOX'; im.projection_blend = blend
        L.new(mp.outputs['Vector'], im.inputs['Vector']); out.append(im.outputs['Color'])
    return out

def mix(nt, a, b, fac, kind='MIX'):
    m = nt.nodes.new('ShaderNodeMix'); m.data_type = 'RGBA'; m.blend_type = kind
    nt.links.new(fac, m.inputs['Factor']); nt.links.new(a, m.inputs[6]); nt.links.new(b, m.inputs[7])
    return m.outputs[2]

def load_parts(model, pick):
    f = glob.glob(f'{A}/models/{model}/*.blend')[0]
    with bpy.data.libraries.load(f, link=False) as (src, dst): dst.objects = [n for n in src.objects if pick(n)]
    return [o for o in dst.objects if o is not None and o.type == 'MESH']

def library(name, parts_by_child):
    lib = bpy.data.collections.new(name)
    for child, parts in parts_by_child:
        c = bpy.data.collections.new(child); lib.children.link(c)
        for o in parts: c.objects.link(o)
    return lib

def scatter_tree(name, lib, density_attr=None, density=0.0, scale_attr=None, scale_rand=(1, 1), index_attr=None, keep_mesh=True):
    ng = bpy.data.node_groups.new(name, 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    N, L = ng.nodes, ng.links
    gi, go = N.new('NodeGroupInput'), N.new('NodeGroupOutput')
    pts = gi.outputs[0]
    if density_attr:
        dist = N.new('GeometryNodeDistributePointsOnFaces'); dist.distribute_method = 'RANDOM'
        at = N.new('GeometryNodeInputNamedAttribute'); at.data_type = 'FLOAT'; at.inputs['Name'].default_value = density_attr
        mu = N.new('ShaderNodeMath'); mu.operation = 'MULTIPLY'; mu.inputs[1].default_value = density
        L.new(at.outputs['Attribute'], mu.inputs[0]); L.new(mu.outputs[0], dist.inputs['Density']); L.new(gi.outputs[0], dist.inputs['Mesh'])
        pts = dist.outputs['Points']
    ci = N.new('GeometryNodeCollectionInfo'); ci.inputs['Collection'].default_value = lib
    ci.inputs['Separate Children'].default_value = True; ci.inputs['Reset Children'].default_value = True
    io = N.new('GeometryNodeInstanceOnPoints'); io.inputs['Pick Instance'].default_value = True
    L.new(pts, io.inputs['Points']); L.new(ci.outputs[0], io.inputs['Instance'])
    if index_attr:
        ia = N.new('GeometryNodeInputNamedAttribute'); ia.data_type = 'INT'; ia.inputs['Name'].default_value = index_attr
        L.new(ia.outputs['Attribute'], io.inputs['Instance Index'])
    rr = N.new('FunctionNodeRandomValue'); rr.data_type = 'FLOAT_VECTOR'
    sock(rr.inputs, 'Min', 'VECTOR').default_value = (0, 0, 0); sock(rr.inputs, 'Max', 'VECTOR').default_value = (0, 0, 6.283)
    try:
        e2r = N.new('FunctionNodeEulerToRotation'); L.new(sock(rr.outputs, None, 'VECTOR'), e2r.inputs[0]); L.new(e2r.outputs[0], io.inputs['Rotation'])
    except Exception:
        L.new(sock(rr.outputs, None, 'VECTOR'), io.inputs['Rotation'])
    if scale_attr:
        sa = N.new('GeometryNodeInputNamedAttribute'); sa.data_type = 'FLOAT'; sa.inputs['Name'].default_value = scale_attr
        L.new(sa.outputs['Attribute'], io.inputs['Scale'])
    else:
        rs = N.new('FunctionNodeRandomValue'); rs.data_type = 'FLOAT'
        sock(rs.inputs, 'Min', 'VALUE').default_value, sock(rs.inputs, 'Max', 'VALUE').default_value = scale_rand
        L.new(sock(rs.outputs, None, 'VALUE'), io.inputs['Scale'])
    if keep_mesh:
        j = N.new('GeometryNodeJoinGeometry'); L.new(io.outputs[0], j.inputs[0]); L.new(gi.outputs[0], j.inputs[0]); L.new(j.outputs[0], go.inputs[0])
    else:
        L.new(io.outputs[0], go.inputs[0])
    return ng

def sock(socks, name, typ): return next(x for x in socks if (name is None or x.name == name) and x.type == typ)

def add_attr(ob, name, kind, values):
    a = ob.data.attributes.new(name, kind, 'POINT'); a.data.foreach_set('value', np.asarray(values).ravel())

# ---------------------------------------------------------------- terrain
dx0, dz0 = D['dorig']; Hd = D['Hd']
nz, nx = Hd.shape
Hg, GRASS, step = Hd, D['grass'].copy(), 1.0
if MODELS:
    # The buildings from the web stand on this ground: at 0.5 m, so it can be cut cleanly under their floors and
    # decks (at 1 m, slopes into the quarry wall came up through the cabin floors), and no grass grows inside them.
    def up2(a):
        b = np.empty((2 * a.shape[0] - 1, 2 * a.shape[1] - 1), np.float32)
        b[::2, ::2] = a; b[1::2, ::2] = (a[:-1] + a[1:]) / 2; b[::2, 1::2] = (a[:, :-1] + a[:, 1:]) / 2
        b[1::2, 1::2] = (a[:-1, :-1] + a[1:, :-1] + a[:-1, 1:] + a[1:, 1:]) / 4
        return b
    Hg, GRASS, step = up2(Hd), up2(GRASS), 0.5
    gz, gx = np.mgrid[0:Hg.shape[0], 0:Hg.shape[1]] * step; gx = gx + float(dx0); gz = gz + float(dz0)
    def footprint(x, z, rot, u0, v0, u1, v1, m):       # a rectangle in a building's own frame (js/cabin.js): u its x, v toward its front
        th = math.radians(rot); u = -(gx - x) * math.cos(th) - (gz - z) * math.sin(th); v = (gx - x) * math.sin(th) - (gz - z) * math.cos(th)
        return (u > u0 - m) & (u < u1 + m) & (v > v0 - m) & (v < v1 + m)
    def cut(sel, top): Hg[sel] = np.minimum(Hg[sel], top)
    for x, z, floor, rot, w, d in D['cabins']:           # js/cabin.js CABIN: front 3.25, deck to 6.25
        cut(footprint(x, z, rot, -w / 2, -d / 2, w / 2, 3.25, 0.6), floor - 0.05); cut(footprint(x, z, rot, -w / 2, 3.25, w / 2, 6.25, 0), floor - 0.05)
        GRASS[footprint(x, z, rot, -w / 2, -d / 2, w / 2, 6.25, 1.0)] = 0
    if 'residence' in D.files:                           # RESIDENCE.extent: rooms, decks, the pool
        rx, rz, rfl, rrot = D['residence']
        cut(footprint(rx, rz, rrot, -15, -9, 16, 13, 0.6), rfl - 0.05); GRASS[footprint(rx, rz, rrot, -15, -9, 16, 13, 1.0)] = 0
ground = grid_mesh('ground', Hg, dx0, dz0, step, uv_rect=(dx0, dz0, dx0 + nx - 1, dz0 + nz - 1))
add_attr(ground, 'grass', 'FLOAT', GRASS)
m, nt, N, L, bs = mat('ground')
tc = N.new('ShaderNodeTexCoord'); coord = tc.outputs['Object']
splat = N.new('ShaderNodeTexImage'); splat.image = bpy.data.images.load(f'{SITE}/splat.png'); splat.image.colorspace_settings.name = 'Non-Color'
uvn = N.new('ShaderNodeUVMap'); uvn.uv_map = 'UVMap'; L.new(uvn.outputs['UV'], splat.inputs['Vector'])
sep = N.new('ShaderNodeSeparateColor'); L.new(splat.outputs['Color'], sep.inputs['Color'])
nz_ = N.new('ShaderNodeTexNoise'); nz_.inputs['Scale'].default_value = 0.35; L.new(coord, nz_.inputs['Vector'])
def breakup(w, k=0.55):
    a = N.new('ShaderNodeMath'); a.operation = 'MULTIPLY_ADD'; L.new(nz_.outputs['Fac'], a.inputs[0]); a.inputs[1].default_value = k; a.inputs[2].default_value = -k / 2
    s = N.new('ShaderNodeMath'); s.operation = 'ADD'; s.use_clamp = True; L.new(w, s.inputs[0]); L.new(a.outputs[0], s.inputs[1])
    r = N.new('ShaderNodeMapRange'); r.inputs['From Min'].default_value = 0.35; r.inputs['From Max'].default_value = 0.65; L.new(s.outputs[0], r.inputs['Value'])
    return r.outputs['Result']
soil_ = N.new('ShaderNodeMath'); soil_.operation = 'MULTIPLY'; soil_.inputs[1].default_value = 0.3; N.active = soil_
nt.links.new(sep.outputs['Green'], soil_.inputs[0])
ws, wl = breakup(soil_.outputs[0]), breakup(sep.outputs['Blue'], 0.4)      # mostly lawn: it will be a landscaped site
geo = N.new('ShaderNodeNewGeometry'); xyz = N.new('ShaderNodeSeparateXYZ'); L.new(geo.outputs['Normal'], xyz.inputs[0])
steep = N.new('ShaderNodeMapRange'); steep.inputs['From Min'].default_value = 0.88; steep.inputs['From Max'].default_value = 0.62; L.new(xyz.outputs['Z'], steep.inputs['Value'])
g, s, f, w = pbr(nt, 'leafy_grass', 2.4, coord), pbr(nt, 'cracked_red_ground', 3.0, coord), pbr(nt, 'forest_leaves_02', 2.4, coord), pbr(nt, 'excavated_soil_wall', 4.0, coord)
wt = N.new('ShaderNodeRGB'); wt.outputs[0].default_value = (0.95, 0.62, 0.45, 1); one_ = N.new('ShaderNodeValue'); one_.outputs[0].default_value = 1.0
w = [mix(nt, w[0], wt.outputs[0], one_.outputs[0], 'MULTIPLY'), w[1], w[2]]      # the real wall is red-brown earth
gt = N.new('ShaderNodeRGB'); gt.outputs[0].default_value = (0.6, 0.9, 0.48, 1)
one = N.new('ShaderNodeValue'); one.outputs[0].default_value = 1.0
g = [mix(nt, g[0], gt.outputs[0], one.outputs[0], 'MULTIPLY'), g[1], g[2]]     # the scanned "leafy grass" is beige
out = []
for k in range(3):
    c = mix(nt, g[k], s[k], ws); c = mix(nt, c, f[k], wl); c = mix(nt, c, w[k], steep.outputs['Result']); out.append(c)
L.new(out[0], bs.inputs['Base Color'])
rg = N.new('ShaderNodeSeparateColor'); L.new(out[1], rg.inputs['Color']); L.new(rg.outputs['Red'], bs.inputs['Roughness'])
nm = N.new('ShaderNodeNormalMap'); L.new(out[2], nm.inputs['Color']); L.new(nm.outputs['Normal'], bs.inputs['Normal'])
ground.data.materials.append(m)

cx0, cz0, cx1, cz1 = D['corig']
far = grid_mesh('far', D['Hc'], cx0, cz0, 10.0, uv_rect=(cx0, cz0, cx1, cz1), flip_v=True)
m, nt, N, L, bs = mat('far')
im = N.new('ShaderNodeTexImage'); im.image = bpy.data.images.load(f'{SITE}/far.png'); L.new(im.outputs['Color'], bs.inputs['Base Color']); bs.inputs['Roughness'].default_value = 1
far.data.materials.append(m)

# ---------------------------------------------------------------- trees: real models, species by height
SPECIES = [('a_jac', 'jacaranda_tree', lambda n: n in ('jacaranda_tree_LOD0', 'jacaranda_tree_trunk_LOD0')),
           ('b_tall', 'island_tree_01', lambda n: n == 'island_tree_01_LOD0'),
           ('c_tall2', 'island_tree_02', lambda n: n == 'island_tree_02_LOD0'),
           ('d_mid', 'tree_small_02', lambda n: n in ('tree_small_02_LOD0', 'tree_small_02_trunk')),
           ('e_small', 'island_tree_03', lambda n: n == 'island_tree_03_LOD0')]
parts, native = [], []
for child, model, pick in SPECIES:
    ps = load_parts(model, pick); parts.append((child, ps))
    native.append(max((o.matrix_world @ Vector(c)).z for o in ps for c in o.bound_box))
treelib = library('treelib', parts)
T = D['trees']
keep = (np.hypot(T[:, 0] - 390.0, T[:, 1] - 836.0) > 28) & (np.hypot(T[:, 0] - 384.2, T[:, 1] - 860.4) > 15) if QUARRY else np.ones(len(T), bool)
if 'species' in D.files: SP0 = D['species']
else:
    rng = np.random.default_rng(7); r = rng.random(keep.sum()); h_ = T[keep, 3]
    SP0 = np.zeros(len(T), np.int32); SP0[keep] = np.where(h_ >= 14, 1, np.where(h_ >= 8, np.where(r < 0.5, 1, 2), np.where(h_ >= 4.5, np.where(r < 0.6, 3, 2), 4)))
for p in SPOTS: keep &= np.hypot(T[:, 0] - p['x'], T[:, 1] - p['z']) > 5          # no trunk right in front of a 360° view
T, sp = T[keep], SP0[keep].astype(np.int32); h = T[:, 3]
scale = (h / np.array(native)[sp]).astype(np.float32)
me = bpy.data.meshes.new('treepts'); me.vertices.add(len(T))
me.vertices.foreach_set('co', np.column_stack([T[:, 0], -T[:, 1], T[:, 2] - 0.2]).astype(np.float32).ravel())
tob = bpy.data.objects.new('trees', me); sc.collection.objects.link(tob)
add_attr(tob, 'species', 'INT', sp); add_attr(tob, 'scale', 'FLOAT', scale)
mod = tob.modifiers.new('trees', 'NODES'); mod.node_group = scatter_tree('trees_gn', treelib, scale_attr='scale', index_attr='species', keep_mesh=False)

# ---------------------------------------------------------------- grass near the camera, and on the living roofs
grasslib = library('grasslib', [(f'g{i}', [o]) for i, o in enumerate(load_parts('grass_medium_01', lambda n: n.endswith('LOD0') and 'tall' in n) +
                                                                       load_parts('grass_medium_02', lambda n: n.startswith('grass_medium_02_') and n[-2] == '_' and n[-1] in 'bcde'))])
for o in grasslib.all_objects:                     # the scanned grass is dry: green it up
    for m_ in [sl.material for sl in o.material_slots]:
        if not m_ or not m_.use_nodes or m_.get('greened'): continue
        for im_ in [n for n in m_.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image and 'diff' in n.image.name]:
            for lk in list(im_.outputs['Color'].links):
                mx = m_.node_tree.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1
                mx.inputs[7].default_value = (0.6, 0.92, 0.42, 1); dst_ = lk.to_socket
                m_.node_tree.links.new(im_.outputs['Color'], mx.inputs[6]); m_.node_tree.links.new(mx.outputs[2], dst_)
        m_['greened'] = True
gmod = ground.modifiers.new('grass', 'NODES'); gmod.node_group = scatter_tree('grass_gn', grasslib, density_attr='grass', density=14.0, scale_rand=(0.5, 0.95) if MODELS else (1.0, 1.8))     # a mown meadow: around the buildings, a lawn

# ---------------------------------------------------------------- cabins: rammed earth, glass, steel, deck, living roof
def box(name, size, at, rot, m, parent_list):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at); o = bpy.context.active_object
    o.name = name; o.scale = size; o.rotation_euler = (0, 0, rot); o.data.materials.append(m); parent_list.append(o); return o
earth, nt, N, L, bs = mat('earth')
c, rgh, nrm = pbr(nt, 'clay_plaster', 2.0, N.new('ShaderNodeTexCoord').outputs['Object'])
tint = mix(nt, c, c, N.new('ShaderNodeValue').outputs[0])
L.new(c, bs.inputs['Base Color']); sr = N.new('ShaderNodeSeparateColor'); L.new(rgh, sr.inputs['Color']); L.new(sr.outputs['Red'], bs.inputs['Roughness'])
nn = N.new('ShaderNodeNormalMap'); L.new(nrm, nn.inputs['Color']); L.new(nn.outputs['Normal'], bs.inputs['Normal'])
deck, nt, N, L, bs = mat('deck')
c, rgh, nrm = pbr(nt, 'brown_planks_05', 2.0, N.new('ShaderNodeTexCoord').outputs['Object'], 0.1)
L.new(c, bs.inputs['Base Color']); nn = N.new('ShaderNodeNormalMap'); L.new(nrm, nn.inputs['Color']); L.new(nn.outputs['Normal'], bs.inputs['Normal'])
steel, nt, N, L, bs = mat('steel'); bs.inputs['Base Color'].default_value = (0.03, 0.03, 0.032, 1); bs.inputs['Metallic'].default_value = 0.8; bs.inputs['Roughness'].default_value = 0.35
slab, nt, N, L, bs = mat('slab'); bs.inputs['Base Color'].default_value = (0.12, 0.11, 0.1, 1); bs.inputs['Roughness'].default_value = 0.8
glass, nt, N, L, bs = mat('glass'); bs.inputs['Base Color'].default_value = (0.8, 0.86, 0.85, 1); bs.inputs['Roughness'].default_value = 0.02
bs.inputs['Transmission Weight'].default_value = 1.0; bs.inputs['IOR'].default_value = 1.45
roofg, nt, N, L, bs = mat('roofgrass')
c, rgh, nrm = pbr(nt, 'leafy_grass', 2.4, N.new('ShaderNodeTexCoord').outputs['Object'])
L.new(c, bs.inputs['Base Color']); bs.inputs['Roughness'].default_value = 0.9
interior, nt, N, L, bs = mat('interior'); bs.inputs['Base Color'].default_value = (0.55, 0.45, 0.36, 1); bs.inputs['Roughness'].default_value = 0.9
def roof_tops(objs, inset=1.0):                     # a metre in, or tufts hang over the edge seen from a deck
    """The living roofs of a model: the top faces in its roofGrass material, one rectangle per height, set in from the edge."""
    tops = {}
    for o in objs:
        if o.type != 'MESH' or not o.material_slots: continue
        mw = o.matrix_world
        for poly in o.data.polygons:
            m_ = o.material_slots[poly.material_index].material
            if not m_ or not m_.name.lower().startswith('roofgrass') or (mw.to_3x3() @ poly.normal).normalized().z < 0.9: continue
            vs = [mw @ o.data.vertices[i].co for i in poly.vertices]
            b = tops.setdefault(round(max(v.z for v in vs), 1), [1e9, 1e9, -1e9, -1e9])
            for v in vs: b[0] = min(b[0], v.x); b[1] = min(b[1], v.y); b[2] = max(b[2], v.x); b[3] = max(b[3], v.y)
    return [((b[0] + b[2]) / 2, (b[1] + b[3]) / 2, z + 0.02, b[2] - b[0] - 2 * inset, b[3] - b[1] - 2 * inset) for z, b in tops.items()]
def import_model(name, lamps):
    """One building from the web (glb), with grass tufts on its living roofs and warm lamps inside, as a collection to place."""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=f'{MODELS}/{name}.glb')
    col = bpy.data.collections.new(name)
    for o in set(bpy.data.objects) - before:
        for c in list(o.users_collection): c.objects.unlink(o)
        col.objects.link(o)
    bpy.context.view_layer.update()
    roofs = roof_tops(col.objects)
    print(name, 'living roofs', [tuple(round(v, 2) for v in r) for r in roofs], flush=True)
    for k, (x, y, z, sx, sy) in enumerate(roofs):                    # glTF front (+z) comes in as -Y
        bpy.ops.mesh.primitive_grid_add(x_subdivisions=int(sx * 2), y_subdivisions=int(sy * 2), size=1, location=(0, 0, 0)); rf = bpy.context.active_object
        rf.data.transform(Matrix.Translation((x, y, z)) @ Matrix.Diagonal((sx, sy, 1, 1)))
        for c in list(rf.users_collection): c.objects.unlink(rf)
        col.objects.link(rf); rf.hide_render = False
        rf.data.materials.append(bpy.data.materials.new('roofhide')); rf.data.materials[0].use_nodes = True
        rf.data.materials[0].node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = 0.0
        add_attr(rf, 'grass', 'FLOAT', np.ones(len(rf.data.vertices), np.float32))
        rm = rf.modifiers.new('roofgrass', 'NODES'); rm.node_group = bpy.data.node_groups.get('roof_gn') or scatter_tree('roof_gn', grasslib, density_attr='grass', density=14.0, scale_rand=(0.55, 0.95))
    for k, (x, y, z) in enumerate(lamps):
        lamp = bpy.data.objects.new(f'{name}_lamp{k}', bpy.data.lights.new(f'{name}_lamp{k}', 'POINT')); col.objects.link(lamp)
        lamp.location = (x, y, z); lamp.data.energy = 120; lamp.data.color = (1.0, 0.72, 0.45); lamp.data.shadow_soft_size = 0.4
    return col
def place(col, x, z, floor, rot):
    e = bpy.data.objects.new(col.name + '_at', None); e.instance_type = 'COLLECTION'; e.instance_collection = col
    e.location = bl(x, z, floor); e.rotation_euler = (0, 0, math.pi - math.radians(rot)); sc.collection.objects.link(e)
def web_materials():
    """The web's materials for glass and water, made real for Cycles; lamps glow."""
    for m in bpy.data.materials:
        key = m.name.split('.')[0]
        if not m.use_nodes or key not in ('glass', 'pool', 'lamp'): continue
        b = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if not b: continue
        if key in ('glass', 'pool'):
            for l in list(b.inputs['Alpha'].links): m.node_tree.links.remove(l)
            b.inputs['Alpha'].default_value = 1.0; b.inputs['Transmission Weight'].default_value = 1.0; b.inputs['Metallic'].default_value = 0.0
            b.inputs['Roughness'].default_value = 0.02 if key == 'glass' else 0.03; b.inputs['IOR'].default_value = 1.45 if key == 'glass' else 1.33
            b.inputs['Base Color'].default_value = (0.85, 0.9, 0.9, 1) if key == 'glass' else (0.35, 0.75, 0.78, 1)
        else:
            b.inputs['Emission Color'].default_value = (1.0, 0.75, 0.48, 1); b.inputs['Emission Strength'].default_value = 4.0
if MODELS:
    if len(D['cabins']):
        cab_col = import_model('cabin', [(0, -0.6, 2.2)])
        for x, z, floor, rot, w, d in D['cabins']: place(cab_col, x, z, floor, rot)
    if 'residence' in D.files:
        res_col = import_model('residence', [(-4.2, 0.2, 2.3), (-8.0, -0.5, 2.3), (8.75, 2.5, 2.5)])
        rx, rz, rfl, rrot = D['residence']; place(res_col, rx, rz, rfl, rrot)
    web_materials()
    if 'rocks' in D.files:                                            # the granite boulders by the mango tree
        rock, nt, N, L, bs = mat('granite')
        c, rgh, nrm = pbr(nt, 'clay_plaster', 1.5, N.new('ShaderNodeTexCoord').outputs['Object'])
        L.new(mix(nt, c, nt.nodes.new('ShaderNodeRGB').outputs[0], nt.nodes.new('ShaderNodeValue').outputs[0], 'MULTIPLY'), bs.inputs['Base Color'])
        rgb = [n for n in nt.nodes if n.type == 'RGB'][-1]; rgb.outputs[0].default_value = (0.5, 0.5, 0.52, 1)
        [n for n in nt.nodes if n.type == 'VALUE'][-1].outputs[0].default_value = 1.0
        nn = N.new('ShaderNodeNormalMap'); L.new(nrm, nn.inputs['Color']); L.new(nn.outputs['Normal'], bs.inputs['Normal']); bs.inputs['Roughness'].default_value = 0.85
        for k, (x, z, y, w_, d_, h_, rot) in enumerate(D['rocks']):
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=5, radius=1, location=bl(x, z, y + 0.1)); o = bpy.context.active_object
            for v in o.data.vertices:
                p = v.co; n_ = 1 + 0.13 * math.sin(p.x * 3.1 + k * 7) * math.cos(p.y * 2.7 + p.z * 1.9) + 0.06 * math.sin(p.x * 9.3 + p.z * 7.7 + p.y * 8.1)
                p *= n_
                if p.z < -0.15: p.z = -0.15 + (p.z + 0.15) * 0.2
            o.scale = (w_ / 2, d_ / 2, h_); o.rotation_euler = (0, 0, math.radians(rot)); o.data.materials.append(rock)
            bpy.ops.object.shade_smooth()
for i, (x, z, floor, rot, w, d) in enumerate(D['cabins'] if not MODELS else []):
    th = math.radians(rot); F = Vector((math.sin(th), math.cos(th), 0)); R = Vector((math.cos(th), -math.sin(th), 0)); yaw = -th
    C = Vector(bl(x, z, floor)); Hh = 3.0
    at = lambda u, v, z_: C + R * u + F * v + Vector((0, 0, z_))
    parts_ = []
    box(f'walls{i}', (w, d - 0.3, Hh + 1.2), at(0, -0.15, (Hh - 1.2) / 2), yaw, earth, parts_)
    box(f'inside{i}', (w - 0.5, d - 0.8, Hh - 0.4), at(0, 0.05, Hh / 2 + 0.05), yaw, interior, parts_)
    box(f'glass{i}', (w - 0.7, 0.03, Hh - 0.45), at(0, d / 2 - 0.25, (Hh - 0.45) / 2 + 0.2), yaw, glass, parts_)
    for k in range(5):
        box(f'mull{i}{k}', (0.08, 0.12, Hh - 0.4), at(-(w - 0.7) / 2 + k * (w - 0.7) / 4, d / 2 - 0.25, (Hh - 0.4) / 2 + 0.18), yaw, steel, parts_)
    box(f'rail{i}', (w - 0.6, 0.12, 0.1), at(0, d / 2 - 0.25, Hh - 0.22), yaw, steel, parts_)
    box(f'slab{i}', (w + 0.8, d + 1.6, 0.3), at(0, 0.4, Hh + 0.15), yaw, slab, parts_)
    box(f'fascia{i}', (w + 0.84, 0.06, 0.34), at(0, d / 2 + 1.22, Hh + 0.15), yaw, steel, parts_)
    box(f'deck{i}', (w, 3.0, 0.16), at(0, d / 2 + 1.5, 0.08), yaw, deck, parts_)
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=18, y_subdivisions=14, size=1, location=at(0, 0.4, Hh + 0.31)); rf = bpy.context.active_object
    rf.data.transform(Matrix.Diagonal((w - 0.8, d - 0.2, 1, 1)))   # inside the roof edge; size baked in so the tufts keep their shape; rf.rotation_euler = (0, 0, yaw); rf.data.materials.append(roofg)
    add_attr(rf, 'grass', 'FLOAT', np.ones(len(rf.data.vertices), np.float32))
    if not (VIEW == 'deck' and i == 3):               # standing under that eave, its tufts would seem to float in the sky
        rm = rf.modifiers.new('roofgrass', 'NODES')
        rm.node_group = bpy.data.node_groups.get('roof_gn') or scatter_tree('roof_gn', grasslib, density_attr='grass', density=14.0, scale_rand=(0.7, 1.2))
    lamp = bpy.data.objects.new(f'lamp{i}', bpy.data.lights.new(f'lamp{i}', 'POINT')); sc.collection.objects.link(lamp)
    lamp.location = at(0, 0.6, 2.2); lamp.data.energy = 120; lamp.data.color = (1.0, 0.72, 0.45); lamp.data.shadow_soft_size = 0.4

# ---------------------------------------------------------------- the lagoon
if QUARRY:
  lx, lz, water, lrot, lw, ld = D['lagoon']
  bpy.ops.mesh.primitive_circle_add(vertices=96, radius=1, fill_type='NGON', location=bl(lx, lz, water)); lg = bpy.context.active_object
  lg.scale = (lw / 2, ld / 2, 1); lg.location.z -= 0.02; lg.rotation_euler = (0, 0, -math.radians(lrot))
  wat, nt, N, L, bs = mat('water'); bs.inputs['Base Color'].default_value = (0.02, 0.05, 0.045, 1); bs.inputs['Roughness'].default_value = 0.03; bs.inputs['IOR'].default_value = 1.33
  wn = N.new('ShaderNodeTexNoise'); wn.inputs['Scale'].default_value = 3.0; bump = N.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.08
  L.new(wn.outputs['Fac'], bump.inputs['Height']); L.new(bump.outputs['Normal'], bs.inputs['Normal'])
  lg.data.materials.append(wat)

# ---------------------------------------------------------------- sunrise sky, turned so the sun rises in the east-south-east
world = bpy.data.worlds.new('sky'); sc.world = world; world.use_nodes = True
WN, WL = world.node_tree.nodes, world.node_tree.links
env = WN.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(f'{A}/hdri/evening_road_01_puresky.hdr')
px = np.empty(env.image.size[0] * env.image.size[1] * 4, np.float32); env.image.pixels.foreach_get(px)
px = px.reshape(env.image.size[1], env.image.size[0], 4); lum = px[..., :3].sum(-1)
vy, ux = np.unravel_index(np.argmax(lum), lum.shape)
u, v = (ux + 0.5) / env.image.size[0], (vy + 0.5) / env.image.size[1]
a_sun, el = 2 * math.pi * (u - 0.5), math.pi * (v - 0.5)
hdri_ang = -a_sun                                                          # sun azimuth in the panorama, as an XY angle (checked against a render of the sky)
want = math.atan2(-0.41, 0.86)                                             # east-south-east, as in the web model
tco, mp = WN.new('ShaderNodeTexCoord'), WN.new('ShaderNodeMapping')
mp.inputs['Rotation'].default_value = (0, 0, hdri_ang - want)
WL.new(tco.outputs['Generated'], mp.inputs['Vector']); WL.new(mp.outputs['Vector'], env.inputs['Vector']); WL.new(env.outputs['Color'], WN['Background'].inputs['Color'])
WN['Background'].inputs['Strength'].default_value = 0.7
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sc.collection.objects.link(sun)
hd_ = Vector((0.86, -0.41, 0)).normalized(); e = math.radians(30); sd = Vector((hd_.x * math.cos(e), hd_.y * math.cos(e), math.sin(e)))
sun.rotation_euler = (-sd).to_track_quat('-Z', 'Y').to_euler(); sun.data.energy = 7.5; sun.data.color = (1.0, 0.72, 0.48); sun.data.angle = math.radians(0.8)
print(f'sun in panorama at {math.degrees(el):.1f} deg elevation', flush=True)

# ---------------------------------------------------------------- the sky alone, in linear light, for the web world's background, haze and reflections
if VIEW == 'sky':
    import os
    WEB = os.path.join(SITE, 'web'); os.makedirs(WEB, exist_ok=True)
    for ob in sc.objects: ob.hide_render = True
    sky = bpy.data.objects.new('skycam', bpy.data.cameras.new('skycam')); sc.collection.objects.link(sky); sc.camera = sky
    sky.data.type = 'PANO'
    try: sky.data.panorama_type = 'EQUIRECTANGULAR'
    except Exception: sky.data.cycles.panorama_type = 'EQUIRECTANGULAR'
    sky.rotation_euler = (math.pi / 2, 0, 0)                      # centre of the image = north
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 8; sc.render.resolution_x, sc.render.resolution_y = W, H
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.exposure = 0
    sc.render.image_settings.file_format = 'OPEN_EXR'; sc.render.image_settings.color_depth = '16'
    f = os.path.join(WEB, 'sky.exr'); sc.render.filepath = f; bpy.ops.render.render(write_still=True)
    im = bpy.data.images.load(f); px = np.empty(W * H * 4, np.float32); im.pixels.foreach_get(px)
    np.save(os.path.join(WEB, 'sky.npy'), px.reshape(H, W, 4)[::-1, :, :3].astype(np.float16))    # rows top first
    print('sky done', flush=True); sys.exit(0)

# ---------------------------------------------------------------- bake: the light on the ground, for the walkable web world
if VIEW == 'bake':
    import json, os
    WEB = os.path.join(SITE, 'web'); os.makedirs(WEB, exist_ok=True)
    for ob in list(sc.objects):                                   # grass is drawn live on the web; it only slows the bake
        for md in list(ob.modifiers):
            if md.type == 'NODES' and md.node_group and md.node_group.name in ('grass_gn', 'roof_gn'): ob.modifiers.remove(md)
    lm = bpy.data.images.new('lightmap', W, H, float_buffer=True)
    gm = ground.data.materials[0]; nd = gm.node_tree.nodes.new('ShaderNodeTexImage'); nd.image = lm
    for n in gm.node_tree.nodes: n.select = False
    nd.select = True; gm.node_tree.nodes.active = nd
    gm.node_tree.links.new(uvn.outputs['UV'], nd.inputs['Vector'])
    for ob in sc.objects: ob.select_set(False)
    ground.select_set(True); bpy.context.view_layer.objects.active = ground
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SPP; sc.cycles.transparent_max_bounces = 24
    sc.render.bake.margin = 4; sc.render.bake.use_pass_color = False; sc.render.bake.use_pass_direct = True; sc.render.bake.use_pass_indirect = True
    t1 = time.time()
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, use_clear=True, margin=4)
    print(f'baked {W}x{H} @ {SPP} spp in {time.time() - t1:.0f} s', flush=True)
    px = np.empty(W * H * 4, np.float32); lm.pixels.foreach_get(px); px = px.reshape(H, W, 4)[..., :3]
    np.save(os.path.join(WEB, 'lightmap.npy'), px.astype(np.float16))        # row 0 = UV v 0 = the north edge
    # The sky as seen from the site, as a plain panorama for the web's background and reflections.
    for ob in sc.objects: ob.hide_render = True
    sky = bpy.data.objects.new('skycam', bpy.data.cameras.new('skycam')); sc.collection.objects.link(sky); sc.camera = sky
    sky.data.type = 'PANO'
    try: sky.data.panorama_type = 'EQUIRECTANGULAR'
    except Exception: sky.data.cycles.panorama_type = 'EQUIRECTANGULAR'
    sky.rotation_euler = (math.pi / 2, 0, 0)                      # centre of the image = north
    sc.cycles.samples = 4; sc.render.resolution_x, sc.render.resolution_y = 4096, 2048
    vs = sc.view_settings; vs.view_transform = 'AgX'
    try: vs.look = 'AgX - Punchy'
    except Exception: pass
    vs.exposure = 0.5; sc.render.filepath = os.path.join(WEB, 'sky.png'); bpy.ops.render.render(write_still=True)
    json.dump({'region': [float(dx0), float(dz0), float(dx0 + nx - 1), float(dz0 + nz - 1)], 'sun': [float(v) for v in sd], 'sky_centre_bearing': 0,
               'lagoon': [float(v) for v in D['lagoon']], 'cabins': [[float(v) for v in c] for c in D['cabins']]}, open(os.path.join(WEB, 'bake.json'), 'w'))
    print('bake done', flush=True); sys.exit(0)

# ---------------------------------------------------------------- camera and render
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
def ground_at(x, z):
    fx, fz = x - dx0, z - dz0; i, j = int(fz), int(fx); tz, tx = fz - i, fx - j
    return float(Hd[i, j] * (1 - tx) * (1 - tz) + Hd[i, j + 1] * tx * (1 - tz) + Hd[i + 1, j] * (1 - tx) * tz + Hd[i + 1, j + 1] * tx * tz)
if QUARRY and VIEW != 'tour':
    CAM, TGT = (390.0, 836.0), (350.0, 892.0)      # north-east of the lagoon, looking south-west along the row: the sun rakes across
    cam.location = bl(CAM[0], CAM[1], ground_at(*CAM) + 2.8)
    look = Vector(bl(TGT[0], TGT[1], ground_at(*TGT) + 4.5)) - cam.location
    cam.rotation_euler = look.to_track_quat('-Z', 'Y').to_euler()
cam.data.lens = 24; cam.data.clip_end = 8000
if VIEW in PANOS:
    if VIEW == 'deck':                                    # front edge of cabin 4's deck, looking at the lagoon
        cx_, cz_, fl_, rot_, w_, d_ = D['cabins'][3]; off = d_ / 2 + 2.6; th_ = math.radians(rot_)
        px_, pz_ = cx_ + math.sin(th_) * off, cz_ - math.cos(th_) * off
        eye, base = 1.65, fl_ + 0.16
        brg = math.degrees(math.atan2(D['lagoon'][0] - px_, -(D['lagoon'][1] - pz_))) % 360
        print(f'deck view at ({px_:.1f}, {pz_:.1f}), facing {brg:.0f}', flush=True)
    else:
        (px_, pz_), eye, brg = PANOS[VIEW]
        base = ground_at(px_, pz_)
    cam.location = bl(px_, pz_, base + eye)
    cam.rotation_euler = (math.pi / 2, 0, -math.radians(brg))                         # level, centre of the image toward the bearing
    cam.data.type = 'PANO'
    try: cam.data.panorama_type = 'EQUIRECTANGULAR'
    except Exception: cam.data.cycles.panorama_type = 'EQUIRECTANGULAR'
    cam.data.clip_start = 0.05
sc.render.engine = 'CYCLES'; c_ = sc.cycles; c_.device = 'CPU'; c_.samples = SPP; c_.use_adaptive_sampling = True; c_.use_denoising = True
c_.max_bounces = 8; c_.diffuse_bounces = 3; c_.glossy_bounces = 3; c_.transmission_bounces = 6; c_.transparent_max_bounces = 24
c_.blur_glossy = 1.0
sc.render.resolution_x, sc.render.resolution_y = W, H; sc.render.filepath = OUT
vs = sc.view_settings; vs.view_transform = 'AgX'
try: vs.look = 'AgX - Punchy'
except Exception: pass
vs.exposure = 0.5
print(f'scene built in {time.time() - t0:.0f} s: {len(T)} trees', flush=True)
if SPP == 0:                        # debug: where the sun points, and what a ray from a cabin front toward it hits
    dg = bpy.context.evaluated_depsgraph_get()
    ld = sun.matrix_world.to_quaternion() @ Vector((0, 0, -1)); print('sun light travels', tuple(round(v, 2) for v in ld))
    x, z, floor, rot, w, d = D['cabins'][3]; th = math.radians(rot)
    o = Vector(bl(x, z, floor + 1.5)) + Vector((math.sin(th), math.cos(th), 0)) * (d / 2 + 0.6)
    hit, loc, nrm, idx, obj, mtx = sc.ray_cast(dg, o, -ld)
    print('ray to sun from cabin front hits', obj.name if hit else 'nothing', tuple(round(v, 1) for v in loc) if hit else '', 'distance', round((loc - o).length, 1) if hit else '')
    sys.exit(0)
if VIEW == 'tour':
    import os
    os.makedirs(OUT, exist_ok=True)
    cam.data.type = 'PANO'
    try: cam.data.panorama_type = 'EQUIRECTANGULAR'
    except Exception: cam.data.cycles.panorama_type = 'EQUIRECTANGULAR'
    cam.data.clip_start = 0.05
    sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 90
    for p in SPOTS:
        cam.location = bl(p['x'], p['z'], p['y'])
        cam.rotation_euler = (math.pi / 2, 0, -math.radians(p['bearing']))           # level, centre of the image toward the bearing
        sc.render.filepath = os.path.join(OUT, f"{p['site']}-{p['id']}.jpg")
        c_.samples = SPP * 3 if 'roam' in p else SPP              # a view inside (free roam starts outside it): lamplight needs more samples
        t1 = time.time(); bpy.ops.render.render(write_still=True)
        print(f"{p['site']}-{p['id']}: {W}x{H} @ {c_.samples} spp in {time.time() - t1:.0f} s", flush=True)
    sys.exit(0)
t1 = time.time(); bpy.ops.render.render(write_still=True)
print(f'render {W}x{H} @ {SPP} spp: {time.time() - t1:.0f} s', flush=True)
