"""Manga-panel composition guides for the speaker refs (Andrés S3/S4 method, generalised):
ref at its screen placement on a 3360x1440 canvas, margins pre-filled (edge-replicate + blur), paint-outs, then
XDoG ink + 3-step screentone + solid blacks; margins = flat tone + the ref's long perspective lines extended; manga FX
(radial burst/focus lines) only over dark background. Usage: manga_speakers.py NAME [NAME...]"""
import math, random, sys, json, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
O = R + "frames_screen/speakers/"; PL = json.load(open(O + "placement.json"))
OV = Image.open(R + "frames_screen/expand_v8/SCREEN_overlay_21x9.png")          # same band rows 408-1031 of 1440
W, H = 3360, 1440
# per scene: paint-outs as ref-fraction ellipses (cx, cy, rx, ry); fx = (kind, ref-fraction point, n lines, protect radius px)
CFG = {
 "CEP1_cancha":  dict(drawn=True, out=[(0.985, 0.77, 0.02, 0.06), (0.67, 0.59, 0.045, 0.04), (0.49, 0.555, 0.07, 0.03)],
                      fx=[], pct=[93, 78, 48],
                      draw=[("dots", (0.0, 0.40), (0.08, 0.30), (0.17, 0.25), 7, 16), ("dots", (0.83, 0.25), (0.92, 0.30), (1.0, 0.40), 7, 16),
                            ("curve", (0.0, 0.47), (0.08, 0.36), (0.17, 0.33), 6), ("curve", (0.83, 0.33), (0.92, 0.36), (1.0, 0.47), 6)]),
 "CEP2_tunel":   dict(out=[], fx=[("focus", (0.50, 0.28), 220, 520)],
                      draw=[("vp", (0.50, 0.42), [(0.0, 0.02), (0.17, 0.0), (0.83, 0.0), (1.0, 0.02), (0.0, 1.0), (1.0, 1.0)], 6)]),
 "CEP3_penal":   dict(out=[], fx=[("focus", (0.53, 0.80), 200, 160)]),
 "CEP4_tecnico": dict(out=[], fx=[("focus", (0.515, 0.355), 110, 260)],
                      draw=[("vlines", [0.03, 0.08, 0.13, 0.87, 0.92, 0.97], 0.22, 0.95, 6), ("vp", (0.42, 0.40), [(0.0, 0.0), (1.0, 0.0)], 5)]),
 "CEP5_festejo": dict(out=[], fx=[("burst", (0.50, 0.56), 240, 300)]),
}
YY, XX = np.mgrid[0:H, 0:W].astype(np.float32); c45 = math.cos(math.radians(45))
SCR = (np.cos(2 * np.pi * (XX * c45 - YY * c45) / 11) + np.cos(2 * np.pi * (XX * c45 + YY * c45) / 11)) / 4 + 0.5
def ht(v): return np.where(SCR > 1 - v, 0.0, 1.0)
def xdog(img, sig, k=1.6, tau=0.98, phi=120):
    a = cv2.GaussianBlur(img, (0, 0), sig); b = cv2.GaussianBlur(img, (0, 0), sig * k); D = a - tau * b
    return np.where(D >= 0, 1.0, 1 + np.tanh(phi * D))
for name in sys.argv[1:]:
    m = PL[name]; cfg = CFG[name]; k = W / m["canvas"][0]
    x0, y0, bw, bh = [v * k for v in m["base_in_canvas"]]
    base = cv2.imread(m["base"]); base = cv2.resize(base, (int(round(bw)), int(round(bh))), interpolation=cv2.INTER_AREA)
    rf = lambda fx, fy: (x0 + fx * bw, y0 + fy * bh)                                   # ref fraction -> canvas px
    # paint-outs on the ref itself
    mk = np.zeros(base.shape[:2], np.uint8)
    for (cx, cy, rx, ry) in cfg["out"]: cv2.ellipse(mk, (int(cx * bw), int(cy * bh)), (int(rx * bw), int(ry * bh)), 0, 0, 360, 255, -1)
    if mk.any(): base = cv2.inpaint(base, mk, 15, cv2.INPAINT_TELEA)
    from rembg import remove, new_session
    ses = globals().get("_SES") or new_session("u2net_human_seg"); globals()["_SES"] = ses
    pm_ = np.asarray(remove(Image.fromarray(cv2.cvtColor(base, cv2.COLOR_BGR2RGB)), session=ses, only_mask=True)).astype(np.float32) / 255
    # pre-filled canvas (edge replicate, blurred outside)
    pad = 2000; big = cv2.copyMakeBorder(base, pad, pad, pad, pad, cv2.BORDER_REPLICATE)
    X, Y = int(round(x0)), int(round(y0)); src = big[pad - Y: pad - Y + H, pad - X: pad - X + W].copy(); rep_ = src.copy()
    inside = np.zeros((H, W), np.float32); inside[max(0, Y) + 6:min(H, Y + base.shape[0]) - 6, max(0, X) + 6:min(W, X + base.shape[1]) - 6] = 1
    src = (src * cv2.GaussianBlur(inside, (0, 0), 3)[..., None] + cv2.GaussianBlur(src, (0, 0), 38) * (1 - cv2.GaussianBlur(inside, (0, 0), 3)[..., None])).astype(np.uint8)
    person = np.zeros((H, W), np.float32); ys0, xs0 = max(0, Y), max(0, X)
    person[ys0:min(H, Y + base.shape[0]), xs0:min(W, X + base.shape[1])] = pm_[ys0 - Y:min(H, Y + base.shape[0]) - Y, xs0 - X:min(W, X + base.shape[1]) - X]
    person = (person > 0.5).astype(np.uint8); personD = cv2.dilate(person, np.ones((41, 41), np.uint8))
    # tones + ink
    lab = cv2.cvtColor(src, cv2.COLOR_BGR2LAB); Lc = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8)).apply(lab[..., 0])
    sm = cv2.bilateralFilter(Lc, 17, 45, 11).astype(np.float32) / 255
    pin = sm[inside > 0]; p80, p55, p22 = np.percentile(pin, cfg.get('pct', [72, 45, 16]))
    tone = np.where(sm > p80, 1.0, np.where(sm > p55, ht(0.18), np.where(sm > p22, ht(0.46), 0.0)))
    ink = (xdog(sm, 2.6) < 0.5).astype(np.uint8)
    n, lab_, st, _ = cv2.connectedComponentsWithStats(ink, 8); keep = np.zeros(n, bool); keep[1:] = st[1:, cv2.CC_STAT_AREA] >= 90
    ink = cv2.dilate(keep[lab_].astype(np.uint8), np.ones((2, 2), np.uint8))
    inkB = (xdog(sm, 4.0) < 0.5).astype(np.uint8); nb, lb, sb, _ = cv2.connectedComponentsWithStats(inkB, 8); kb = np.zeros(nb, bool); kb[1:] = sb[1:, cv2.CC_STAT_AREA] >= 220
    inkB = kb[lb].astype(np.uint8)                                                     # background: fewer, calmer lines
    pf = cv2.GaussianBlur(person.astype(np.float32), (0, 0), 4) if person.any() else np.ones((H, W), np.float32)
    ink = np.where(pf > 0.5, ink, inkB)
    if person.any(): tone = np.where(pf > 0.5, tone, np.maximum(tone, ht(0.30) * (tone < 1) + (tone >= 1)))   # background tone one step lighter
    panel = np.minimum(tone, 1.0 - ink.astype(np.float32)); im = Image.fromarray((panel * 245 + 5).astype(np.uint8)).convert("RGB")
    # FX lines over dark background only, kept off the subject (protect radius)
    dark = ((sm < p55) & (inside > 0) & (personD == 0)).astype(np.uint8) * 255; dark = cv2.erode(dark, np.ones((9, 9), np.uint8))
    fx = Image.new("L", (W, H), 0); d = ImageDraw.Draw(fx); random.seed(7)
    for kind, (fxx, fyy), nl, prot in cfg["fx"]:
        P = rf(fxx, fyy)
        for _ in range(nl):
            a = random.uniform(0, 2 * math.pi); r0 = prot + random.uniform(0, 60); r1 = random.uniform(160, 700) if kind == "burst" else 3000
            d.line([(P[0] + r0 * math.cos(a), P[1] + r0 * math.sin(a)), (P[0] + (r0 + r1) * math.cos(a), P[1] + (r0 + r1) * math.sin(a))], fill=255, width=random.choice([2, 3, 3, 4]))
        if kind == "burst":
            g = Image.new("L", (W, H), 0); ImageDraw.Draw(g).ellipse([P[0] - prot * 2.2, P[1] - prot * 1.2, P[0] + prot * 2.2, P[1] + prot * 1.2], fill=200)
            fx = Image.fromarray(np.maximum(np.asarray(fx), np.asarray(g.filter(ImageFilter.GaussianBlur(prot * 0.6)))))
    fxm = Image.fromarray(np.minimum(np.asarray(fx), np.asarray(Image.fromarray(dark).filter(ImageFilter.GaussianBlur(2)))))
    im = Image.composite(Image.new("RGB", (W, H), (248, 248, 244)), im, fxm)
    # margins: flat 3-step tone from the blurred continuation + the ref's long perspective lines carried across
    sys.path.insert(0, R + "tools"); import manga_margins as MM
    mt_, ok_ = MM.render(name, ht)
    fe = (cv2.GaussianBlur(inside, (0, 0), 34) * (0 if cfg.get('drawn') else 1))[..., None]
    im = Image.fromarray((np.asarray(im).astype(np.float32) * fe + (mt_ * 245 + 5)[..., None] * (1 - fe)).astype(np.uint8))
    im.save(O + f"{name}__MANGA_guide.png")
    both = im.convert("RGBA"); both.alpha_composite(OV); both.convert("RGB").save(O + f"{name}__MANGA_with_overlay.png")
    both.convert("RGB").resize((1120, 480), Image.LANCZOS).save(R + f"qc/{name}_manga_prev.jpg", quality=85)
print("ok", sys.argv[1:])
