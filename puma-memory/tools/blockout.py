"""Blender headless blockout -> perspective-correct reference frame.
Usage: bvenv/bin/python tools/blockout.py scene.json out_prefix [--draft]
Scene JSON (metres, Z up):
  camera : {"pos":[x,y,z], "look_at":[x,y,z], "lens":24, "roll":0}
  night  : true/false            (dark sky + emissive floodlights, or daylight)
  sun    : [elev_deg, azim_deg]  (optional key light)
  objects: list of
    {"type":"box","pos":[..],"size":[..],"rot":deg_z,"tone":0-1}
    {"type":"cyl","pos":[..],"r":..,"h":..,"tone":..}
    {"type":"pitch"}                                   105 x 68 m, lines, stripes, centred on origin, long axis X
    {"type":"goal","pos":[x,y,0],"rot":deg}            7.32 x 2.44 m
    {"type":"stand","pos":[x,y,0],"rot":deg,"length":L,"rows":n,"roof":true,"lights":k}   faces local -Y
    {"type":"tunnel","pos":[..],"rot":deg,"length":L,"width":w,"height":h}                opening along local +Y
    {"type":"lockers","pos":[..],"rot":deg,"count":n}
    {"type":"board","pos":[..],"rot":deg}              tactics whiteboard on a stand
    {"type":"person","pos":[x,y,0],"facing":deg,"pose":"stand|run|kick|kneel|sit|arms_up|point","height":1.8,"tone":0.3,"num":"9"}
    {"type":"ball","pos":[x,y,z]}
Outputs: <prefix>_render.png (3360x1440 clay render), <prefix>_strip.jpg (what reaches the LED, die-cut applied)."""
import sys, json, math
import bpy
from mathutils import Vector, Matrix

S = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
scene_path, prefix = sys.argv[1], sys.argv[2]; DRAFT = "--draft" in sys.argv
C = json.load(open(scene_path))
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
_mats = {}
def mat(tone, emit=0.0):
    k = (round(tone, 2), emit)
    if k not in _mats:
        m = bpy.data.materials.new(f"m{k}"); m.use_nodes = True; b = m.node_tree.nodes["Principled BSDF"]
        b.inputs["Base Color"].default_value = (tone, tone, tone, 1); b.inputs["Roughness"].default_value = 0.9
        if emit: b.inputs["Emission Color"].default_value = (1, 1, 1, 1); b.inputs["Emission Strength"].default_value = emit
        _mats[k] = m
    return _mats[k]
def T(pos=(0, 0, 0), rot=0): return Matrix.Translation(Vector(pos)) @ Matrix.Rotation(math.radians(rot), 4, "Z")
def _fin(o, M, tone, emit=0.0):
    o.matrix_world = M @ o.matrix_world; o.data.materials.append(mat(tone, emit)); return o
def box(size, loc, tone=0.5, M=Matrix(), emit=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = bpy.context.object; o.scale = size
    bpy.context.view_layer.update(); return _fin(o, M, tone, emit)
def sphere(r, loc, tone=0.5, M=Matrix(), emit=0.0):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=20, ring_count=10); o = bpy.context.object
    bpy.ops.object.shade_smooth(); bpy.context.view_layer.update(); return _fin(o, M, tone, emit)
def limb(a, b, r, tone=0.5, M=Matrix()):
    a, b = Vector(a), Vector(b); d = b - a
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=d.length, vertices=14, location=(a + b) / 2); o = bpy.context.object
    o.rotation_euler = d.to_track_quat("Z", "Y").to_euler(); bpy.ops.object.shade_smooth(); bpy.context.view_layer.update(); return _fin(o, M, tone)
def torus(R, r, loc, tone, M=Matrix()):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, major_segments=64, minor_segments=4); o = bpy.context.object
    o.scale.z = 0.05; bpy.context.view_layer.update(); return _fin(o, M, tone)

def pitch(o):
    M = T(o.get("pos", (0, 0, 0)), o.get("rot", 0)); L, Wd = 105, 68
    for i in range(14):                                                    # mowing stripes
        box((L / 14, Wd, 0.02), (-L / 2 + (i + 0.5) * L / 14, 0, -0.01), 0.20 if i % 2 else 0.26, M)
    box((L + 16, Wd + 16, 0.02), (0, 0, -0.03), 0.18, M)                    # run-off
    w = 0.14; ln = lambda sx, sy, x, y: box((sx, sy, 0.02), (x, y, 0.005), 0.95, M)
    ln(L, w, 0, Wd / 2); ln(L, w, 0, -Wd / 2); ln(w, Wd, L / 2, 0); ln(w, Wd, -L / 2, 0); ln(w, Wd, 0, 0)
    torus(9.15, 0.09, (0, 0, 0.01), 0.95, M)
    for s in (-1, 1):
        ln(w, 40.3, s * (L / 2 - 16.5), 0); ln(16.5, w, s * (L / 2 - 8.25), 20.15); ln(16.5, w, s * (L / 2 - 8.25), -20.15)
        ln(w, 18.3, s * (L / 2 - 5.5), 0); ln(5.5, w, s * (L / 2 - 2.75), 9.15); ln(5.5, w, s * (L / 2 - 2.75), -9.15)
        sphere(0.12, (s * (L / 2 - 11), 0, 0.0), 0.95, M)
def goal(o):
    M = T(o["pos"], o.get("rot", 0)); r = 0.06
    limb((0, -3.66, 0), (0, -3.66, 2.44), r, 0.95, M); limb((0, 3.66, 0), (0, 3.66, 2.44), r, 0.95, M); limb((0, -3.66, 2.44), (0, 3.66, 2.44), r, 0.95, M)
    for y in (-3.66, 3.66): limb((0, y, 2.44), (-2, y, 0), 0.03, 0.9, M)
    limb((-2, -3.66, 0), (-2, 3.66, 0), 0.03, 0.9, M)
    for i in range(1, 12): limb((0, -3.66 + i * 0.61, 2.44), (-2, -3.66 + i * 0.61, 0), 0.012, 0.85, M)    # net hint
    for i in range(1, 5): limb((-i * 0.4, -3.66, 2.44 - i * 0.49), (-i * 0.4, 3.66, 2.44 - i * 0.49), 0.012, 0.85, M)
def stand(o):
    """Tiered stand. Local frame: front edge on y=0, rising toward +y; spectators look toward -y."""
    M = T(o["pos"], o.get("rot", 0)); L = o.get("length", 100); n = o.get("rows", 24); tr, ri = 0.85, 0.45
    box((L, 0.3, 1.1), (0, -0.15, 0.55), 0.12, M)                           # pitch-side board/wall
    for i in range(n):
        box((L, tr, ri * (i + 1) + 1.0), (0, tr * (i + 0.5), (ri * (i + 1) + 1.0) / 2), 0.30 if i % 2 else 0.36, M)
    D = n * tr; Ht = n * ri + 1.0
    for x in range(int(-L / 2) + 8, int(L / 2), 16): box((1.6, D, 0.05), (x, D / 2, Ht / 2 + 0.6), 0.5, M @ Matrix.Rotation(math.atan2(ri, tr), 4, "X"))  # aisles
    box((L, 1.0, Ht + 6), (0, D + 0.5, (Ht + 6) / 2), 0.22, M)              # back wall
    if o.get("roof", True):
        rz = Ht + 6; box((L, D + 4, 0.5), (0, D / 2 - 1.5, rz), 0.42, M)    # roof slab, front edge overhangs
        for x in range(int(-L / 2), int(L / 2) + 1, 12): box((0.5, 0.5, rz), (x, D + 0.2, rz / 2), 0.3, M)
        k = o.get("lights", 0)
        for j in range(k):
            x = -L / 2 + (j + 0.5) * L / k
            for dx in (-1.2, 0, 1.2): sphere(0.45, (x + dx, -3.3, rz - 0.5), 1.0, M, emit=30.0)
def tunnel(o):
    M = T(o["pos"], o.get("rot", 0)); L = o.get("length", 14); w = o.get("width", 4.2); h = o.get("height", 2.9)
    box((w + 6, L, 0.05), (0, L / 2, -0.02), 0.25, M)
    for s in (-1, 1):
        box((0.4, L, h + 1), (s * (w / 2 + 0.2), L / 2, (h + 1) / 2), 0.4, M)
        for y in range(2, int(L), 3): box((0.44, 0.06, h + 1), (s * (w / 2 + 0.2), y, (h + 1) / 2), 0.25, M)   # panel joints
        sphere(0.14, (s * (w / 2 - 0.05), L * 0.45, 1.5), 1.0, M, emit=8.0)                                        # wall lamps
    box((w + 0.8, L, 0.4), (0, L / 2, h + 0.2), 0.35, M)
def lockers(o):
    M = T(o["pos"], o.get("rot", 0)); n = o.get("count", 8)
    for i in range(n):
        x = (i - n / 2 + 0.5) * 0.9
        box((0.86, 0.6, 2.1), (x, 0.3, 1.05), 0.28, M); box((0.8, 0.05, 2.0), (x, -0.01, 1.05), 0.2, M)
        box((0.5, 0.04, 0.7), (x, -0.06, 1.35), o.get("shirt_tone", 0.55), M)                                       # hanging shirt
    box((n * 0.9, 0.45, 0.06), (0, -0.7, 0.45), 0.45, M)
    for x in (-n * 0.4, 0, n * 0.4): box((0.06, 0.4, 0.45), (x, -0.7, 0.22), 0.3, M)
def board(o):
    M = T(o["pos"], o.get("rot", 0)); box((1.2, 0.04, 1.6), (0, 0, 1.5), 0.95, M); limb((0, 0, 0), (0, 0, 0.75), 0.03, 0.3, M)
    for s in (-1, 1): limb((0, 0, 0.05), (s * 0.4, 0.3, 0.02), 0.02, 0.3, M)
def ball(o): sphere(0.11, o["pos"], 0.95)

POSES = {  # joint positions for a 1.8 m figure facing +Y: hip, chest, head, L/R shoulder, elbow, hand, knee, foot
 "stand":   dict(hip=(0, 0, .95), chest=(0, 0, 1.42), head=(0, .01, 1.68), lsh=(-.2, 0, 1.45), rsh=(.2, 0, 1.45), lel=(-.25, 0, 1.15), rel=(.25, 0, 1.15), lha=(-.25, .05, .88), rha=(.25, .05, .88), lkn=(-.1, .02, .5), rkn=(.1, .02, .5), lft=(-.1, 0, .05), rft=(.1, 0, .05)),
 "run":     dict(hip=(0, 0, .95), chest=(0, .12, 1.40), head=(0, .2, 1.65), lsh=(-.2, .1, 1.43), rsh=(.2, .1, 1.43), lel=(-.26, .32, 1.22), rel=(.26, -.15, 1.2), lha=(-.22, .5, 1.38), rha=(.24, -.35, 1.05), lkn=(-.1, .38, .62), rkn=(.1, -.15, .5), lft=(-.1, .2, .2), rft=(.1, -.6, .35)),
 "kick":    dict(hip=(0, 0, .93), chest=(0, -.05, 1.38), head=(0, 0, 1.63), lsh=(-.2, -.03, 1.42), rsh=(.2, -.03, 1.42), lel=(-.5, .0, 1.3), rel=(.42, -.2, 1.2), lha=(-.75, .1, 1.25), rha=(.5, -.4, 1.0), lkn=(-.12, .1, .48), rkn=(.12, -.3, .55), lft=(-.12, .05, .05), rft=(.14, -.75, .5)),
 "kneel":   dict(hip=(0, 0, .55), chest=(0, -.08, 1.02), head=(0, -.12, 1.28), lsh=(-.2, -.08, 1.05), rsh=(.2, -.08, 1.05), lel=(-.42, .1, .95), rel=(.42, .1, .95), lha=(-.36, .25, 1.18), rha=(.36, .25, 1.18), lkn=(-.18, .35, .08), rkn=(.18, .35, .08), lft=(-.18, -.2, .08), rft=(.18, -.2, .08)),
 "sit":     dict(hip=(0, 0, .5), chest=(0, .1, .95), head=(0, .2, 1.18), lsh=(-.2, .1, .98), rsh=(.2, .1, .98), lel=(-.22, .3, .72), rel=(.22, .3, .72), lha=(-.1, .45, .6), rha=(.1, .45, .6), lkn=(-.12, .45, .5), rkn=(.12, .45, .5), lft=(-.12, .5, .05), rft=(.12, .5, .05)),
 "arms_up": dict(hip=(0, 0, .95), chest=(0, 0, 1.42), head=(0, -.02, 1.68), lsh=(-.2, 0, 1.45), rsh=(.2, 0, 1.45), lel=(-.38, 0, 1.7), rel=(.38, 0, 1.7), lha=(-.42, 0, 2.0), rha=(.42, 0, 2.0), lkn=(-.12, .15, .52), rkn=(.12, -.1, .5), lft=(-.12, .05, .05), rft=(.12, -.3, .15)),
 "point":   dict(hip=(0, 0, .95), chest=(0, 0, 1.42), head=(.03, .01, 1.68), lsh=(-.2, 0, 1.45), rsh=(.2, 0, 1.45), lel=(-.25, 0, 1.15), rel=(.48, .1, 1.42), lha=(-.22, .1, .9), rha=(.78, .2, 1.4), lkn=(-.1, .02, .5), rkn=(.1, .02, .5), lft=(-.1, 0, .05), rft=(.1, 0, .05)),
}
def person(o):
    k = o.get("height", 1.8) / 1.8; t = o.get("tone", 0.3); skin = 0.75
    M = T(o["pos"], o.get("facing", 0)) @ Matrix.Scale(k, 4); J = POSES[o.get("pose", "stand")]
    limb(J["hip"], J["chest"], 0.17, t, M); sphere(0.19, J["chest"], t, M); sphere(0.115, J["head"], skin, M)
    for s in ("l", "r"):
        limb(J[s + "sh"], J[s + "el"], 0.055, t, M); limb(J[s + "el"], J[s + "ha"], 0.045, skin, M); sphere(0.05, J[s + "ha"], skin, M)
        hp = (J["hip"][0] + (-.1 if s == "l" else .1), J["hip"][1], J["hip"][2])
        limb(hp, J[s + "kn"], 0.085, t * 0.8, M); limb(J[s + "kn"], J[s + "ft"], 0.06, skin if o.get("shorts", True) else t, M)
        box((0.1, 0.27, 0.09), (J[s + "ft"][0], J[s + "ft"][1] + 0.07, J[s + "ft"][2]), 0.05, M)
    if o.get("num"):                                                        # squad number on the back
        bpy.ops.object.text_add(); tx = bpy.context.object; tx.data.body = str(o["num"]); tx.data.align_x = "CENTER"; tx.data.size = 0.3; tx.data.extrude = 0.005
        c = Vector(J["chest"]); tx.matrix_world = M @ Matrix.Translation((c.x, c.y - 0.2, c.z - 0.22)) @ Matrix.Rotation(math.radians(90), 4, "X") @ Matrix.Rotation(math.radians(180), 4, "Y")
        tx.data.materials.append(mat(0.95))
BUILD = dict(pitch=pitch, goal=goal, stand=stand, tunnel=tunnel, lockers=lockers, board=board, ball=ball, person=person,
             box=lambda o: box(o["size"], o["pos"], o.get("tone", 0.5), T((0, 0, 0), 0) if not o.get("rot") else T(o["pos"], o["rot"]) @ Matrix.Translation(-Vector(o["pos"])), o.get("emit", 0.0)),
             cyl=lambda o: limb(o["pos"], (o["pos"][0], o["pos"][1], o["pos"][2] + o["h"]), o["r"], o.get("tone", 0.5)))
for ob in C["objects"]: BUILD[ob["type"]](ob)

# camera
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
cc = C["camera"]; cam.location = cc["pos"]; cam.data.lens = cc.get("lens", 24); cam.data.sensor_width = 36; cam.data.clip_end = 2000
d = Vector(cc["look_at"]) - Vector(cc["pos"]); cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler(); cam.rotation_euler.rotate_axis("Z", math.radians(cc.get("roll", 0)))
# light
night = C.get("night", False); w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
bg = w.node_tree.nodes["Background"]; bg.inputs[0].default_value = (0.02, 0.03, 0.05, 1) if night else (0.8, 0.85, 0.95, 1); bg.inputs[1].default_value = 1.0 if night else 0.9
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN")); sc.collection.objects.link(sun); el, az = C.get("sun", [55, 30])
sun.rotation_euler = (math.radians(90 - el), 0, math.radians(az)); sun.data.energy = 1.2 if night else 3.0; sun.data.angle = math.radians(8)
# render
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = 12 if DRAFT else 48
try: sc.cycles.use_denoising = True
except Exception: pass
k = 0.4 if DRAFT else 1.0; sc.render.resolution_x = int(3360 * k); sc.render.resolution_y = int(1440 * k); sc.render.resolution_percentage = 100
sc.view_settings.view_transform = "Standard"; sc.render.filepath = prefix + "_render.png"; sc.render.image_settings.file_format = "PNG"
bpy.ops.render.render(write_still=True)
# LED strip preview (rows 408-1031 of 1440, die-cut applied)
try:
    import numpy as np
    img = bpy.data.images.load(prefix + "_render.png"); Wp, Hp = img.size; a = (np.array(img.pixels[:]).reshape(Hp, Wp, 4)[::-1, :, :3] * 255).astype(np.uint8)
    st = a[int(Hp * 408 / 1440):int(Hp * 1031 / 1440)]
    out = bpy.data.images.new("strip", st.shape[1], st.shape[0]); px = np.ones((st.shape[0], st.shape[1], 4), np.float32); px[..., :3] = st[::-1] / 255.0
    out.pixels = px.ravel(); out.filepath_raw = prefix + "_strip.png"; out.file_format = "PNG"; out.save()
except Exception as e: print("strip preview skipped:", e)
print("ok", prefix)
