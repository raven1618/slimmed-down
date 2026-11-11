"""Reference pack for manual GPT Image 2.6 generation (21:9). Sketch = grey silhouettes only (no text, no die-cut)."""
import cv2, numpy as np, os
from PIL import Image, ImageDraw, ImageFilter
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
O = R + "frames_screen/"
W, H = 2520, 1080; B0, B1 = 308, 772            # screen band inside a 21:9 frame (43% of height)
SIL = (150, 150, 150); BG = (30, 30, 32)
def sketch(draw_fn):
    im = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(im); draw_fn(d); return im.filter(ImageFilter.GaussianBlur(3))
def E(d, x0, y0, x1, y1, c=SIL): d.ellipse([x0, y0, x1, y1], fill=c)
def L(d, pts, w, c=SIL): d.line(pts, fill=c, width=w, joint="curve")
def s1(d):
    d.rectangle([2230, 360, 2520, 720], fill=(205, 200, 185))                       # bright tunnel exit, far right (inside the right panel)
    for x, s in ((2300, 1.0), (2385, .85), (2460, .72)):
        E(d, x - 16 * s, 470, x + 16 * s, 470 + 34 * s, (70, 70, 70)); L(d, [(x, 505), (x, 505 + 150 * s)], int(34 * s), (70, 70, 70))
    L(d, [(185, 0), (200, 300), (215, 470)], 90)                                       # leg / green sock
    d.polygon([(40, 640), (70, 560), (230, 530), (400, 590), (405, 640), (40, 650)], fill=SIL)   # boot, at the widest part of the left panel
    E(d, 95, 430, 235, 525); E(d, 235, 445, 365, 535)                                  # hands lacing
    d.rectangle([0, 650, 300, 1080], fill=(52, 52, 54))                                # wet floor below
def s2(d):
    E(d, 2150, 390, 2400, 650); d.polygon([(2060, 1080), (2110, 780), (2160, 640), (2440, 630), (2520, 700), (2520, 1080)], fill=SIL)
    for cx, cy, r in ((150, 540, 78), (320, 575, 62)): E(d, cx - r, cy - r, cx + r, cy + r, (110, 110, 110))
    d.polygon([(10, 1080), (20, 760), (70, 620), (390, 630), (440, 760), (450, 1080)], fill=(110, 110, 110))
def s3(d):
    E(d, 1060, -60, 1460, 300, (90, 90, 88))                                           # floodlight glow, top centre
    E(d, 60, 430, 280, 660); d.polygon([(0, 1080), (0, 700), (80, 650), (300, 660), (400, 1080)], fill=SIL)   # captain
    L(d, [(330, 900), (318, 620), (305, 470)], 50); E(d, 262, 440, 345, 540); L(d, [(300, 460), (296, 380)], 22)   # raised arm + index finger
    for cx in (760, 980, 1540, 1760): E(d, cx - 110, 800, cx + 110, 1040, (95, 95, 95))  # heads/shoulders below the band
    E(d, 2160, 430, 2360, 650); E(d, 2310, 480, 2510, 720); d.polygon([(2100, 1080), (2130, 730), (2520, 740), (2520, 1080)], fill=SIL)
def s4(d):
    E(d, 90, 330, 215, 455); L(d, [(150, 455), (190, 640), (150, 820), (110, 1000)], 64); L(d, [(190, 640), (280, 830), (330, 1000)], 56); L(d, [(150, 490), (300, 430)], 40)  # runner (feet below the band)
    E(d, 2258, 334, 2402, 477); L(d, [(2330, 464), (2258, 647), (2310, 772), (2350, 860)], 92); L(d, [(2271, 503), (1910, 590)], 39)          # helper
    E(d, 1595, 588, 1706, 699); L(d, [(1641, 699), (1706, 772)], 92); L(d, [(1693, 647), (1890, 600)], 34); L(d, [(1706, 772), (1960, 840)], 60)  # seated
    E(d, 1870, 570, 1930, 625, (200, 200, 200))                                          # clasp
SK = {"S1": s1, "S2": s2, "S3": s3, "S4": s4}
# die-cut, mapped into the 21:9 band, for the check overlay only
dm = cv2.resize(cv2.imread(R + "puma-kb/sources/S09-piloto-aprobado/diecut_mask_pilot.png", 0), (W, B1 - B0), interpolation=cv2.INTER_NEAREST) > 127
dm[:4] = dm[4]; dm[-4:] = dm[-5]
def overlay(im):
    a = np.asarray(im).astype(np.float32); band = a[B0:B1]; band[dm] = band[dm] * 0.25 + np.float32([200, 30, 30]) * 0.75
    out = a * 0.55; out[B0:B1] = band; im2 = Image.fromarray(out.astype(np.uint8)); d = ImageDraw.Draw(im2)
    d.rectangle([0, B0, W - 1, B1], outline=(140, 255, 60), width=4); return im2
SCN = {"S1": R + "puma-kb/sources/S09-piloto-aprobado/placeholder_botines_16x9.png", "S2": R + "drive-dl/concentracion.png",
       "S3": R + "extend/huddle_nb.png", "S4": R + "extend/comp_nb_fix.png"}
hud = Image.open(R + "extend/huddle_nb.png").convert("RGB"); comp = Image.open(R + "extend/comp_nb_fix.png").convert("RGB")
k1 = hud.crop((1460, 890, 1880, 1344)); k2 = comp.crop((1480, 830, 1990, 1070))
k1 = k1.resize((int(k1.width * 900 / k1.height), 900)); k2 = k2.resize((int(k2.width * 900 / k2.height), 900))
kit = Image.new("RGB", (k1.width + k2.width + 20, 900), (20, 20, 20)); kit.paste(k1, (0, 0)); kit.paste(k2, (k1.width + 20, 0))
for sid, fn in SK.items():
    os.makedirs(O + sid, exist_ok=True)
    sk = sketch(fn); sk.save(O + f"{sid}/1_composicion_{sid}.png")
    overlay(sk).save(O + f"{sid}/_check_composicion_sobre_pantalla_{sid}.jpg", quality=90)
    sc = Image.open(SCN[sid]).convert("RGB"); sc.thumbnail((2560, 2560)); sc.save(O + f"{sid}/2_escena_{sid}.jpg", quality=93)
    kit.save(O + f"{sid}/3_uniforme.jpg", quality=93)
# contact sheet
rows = []
for sid in SK:
    ims = [Image.open(O + f"{sid}/_check_composicion_sobre_pantalla_{sid}.jpg"), Image.open(O + f"{sid}/2_escena_{sid}.jpg"), Image.open(O + f"{sid}/3_uniforme.jpg")]
    th = 300; ims = [i.resize((int(i.width * th / i.height), th)) for i in ims]
    r = Image.new("RGB", (sum(i.width for i in ims) + 20, th), (10, 10, 10)); x = 0
    for i in ims: r.paste(i, (x, 0)); x += i.width + 10
    rows.append(r)
S = Image.new("RGB", (max(r.width for r in rows), sum(r.height + 10 for r in rows)), (10, 10, 10)); y = 0
for r in rows: S.paste(r, (0, y)); y += r.height + 10
S.save(R + "qc/refs_sheet.jpg", quality=85); print(S.size)
