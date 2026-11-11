"""S2 · manga panel composition guide (3360x1440, matches SCREEN_overlay_21x9.png).
Depth: one-point perspective room, teammates scaled along the bench toward the VP, line weight + tone fade with distance.
Flavor: chiaroscuro (solid-black shadow side, rim light), gradient screentone, spiky hair, sweat, focus lines, foreground silhouette."""
import math, random, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
W, H = 3360, 1440; INK = (10, 10, 10); PAPER = (250, 249, 245)
YY, XX = np.mgrid[0:H, 0:W].astype(np.float32)
_c, _s = math.cos(math.radians(45)), math.sin(math.radians(45))
SCREEN = (np.cos(2 * np.pi * (XX * _c - YY * _s) / 11) + np.cos(2 * np.pi * (XX * _s + YY * _c) / 11)) / 4 + 0.5
def ht(v):                       # AM halftone for a darkness map/scalar v in 0..1 -> uint8 (0 = ink)
    return np.where(SCREEN > 1 - np.asarray(v, np.float32), 0, 255).astype(np.uint8)
def to_np(im): return np.asarray(im).copy()
def poly_mask(pts):
    m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).polygon([tuple(p) for p in pts], fill=255); return np.asarray(m) > 0
def pline(d, pts, w, col=INK): d.line([tuple(p) for p in pts], fill=col, width=max(1, int(round(w))), joint="curve")
def closed(d, pts, w, col=INK): pline(d, list(pts) + [pts[0], pts[1]], w, col)
def ell(cx, cy, rx, ry, ang=0, n=96):
    a = math.radians(ang); return [(cx + rx * math.cos(t) * math.cos(a) - ry * math.sin(t) * math.sin(a), cy + rx * math.cos(t) * math.sin(a) + ry * math.sin(t) * math.cos(a)) for t in [2 * math.pi * i / n for i in range(n)]]
def capsule(p, q, w1, w2, n=16):
    b = math.atan2(q[1] - p[1], q[0] - p[0]); pts = []
    for i in range(n + 1): t = b - math.pi / 2 + math.pi * i / n; pts.append((q[0] + w2 / 2 * math.cos(t), q[1] + w2 / 2 * math.sin(t)))
    for i in range(n + 1): t = b + math.pi / 2 + math.pi * i / n; pts.append((p[0] + w1 / 2 * math.cos(t), p[1] + w1 / 2 * math.sin(t)))
    return pts
VP = np.array([2950.0, 800.0])
def toward(p, f): p = np.asarray(p, float); return p + (VP - p) * f
# ======================= ROOM (perspective) =======================
img = np.full((H, W, 3), 250, np.uint8)
light = np.clip(1 - np.hypot((XX - 3050) / 1900, (YY - 700) / 1100), 0, 1)        # key light from the far right (doorway)
wall_v = 0.62 - 0.45 * light                                                       # darker away from the light
A_top, A_bot = np.array([-300.0, 120.0]), np.array([-300.0, 1215.0])
fs = [1 - 0.84 ** i for i in range(0, 26)]
lockers = []
for i in range(len(fs) - 1):
    f0, f1 = fs[i], fs[i + 1] - 0.012 * (1 - fs[i])
    q = [toward(A_top, f0), toward(A_top, f1), toward(A_bot, f1), toward(A_bot, f0)]; lockers.append((q, f0, f1))
wall = poly_mask([A_top, VP, A_bot, (-300, 1215)]); g = ht(wall_v); img[wall] = g[wall][:, None]
ceil = poly_mask([(-300, -10), (W + 10, -10), (W + 10, 300), VP, A_top]); img[ceil] = ht(0.8 - 0.35 * light)[ceil][:, None]
floor = poly_mask([A_bot, VP, (W + 10, 1100), (W + 10, H + 10), (-300, H + 10)]); img[floor] = ht(0.7 - 0.3 * light)[floor][:, None]
im = Image.fromarray(img); d = ImageDraw.Draw(im); BG = (60, 60, 60)
for q, f0, f1 in lockers:                                                          # wooden lockers receding, a jersey in each
    sc = 1 - f0; wq = max(1.2, 4.2 * sc)
    opening = [toward(q[0], 0) * 0 + q[0] + (q[1] - q[0]) * 0.1 + (q[3] - q[0]) * 0.05, q[0] + (q[1] - q[0]) * 0.9 + (q[2] - q[1]) * 0.05,
               q[3] + (q[2] - q[3]) * 0.9 - (q[2] - q[1]) * 0.02, q[3] + (q[2] - q[3]) * 0.1 - (q[3] - q[0]) * 0.02]
    m = poly_mask(opening); arr = to_np(im); arr[m] = ht(0.82 - 0.3 * light)[m][:, None]; im = Image.fromarray(arr); d = ImageDraw.Draw(im)
    closed(d, q, wq, BG); closed(d, opening, wq * 0.8, BG)
    top, bot = (opening[0] + opening[1]) / 2, (opening[3] + opening[2]) / 2; hgt = bot[1] - top[1]; cx = top[0] + (bot[0] - top[0]) * 0.2; wdt = np.linalg.norm(opening[1] - opening[0])
    if wdt > 14:
        y0 = top[1] + hgt * 0.16; jw = wdt * 0.36; jh = hgt * 0.33
        jer = [(cx - jw * .5, y0), (cx - jw * .95, y0 + jh * .14), (cx - jw * .75, y0 + jh * .3), (cx - jw * .5, y0 + jh * .24), (cx - jw * .5, y0 + jh), (cx + jw * .5, y0 + jh),
               (cx + jw * .5, y0 + jh * .24), (cx + jw * .75, y0 + jh * .3), (cx + jw * .95, y0 + jh * .14), (cx + jw * .5, y0), (cx + jw * .2, y0 - jh * .02), (cx, y0 + jh * .07), (cx - jw * .2, y0 - jh * .02)]
        d.polygon(jer, fill=(232, 232, 228)); closed(d, jer, wq * 0.7, BG); pline(d, [(cx, y0 - jh * .14), (cx, y0 - jh * .02)], wq * .6, BG)
bench_t, bench_b = np.array([-300.0, 1110.0]), np.array([-300.0, 1185.0])
bq = [bench_t, toward(bench_t, 0.97), toward(bench_b, 0.97), bench_b]; d.polygon([tuple(p) for p in bq], fill=(225, 222, 214)); closed(d, bq, 4, BG)
for k in range(10): pline(d, [(-300, 1260 + k * 22), toward((-300, 1260 + k * 22), 0.96)], 2, (120, 120, 120))   # floor boards to the VP
for i, f in enumerate([0.08, 0.3, 0.48, 0.62, 0.73]):                              # ceiling lights receding, with bursts
    c = toward((520, 95), f); r = 95 * (1 - f)
    d.ellipse([c[0] - r, c[1] - r * .32, c[0] + r, c[1] + r * .32], fill=PAPER, outline=INK, width=max(1, int(4 * (1 - f))))
    for k in range(14):
        a = math.pi * (0.08 + 0.84 * k / 13); d.line([(c[0] + r * 1.2 * math.cos(a), c[1] + r * .45 * math.sin(a)), (c[0] + r * 2.4 * math.cos(a), c[1] + r * 1.8 * math.sin(a))], fill=PAPER, width=max(1, int(3 * (1 - f))))
glow = Image.new("L", (W, H), 0); ImageDraw.Draw(glow).ellipse([2700, 450, 3360, 1150], fill=255); glow = glow.filter(ImageFilter.GaussianBlur(120))
im = Image.composite(Image.new("RGB", (W, H), PAPER), im, glow.point(lambda v: int(v * 0.85)))             # doorway light
d = ImageDraw.Draw(im); random.seed(4)
for k in range(105):                                                                  # concentration focus lines (background only)
    a = random.uniform(0, 2 * math.pi); r0 = random.uniform(950, 1250); c = (1500, 620)
    d.line([(c[0] + r0 * math.cos(a), c[1] + r0 * 0.55 * math.sin(a)), (c[0] + 2600 * math.cos(a), c[1] + 1400 * math.sin(a))], fill=(255, 255, 255), width=random.choice([2, 2, 3]))
bgim = im.filter(ImageFilter.GaussianBlur(1.3))
# ======================= FIGURES =======================
def figure(s, hx, hy, w, jv, detail, fade, tilt=38, spike=0.16):
    lay = Image.new("RGB", (W, H), (0, 255, 0)); d = ImageDraw.Draw(lay); masks = {}
    a = math.radians(tilt); ax = np.array([-math.sin(a), math.cos(a)]); nx = np.array([math.cos(a), math.sin(a)])
    P = lambda u, v: tuple(np.array([hx, hy]) + (u * nx + v * ax) * s)
    X = lambda x, y: (hx + x * s, hy + y * s)
    def part(pts, kind, lw=w):
        if kind == "jersey": d.polygon(pts, fill=(255, 0, 0))
        elif kind == "shorts": d.polygon(pts, fill=(0, 0, 255))
        elif kind == "black": d.polygon(pts, fill=INK)
        else: d.polygon(pts, fill=PAPER)
        if lw: closed(d, pts, lw)
    part(capsule(X(-200, 760), X(320, 830), 250 * s, 230 * s), "shorts")                                # thigh
    part([P(-95, 110), X(-275, 100), X(-330, 210), X(-60, 285), P(40, 200)], "skin")                    # neck
    torso = [X(-275, 100), X(-490, 170), X(-650, 400), X(-730, 920), X(90, 920), X(70, 520), X(-55, 285), X(-180, 235)]
    part(torso, "jersey")
    part([X(-490, 170), X(-650, 400), X(-730, 920), X(-540, 920), X(-500, 560), X(-420, 330), X(-330, 215)], "black", 0)   # shadow side of the back
    pline(d, [X(-275, 100), X(-170, 200), X(-55, 285)], 17 * s + 2)                                    # collar
    part(ell(*X(-360, 330), 165 * s, 160 * s), "jersey"); part(capsule(X(-360, 330), X(-150, 645), 205 * s, 178 * s), "jersey")
    part([X(-470, 300), X(-520, 420), X(-470, 560), X(-410, 470), X(-430, 360)], "black", 0)            # shoulder core shadow
    for f_ in ([(-430, 230), (-300, 300), (-210, 420)], [(-560, 520), (-450, 600), (-330, 640)], [(-200, 380), (-120, 470)]): pline(d, [X(*p) for p in f_], max(2, 4 * s))   # folds
    pline(d, [X(-300, 565), X(-110, 525)], 11 * s + 2)                                                    # sleeve hem
    part(capsule(X(-170, 600), X(-115, 685), 152 * s, 150 * s), "skin"); part(capsule(X(-115, 685), X(120, 890), 138 * s, 118 * s), "skin")
    part(ell(*X(150, 925), 66 * s, 58 * s, 40), "skin"); pline(d, [X(118, 905), X(178, 935)], 4 * s); pline(d, [X(112, 930), X(170, 960)], 4 * s)
    pline(d, [X(-40, 300), X(55, 530), X(80, 900)], 10 * s, PAPER)                                       # rim light on the chest edge
    # head: hair mass (spiky), face, ear, nose, features
    hair = []
    for i in range(60):
        t = math.radians(95 + 205 * i / 59); r = 1.0 + (spike if i % 2 else 0.0)
        hair.append(P(-15 + 165 * r * math.cos(t), -10 + 210 * r * math.sin(t)))
    for (u, v) in [(60, -200), (120, -150), (95, -95), (150, -110), (130, -60), (175, -70)]: hair.append(P(u, v))   # fringe falling toward the face
    part(hair, "black")
    face = [P(55, -115), P(150, -70), P(168, -32), P(160, 40), P(150, 95), P(140, 135), P(122, 178), P(70, 208), P(-30, 170), P(-75, 95), P(-80, 20), P(-45, -60)]
    part(face, "skin")
    part([P(-40, -95), P(-110, -40), P(-95, 120), P(-60, 120), P(-75, -10)], "black", 0)                   # hair at the temple
    for k in range(3): pline(d, [P(-130 + 30 * k, -185), P(-60 + 30 * k, -160), P(10 + 30 * k, -175)], 5 * s, PAPER)   # hair shine
    part(ell(*P(-55, 25), 30 * s, 46 * s, tilt), "skin", max(2, w * .8)); pline(d, [P(-62, 5), P(-72, 25), P(-60, 48)], 4 * s)
    d.polygon([P(160, -10), P(206, 66), P(162, 86)], fill=PAPER); pline(d, [P(160, -10), P(206, 66), P(168, 86)], w)
    if detail:
        pline(d, [P(82, -50), P(118, -58), P(152, -48)], 10 * s)                                          # brow
        pline(d, [P(86, -8), P(112, 6), P(144, 0)], 8 * s)                                                # closed eye
        for k in range(3): pline(d, [P(96 + 15 * k, 6), P(92 + 15 * k, 22)], 3 * s)
        pline(d, [P(118, 128), P(148, 133)], 6 * s)                                                       # mouth
        for k in range(7): pline(d, [P(-40 + 14 * k, 70), P(-62 + 14 * k, 160)], 3 * s)                   # hatch: cheek shadow
        for k in range(7): pline(d, [P(-5 + 15 * k, 214), P(-38 + 15 * k, 268)], 3 * s)                   # hatch: under the chin
        for (u, v, r) in [(30, -95, 15), (-5, -70, 11), (135, 165, 9)]:                                      # sweat drops
            c = P(u, v); dd = [(c[0], c[1] - r * 2.1 * s), (c[0] + r * s, c[1]), (c[0], c[1] + r * s), (c[0] - r * s, c[1])]
            d.polygon(dd, fill=PAPER); closed(d, dd, 3 * s)
    arr = to_np(lay); key = np.all(arr == (0, 255, 0), -1)
    jm = np.all(arr == (255, 0, 0), -1); sm = np.all(arr == (0, 0, 255), -1)
    arr[jm] = ht(jv)[jm][:, None]; arr[sm] = ht(min(0.92, jv + 0.15))[sm][:, None]
    if fade:                                                                      # atmospheric depth: lighter ink with distance
        arr = (arr.astype(np.float32) * (1 - fade) + 250 * fade).astype(np.uint8)
    alpha = np.where(key, 0, 255).astype(np.uint8); return Image.fromarray(np.dstack([arr, alpha]), "RGBA")
panel = bgim.convert("RGBA")
hero = np.array([1480.0, 650.0])
for t, w, jv, fade, tl, sp in ((0.66, 3, 0.45, 0.42, 30, 0.08), (0.52, 4, 0.5, 0.3, 46, 0.22), (0.34, 5.5, 0.55, 0.16, 32, 0.05)):   # teammates along the bench, varied
    p = hero + (np.array([2950.0, 830.0]) - hero) * t
    panel.alpha_composite(figure(1 - t, p[0], p[1], w, jv, False, fade, tl, sp))
panel.alpha_composite(figure(1.0, *hero, 9, 0.68, True, 0))
# foreground silhouette (out of focus, frames the shot)
fg = Image.new("L", (W, H), 0); ImageDraw.Draw(fg).polygon([(0, 0), (150, 0), (120, H), (0, H)], fill=255); fg = fg.filter(ImageFilter.GaussianBlur(14))
panel = Image.composite(Image.new("RGBA", (W, H), (8, 8, 8, 255)), panel, fg)
out = R + "frames_screen/expand_v8/S2_concentracion__MANGA_guide.png"; panel.convert("RGB").save(out)
ov = Image.open(R + "frames_screen/expand_v8/SCREEN_overlay_21x9.png"); both = panel.copy(); both.alpha_composite(ov)
both.convert("RGB").save(R + "frames_screen/expand_v8/S2_concentracion__MANGA_with_overlay.png")
both.convert("RGB").resize((1680, 720), Image.LANCZOS).save(R + "qc/s2_manga_prev.jpg", quality=90)
panel.convert("RGB").resize((1680, 720), Image.LANCZOS).save(R + "qc/s2_manga_clean.jpg", quality=90)
print("ok")
