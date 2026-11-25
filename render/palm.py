"""A palm for the renders and the hill's tree photographs: Poly Haven has none. Built from simple geometry: a curved,
ringed trunk and a crown of arching fronds, each a spine with leaflets (16 green, 4 dead ones hanging below)."""
import math
import bpy
import numpy as np
from mathutils import Vector

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
