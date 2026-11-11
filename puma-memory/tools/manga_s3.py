"""S3 huddle · manga panel guide (3360x1440 = SCREEN_overlay_21x9.png). Worm's-eye, 3-point perspective, floodlight burst,
impact lines from the captain's fingertip (light-birth point), screentone kit, chiaroscuro. Only visible hand = captain's."""
import math, random, numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
W, H = 3360, 1440; INK = (10, 10, 10); PAPER = (250, 249, 245)
YY, XX = np.mgrid[0:H, 0:W].astype(np.float32)
_c, _s = math.cos(math.radians(45)), math.sin(math.radians(45))
SCREEN = (np.cos(2 * np.pi * (XX * _c - YY * _s) / 11) + np.cos(2 * np.pi * (XX * _s + YY * _c) / 11)) / 4 + 0.5
def ht(v): return np.where(SCREEN > 1 - np.asarray(v, np.float32), 0, 255).astype(np.uint8)
def pl(d, pts, w, col=INK): d.line([tuple(map(float, p)) for p in pts], fill=col, width=max(1, int(round(w))), joint="curve")
def cl(d, pts, w, col=INK): pl(d, list(pts) + [pts[0], pts[1]], w, col)
def ell(cx, cy, rx, ry, ang=0, a0=0, a1=360, n=96):
    a = math.radians(ang); out = []
    for i in range(n + 1):
        t = math.radians(a0 + (a1 - a0) * i / n); out.append((cx + rx * math.cos(t) * math.cos(a) - ry * math.sin(t) * math.sin(a), cy + rx * math.cos(t) * math.sin(a) + ry * math.sin(t) * math.cos(a)))
    return out
def capsule(p, q, w1, w2, n=16):
    b = math.atan2(q[1] - p[1], q[0] - p[0]); pts = []
    for i in range(n + 1): t = b - math.pi / 2 + math.pi * i / n; pts.append((q[0] + w2 / 2 * math.cos(t), q[1] + w2 / 2 * math.sin(t)))
    for i in range(n + 1): t = b + math.pi / 2 + math.pi * i / n; pts.append((p[0] + w1 / 2 * math.cos(t), p[1] + w1 / 2 * math.sin(t)))
    return pts
JER, JER_SH, SHORT = (255, 0, 0), (0, 0, 255), (255, 0, 255)          # markers -> screentones
def fill(d, pts, kind, w=0):
    col = {"jersey": JER, "jersey_shadow": JER_SH, "black": INK, "skin": PAPER, "paper": PAPER}[kind]
    d.polygon([tuple(map(float, p)) for p in pts], fill=col)
    if w: cl(d, pts, w)
# ======================= SKY + STADIUM ROOF (worm's-eye) =======================
img = np.zeros((H, W, 3), np.uint8)
glow = np.clip(1 - np.hypot((XX - 1760) / 900, (YY - 430) / 520), 0, 1)
img[:] = ht(np.clip(0.93 - 0.85 * glow ** 1.3, 0, 1))[..., None]
im = Image.fromarray(img); d = ImageDraw.Draw(im)
VP = (1760, -1700)
for x in list(range(-1500, 5000, 260)):                                         # roof girders converging up to the VP
    pl(d, [(x, H), VP], 3, (120, 120, 120))
for k, y in enumerate([60, 150, 250, 360]):                                      # cross beams (curved, receding)
    pl(d, [(cx, y + 0.00012 * (cx - 1760) ** 2) for cx in range(-100, W + 100, 40)], 4 - k * 0.5, (140, 140, 140))
for i in range(9):                                                               # floodlight bank, top centre
    x = 1520 + i * 60; d.rounded_rectangle([x, 395, x + 46, 425], 8, fill=PAPER, outline=(60, 60, 60), width=2)
burst = Image.new("L", (W, H), 0); bd = ImageDraw.Draw(burst); random.seed(7)
for k in range(220):                                                             # floodlight burst
    a = random.uniform(0, 2 * math.pi); r1 = random.uniform(250, 900)
    bd.line([(1760, 410), (1760 + r1 * math.cos(a), 410 + r1 * 0.75 * math.sin(a))], fill=255, width=random.choice([2, 3, 4]))
bd.ellipse([1560, 330, 1960, 490], fill=255); burst = burst.filter(ImageFilter.GaussianBlur(3))
im = Image.composite(Image.new("RGB", (W, H), PAPER), im, burst)
TIP = (1562, 690)                                                                # captain's fingertip = where the light is born
imp = Image.new("L", (W, H), 0); idr = ImageDraw.Draw(imp)
for k in range(140):                                                             # impact lines from the fingertip
    a = random.uniform(0, 2 * math.pi); r0 = random.uniform(70, 160)
    idr.line([(TIP[0] + r0 * math.cos(a), TIP[1] + r0 * math.sin(a)), (TIP[0] + 2400 * math.cos(a), TIP[1] + 2400 * math.sin(a))], fill=255, width=random.choice([2, 2, 3, 5]))
im = Image.composite(Image.new("RGB", (W, H), PAPER), im, imp.point(lambda v: int(v * 0.8)))
base = im.convert("RGBA")
# ======================= HEADS =======================
def head(d, cx, cy, s, yaw, tilt, mouth, hair, w, gaze=(0, 0), detail=True, sweat=True):
    """yaw -1 = facing left ... +1 = facing right. tilt in degrees. mouth: 'closed' | 'shout'."""
    t = math.radians(tilt); L = lambda u, v: (cx + s * (u * math.cos(t) - v * math.sin(t)), cy + s * (u * math.sin(t) + v * math.cos(t)))
    uc = 70 * yaw
    # neck (seen from below) — drawn by caller before; here: skull/hair base, face, hair, ear, features
    fill(d, [L(*p) for p in [(u, v) for (u, v) in [(150 * math.cos(a), 195 * math.sin(a)) for a in [2 * math.pi * i / 96 for i in range(96)]]]], "black", w)
    face = [L(18 * yaw + 140 * math.cos(a) * (1 - 0.12 * abs(yaw)), 22 + 182 * math.sin(a)) for a in [2 * math.pi * i / 96 for i in range(96)]]
    fill(d, face, "skin", w)
    # hair over the top and the back side
    back = -1 if yaw > 0.25 else (1 if yaw < -0.25 else 0)
    hp = []
    n = 40
    for i in range(n + 1):
        a = math.radians(180 + 180 * i / n)
        r = 1.07 + (0.10 * (i % 2) if hair == "short" else 0.06 * math.sin(i * 1.7) if hair == "long" else 0.09 * abs(math.sin(i * 2.3)))
        hp.append(L(158 * r * math.cos(a), 200 * r * math.sin(a) - 5))
    fringe_y = {"short": -75, "long": -55, "curly": -70}[hair]
    for i in range(n, -1, -1):                                                   # jagged fringe line across the forehead
        u = -158 + 316 * i / n; jag = (18 if i % 2 else 0) if hair != "long" else 10 * math.sin(i)
        hp.append(L(u, fringe_y + jag + 0.0006 * u * u * 40 / 40))
    fill(d, hp, "black", w)
    if back:                                                                       # hair down the back of the head (+ long hair falls lower)
        drop = 175 if hair == "long" else 60
        side = [L(back * 160, -40), L(back * 168, drop), L(back * 120, drop + 30), L(back * 95, 30), L(back * 100, -60)]
        fill(d, side, "black", 0)
    for k in range(3):                                                             # hair shine
        pl(d, [L(-60 + 40 * k - 30 * yaw, -170), L(-30 + 40 * k - 30 * yaw, -150), L(0 + 40 * k - 30 * yaw, -168)], 5 * s, PAPER)
    if abs(yaw) > 0.25:                                                             # ear on the back side
        e = ell(*L(-yaw * 128, 15), 24 * s, 40 * s, tilt); fill(d, e, "skin", w * 0.8); pl(d, [L(-yaw * 128, -5), L(-yaw * 138, 18), L(-yaw * 126, 40)], 4 * s)
    if not detail: return
    eyes = [uc - 52 * (1 - 0.35 * max(0, yaw)), uc + 52 * (1 - 0.35 * max(0, -yaw))]
    for i, ex in enumerate(eyes):
        if abs(yaw) > 0.7 and ((yaw > 0 and i == 0) or (yaw < 0 and i == 1)): continue
        ew = 34 * (1 - 0.3 * abs(yaw))
        pl(d, [L(ex - ew, -12), L(ex, -24), L(ex + ew, -12)], 8 * s)                # upper lid
        d.ellipse([*L(ex - 12 + gaze[0] * 14, -16 + gaze[1] * 8), *L(ex + 12 + gaze[0] * 14, 8 + gaze[1] * 8)], fill=INK) if tilt == 0 else d.polygon(ell(*L(ex + gaze[0] * 14, -4 + gaze[1] * 8), 12 * s, 12 * s), fill=INK)
        inner = 1 if ex < uc else -1
        pl(d, [L(ex - ew * 1.1, -52 - 6 * inner), L(ex + ew * 1.1, -52 + 6 * inner)], 11 * s)   # intense brows (inner ends lower)
    if abs(yaw) < 0.3:                                                                          # nose from below (worm's-eye): nostrils
        pl(d, [L(uc - 6, 0), L(uc - 14, 48)], 4 * s); pl(d, [L(uc - 22, 56), L(uc - 10, 62)], 6 * s); pl(d, [L(uc + 10, 62), L(uc + 22, 56)], 6 * s)
    else:
        pl(d, [L(uc + 4 * yaw, -10), L(uc + 48 * yaw, 46), L(uc + 14 * yaw, 60)], w)
        d.polygon([L(uc + 4 * yaw, -10), L(uc + 48 * yaw, 46), L(uc + 14 * yaw, 60)], fill=PAPER); pl(d, [L(uc + 4 * yaw, -10), L(uc + 48 * yaw, 46), L(uc + 14 * yaw, 60)], w * 0.8)
    if mouth == "shout":
        m = ell(*L(uc + 8 * yaw, 108), 46 * s * (1 - 0.3 * abs(yaw)), 40 * s, tilt); fill(d, m, "black", w * 0.8)
        d.polygon([L(uc - 34 + 8 * yaw, 82), L(uc + 34 + 8 * yaw, 82), L(uc + 30 + 8 * yaw, 94), L(uc - 30 + 8 * yaw, 94)], fill=PAPER)
    else:
        pl(d, [L(uc - 26 + 8 * yaw, 104), L(uc + 26 + 8 * yaw, 100)], 7 * s)
    for k in range(7): pl(d, [L(-yaw * 70 - 50 + 16 * k, 120), L(-yaw * 70 - 66 + 16 * k, 175)], 3 * s)   # jaw shadow hatching
    for k in range(5): pl(d, [L(-40 + 20 * k, 196), L(-52 + 20 * k, 226)], 3 * s)                           # under-chin (lit from above)
    if sweat:
        for (u, v, r) in [(uc - 70, -95, 12), (uc + 90 * yaw + 40, 20, 9)]:
            c = L(u, v); dd = [(c[0], c[1] - r * 2.2 * s), (c[0] + r * s, c[1]), (c[0], c[1] + r * s), (c[0] - r * s, c[1])]; d.polygon(dd, fill=PAPER); cl(d, dd, 3 * s)
def kit_body(d, pts, w, collar=None, shadow=None, number=None, numfont=None):
    fill(d, pts, "jersey", w)
    if shadow: fill(d, shadow, "jersey_shadow", 0)
    random.seed(len(pts) * 13)
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    for k in range(26):                                                            # sublimated brush-stroke texture
        x = random.uniform(min(xs), max(xs)); y = random.uniform(min(ys), max(ys)); L_ = random.uniform(40, 120)
        pl(d, [(x, y), (x + L_, y - L_ * 0.35)], random.choice([4, 6]), (90, 120, 100))
    if collar: pl(d, collar, 26, INK)
    if number: d.text(number[0], number[1], font=numfont, fill=INK, anchor="mm")
def layer():
    return Image.new("RGB", (W, H), (0, 255, 0))
def commit(lay, panel, fade=0.0):
    a = np.asarray(lay).copy(); key = np.all(a == (0, 255, 0), -1)
    for mark, v in ((JER, 0.22), (JER_SH, 0.5)):
        m = np.all(a == mark, -1); a[m] = ht(v)[m][:, None]
    m = np.all(a == (90, 120, 100), -1); a[m] = ht(0.55)[m][:, None]
    if fade: a = (a.astype(np.float32) * (1 - fade) + 250 * fade).astype(np.uint8)
    panel.alpha_composite(Image.fromarray(np.dstack([a, np.where(key, 0, 255).astype(np.uint8)]), "RGBA"))
NUM = ImageFont.truetype(R + "drive-dl/GothamCondensed-Black.otf", 200)
panel = base
# far ring (beyond the v8 frame): shoulders and backs only, heads cropped
lay = layer(); d = ImageDraw.Draw(lay)
kit_body(d, [(-50, 640), (260, 560), (520, 700), (600, 1000), (520, 1440), (-50, 1440)], 8, shadow=[(-50, 900), (300, 1000), (420, 1440), (-50, 1440)])
kit_body(d, [(3420, 700), (3080, 620), (2860, 760), (2820, 1100), (2900, 1440), (3420, 1440)], 8, shadow=[(3420, 950), (3050, 1050), (3000, 1440), (3420, 1440)])
commit(lay, panel, 0.12)
# P5 · right lower, faces left at the captain
lay = layer(); d = ImageDraw.Draw(lay)
kit_body(d, [(2000, 1440), (2030, 1080), (2180, 1000), (2520, 990), (2840, 1100), (2900, 1440)], 8, collar=[(2120, 1010), (2185, 1110), (2265, 1015)])
fill(d, capsule((2190, 980), (2195, 1060), 150, 170), "skin", 8)
head(d, 2190, 870, 0.78, -0.6, -8, "closed", "short", 8, gaze=(-0.8, 0.2))
commit(lay, panel)
# P2 · long hair, left, faces right at the captain
lay = layer(); d = ImageDraw.Draw(lay)
kit_body(d, [(520, 1440), (600, 1050), (850, 920), (1180, 890), (1450, 960), (1520, 1440)], 9, collar=[(1180, 905), (1265, 1020), (1360, 920)],
         shadow=[(600, 1050), (850, 920), (900, 1440), (520, 1440)])
fill(d, capsule((1255, 860), (1270, 960), 175, 200), "skin", 9)
head(d, 1270, 700, 0.95, 0.6, 6, "closed", "long", 9, gaze=(0.9, 0.3))
commit(lay, panel)
# CAPTAIN · number 10, black armband, shouting, index finger raised
lay = layer(); d = ImageDraw.Draw(lay)
kit_body(d, [(1400, 1440), (1440, 1050), (1600, 960), (1900, 960), (2120, 1040), (2200, 1440)], 9, collar=[(1640, 965), (1745, 1090), (1850, 965)],
         number=((1765, 1280), "10"), numfont=NUM)
fill(d, capsule((2120, 1060), (2200, 1300), 210, 190), "jersey", 9); fill(d, [(2050, 1140), (2230, 1110), (2250, 1190), (2075, 1225)], "black", 0)   # left upper arm + armband
fill(d, capsule((1745, 920), (1745, 1000), 175, 200), "skin", 9)
head(d, 1745, 745, 1.0, 0.0, -4, "shout", "short", 10, gaze=(-0.2, -0.9))
fill(d, capsule((1470, 1300), (1500, 905), 150, 135), "skin", 9)                              # forearm rising from below
fist = ell(1505, 880, 78, 92, -8); fill(d, fist, "skin", 9)
for k in range(3): pl(d, [(1440, 850 + 30 * k), (1540, 838 + 30 * k)], 5)                         # curled fingers
fill(d, capsule((1528, 820), (1562, 692), 40, 32), "skin", 8)                                    # index finger up
pl(d, [(1466, 905), (1430, 870), (1445, 830)], 6)                                                 # thumb
commit(lay, panel)
# P1 · top-left, leaning over the lens, looks down-right
lay = layer(); d = ImageDraw.Draw(lay)
kit_body(d, [(-50, -50), (1100, -50), (1200, 220), (1080, 420), (900, 470), (620, 620), (300, 700), (-50, 660)], 9,
         shadow=[(-50, 300), (500, 420), (620, 620), (300, 700), (-50, 660)], collar=[(840, 330), (950, 420), (1040, 340)])
fill(d, capsule((960, 470), (880, 380), 160, 180), "skin", 9)
head(d, 1070, 560, 0.75, 0.75, 28, "closed", "curly", 8, gaze=(0.6, 0.6))
commit(lay, panel)
# P4 · top-right, curly, leaning over the lens, looks down-left at the captain
lay = layer(); d = ImageDraw.Draw(lay)
kit_body(d, [(2230, -50), (3420, -50), (3420, 760), (3000, 820), (2660, 740), (2440, 560), (2330, 360)], 9,
         shadow=[(3000, -50), (3420, -50), (3420, 760), (3000, 820)], number=((2860, 430), "9"), numfont=NUM, collar=[(2330, 420), (2400, 520), (2470, 420)])
fill(d, capsule((2330, 540), (2420, 460), 170, 190), "skin", 9)
head(d, 2240, 670, 0.95, -0.65, -22, "closed", "curly", 9, gaze=(-0.8, 0.6))
commit(lay, panel)
# rim light from the floodlights along the top of heads/shoulders
rl = ImageDraw.Draw(panel)
for pts in ([(1600, 600), (1700, 560), (1820, 575)], [(1150, 560), (1250, 520), (1350, 540)], [(2150, 520), (2250, 490), (2330, 510)]):
    pl(rl, pts, 7, PAPER)
out = R + "frames_screen/expand_v8/S3_huddle__MANGA_guide.png"; panel.convert("RGB").save(out)
ov = Image.open(R + "frames_screen/expand_v8/SCREEN_overlay_21x9.png"); both = panel.copy(); both.alpha_composite(ov)
both.convert("RGB").save(R + "frames_screen/expand_v8/S3_huddle__MANGA_with_overlay.png")
both.convert("RGB").resize((1680, 720), Image.LANCZOS).save(R + "qc/s3_manga_prev.jpg", quality=90)
panel.convert("RGB").resize((1680, 720), Image.LANCZOS).save(R + "qc/s3_manga_clean.jpg", quality=90)
print("ok")
