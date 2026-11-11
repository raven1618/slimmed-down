"""S4 compañerismo · manga panel guide (3360x1440 = SCREEN_overlay_21x9.png), inked from the approved v8 frame.
Depth: players bold (ink + tone + rim light), stadium soft screentone with faint ink, foreground grass hatching.
FX: low sun burst behind the far stand (right), spark at the clasp = light-birth point."""
import math, random, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
from rembg import remove, new_session
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
src = cv2.imread(R + "frames_screen/expand_v8/S4_companerismo__GUIDE_image_prompt.png"); H, W = src.shape[:2]
SUN, CLASP = (2260, 640), (1620, 722)
# ---- people mask
crop = Image.fromarray(cv2.cvtColor(src[300:1200, 900:2200], cv2.COLOR_BGR2RGB))
pm = np.asarray(remove(crop, session=new_session("u2net_human_seg"), only_mask=True)).astype(np.float32) / 255
P = np.zeros((H, W), np.float32); P[300:1200, 900:2200] = pm; Pb = (P > 0.5).astype(np.uint8)
# ---- screen pattern
YY, XX = np.mgrid[0:H, 0:W].astype(np.float32); c, s = math.cos(math.radians(45)), math.sin(math.radians(45))
def screen(period): return (np.cos(2 * np.pi * (XX * c - YY * s) / period) + np.cos(2 * np.pi * (XX * s + YY * c) / period)) / 4 + 0.5
S_FG, S_BG = screen(10), screen(13)
def ht(v, scr): return np.where(scr > 1 - v, 0.0, 1.0)
L = cv2.cvtColor(src, cv2.COLOR_BGR2LAB)[..., 0]
def xdog(img, sig, k=1.6, tau=0.98, phi=120):
    a = cv2.GaussianBlur(img, (0, 0), sig); b = cv2.GaussianBlur(img, (0, 0), sig * k); D = a - tau * b
    return np.where(D >= 0, 1.0, 1 + np.tanh(phi * D))
def clean_ink(ink, min_area):
    n, lab, st, _ = cv2.connectedComponentsWithStats(ink.astype(np.uint8), 8)
    keep = np.zeros(n, bool); keep[1:] = st[1:, cv2.CC_STAT_AREA] >= min_area; return keep[lab]
# ---- BACKGROUND: soft, out of focus, lighter = depth
bgL = cv2.GaussianBlur(L, (0, 0), 6).astype(np.float32) / 255
b80, b50, b20 = np.percentile(bgL, [75, 45, 15])
bg = np.where(bgL > b80, 1.0, np.where(bgL > b50, ht(0.16, S_BG), np.where(bgL > b20, ht(0.38, S_BG), ht(0.66, S_BG))))
bink = clean_ink(xdog(bgL, 5.0, phi=60) < 0.4, 900)
bg = np.minimum(bg, 1 - bink * 0.55)                                              # faint grey lines for the stands
bg = bg * 0.88 + 0.12                                                             # push back
# ---- FOREGROUND PLAYERS: crisp ink, 3-step tone, solid blacks
fgL = cv2.bilateralFilter(cv2.createCLAHE(2.0, (8, 8)).apply(L), 13, 40, 9).astype(np.float32) / 255
vals = fgL[Pb > 0]; f72, f40, f15 = np.percentile(vals, [64, 30, 7])
fg = np.where(fgL > f72, 1.0, np.where(fgL > f40, ht(0.2, S_FG), np.where(fgL > f15, ht(0.42, S_FG), 0.0)))
fink = clean_ink(xdog(fgL, 1.8) < 0.5, 60); fink = cv2.dilate(fink.astype(np.uint8), np.ones((2, 2), np.uint8)) > 0
fg = np.minimum(fg, 1 - fink)
# rim light from the sun (backlight): bright band inside the silhouette on the side facing the sun
dist = cv2.distanceTransform(Pb, cv2.DIST_L2, 5)
gx = cv2.Sobel(cv2.GaussianBlur(dist, (0, 0), 3), cv2.CV_32F, 1, 0); gy = cv2.Sobel(cv2.GaussianBlur(dist, (0, 0), 3), cv2.CV_32F, 0, 1)
tx, ty = SUN[0] - XX, SUN[1] - YY; tn = np.hypot(tx, ty) + 1e-6; gn = np.hypot(gx, gy) + 1e-6
facing = (-(gx * tx + gy * ty) / (gn * tn)) > 0.25
rim = (dist > 2) & (dist < 13) & facing & (Pb > 0)
fg = np.where(rim, 1.0, fg)
outline = (cv2.dilate(Pb, np.ones((9, 9), np.uint8)) - Pb) > 0                       # bold figure outline
alpha = cv2.GaussianBlur(P, (0, 0), 1.2)
panel = bg * (1 - alpha) + fg * alpha
panel = np.where(outline & ~rim, 0.0, panel)
# ---- FOREGROUND GRASS (below the players' feet): manga hatching, denser toward the bottom
img = Image.fromarray((np.clip(panel, 0, 1) * 245 + 5).astype(np.uint8)).convert("RGB"); d = ImageDraw.Draw(img); random.seed(5)
for k in range(2600):
    x = random.uniform(-20, W + 20); y = random.uniform(1035, H + 30)
    if Pb[min(H - 1, int(y)), min(W - 1, max(0, int(x)))]: continue
    depth = (y - 1035) / (H - 1035); ln = 6 + 24 * depth; lean = random.uniform(-0.35, 0.35)
    d.line([(x, y), (x + lean * ln, y - ln)], fill=(10, 10, 10), width=1 + int(1.6 * depth))
# ---- STADIUM BOWL drawn in perspective, curving around the sun (background layer, people masked out)
def curve(pts, n=400):
    p = np.asarray(pts, np.float32); p = np.vstack([p[0], p, p[-1]]); out = []
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i - 1], p[i], p[i + 1], p[i + 2]
        for t in np.linspace(0, 1, n // (len(p) - 3), endpoint=False):
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    return [tuple(map(float, q)) for q in out]
st = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sd_ = ImageDraw.Draw(st)
roof = curve([(-50, 300), (600, 380), (1300, 500), (2260, 600), (2800, 540), (3400, 400)])
sd_.polygon(roof + [(3400, -50), (-50, -50)], fill=(0, 0, 0, 0)); sd_.line(roof, fill=(20, 20, 20, 255), width=9)
for off, w in ((40, 3), (75, 2)): sd_.line([(x, y + off) for x, y in roof], fill=(40, 40, 40, 255), width=w)          # roof fascia
for k in range(0, 3400, 140):                                                                                        # roof trusses
    i = min(len(roof) - 1, int(k / 3400 * len(roof))); x, y = roof[i]; sd_.line([(x, y), (x + (x - 2260) * 0.12, y - 260)], fill=(70, 70, 70, 255), width=3)
ring = curve([(-50, 610), (700, 650), (1500, 700), (2260, 720), (2900, 690), (3400, 640)])
for i in range(0, len(ring), 9):
    x, y = ring[i]; r = 9 + 5 * (1 - abs(x - 2260) / 2400)
    sd_.ellipse([x - r, y - r * 0.6, x + r, y + r * 0.6], fill=(252, 252, 250, 255), outline=(20, 20, 20, 255), width=2)
for yy, w in ((800, 3), (880, 2)):
    sd_.line(curve([(-50, yy - 20), (1200, yy + 10), (2260, yy + 20), (3400, yy - 10)]), fill=(45, 45, 45, 255), width=w)   # tier lines
boards_top = curve([(-50, 945), (1200, 960), (2260, 968), (3400, 950)]); boards_bot = [(x, y + 52) for x, y in boards_top]
sd_.polygon(boards_top + boards_bot[::-1], fill=(250, 250, 246, 255)); sd_.line(boards_top, fill=(15, 15, 15, 255), width=5); sd_.line(boards_bot, fill=(15, 15, 15, 255), width=5)
for x in range(0, 3400, 260): sd_.line([(x, 955 + 0.0 * x), (x, 1010)], fill=(60, 60, 60, 255), width=2)                         # board panel joints
sa = np.asarray(st).copy(); sa[..., 3] = (sa[..., 3] * (1 - cv2.dilate(Pb, np.ones((15, 15), np.uint8)))).astype(np.uint8)
im_rgba = img.convert("RGBA"); im_rgba.alpha_composite(Image.fromarray(sa, "RGBA")); img = im_rgba.convert("RGB"); d = ImageDraw.Draw(img)
# ---- SUN BURST behind the far stand (background only)
fx = Image.new("L", (W, H), 0); fd = ImageDraw.Draw(fx)
for k in range(120):
    a = random.uniform(0, 2 * math.pi); r = random.uniform(260, 1000)
    fd.line([SUN, (SUN[0] + r * math.cos(a), SUN[1] + r * 0.62 * math.sin(a))], fill=170, width=random.choice([2, 3]))
fd.ellipse([SUN[0] - 95, SUN[1] - 70, SUN[0] + 95, SUN[1] + 70], fill=255)
fx = fx.filter(ImageFilter.GaussianBlur(2))
glow = Image.new("L", (W, H), 0); ImageDraw.Draw(glow).ellipse([SUN[0] - 220, SUN[1] - 150, SUN[0] + 220, SUN[1] + 150], fill=150); glow = glow.filter(ImageFilter.GaussianBlur(70))
notp = Image.fromarray(((1 - cv2.dilate(Pb, np.ones((25, 25), np.uint8))) * 255).astype(np.uint8))
fxm = Image.fromarray(np.minimum(np.maximum(np.asarray(fx), np.asarray(glow)), np.asarray(notp)))
img = Image.composite(Image.new("RGB", (W, H), (250, 250, 246)), img, fxm)
# ---- SPARK at the clasp (light-birth point): 4-point star + short impact lines around it
sp = Image.new("L", (W, H), 0); sd = ImageDraw.Draw(sp)
for k in range(46):
    a = random.uniform(0, 2 * math.pi); r0 = random.uniform(70, 110); r1 = random.uniform(240, 520)
    sd.line([(CLASP[0] + r0 * math.cos(a), CLASP[1] + r0 * math.sin(a)), (CLASP[0] + r1 * math.cos(a), CLASP[1] + r1 * math.sin(a))], fill=255, width=random.choice([2, 3]))
sp = Image.fromarray(np.minimum(np.asarray(sp), np.asarray(notp)))
img = Image.composite(Image.new("RGB", (W, H), (250, 250, 246)), img, sp)
d = ImageDraw.Draw(img)
star = [(CLASP[0], CLASP[1] - 70), (CLASP[0] + 14, CLASP[1] - 14), (CLASP[0] + 70, CLASP[1]), (CLASP[0] + 14, CLASP[1] + 14), (CLASP[0], CLASP[1] + 70), (CLASP[0] - 14, CLASP[1] + 14), (CLASP[0] - 70, CLASP[1]), (CLASP[0] - 14, CLASP[1] - 14)]
d.polygon(star, fill=(252, 252, 250), outline=(10, 10, 10))
out = R + "frames_screen/expand_v8/S4_companerismo__MANGA_guide.png"; img.save(out)
ov = Image.open(R + "frames_screen/expand_v8/SCREEN_overlay_21x9.png"); both = img.convert("RGBA"); both.alpha_composite(ov)
both.convert("RGB").save(R + "frames_screen/expand_v8/S4_companerismo__MANGA_with_overlay.png")
img.resize((1680, 720), Image.LANCZOS).save(R + "qc/s4_manga_clean.jpg", quality=90)
both.convert("RGB").resize((1680, 720), Image.LANCZOS).save(R + "qc/s4_manga_prev.jpg", quality=90)
img.crop((1000, 380, 2200, 1100)).save(R + "qc/s4_manga_zoom.jpg", quality=90)
print("ok")
