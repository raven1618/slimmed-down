"""Ink an approved frame into a manga panel: XDoG ink lines + 3-step screentone + solid blacks, then manga FX.
S3: hands other than the captain's are painted out first; impact lines radiate from the fingertip over the night sky."""
import math, random, sys, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
src = cv2.imread(R + "frames_screen/expand_v8/S3_huddle__GUIDE_image_prompt.png"); H, W = src.shape[:2]
# ---- paint out every hand except the captain's raised one (canvas coords)
mask = np.zeros((H, W), np.uint8)
for (x0, y0, x1, y1) in [(1225, 815, 1340, 920), (1835, 845, 1960, 945), (1985, 925, 2130, 1095), (2170, 985, 2280, 1105), (985, 660, 1085, 730), (2540, 405, 2690, 585)]:
    cv2.ellipse(mask, ((x0 + x1) // 2, (y0 + y1) // 2), ((x1 - x0) // 2 + 10, (y1 - y0) // 2 + 10), 0, 0, 360, 255, -1)
clean = cv2.inpaint(src, mask, 15, cv2.INPAINT_TELEA)
cv2.imwrite(R + "qc/s3_handsout.jpg", cv2.resize(clean, (1680, 720)))
# ---- tones (equalised, percentile steps: faces/highlights white, kit light tone, shadows dark tone, deepest black)
lab = cv2.cvtColor(clean, cv2.COLOR_BGR2LAB); Lc = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8)).apply(lab[..., 0])
sm = cv2.bilateralFilter(Lc, 17, 45, 11).astype(np.float32) / 255
YY, XX = np.mgrid[0:H, 0:W].astype(np.float32); c, s = math.cos(math.radians(45)), math.sin(math.radians(45))
SCR = (np.cos(2 * np.pi * (XX * c - YY * s) / 11) + np.cos(2 * np.pi * (XX * s + YY * c) / 11)) / 4 + 0.5
def ht(v): return np.where(SCR > 1 - v, 0.0, 1.0)
p80, p55, p22 = np.percentile(sm, [72, 45, 16])
tone = np.where(sm > p80, 1.0, np.where(sm > p55, ht(0.18), np.where(sm > p22, ht(0.46), 0.0)))
# ---- ink lines: XDoG on a smoothed image, small specks removed
def xdog(img, sig, k=1.6, tau=0.98, eps=0.0, phi=120):
    a = cv2.GaussianBlur(img, (0, 0), sig); b = cv2.GaussianBlur(img, (0, 0), sig * k); D = a - tau * b
    return np.where(D >= eps, 1.0, 1 + np.tanh(phi * (D - eps)))
ink = (xdog(sm, 2.6) < 0.5).astype(np.uint8)
n, lab_, st, _ = cv2.connectedComponentsWithStats(ink, 8)
keep = np.zeros(n, bool); keep[1:] = st[1:, cv2.CC_STAT_AREA] >= 90; ink = keep[lab_].astype(np.uint8)
ink = cv2.dilate(ink, np.ones((2, 2), np.uint8))
panel = np.minimum(tone, 1.0 - ink.astype(np.float32))
out = (panel * 245 + 5).astype(np.uint8)
im = Image.fromarray(out).convert("RGB")
# ---- night sky: darker tone where the background is dark, between the heads
import json
SKYP = np.array([(1250, 640), (1290, 420), (1420, 250), (1560, 120), (1680, 30), (1700, 300), (1800, 340), (1980, 310), (2000, 120), (2120, 40), (2165, 300), (2150, 520), (2050, 700), (1880, 620), (1700, 560), (1500, 640)], np.int32)
skyreg = np.zeros((H, W), np.uint8); cv2.fillPoly(skyreg, [SKYP], 255)
darken = (skyreg > 0) & (sm < p80)
arr = np.asarray(im).copy(); arr[darken] = (np.minimum(ht(0.78), 1.0 - ink.astype(np.float32))[darken] * 245 + 5).astype(np.uint8)[:, None]; im = Image.fromarray(arr)
# ---- FX: floodlight burst + impact lines from the captain's fingertip, only over the dark night sky
sky = ((sm < p80) & (skyreg > 0)).astype(np.uint8) * 255
sky = cv2.erode(sky, np.ones((9, 9), np.uint8)); skyI = Image.fromarray(sky).filter(ImageFilter.GaussianBlur(2))
fx = Image.new("L", (W, H), 0); d = ImageDraw.Draw(fx); random.seed(11)
TIP = (1567, 718)
for k in range(170):
    a = random.uniform(0, 2 * math.pi); r0 = random.uniform(60, 140)
    d.line([(TIP[0] + r0 * math.cos(a), TIP[1] + r0 * math.sin(a)), (TIP[0] + 2600 * math.cos(a), TIP[1] + 2600 * math.sin(a))], fill=255, width=random.choice([2, 3, 3, 5]))
FL = (1900, 360)
for k in range(160):
    a = random.uniform(0, 2 * math.pi); r1 = random.uniform(200, 760)
    d.line([FL, (FL[0] + r1 * math.cos(a), FL[1] + r1 * 0.7 * math.sin(a))], fill=255, width=random.choice([2, 3]))
fxm = Image.fromarray(np.minimum(np.asarray(fx), np.asarray(skyI)))
im = Image.composite(Image.new("RGB", (W, H), (248, 248, 244)), im, fxm)
glow = Image.new("L", (W, H), 0); ImageDraw.Draw(glow).ellipse([FL[0] - 230, FL[1] - 110, FL[0] + 230, FL[1] + 110], fill=255); glow = glow.filter(ImageFilter.GaussianBlur(40))
im = Image.composite(Image.new("RGB", (W, H), (250, 250, 246)), im, glow)
tg = Image.new("L", (W, H), 0); ImageDraw.Draw(tg).ellipse([TIP[0] - 38, TIP[1] - 38, TIP[0] + 38, TIP[1] + 38], fill=255); tg = tg.filter(ImageFilter.GaussianBlur(14))
im = Image.composite(Image.new("RGB", (W, H), (252, 252, 250)), im, tg)            # spark at the fingertip
# ---- extended edges: clean flat screentone (no smears) + ring-of-shoulders contours
pm = json.load(open(R + "frames_screen/expand_v8/placement.json"))["S3_huddle"]; kk = W / pm["canvas"][0]
bx0, by0, bw, bh = [v * kk for v in pm["base_in_canvas"]]; bx1, by1 = bx0 + bw, by0 + bh
inside = np.zeros((H, W), np.float32); inside[int(by0) + 6:int(by1) - 6, int(bx0) + 6:int(bx1) - 6] = 1
fe = cv2.GaussianBlur(inside, (0, 0), 18)[..., None]
bl = cv2.GaussianBlur(cv2.cvtColor(src, cv2.COLOR_BGR2LAB)[..., 0], (0, 0), 55).astype(np.float32) / 255
mt = np.where(bl > np.percentile(bl, 60), ht(0.2), np.where(bl > np.percentile(bl, 30), ht(0.45), ht(0.7)))
margin = (mt * 245 + 5)[..., None].repeat(3, 2)
im = Image.fromarray((np.asarray(im).astype(np.float32) * fe + margin * (1 - fe)).astype(np.uint8))
d = ImageDraw.Draw(im)
for pts in ([(0, 700), (150, 640), (300, 690)], [(0, 980), (120, 940), (260, 1000), (290, 1440)], [(60, 0), (130, 140), (300, 210)],
            [(3360, 640), (3230, 600), (3120, 660)], [(3360, 1000), (3240, 960), (3120, 1020), (3100, 1440)], [(3300, 0), (3230, 120), (3120, 170)],
            [(700, 1440), (760, 1360), (900, 1350)], [(2500, 1440), (2560, 1365), (2700, 1350)]):
    d.line(pts, fill=(10, 10, 10), width=9, joint="curve")
out_p = R + "frames_screen/expand_v8/S3_huddle__MANGA_guide.png"; im.save(out_p)
ov = Image.open(R + "frames_screen/expand_v8/SCREEN_overlay_21x9.png"); both = im.convert("RGBA"); both.alpha_composite(ov)
both.convert("RGB").save(R + "frames_screen/expand_v8/S3_huddle__MANGA_with_overlay.png")
im.resize((1680, 720), Image.LANCZOS).save(R + "qc/s3_manga_clean.jpg", quality=90)
both.convert("RGB").resize((1680, 720), Image.LANCZOS).save(R + "qc/s3_manga_prev.jpg", quality=90)
print("ok")
