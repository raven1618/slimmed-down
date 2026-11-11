"""Hand-specified manga margins (S4 method): zones in screentone, crowd stipple, tier/roof/board curves, floodlights,
tunnel/ceiling perspective, all in canvas percent (x 0-100 of 3360, y 0-100 of 1440). Returns float tone image + ink mask."""
import math, random, numpy as np, cv2
from PIL import Image, ImageDraw
W, H = 3360, 1440
def P(p): return (p[0] * W / 100, p[1] * H / 100)
def quad(a, m, b, n=40):
    t = np.linspace(0, 1, n); return [((1 - u) ** 2 * a[0] + 2 * (1 - u) * u * m[0] + u ** 2 * b[0], (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * m[1] + u ** 2 * b[1]) for u in t]
def band(top, bot): return top + bot[::-1]
L = lambda *pts: list(pts)
def mirror(c): return [(100 - x, y) for x, y in c]
def stadium_side(edge_x, outer_x, roof, stand_top, boards, boards2, tiers, lights, empty=False):
    """one side of a stadium bowl: each arg is a (y at ref edge, y at outer edge) pair; mid control point bows the curve."""
    def cv(y): a, b = y; mx = (edge_x + outer_x) / 2; return quad((edge_x, a), (mx, (a + b) / 2 + (0 if abs(a - b) < 1 else (b - a) * -0.15)), (outer_x, b))
    top = [(edge_x, -5), (outer_x, -5)]; bottom = [(edge_x, 105), (outer_x, 105)]
    it = [("zone", 0.75, band([(edge_x, -5), (outer_x, -5)], cv(roof)[::-1][::-1])),]
    it = [("zone", 0.75, [(edge_x, -5), (outer_x, -5)] + cv(roof)[::-1]),
          ("zone", 0.62, band(cv(roof), cv(stand_top))),
          ("zone", 0.48, band(cv(stand_top), cv(boards))), (("rows", cv(stand_top), cv(boards), 9) if empty else ("crowd", band(cv(stand_top), cv(boards)), 1400)),
          ("zone", 0.28, band(cv(boards), cv(boards2))),
          ("zone", 0.12, cv(boards2) + [(outer_x, 105), (edge_x, 105)])]
    it += [("line", 7, cv(roof)), ("line", 5, cv(stand_top)), ("line", 6, cv(boards)), ("line", 6, cv(boards2))]
    it += [("line", 4, cv(t)) for t in tiers]
    if lights: it.append(("lights", cv(roof), lights))
    return it
S = {}
S["CEP1_cancha"] = (bowl_full_def := None) or []
def tunnel_side(edge_x, outer_x, vp, top_at_edge, floor_at_edge, joints, lamp):
    def at(x, through):                       # y on the line VP -> through-point, at x
        s = (through[1] - vp[1]) / (through[0] - vp[0]); return vp[1] + (x - vp[0]) * s
    ct = (edge_x, top_at_edge); fb = (edge_x, floor_at_edge)
    c_out = (outer_x, at(outer_x, ct)); f_out = (outer_x, at(outer_x, fb))
    it = [("zone", 0.78, [(edge_x, -5), (outer_x, -5), c_out, ct]),
          ("zone", 0.6, [ct, c_out, f_out, fb]),
          ("zone", 0.3, [fb, f_out, (outer_x, 105), (edge_x, 105)]),
          ("line", 7, [ct, c_out]), ("line", 7, [fb, f_out])]
    for jx in joints: it.append(("line", 5, [(jx, at(jx, ct)), (jx, min(100, at(jx, fb)))]))
    it.append(("lights", [lamp], 1)); it.append(("streaks", [fb, f_out, (outer_x, 105), (edge_x, 105)]))
    return it
S["CEP2_tunel"] = (tunnel_side(17, 0, (50, 45), 18, 95, [13, 8.5, 3.5], (7, 68)) + tunnel_side(83, 100, (50, 45), 18, 95, [87, 91.5, 96.5], (93, 68))
                  + [("zone", 0.78, [(17, -5), (83, -5), (83, 18), (17, 18)]), ("zone", 0.62, [(17, -5), (83, -5), (83, 8), (17, 8)]), ("line", 7, [(0, 8), (100, 8)])])
def bowl_full(roof, stand_top, boards, boards2, tiers, nl):
    cv = lambda y: quad((0, y[1]), (50, y[0]), (100, y[1]))   # (y at centre, y at both edges)
    it = [("zone", 0.75, [(0, -5), (100, -5)] + cv(roof)[::-1]), ("zone", 0.62, band(cv(roof), cv(stand_top))),
          ("zone", 0.48, band(cv(stand_top), cv(boards))), ("crowd", band(cv(stand_top), cv(boards)), 3200),
          ("zone", 0.28, band(cv(boards), cv(boards2))), ("zone", 0.12, cv(boards2) + [(100, 105), (0, 105)]),
          ("line", 7, cv(roof)), ("line", 5, cv(stand_top)), ("line", 6, cv(boards)), ("line", 6, cv(boards2))]
    it += [("line", 4, cv(t)) for t in tiers] + [("lights", cv(roof), nl)]
    return it
S["CEP1_cancha"] = ([it for it in bowl_full((54, 18), (54, 26), (52, 68), (54, 71), [(56, 38), (56, 52)], 24) if it[0] != "crowd"]
    + [("zone", 0.92, [(0, -5), (100, -5)] + quad((0, 18), (50, 54), (100, 18))[::-1]),
       ("rows", quad((0, 26), (50, 54), (100, 26)), quad((0, 68), (50, 52), (100, 68)), 14),
       ("line", 6, [(14, 25), (19, 60)]), ("line", 6, [(86, 25), (81, 60)]),
       ("stripes", [(0, 62), (100, 62), (100, 100), (0, 100)], 7),
       ("wline", [(52, 61.5), (100, 92)]),
       ("goal", (47.5, 56.5), (52.5, 60.3)),
       ("lights", quad((0, 18), (50, 54), (100, 18)), 24)])
S["CEP3_penal"] = bowl_full((19, 7), (24, 13), (59, 65), (61, 69), [(35, 30), (47, 45)], 14) + [("zone", 0.3, [(0, 92), (100, 92), (100, 105), (0, 105)]), ("grass", [(0, 80), (100, 80), (100, 100), (0, 100)])]
S["CEP4_tecnico"] = ([("zone", 0.78, [(0, -5), (100, -5), (100, 15), (0, 15)]), ("zone", 0.62, [(0, 0), (19, 0), (19, 105), (0, 105)]), ("zone", 0.62, [(81, 0), (100, 0), (100, 105), (81, 105)]),
                      ("rect", (34, 10), (42, 12.5)), ("rect", (31.5, 2.5), (44.5, 6.5))]
                     + [("line", 6, [(x, 16), (x, 92)]) for x in (2.5, 7.5, 12.5, 16.5, 84, 89, 94.5)] + [("line", 6, [(0, 30), (19, 31)]), ("line", 6, [(81, 26), (100, 25)]), ("line", 8, [(0, 84), (19, 86)])])
S["CEP5_festejo"] = (stadium_side(18, 0, (2, -6), (7, 2), (52, 57), (55, 60.5), [(22, 18), (37, 37)], 0)
                    + stadium_side(82, 100, (2, -6), (7, 2), (52, 57), (55, 60.5), [(22, 18), (37, 37)], 0)
                    + [("lights", quad((19.5, 3), (15, 1.2), (11, 0)), 3), ("lights", quad((80.5, 3), (85, 1.2), (89, 0)), 3),
                       ("zone", 0.12, [(18, 84), (82, 84), (82, 105), (18, 105)]), ("wline", [(18.5, 82), (0, 86)]), ("grass", [(0, 86), (100, 86), (100, 100), (0, 100)])])
def render(name, ht):
    YY, XX = np.mgrid[0:H, 0:W]; lvl = np.zeros((H, W), np.float32)            # default white
    ink = Image.new("L", (W, H), 0); di = ImageDraw.Draw(ink); white = Image.new("L", (W, H), 0); dw = ImageDraw.Draw(white)
    random.seed(3)
    for it in S.get(name, []):
        k = it[0]
        if k == "zone":
            m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).polygon([P(p) for p in it[2]], fill=255); lvl[np.asarray(m) > 0] = {0.78: 0.6, 0.75: 0.58, 0.62: 0.45, 0.6: 0.42, 0.48: 0.3, 0.3: 0.2, 0.28: 0.18, 0.12: 0.08}.get(it[1], it[1])   # one step lighter: margins sit behind the ref
        elif k == "line": di.line([P(p) for p in it[2]], fill=255, width=it[1], joint="curve")
        elif k == "wline": di.line([P(p) for p in it[1]], fill=255, width=16); dw.line([P(p) for p in it[1]], fill=255, width=8)
        elif k == "stripes":                                                           # mowing stripes in perspective (alternate lighter bands)
            m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).polygon([P(p) for p in it[1]], fill=255); mm = np.asarray(m) > 0
            n_ = it[2]; ang = (XX - W / 2) / (YY - 0.55 * H + 1e-3); band_ = np.floor((ang + 4) * n_ / 2).astype(int) % 2 == 0
            lvl[mm & band_ & (YY > 0.6 * H)] = 0.16
        elif k == "goal":
            (a, b) = P(it[1]), P(it[2]); di.rectangle([a, b], outline=255, width=5); dw.rectangle([a[0] + 5, a[1] + 5, b[0] - 5, b[1]], outline=255, width=2)
        elif k == "rows":                                                              # empty seat rows: curves interpolated between two edges
            a_, b_, n_ = it[1], it[2], it[3]
            for j in range(1, n_ + 1):
                u = j / (n_ + 1); di.line([P(((1 - u) * pa[0] + u * pb[0], (1 - u) * pa[1] + u * pb[1])) for pa, pb in zip(a_, b_)], fill=255, width=3)
        elif k == "crowd":
            m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).polygon([P(p) for p in it[1]], fill=255); ys, xs = np.nonzero(np.asarray(m))
            if len(xs):
                for i in np.random.default_rng(5).choice(len(xs), min(it[2], len(xs)), replace=False):
                    r = 3 + 4 * abs(xs[i] / W - 0.5); di.ellipse([xs[i] - r, ys[i] - r * 0.8, xs[i] + r, ys[i] + r * 1.1], fill=255)
        elif k == "lights":
            pts = it[1]; n = it[2]; idx = np.linspace(0, len(pts) - 1, n + 2)[1:-1] if n > 1 and len(pts) > 2 else range(len(pts))
            for j, i in enumerate(idx):
                x, y = P(pts[int(round(i))]); r = 16 + 14 * abs(x / W - 0.5) * 2
                for a in np.linspace(0, 2 * math.pi, 14, endpoint=False):
                    dw.line([(x + r * 1.4 * math.cos(a), y + r * 1.0 * math.sin(a)), (x + r * 4.2 * math.cos(a), y + r * 2.6 * math.sin(a))], fill=255, width=4)
                di.ellipse([x - r - 4, y - r * 0.7 - 4, x + r + 4, y + r * 0.7 + 4], fill=255); dw.ellipse([x - r, y - r * 0.7, x + r, y + r * 0.7], fill=255)
        elif k == "rect":
            (a, b) = P(it[1]), P(it[2]); di.rectangle([a[0] - 5, a[1] - 5, b[0] + 5, b[1] + 5], fill=255); dw.rectangle([a, b], fill=255)
        elif k in ("streaks", "grass"):
            m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).polygon([P(p) for p in it[1]], fill=255); ys, xs = np.nonzero(np.asarray(m))
            if len(xs):
                rg = np.random.default_rng(9)
                for i in rg.choice(len(xs), min(260 if k == "grass" else 90, len(xs)), replace=False):
                    if k == "grass": di.line([(xs[i], ys[i]), (xs[i] + rg.uniform(-6, 6), ys[i] - rg.uniform(14, 34))], fill=255, width=3)
                    else: dw.line([(xs[i], ys[i]), (xs[i] + rg.uniform(-4, 4), ys[i] + rg.uniform(30, 90))], fill=255, width=rg.choice([3, 5]))
    tone = np.ones((H, W), np.float32)
    for v in np.unique(lvl):
        if v > 0: tone[lvl == v] = ht(v)[lvl == v]
    tone = np.where(np.asarray(ink) > 0, 0.0, tone); tone = np.where(np.asarray(white) > 0, 1.0, tone)   # lights stay white inside their ink rim
    return tone, bool(S.get(name))
