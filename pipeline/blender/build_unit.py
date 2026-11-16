"""
build_unit.py: builds an interior unit from a JSON spec with headless Blender,
pre-computes ("bakes") its lighting as separate light layers, and exports
everything the web viewer needs.

    python pipeline/blender/build_unit.py \
        --spec pipeline/blender/specs/demo-unit-villa-morra.json \
        --out  public/home/demo-unit-villa-morra

Requirements: Python 3.13 with `pip install bpy==5.3.0 numpy`, and the CC0
assets from `npm run assets:polyhaven` in pipeline/.cache/polyhaven.

Light layers
------------
Every light source is baked into its own lightmap (irradiance only, no albedo):

* sky: daylight entering through the windows (direct + bounced)
* sun_<season>_<hh:mm>: only the *bounced* sunlight at that time of day.
  Direct sunlight is drawn live in the browser, so the sun patch moves.
* one layer per artificial light (lamp, pendant, ceiling, kitchen, tv)

The browser mixes the layers with live weights: switching on a lamp fades its
layer in, the time slider blends between sun keys. That gives near-photoreal
light at a cost a phone or a VR headset can afford.

Outputs (in --out):
    unit.glb            geometry + materials, UV0 for textures, UV1 for lightmaps
    lm_<layer>.png      lightmaps, RGBE-encoded HDR in an 8-bit PNG
    bg_day.jpg / bg_night.jpg   equirectangular views for the windows
    manifest.json       layers, sun keys, views, interactive objects
    preview.jpg         path-traced reference render (with --preview)

Coordinates: the spec uses x = east, y = north, z = up (metres). The web side
(glTF, three.js) uses x = east, y = up, z = south.
"""

import argparse
import json
import math
import os
import struct
import sys
import time
import zlib

import bpy  # must come first: the bpy module provides bmesh and mathutils
import bmesh
import numpy as np
from mathutils import Matrix, Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CACHE = os.path.join(ROOT, "pipeline", ".cache", "polyhaven")


def log(*a):
    print("[build_unit]", *a, flush=True)


# --------------------------------------------------------------------------- #
# Solar position (same algorithm as src/shared/solar.ts)
# --------------------------------------------------------------------------- #

def sun_position(date_str, time_str, lat, lon, utc_offset):
    """Returns (azimuth from north clockwise, elevation) in degrees."""
    y, mo, d = (int(v) for v in date_str.split("-"))
    hh, mm = (int(v) for v in time_str.split(":"))
    # days since J2000.0 at the given UTC instant
    import datetime as dt
    t = dt.datetime(y, mo, d, hh, mm, tzinfo=dt.timezone(dt.timedelta(hours=utc_offset)))
    jd = t.timestamp() / 86400.0 + 2440587.5
    n = jd - 2451545.0
    rad = math.pi / 180
    L = (280.460 + 0.9856474 * n) % 360
    g = ((357.528 + 0.9856003 * n) % 360) * rad
    lam = (L + 1.915 * math.sin(g) + 0.020 * math.sin(2 * g)) * rad
    eps = (23.439 - 0.0000004 * n) * rad
    ra = math.atan2(math.cos(eps) * math.sin(lam), math.cos(lam))
    dec = math.asin(math.sin(eps) * math.sin(lam))
    gmst = (18.697374558 + 24.06570982441908 * n) % 24
    ha = (gmst * 15 + lon) * rad - ra
    phi = lat * rad
    el = math.asin(math.sin(phi) * math.sin(dec) + math.cos(phi) * math.cos(dec) * math.cos(ha))
    az = math.atan2(-math.sin(ha) * math.cos(dec),
                    math.sin(dec) * math.cos(phi) - math.cos(dec) * math.sin(phi) * math.cos(ha))
    return (math.degrees(az) % 360, math.degrees(el))


def sun_vector(az, el):
    """Unit vector pointing *towards* the sun, in spec coordinates (x east, y north, z up)."""
    a, e = math.radians(az), math.radians(el)
    return Vector((math.sin(a) * math.cos(e), math.cos(a) * math.cos(e), math.sin(e)))


def to_web(v):
    """spec / Blender (x east, y north, z up) -> three.js (x east, y up, z south)."""
    return [round(v[0], 4), round(v[2], 4), round(-v[1], 4)]


# --------------------------------------------------------------------------- #
# Materials
# --------------------------------------------------------------------------- #

_material_cache = {}


def tex_path(texture_id, kind):
    d = os.path.join(CACHE, "textures", texture_id)
    for ext in ("jpg", "png"):
        p = os.path.join(d, f"{texture_id}_{kind}_1k.{ext}")
        if os.path.exists(p):
            return p
    return None


def load_image(path, non_color=False):
    img = bpy.data.images.load(path, check_existing=True)
    if non_color:
        img.colorspace_settings.name = "Non-Color"
    return img


def make_material(name, texture=None, color=None, tint=None, roughness=None,
                  metallic=0.0, emission=None, alpha=None):
    if name in _material_cache:
        return _material_cache[name]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    bsdf.inputs["Metallic"].default_value = metallic
    if roughness is not None:
        bsdf.inputs["Roughness"].default_value = roughness
    if color is not None:
        bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    if texture:
        diff = tex_path(texture, "diff")
        if diff:
            n = nt.nodes.new("ShaderNodeTexImage")
            n.image = load_image(diff)
            out = n.outputs["Color"]
            if tint is not None:
                mix = nt.nodes.new("ShaderNodeMix")
                mix.data_type = "RGBA"
                mix.blend_type = "MULTIPLY"
                mix.inputs["Factor"].default_value = 1.0
                nt.links.new(out, mix.inputs[6])
                mix.inputs[7].default_value = (*tint, 1.0)
                out = mix.outputs[2]
            nt.links.new(out, bsdf.inputs["Base Color"])
        rough = tex_path(texture, "rough")
        if rough and roughness is None:
            n = nt.nodes.new("ShaderNodeTexImage")
            n.image = load_image(rough, non_color=True)
            nt.links.new(n.outputs["Color"], bsdf.inputs["Roughness"])
        nor = tex_path(texture, "nor_gl")
        if nor:
            n = nt.nodes.new("ShaderNodeTexImage")
            n.image = load_image(nor, non_color=True)
            nm = nt.nodes.new("ShaderNodeNormalMap")
            nm.inputs["Strength"].default_value = 0.6
            nt.links.new(n.outputs["Color"], nm.inputs["Color"])
            nt.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission[0], 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission[1]
    if alpha is not None:
        bsdf.inputs["Alpha"].default_value = alpha
    _material_cache[name] = mat
    return mat


# --------------------------------------------------------------------------- #
# Geometry helpers
# --------------------------------------------------------------------------- #

def link(obj, collection=None):
    (collection or bpy.context.scene.collection).objects.link(obj)
    return obj


def box_uv(bm, uv_layer, tile):
    """Box-projects UVs in world metres / tile, so textures keep real scale."""
    for f in bm.faces:
        n = f.normal
        ax = max(range(3), key=lambda i: abs(n[i]))
        for loop in f.loops:
            co = loop.vert.co
            if ax == 2:
                u, v = co.x, co.y
            elif ax == 0:
                u, v = co.y, co.z
            else:
                u, v = co.x, co.z
            loop[uv_layer].uv = (u / tile, v / tile)


def make_box(name, x0, x1, y0, y1, z0, z1, mat, tile=1.0, drop=(), coll=None):
    """Axis-aligned box. `drop` lists faces to delete: 'x-','x+','y-','y+','z-','z+'."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x = x0 if v.co.x < 0 else x1
        v.co.y = y0 if v.co.y < 0 else y1
        v.co.z = z0 if v.co.z < 0 else z1
    bm.normal_update()
    if drop:
        kill = []
        for f in bm.faces:
            n = f.normal
            for d in drop:
                axis = "xyz".index(d[0])
                sign = 1 if d[1] == "+" else -1
                if n[axis] * sign > 0.9:
                    kill.append(f)
        bmesh.ops.delete(bm, geom=list(set(kill)), context="FACES")
    uv = bm.loops.layers.uv.new("UVMap")
    box_uv(bm, uv, tile)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    return link(bpy.data.objects.new(name, me), coll)


def make_plane(name, corners, mat, tile=1.0, coll=None):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    vs = [bm.verts.new(c) for c in corners]
    bm.faces.new(vs)
    bm.normal_update()
    uv = bm.loops.layers.uv.new("UVMap")
    box_uv(bm, uv, tile)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    return link(bpy.data.objects.new(name, me), coll)


def make_cylinder(name, x, y, z0, z1, r, mat, segments=32, caps=True, coll=None):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=caps, cap_tris=False, segments=segments,
                          radius1=r, radius2=r, depth=z1 - z0)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(x, y, (z0 + z1) / 2))
    if not caps:
        pass
    uv = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        for loop in f.loops:
            co = loop.vert.co
            ang = math.atan2(co.y - y, co.x - x)
            loop[uv].uv = (ang / math.tau * 2 * math.pi * r, co.z)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    return link(bpy.data.objects.new(name, me), coll)


def make_pleated_curtain(name, x_anchor, x_end, y, z0, z1, mat, coll=None):
    """Pleated curtain panel. Its origin sits on the anchor edge so the web viewer
    can open/close it by scaling x."""
    width = x_end - x_anchor
    cols = max(8, int(abs(width) / 0.03))
    rows = 6
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    grid = []
    for j in range(rows + 1):
        row = []
        z = z0 + (z1 - z0) * j / rows
        for i in range(cols + 1):
            u = i / cols
            x = u * width
            dy = 0.035 * math.sin(u * abs(width) / 0.16 * math.tau)
            row.append(bm.verts.new((x, dy, z)))
        grid.append(row)
    uvl = bm.loops.layers.uv.new("UVMap")
    for j in range(rows):
        for i in range(cols):
            f = bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
            for loop in f.loops:
                co = loop.vert.co
                loop[uvl].uv = (abs(co.x) / 1.0, co.z / 1.0)
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    obj = link(bpy.data.objects.new(name, me), coll)
    obj.location = (x_anchor, y, 0)
    return obj


# --------------------------------------------------------------------------- #
# Scene building
# --------------------------------------------------------------------------- #

def build_architecture(spec, coll):
    r = spec["room"]
    w, d, h, t = r["width"], r["depth"], r["height"], r["wallThickness"]
    m = r["materials"]
    M = {
        "floor": make_material("floor", texture=m["floor"]["texture"]),
        "walls": make_material("walls", texture=m["walls"].get("texture"), color=m["walls"].get("color"),
                               tint=m["walls"].get("tint"), roughness=m["walls"].get("roughness")),
        "ceiling": make_material("ceiling", color=m["ceiling"]["color"], roughness=m["ceiling"]["roughness"]),
        "frame": make_material("window_frame", color=(0.09, 0.09, 0.1), roughness=0.35, metallic=0.7),
        "door": make_material("door", texture=m["cabinets"]["texture"]),
    }
    tw, tf = m["walls"]["tile"], m["floor"]["tile"]
    objs = []
    # floor + ceiling: single planes covering the interior
    objs.append(make_plane("floor", [(-w / 2, -d / 2, 0), (w / 2, -d / 2, 0), (w / 2, d / 2, 0), (-w / 2, d / 2, 0)], M["floor"], tf, coll))
    objs.append(make_plane("ceiling", [(-w / 2, d / 2, h), (w / 2, d / 2, h), (w / 2, -d / 2, h), (-w / 2, -d / 2, h)], M["ceiling"], 2.0, coll))

    win, door = r["window"], r["door"]
    # north wall with a window opening
    yN0, yN1 = d / 2, d / 2 + t
    objs.append(make_box("wall_n_l", -w / 2 - t, win["x0"], yN0, yN1, 0, h, M["walls"], tw, ("y+", "z-", "z+"), coll))
    objs.append(make_box("wall_n_r", win["x1"], w / 2 + t, yN0, yN1, 0, h, M["walls"], tw, ("y+", "z-", "z+"), coll))
    objs.append(make_box("wall_n_sill", win["x0"], win["x1"], yN0, yN1, 0, win["sill"], M["walls"], tw, ("y+", "z-"), coll))
    objs.append(make_box("wall_n_head", win["x0"], win["x1"], yN0, yN1, win["head"], h, M["walls"], tw, ("y+", "z+"), coll))
    # window frame: mullions + transoms (static, baked)
    fy0, fy1 = yN0 + 0.06, yN0 + 0.12
    n = max(1, round((win["x1"] - win["x0"]) / win["mullionEvery"]))
    for i in range(n + 1):
        x = win["x0"] + (win["x1"] - win["x0"]) * i / n
        objs.append(make_box(f"mullion_{i}", x - 0.025, x + 0.025, fy0, fy1, win["sill"], win["head"], M["frame"], 1.0, (), coll))
    objs.append(make_box("frame_head", win["x0"], win["x1"], fy0, fy1, win["head"] - 0.05, win["head"], M["frame"], 1.0, (), coll))
    objs.append(make_box("frame_sill", win["x0"], win["x1"], fy0, fy1, win["sill"], win["sill"] + 0.05, M["frame"], 1.0, (), coll))

    # south wall with the entrance door
    yS0, yS1 = -d / 2 - t, -d / 2
    objs.append(make_box("wall_s_l", -w / 2 - t, door["x0"], yS0, yS1, 0, h, M["walls"], tw, ("y-", "z-", "z+"), coll))
    objs.append(make_box("wall_s_r", door["x1"], w / 2 + t, yS0, yS1, 0, h, M["walls"], tw, ("y-", "z-", "z+"), coll))
    objs.append(make_box("wall_s_head", door["x0"], door["x1"], yS0, yS1, door["head"], h, M["walls"], tw, ("y-", "z+"), coll))
    # the door leaf stays a separate object: the AR portal hides it to open the doorway
    door_leaf = make_box("door_leaf", door["x0"], door["x1"], yS0 + 0.06, yS0 + 0.11, 0, door["head"], M["door"], 1.0, (), coll)
    door_leaf["role"] = "door"
    # east / west walls
    objs.append(make_box("wall_e", w / 2, w / 2 + t, -d / 2, d / 2, 0, h, M["walls"], tw, ("x+", "z-", "z+", "y-", "y+"), coll))
    objs.append(make_box("wall_w", -w / 2 - t, -w / 2, -d / 2, d / 2, 0, h, M["walls"], tw, ("x-", "z-", "z+", "y-", "y+"), coll))

    # glass: exported for the web, hidden while baking
    glass = make_plane("glass_window", [(win["x0"], fy0 + 0.03, win["sill"]), (win["x1"], fy0 + 0.03, win["sill"]),
                                        (win["x1"], fy0 + 0.03, win["head"]), (win["x0"], fy0 + 0.03, win["head"])],
                       make_material("glass", color=(0.9, 0.95, 1.0), roughness=0.02, alpha=0.08), 1.0, coll)
    glass["role"] = "glass"
    return objs, [glass], [door_leaf]


def build_kitchen(spec, coll):
    k, r = spec["kitchen"], spec["room"]
    m = r["materials"]
    oak = make_material("cabinets", texture=m["cabinets"]["texture"])
    marble = make_material("counter", texture=m["counter"]["texture"], roughness=0.18)
    plinth = make_material("plinth", color=(0.05, 0.05, 0.05), roughness=0.6)
    steel = make_material("steel", color=(0.75, 0.75, 0.76), roughness=0.22, metallic=1.0)
    blackglass = make_material("cooktop", color=(0.01, 0.01, 0.012), roughness=0.05)
    objs, dyn = [], []
    tc, tk = m["counter"]["tile"], m["cabinets"]["tile"]
    for key in ("backCounter", "island"):
        c = k[key]
        y0, y1 = c["y"] - c["depth"] / 2, c["y"] + c["depth"] / 2
        objs.append(make_box(f"{key}_plinth", c["x0"] + 0.05, c["x1"] - 0.05, y0 + 0.06, y1 - 0.06, 0, 0.1, plinth, 1, ("z-",), coll))
        objs.append(make_box(f"{key}_body", c["x0"], c["x1"], y0, y1, 0.1, c["height"] - 0.04, oak, tk, ("z-",), coll))
        objs.append(make_box(f"{key}_top", c["x0"] - 0.02, c["x1"] + 0.02, y0 - 0.02, y1 + 0.02, c["height"] - 0.04, c["height"], marble, tc, (), coll))
    bc = k["backCounter"]
    wall_y = -r["depth"] / 2
    # backsplash + floating shelf
    objs.append(make_box("backsplash", bc["x0"], bc["x1"], wall_y, wall_y + 0.012, bc["height"], k["shelf"]["z"], marble, tc, ("y-",), coll))
    objs.append(make_box("shelf", k["shelf"]["x0"], k["shelf"]["x1"], wall_y, wall_y + 0.28, k["shelf"]["z"], k["shelf"]["z"] + 0.045, oak, tk, (), coll))
    # cooktop on the back counter
    cx = k["cooktop"]["x"]
    objs.append(make_box("cooktop", cx - 0.3, cx + 0.3, bc["y"] - 0.25, bc["y"] + 0.25, bc["height"], bc["height"] + 0.006, blackglass, 1, ("z-",), coll))
    # sink in the island + faucet (interactive, not baked)
    isl = k["island"]
    sx = k["sink"]["x"]
    objs.append(make_box("sink", sx - 0.3, sx + 0.3, isl["y"] - 0.2, isl["y"] + 0.2, isl["height"] + 0.001, isl["height"] + 0.003, steel, 1, ("z-",), coll))
    fy = isl["y"] + 0.3
    base = make_cylinder("faucet_base", sx, fy, isl["height"], isl["height"] + 0.32, 0.018, steel, 24, True, coll)
    spout = make_box("faucet_spout", sx - 0.012, sx + 0.012, fy - 0.22, fy, isl["height"] + 0.30, isl["height"] + 0.33, steel, 1, (), coll)
    handle = make_box("faucet_handle", sx + 0.018, sx + 0.07, fy - 0.01, fy + 0.01, isl["height"] + 0.16, isl["height"] + 0.18, steel, 1, (), coll)
    for o in (base, spout, handle):
        o["role"] = "faucet"
    dyn += [base, spout, handle]
    return objs, dyn


def build_fixtures(spec, coll):
    """Lamps, TV, ceiling spots, curtains. Returns (static, dynamic) objects."""
    r = spec["room"]
    h, w = r["height"], r["width"]
    black = make_material("black_metal", color=(0.02, 0.02, 0.02), roughness=0.4, metallic=0.8)
    static, dyn = [], []
    for L in spec["lights"]:
        if L.get("fixture") == "floorLamp":
            x, y, z = L["at"]
            static.append(make_cylinder("lamp_base", x, y, 0, 0.025, 0.16, black, 32, True, coll))
            static.append(make_cylinder("lamp_pole", x, y, 0.025, z - 0.1, 0.012, black, 16, True, coll))
            shade_mat = make_material("lamp_shade", texture=r["materials"]["curtain"]["texture"], tint=(1.0, 0.95, 0.86))
            shade = make_cylinder("lamp_shade", x, y, z - 0.16, z + 0.16, 0.22, shade_mat, 40, False, coll)
            shade["role"] = "lampshade"
            shade["light"] = L["id"]
            dyn.append(shade)
        if L["type"] == "SPOTS":
            ring_mat = make_material("spot_ring", color=(0.92, 0.92, 0.92), roughness=0.4)
            emit_mat = make_material("spot_emit", color=(1.0, 0.95, 0.85), roughness=0.3)
            for i, (x, y) in enumerate(L["positions"]):
                static.append(make_cylinder(f"spot_ring_{i}", x, y, h - 0.012, h, 0.06, ring_mat, 24, True, coll))
                e = make_cylinder(f"spot_emit_{i}", x, y, h - 0.014, h - 0.012, 0.04, emit_mat, 24, True, coll)
                e["role"] = "emitter"
                e["light"] = L["id"]
                dyn.append(e)
        if L["type"] == "STRIP":
            strip_mat = make_material("strip_emit", color=(1.0, 0.95, 0.85), roughness=0.3)
            e = make_box("strip_emit", L["x0"], L["x1"], L["y"], L["y"] + 0.02, L["z"] - 0.004, L["z"], strip_mat, 1, (), coll)
            e["role"] = "emitter"
            e["light"] = L["id"]
            dyn.append(e)
        if L["type"] == "TV":
            x, y, z = L["at"]
            sw, sh = L["size"]
            frame = make_box("tv_frame", -w / 2 + 0.02, -w / 2 + 0.06, y - sw / 2 - 0.02, y + sw / 2 + 0.02, z - sh / 2 - 0.02, z + sh / 2 + 0.02, black, 1, (), coll)
            static.append(frame)
            scr_mat = make_material("tv_screen", color=(0.005, 0.005, 0.007), roughness=0.08)
            # counter-clockwise seen from the room (+x), u grows towards +y (viewer's right)
            scr = make_plane("tv_screen", [(-w / 2 + 0.061, y - sw / 2, z - sh / 2), (-w / 2 + 0.061, y + sw / 2, z - sh / 2),
                                           (-w / 2 + 0.061, y + sw / 2, z + sh / 2), (-w / 2 + 0.061, y - sw / 2, z + sh / 2)], scr_mat, 1, coll)
            # UVs 0..1 across the screen so the web viewer can play content on it
            uv = scr.data.uv_layers[0].data
            for i, c in enumerate([(0, 0), (1, 0), (1, 1), (0, 1)]):
                uv[i].uv = c
            scr["role"] = "tv"
            scr["light"] = L["id"]
            dyn.append(scr)

    c = spec["interactive"]["curtains"]
    curtain_mat = make_material("curtain", texture=r["materials"]["curtain"]["texture"], tint=r["materials"]["curtain"].get("tint"))
    mid = (c["x0"] + c["x1"]) / 2
    left = make_pleated_curtain("curtain_left", c["x0"], mid, c["y"], c["z0"], c["z1"], curtain_mat, coll)
    right = make_pleated_curtain("curtain_right", c["x1"], mid, c["y"], c["z0"], c["z1"], curtain_mat, coll)
    for o in (left, right):
        o["role"] = "curtain"
    dyn += [left, right]
    track = make_box("curtain_track", c["x0"], c["x1"], c["y"] - 0.02, c["y"] + 0.02, c["z1"], c["z1"] + 0.03, black, 1, (), coll)
    static.append(track)
    return static, dyn


_placed = {}


def top_of(name):
    o = _placed.get(name)
    if o is None:
        return 0.0
    co = np.empty(len(o.data.vertices) * 3, dtype=np.float32)
    o.data.vertices.foreach_get("co", co)
    return float(co.reshape(-1, 3)[:, 2].max() + o.location.z)


def import_model(entry, spec, coll):
    path = os.path.join(CACHE, "models", entry["model"], f"{entry['model']}.gltf")
    if not os.path.exists(path):
        log("missing model", entry["model"], "(run npm run assets:polyhaven)")
        return None
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    for o in new:
        # some assets ship animations (cabinet doors...) that would override placement
        o.animation_data_clear()
    meshes = [o for o in new if o.type == "MESH"]
    if not meshes:
        return None
    # bake parent transforms into the meshes, drop empties
    for o in meshes:
        mw = o.matrix_world.copy()
        o.parent = None
        o.matrix_world = mw
    for o in new:
        if o.type != "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    if len(meshes) > 1:
        with bpy.context.temp_override(active_object=meshes[0], selected_editable_objects=meshes, selected_objects=meshes):
            bpy.ops.object.join()
    obj = meshes[0]
    obj.name = entry.get("id") or entry["model"]
    # apply transform into the mesh
    obj.data.transform(obj.matrix_world)
    obj.matrix_world = Matrix.Identity(4)
    # keep only the first UV layer, named UVMap
    while len(obj.data.uv_layers) > 1:
        obj.data.uv_layers.remove(obj.data.uv_layers[-1])
    if len(obj.data.uv_layers) == 0:
        obj.data.uv_layers.new(name="UVMap")
    obj.data.uv_layers[0].name = "UVMap"

    co = np.empty(len(obj.data.vertices) * 3, dtype=np.float32)
    obj.data.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3)
    mn, mx = co.min(0), co.max(0)
    size = mx - mn
    s = 1.0
    if "fit" in entry:
        s = entry["fit"] / max(size[0], size[1])
    elif "fitHeight" in entry:
        s = entry["fitHeight"] / size[2]
    centre = Vector(((mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, mn[2]))
    rot = Matrix.Rotation(math.radians(entry.get("rot", 0)), 4, "Z")
    obj.data.transform(rot @ Matrix.Scale(s, 4) @ Matrix.Translation(-centre))
    x, y, z = entry["at"]
    if entry.get("on"):
        z = top_of(entry["on"]) + z
    if entry.get("hang"):
        z = spec["room"]["height"] - size[2] * s
    obj.location = (x, y, z)

    if entry.get("decimate"):
        mod = obj.modifiers.new("decimate", "DECIMATE")
        mod.ratio = entry["decimate"]
        with bpy.context.temp_override(object=obj, active_object=obj):
            bpy.ops.object.modifier_apply(modifier=mod.name)
    if obj.users_collection and coll not in obj.users_collection:
        for c in obj.users_collection:
            c.objects.unlink(obj)
        coll.objects.link(obj)
    obj["model"] = entry["model"]
    _placed.setdefault(entry.get("id") or entry["model"], obj)
    if entry.get("id"):
        obj["fid"] = entry["id"]
    return obj


def make_lights(spec, coll):
    """Creates every light. Returns {layer_id: [light objects]} for the artificial lights."""
    r = spec["room"]
    w = r["width"]
    layers = {}
    for L in spec["lights"]:
        objs = []
        col = tuple(L["color"])
        if L["type"] == "POINT":
            ld = bpy.data.lights.new(L["id"], "POINT")
            ld.energy = L["power"]
            ld.shadow_soft_size = L.get("radius", 0.1)
            ld.color = col
            o = link(bpy.data.objects.new(L["id"], ld), coll)
            o.location = L["at"]
            objs.append(o)
        elif L["type"] == "SPOTS":
            for i, (x, y) in enumerate(L["positions"]):
                ld = bpy.data.lights.new(f"{L['id']}_{i}", "SPOT")
                ld.energy = L["power"]
                ld.spot_size = math.radians(75)
                ld.spot_blend = 0.6
                ld.shadow_soft_size = 0.03
                ld.color = col
                o = link(bpy.data.objects.new(f"{L['id']}_{i}", ld), coll)
                o.location = (x, y, r["height"] - 0.02)
                objs.append(o)
        elif L["type"] == "STRIP":
            ld = bpy.data.lights.new(L["id"], "AREA")
            ld.shape = "RECTANGLE"
            ld.size = L["x1"] - L["x0"]
            ld.size_y = 0.03
            ld.energy = L["power"]
            ld.color = col
            o = link(bpy.data.objects.new(L["id"], ld), coll)
            o.location = ((L["x0"] + L["x1"]) / 2, L["y"] + 0.01, L["z"] - 0.006)
            objs.append(o)
        elif L["type"] == "TV":
            x, y, z = L["at"]
            ld = bpy.data.lights.new(L["id"], "AREA")
            ld.shape = "RECTANGLE"
            ld.size = L["size"][1]
            ld.size_y = L["size"][0]
            ld.energy = L["power"]
            ld.color = col
            o = link(bpy.data.objects.new(L["id"], ld), coll)
            o.location = (-w / 2 + 0.075, y, z)
            o.rotation_euler = (0, -math.pi / 2, 0)
            objs.append(o)
        layers[L["id"]] = objs
    return layers


def make_sun(spec, coll):
    ld = bpy.data.lights.new("sun", "SUN")
    ld.energy = spec["sun"]["strength"]
    ld.angle = math.radians(spec["sun"].get("angle", 0.6))
    ld.color = (1.0, 0.96, 0.9)
    return link(bpy.data.objects.new("sun", ld), coll)


def aim_sun(sun, az, el):
    v = sun_vector(az, el)
    sun.rotation_euler = v.to_track_quat("Z", "Y").to_euler()


def setup_world(spec):
    world = bpy.data.worlds.new("sky")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (*spec["sky"]["color"], 1.0)
    bg.inputs["Strength"].default_value = spec["sky"]["strength"]
    return bg


# --------------------------------------------------------------------------- #
# Lightmap UVs + baking
# --------------------------------------------------------------------------- #

def join(objs, name):
    objs = [o for o in objs if o is not None]
    for o in objs:
        if len(o.data.uv_layers) == 0:
            o.data.uv_layers.new(name="UVMap")
        o.data.uv_layers[0].name = "UVMap"
    with bpy.context.temp_override(active_object=objs[0], selected_editable_objects=objs, selected_objects=objs):
        bpy.ops.object.join()
    obj = objs[0]
    obj.name = name
    obj.data.transform(obj.matrix_world)
    obj.matrix_world = Matrix.Identity(4)
    return obj


def make_lightmap_uvs(obj, margin, angle=66):
    obj.data.uv_layers.new(name="Lightmap")
    obj.data.uv_layers.active = obj.data.uv_layers["Lightmap"]
    obj.data.uv_layers["UVMap"].active_render = True
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(angle), island_margin=0.0, area_weight=0.0,
                             correct_aspect=True, scale_to_bounds=False)
    bpy.ops.uv.select_all(action="SELECT")
    bpy.ops.uv.average_islands_scale()
    bpy.ops.uv.pack_islands(rotate=True, margin=margin)
    bpy.ops.object.mode_set(mode="OBJECT")


def attach_bake_image(obj, image):
    for slot in obj.material_slots:
        mat = slot.material
        if mat is None:
            continue
        nt = mat.node_tree
        node = nt.nodes.get("__bake__") or nt.nodes.new("ShaderNodeTexImage")
        node.name = "__bake__"
        node.image = image
        node.interpolation = "Closest"
        nt.nodes.active = node


def detach_bake_image(obj):
    for slot in obj.material_slots:
        if slot.material and slot.material.node_tree.nodes.get("__bake__"):
            slot.material.node_tree.nodes.remove(slot.material.node_tree.nodes["__bake__"])


# --------------------------------------------------------------------------- #
# Denoising (edge-aware à-trous wavelet filter in lightmap space)
# --------------------------------------------------------------------------- #

def _shift(a, dy, dx):
    out = np.zeros_like(a)
    h, w = a.shape[:2]
    ys, yd = (slice(dy, h), slice(0, h - dy)) if dy >= 0 else (slice(0, h + dy), slice(-dy, h))
    xs, xd = (slice(dx, w), slice(0, w - dx)) if dx >= 0 else (slice(0, w + dx), slice(-dx, w))
    out[yd, xd] = a[ys, xs]
    return out


def denoise(img, mask, pos, nor, iterations=4, sigma_p=0.08, sigma_n=0.35, sigma_l=4.0):
    """img: HxWx3 irradiance, mask: HxW (1 = covered texel), pos/nor: HxWx3 guides."""
    kernel = [1 / 16, 1 / 4, 3 / 8, 1 / 4, 1 / 16]
    c = img * mask[..., None]
    for it in range(iterations):
        step = 1 << it
        lum = c.mean(axis=2)
        acc = np.zeros_like(c)
        wsum = np.zeros(mask.shape, dtype=np.float32)
        for j, kj in enumerate(kernel):
            for i, ki in enumerate(kernel):
                dy, dx = (j - 2) * step, (i - 2) * step
                cs = _shift(c, dy, dx)
                ms = _shift(mask, dy, dx)
                ps = _shift(pos, dy, dx)
                ns = _shift(nor, dy, dx)
                ls = _shift(lum, dy, dx)
                dp = np.sum((ps - pos) ** 2, axis=2) / (sigma_p * sigma_p * (1 + step))
                dn = np.maximum(0.0, 1.0 - np.sum(ns * nor, axis=2)) / sigma_n
                dl = np.abs(ls - lum) / (sigma_l * np.sqrt(np.maximum(lum, 1e-4)) + 1e-4)
                wgt = kj * ki * ms * np.exp(-dp - dn - dl)
                acc += cs * wgt[..., None]
                wsum += wgt
        c = np.where(wsum[..., None] > 1e-6, acc / np.maximum(wsum, 1e-6)[..., None], c) * mask[..., None]
    return c


def dilate(img, mask, steps=12):
    """Pushes covered texels outwards so bilinear filtering never reads empty space."""
    img = img.copy()
    m = mask.copy()
    for _ in range(steps):
        acc = np.zeros_like(img)
        cnt = np.zeros(m.shape, dtype=np.float32)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            acc += _shift(img * m[..., None], dy, dx)
            cnt += _shift(m, dy, dx)
        grow = (m == 0) & (cnt > 0)
        img[grow] = acc[grow] / cnt[grow][..., None]
        m = np.where(grow, 1.0, m).astype(np.float32)
    return img


# --------------------------------------------------------------------------- #
# Output encoding
# --------------------------------------------------------------------------- #

def write_png_rgba(path, arr):
    """Minimal PNG writer (RGBA8), rows top-to-bottom. Avoids any alpha premultiplication."""
    h, w, _ = arr.shape
    raw = b"".join(b"\x00" + arr[y].tobytes() for y in range(h))

    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


def encode_rgbe(rgb):
    m = rgb.max(axis=2)
    mant, ex = np.frexp(m)
    scale = np.where(m > 1e-9, mant * 256.0 / np.maximum(m, 1e-9), 0.0)
    out = np.zeros(rgb.shape[:2] + (4,), dtype=np.uint8)
    out[..., :3] = np.clip(np.floor(rgb * scale[..., None]), 0, 255).astype(np.uint8)
    out[..., 3] = np.where(m > 1e-9, np.clip(ex + 128, 0, 255), 0).astype(np.uint8)
    return out


def save_lightmap(path, rgb):
    # Blender stores rows bottom-to-top; PNG wants top-to-bottom (glTF UV convention).
    write_png_rgba(path, encode_rgbe(np.ascontiguousarray(rgb[::-1])))


def save_background(src, dst, width=4096):
    if not os.path.exists(src):
        return False
    img = bpy.data.images.load(src)
    img.scale(width, width // 2)
    img.filepath_raw = dst
    img.file_format = "JPEG"
    img.save(filepath=dst, quality=82)
    return True


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #

def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    ap = argparse.ArgumentParser()
    ap.add_argument("--spec", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--size", type=int, default=1024, help="lightmap resolution")
    ap.add_argument("--samples", type=int, default=96, help="bake samples per texel")
    ap.add_argument("--seasons", default="invierno,verano")
    ap.add_argument("--preview", action="store_true", help="also path-trace a reference render")
    ap.add_argument("--preview-only", action="store_true")
    ap.add_argument("--save-blend", action="store_true")
    args = ap.parse_args(argv)

    spec = json.load(open(args.spec))
    out = os.path.abspath(args.out)
    os.makedirs(out, exist_ok=True)
    t0 = time.time()

    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.max_bounces = 6
    sc.cycles.diffuse_bounces = 4
    sc.cycles.glossy_bounces = 2
    sc.cycles.transmission_bounces = 4
    sc.cycles.transparent_max_bounces = 8
    sc.view_settings.view_transform = "AgX"

    coll = bpy.data.collections.new("unit")
    sc.collection.children.link(coll)

    log("building architecture, kitchen, fixtures")
    arch, glass, arch_dyn = build_architecture(spec, coll)
    kitchen, kitchen_dyn = build_kitchen(spec, coll)
    fix_static, fix_dyn = build_fixtures(spec, coll)

    log("importing furniture")
    baked_furniture, props = [], []
    for e in spec["furniture"]:
        o = import_model(e, spec, coll)
        if o is None:
            continue
        (baked_furniture if e.get("bake") else props).append(o)

    light_layers = make_lights(spec, coll)
    sun = make_sun(spec, coll)
    world_bg = setup_world(spec)

    if args.save_blend:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, "unit_source.blend"))

    if args.preview or args.preview_only:
        render_preview(spec, sc, sun, glass + [o for o in fix_dyn if o.get("role") == "curtain"], out)
        if args.preview_only:
            return

    # ---- static meshes + lightmap UVs ---------------------------------------
    # Two atlases: architecture (walls, floor, kitchen, fixtures: big smooth islands) and
    # furniture (many small islands). Keeping them apart stops the furniture from eating
    # the room's texel budget.
    log("joining static geometry and unwrapping lightmap UVs")
    atlases = []
    arch_obj = join(arch + kitchen + fix_static, "static_arch")
    arch_obj["role"] = "static"
    arch_obj["atlas"] = "arch"
    make_lightmap_uvs(arch_obj, 3.0 / args.size, angle=66)
    atlases.append({"key": "arch", "obj": arch_obj, "size": args.size, "prefix": "lm"})
    if baked_furniture:
        furn_obj = join(baked_furniture, "static_furniture")
        furn_obj["role"] = "static"
        furn_obj["atlas"] = "furniture"
        fsize = args.size // 2
        make_lightmap_uvs(furn_obj, 2.0 / fsize, angle=78)
        atlases.append({"key": "furniture", "obj": furn_obj, "size": fsize, "prefix": "lmf"})

    # hide what must not block light while baking (glass, curtains)
    for o in glass + [o for o in fix_dyn if o.get("role") == "curtain"]:
        o.hide_render = True

    all_lights = [o for o in bpy.data.objects if o.type == "LIGHT"]

    def only(lights, sky=False):
        for o in all_lights:
            o.hide_render = o not in lights
        world_bg.inputs["Strength"].default_value = spec["sky"]["strength"] if sky else 0.0

    # one bake image + denoiser guides per atlas and per resolution ("full" / "half")
    images = {}

    def prepare(res):
        """Attaches the right images for this resolution and bakes guides once."""
        for a in atlases:
            size = a["size"] if res == "full" else max(128, a["size"] // 2)
            key = (a["key"], res)
            if key not in images:
                img = bpy.data.images.new(f"__lm_{a['key']}_{res}__", size, size, alpha=True, float_buffer=True)
                img.colorspace_settings.name = "Non-Color"
                images[key] = {"img": img, "size": size}
            attach_bake_image(a["obj"], images[key]["img"])
        need = [a for a in atlases if "pos" not in images[(a["key"], res)]]
        if need:
            only([])
            bake_all("POSITION", None, 1)
            for a in atlases:
                e = images[(a["key"], res)]
                px = read(e["img"])
                e["mask"] = px[..., 3].copy()
                e["pos"] = px[..., :3].copy()
            bake_all("NORMAL", None, 1)
            for a in atlases:
                e = images[(a["key"], res)]
                e["nor"] = read(e["img"])[..., :3] * 2 - 1
                log(f"  atlas {a['key']} {res}: {e['size']}px, coverage {e['mask'].mean() * 100:.1f}%")

    def read(img):
        n = img.size[0]
        px = np.empty(n * n * 4, dtype=np.float32)
        img.pixels.foreach_get(px)
        return px.reshape(n, n, 4)

    def bake_all(bake_type, passes, samples):
        sc.cycles.samples = samples
        for o in bpy.context.view_layer.objects:
            o.select_set(False)
        for a in atlases:
            a["obj"].select_set(True)
        bpy.context.view_layer.objects.active = atlases[0]["obj"]
        kw = dict(type=bake_type, margin=0, use_clear=True, target="IMAGE_TEXTURES")
        if passes is not None:
            kw["pass_filter"] = passes
        t = time.time()
        bpy.ops.object.bake(**kw)
        log(f"  baked {bake_type} {sorted(passes) if passes else ''} in {time.time() - t:.1f}s")

    def bake_layer(lid, lights, sky, passes, res="full"):
        prepare(res)
        only(lights, sky)
        bake_all("DIFFUSE", passes, args.samples)
        files, means = {}, []
        for a in atlases:
            e = images[(a["key"], res)]
            raw = read(e["img"])[..., :3]
            clean = denoise(raw, e["mask"], e["pos"], e["nor"])
            clean = dilate(clean, e["mask"])
            fname = f"{a['prefix']}_{lid}.png"
            save_lightmap(os.path.join(out, fname), clean)
            files[a["key"]] = {"file": fname, "size": e["size"]}
            means.append(float(clean[e["mask"] > 0].mean()) if e["mask"].any() else 0.0)
        return files, round(means[0], 5)

    manifest_layers = []
    log("baking: sky")
    files, avg = bake_layer("sky", [], True, {"DIRECT", "INDIRECT"})
    manifest_layers.append({"id": "sky", "kind": "sky", "atlases": files, "mean": avg})

    for L in spec["lights"]:
        log(f"baking: {L['id']}")
        files, avg = bake_layer(L["id"], light_layers[L["id"]], False, {"DIRECT", "INDIRECT"})
        manifest_layers.append({"id": L["id"], "kind": "light", "atlases": files, "label": L["label"],
                                "color": L["color"], "mean": avg})

    loc = spec["location"]
    seasons_out = {}
    for season in [s for s in args.seasons.split(",") if s]:
        sd = spec["sun"]["dates"][season]
        keys = []
        for tkey in sd["keys"]:
            az, el = sun_position(sd["date"], tkey, loc["lat"], loc["lon"], loc["utcOffset"])
            lid = f"sun_{season}_{tkey.replace(':', '')}"
            entry = {"time": tkey, "azimuth": round(az, 2), "elevation": round(el, 2)}
            if el > 0.5:
                aim_sun(sun, az, el)
                log(f"baking: {lid} (az {az:.1f}°, el {el:.1f}°)")
                # bounced light only (direct sunlight is drawn live in the browser); it is
                # smooth, so half resolution is plenty
                files, avg = bake_layer(lid, [sun], False, {"INDIRECT"}, res="half")
                manifest_layers.append({"id": lid, "kind": "sun", "season": season, "time": tkey,
                                        "atlases": files, "mean": avg})
                entry["layer"] = lid
            keys.append(entry)
        seasons_out[season] = {"date": sd["date"], "keys": keys}

    for a in atlases:
        detach_bake_image(a["obj"])
    for e in images.values():
        bpy.data.images.remove(e["img"])
    coverage = {a["key"]: round(float(images[(a["key"], "full")]["mask"].mean()), 3) for a in atlases}
    for o in glass + fix_dyn:
        o.hide_render = False

    # ---- backgrounds for the windows ---------------------------------------
    # day: a panorama (placeholder until the drone shoots the real view from this floor);
    # night is drawn procedurally in the browser (sky gradient + city lights)
    view = spec.get("view", {})
    bg = {"offset": view.get("offset", 0.0)}
    if view.get("day") and save_background(os.path.join(CACHE, "hdris", f"{view['day']}_tonemapped.jpg"), os.path.join(out, "bg_day.jpg")):
        bg["day"] = "bg_day.jpg"

    # ---- export -------------------------------------------------------------
    for o in list(bpy.data.objects):
        if o.type == "LIGHT":
            bpy.data.objects.remove(o, do_unlink=True)
    log("exporting glb")
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(out, "unit.glb"), export_format="GLB",
        export_texcoords=True, export_normals=True, export_extras=True,
        export_image_format="JPEG", export_jpeg_quality=82,
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
        export_draco_texcoord_quantization=14,
        export_cameras=False, export_lights=False, export_yup=True, export_apply=True,
    )

    r = spec["room"]
    manifest = {
        "id": spec["id"],
        "title": spec["title"],
        "location": spec["location"],
        "floorHeight": spec.get("floorHeight"),
        "model": "unit.glb",
        "lightmap": {"encoding": "rgbe", "samples": args.samples,
                     "atlases": {a["key"]: a["size"] for a in atlases}},
        "layers": manifest_layers,
        "sun": {"strength": spec["sun"]["strength"], "seasons": seasons_out},
        "sky": spec["sky"],
        "north": to_web((0, 1, 0)),
        "room": {"min": to_web((-r["width"] / 2, r["depth"] / 2, 0)), "max": to_web((r["width"] / 2, -r["depth"] / 2, r["height"]))},
        "window": {
            "min": to_web((r["window"]["x0"], r["depth"] / 2, r["window"]["sill"])),
            "max": to_web((r["window"]["x1"], r["depth"] / 2, r["window"]["head"])),
        },
        "background": bg,
        "views": [{"id": v["id"], "label": v["label"], "at": to_web(v["at"]), "look": to_web(v["look"])} for v in spec["views"]],
        "lights": [{"id": L["id"], "label": L["label"], "color": L["color"],
                    "at": to_web(L["at"]) if "at" in L else None} for L in spec["lights"]],
        "interactive": {
            "faucet": {"at": to_web((spec["interactive"]["faucet"]["x"], spec["kitchen"]["island"]["y"] + 0.08, spec["kitchen"]["island"]["height"] + 0.3))},
            "steam": {"object": spec["interactive"]["steam"]["from"]},
        },
        "build": {"seconds": round(time.time() - t0, 1), "blender": bpy.app.version_string, "coverage": coverage},
    }
    with open(os.path.join(out, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    log(f"done in {time.time() - t0:.0f}s → {out}")


def render_preview(spec, sc, sun, hidden, out):
    """Path-traced reference renders of every view (winter, 15:00) plus a top-down layout."""
    log("rendering previews")
    loc = spec["location"]
    sd = spec["sun"]["dates"]["invierno"]
    az, el = sun_position(sd["date"], "15:00", loc["lat"], loc["lon"], loc["utcOffset"])
    aim_sun(sun, az, el)
    for o in hidden:
        o.hide_render = True
    cam_data = bpy.data.cameras.new("preview")
    cam = link(bpy.data.objects.new("preview", cam_data))
    sc.camera = cam
    sc.render.image_settings.file_format = "JPEG"
    shots = [(v["id"], v["at"], v["look"], 18, 1280, 720, 64) for v in spec["views"]]
    r = spec["room"]
    shots.append(("plan", (0, 0, r["height"] - 0.05), (0, 0, 0), None, 960, 720, 24))
    for sid, at, look, lens, rx, ry, spp in shots:
        sc.render.resolution_x, sc.render.resolution_y = rx, ry
        sc.cycles.samples = spp
        if lens is None:
            cam_data.type = "ORTHO"
            cam_data.ortho_scale = r["width"] + 0.6
            cam.location = at
            cam.rotation_euler = (0, 0, 0)
        else:
            cam_data.type = "PERSP"
            cam_data.lens = lens
            cam.location = at
            cam.rotation_euler = (Vector(look) - Vector(at)).to_track_quat("-Z", "Y").to_euler()
        sc.render.filepath = os.path.join(out, f"preview_{sid}.jpg")
        t = time.time()
        bpy.ops.render.render(write_still=True)
        log(f"  preview {sid} in {time.time() - t:.0f}s")
    bpy.data.objects.remove(cam, do_unlink=True)
    for o in hidden:
        o.hide_render = False


if __name__ == "__main__":
    main()
