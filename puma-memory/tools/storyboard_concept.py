"""Concept proposal "Una sola luz" — Andrés Silva teaser, designed for the die-cut 19 x 3.5 m screen.

One continuous green beam (from the KV) ties the piece together: spark -> outline of the screen -> path to the pitch ->
connects the minds -> passes from the leader to the team -> joins the hands -> becomes the KV ball -> frames the speaker.
The three panels are used as three cameras on the same moment (triptych); transitions follow the die-cut geometry.

Renders at 1920x356 (half of 3840x708). Outputs a clean proposal video and an annotated one (info strip).
"""
import json, math, os, subprocess, sys
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

C = json.load(open(sys.argv[1])); OUT = C["out_dir"]; os.makedirs(OUT, exist_ok=True); os.makedirs(f"{OUT}/frames", exist_ok=True)
FPS, N = 25, 750
W, H = 1920, 356
F_B = C["fonts"] + "/GothamCondensed-Black.otf"; F_M = C["fonts"] + "/GothamCondensed-Medium.otf"; F_BO = C["fonts"] + "/GothamCondensed-Bold.otf"
LIME = np.float32([127, 255, 0]); WHITE = np.float32([255, 255, 255]); FLASH = np.float32([205, 255, 215])

def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def ease(t): t = clamp(t); return t * t * (3 - 2 * t)
def eio(t): t = clamp(t); return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2      # ease in-out cubic
def prog(f, a, b, fn=ease): return fn((f - a) / max(1e-6, b - a))
def lerp(a, b, t): return a + (b - a) * t

# ------------------------------------------------------------------ screen geometry (die-cut measured from the approved pilot)
dm = cv2.imread(C["diecut_mask"], 0); dm = cv2.resize(dm, (W, H), interpolation=cv2.INTER_NEAREST) > 127
dm[:4] = dm[4]; dm[-4:] = dm[-5]                                   # clean noisy edge rows
VIS = (~dm).astype(np.float32)[..., None]
n, lab = cv2.connectedComponents((~dm).astype(np.uint8))
comps = sorted([(np.mean(np.where(lab == i)[1]), i) for i in range(1, n) if (lab == i).sum() > 2000])
MASK = {k: (lab == i) for k, (_, i) in zip(["L", "C", "R"], comps[:3])}
BOX = {}
for k, m in MASK.items():
    ys, xs = np.where(m); BOX[k] = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
def resample(p, step=3.0):
    p = np.asarray(p, np.float32); d = np.r_[0, np.cumsum(np.hypot(*np.diff(p, axis=0).T))]
    s = np.arange(0, d[-1], step); return np.stack([np.interp(s, d, p[:, 0]), np.interp(s, d, p[:, 1])], 1)
CONT = {}
for k, m in MASK.items():
    cs, _ = cv2.findContours(m.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cs, key=len)[:, 0, :].astype(np.float32); CONT[k] = resample(np.vstack([c, c[:1]]), 3.0)
DIST = cv2.distanceTransform((~dm).astype(np.uint8), cv2.DIST_L2, 5)  # distance to the die-cut (for "from the bands" reveal)
XX = np.arange(W, dtype=np.float32)[None, :]; YY = np.arange(H, dtype=np.float32)[:, None]
CX, CY = 960.0, 178.0

# ------------------------------------------------------------------ assets
def load_rgb(p): return cv2.cvtColor(cv2.imread(p), cv2.COLOR_BGR2RGB).astype(np.float32)
IMG = {k: load_rgb(v) for k, v in C["images"].items()}
KVBG = load_rgb(C["kv"] + "/kv_bg.png"); KVBM = load_rgb(C["kv"] + "/kv_beams_add.png")
KVF = load_rgb(C["kv"] + "/kv_full.png"); KVU = load_rgb(C["kv"] + "/kv_bg_beams.png")
lm = (np.abs(KVF - KVU).sum(2) > 40); lm[392:] = 0; lm[:330] = 0
ys, xs = np.where(lm); LOGO = KVF[ys.min():ys.max() + 1, xs.min():xs.max() + 1]; LOGO_A = lm[ys.min():ys.max() + 1, xs.min():xs.max() + 1].astype(np.float32)
LOGO_A = cv2.GaussianBlur(LOGO_A, (0, 0), 0.7)
ANDRES = load_rgb(C["andres"])
def cover(img, w, h):
    ih, iw = img.shape[:2]; r = max(w / iw, h / ih); im = cv2.resize(img, (int(iw * r + 1), int(ih * r + 1)), interpolation=cv2.INTER_AREA)
    y = (im.shape[0] - h) // 2; x = (im.shape[1] - w) // 2; return im[y:y + h, x:x + w]
WIDE_BG = cover(KVBG, W, H); WIDE_BM = cover(KVBM, W, H)

# ------------------------------------------------------------------ cameras on stills, per window
def view(img, box, s=1.0, cx=0.5, cy=0.5, rot=0.0):
    x0, y0, x1, y1 = box; bw, bh = x1 - x0, y1 - y0; ih, iw = img.shape[:2]; a = bw / bh
    vw, vh = (ih * a, ih) if iw / ih > a else (iw, iw / a); vw /= s; vh /= s
    px = min(max(cx * iw, vw / 2), iw - vw / 2); py = min(max(cy * ih, vh / 2), ih - vh / 2)
    th = math.radians(rot); k = vw / bw
    A = np.float32([[math.cos(th) * k, -math.sin(th) * k, 0], [math.sin(th) * k, math.cos(th) * k, 0]])
    A[0, 2] = px - A[0, 0] * bw / 2 - A[0, 1] * bh / 2; A[1, 2] = py - A[1, 0] * bw / 2 - A[1, 1] * bh / 2
    return cv2.warpAffine(img, A, (bw, bh), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT), (px, py, vw, vh)
def to_canvas(box, vinfo, ix, iy, img):
    x0, y0, x1, y1 = box; px, py, vw, vh = vinfo; ih, iw = img.shape[:2]
    return x0 + (ix * iw - (px - vw / 2)) * (x1 - x0) / vw, y0 + (iy * ih - (py - vh / 2)) * (y1 - y0) / vh

# ------------------------------------------------------------------ light (KV-style multi-strand ribbons)
def catmull(pts, n=200):
    p = np.asarray(pts, np.float32); p = np.vstack([p[0], p, p[-1]]); out = []
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i - 1], p[i], p[i + 1], p[i + 2]
        for t in np.linspace(0, 1, max(2, n // (len(pts) - 1)), endpoint=False):
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(p[-2]); return resample(np.array(out), 3.0)
def seg(path, head, tail=1.0, start=0.0):
    n = len(path); h = int(clamp(head) * (n - 1)); a = max(int(start * (n - 1)), int(h - tail * (n - 1)))
    return path[a:h + 1] if h - a >= 1 else None
def ribbon(L, pts, inten, t, strands=7, spread=9.0, seed=1, core=2):
    if pts is None or len(pts) < 2 or inten < 0.01: return
    p = np.asarray(pts, np.float32); tg = np.gradient(p, axis=0); nr = np.stack([-tg[:, 1], tg[:, 0]], 1)
    nr /= np.linalg.norm(nr, axis=1, keepdims=True) + 1e-6; u = np.linspace(0, 1, len(p)); rng = np.random.default_rng(seed)
    for i in range(strands):
        off = (i - (strands - 1) / 2) / max(1, (strands - 1) / 2) * spread * 0.5
        wob = off + 2.2 * np.sin(u * rng.uniform(3, 7) * 6.28 + rng.uniform(0, 6.28) + t * 3)
        q = (p + nr * wob[:, None]).astype(np.int32); g = 0.5 + 0.5 * rng.uniform()
        cv2.polylines(L, [q], False, (70 * inten * g, 255 * inten * g, 120 * inten * g), 1, cv2.LINE_AA)
    cv2.polylines(L, [p.astype(np.int32)], False, (235 * inten, 255 * inten, 238 * inten), core, cv2.LINE_AA)
def glow(L):
    g1 = cv2.GaussianBlur(L, (0, 0), 2.5); g2 = cv2.resize(cv2.GaussianBlur(cv2.resize(L, (W // 4, H // 4), interpolation=cv2.INTER_AREA), (0, 0), 4), (W, H))
    return L + g1 * 1.3 + g2 * 2.4 * np.float32([0.55, 1.0, 0.6])
def bloom(L, x, y, r, inten):
    d2 = ((XX - x) ** 2 + (YY - y) ** 2) / (r * r); L += (np.exp(-d2)[..., None] * np.float32([150, 255, 170]) * inten).astype(np.float32)
def lightning(a, b, seed, jag=14, n=26):
    rng = np.random.default_rng(seed); a, b = np.float32(a), np.float32(b); t = np.linspace(0, 1, n)[:, None]
    p = a + (b - a) * t; nr = np.float32([-(b - a)[1], (b - a)[0]]); nr /= np.linalg.norm(nr) + 1e-6
    off = np.cumsum(rng.normal(0, jag, n)); off -= np.linspace(off[0], off[-1], n); return resample(p + nr * off[:, None] * np.sin(np.pi * t), 3.0)

# ------------------------------------------------------------------ typography (light-written)
def text_img(s, path, size, col):
    f = ImageFont.truetype(path, size); w = int(f.getlength(s)) + 8; h = int(size * 1.25)
    im = Image.new("L", (w, h)); ImageDraw.Draw(im).text((4, 0), s, font=f, fill=255)
    a = np.asarray(im, np.float32) / 255.0; return a, np.float32(col)
TXT = {}
def T(key, s, path, size, col): TXT[key] = text_img(s, path, size, col)
for k, v in C["texts"].items(): T(k, v["s"], {"black": F_B, "bold": F_BO, "medium": F_M}[v["font"]], v["size"], LIME if v["col"] == "lime" else WHITE)
def put_text(frame, L, key, cx, y, f, f_in, f_out, t):
    a, col = TXT[key]; h, w = a.shape; x = int(cx - w / 2)
    if f < f_in or f > f_out + 8: return
    r = prog(f, f_in, f_in + 12, lambda q: q); fade = 1 - prog(f, f_out, f_out + 8)
    front = r * (w + 30) - 15; cols = np.clip((front - np.arange(w)) / 10.0, 0, 1)[None, :]
    al = a * cols * fade
    x0, x1 = max(0, x), min(W, x + w); y0, y1 = max(0, y), min(H, y + h)
    if x1 <= x0 or y1 <= y0: return
    al_c = al[y0 - y:y1 - y, x0 - x:x1 - x][..., None]
    sh = cv2.GaussianBlur(al_c[..., 0], (0, 0), 4)[..., None] * 0.55
    frame[y0:y1, x0:x1] = frame[y0:y1, x0:x1] * (1 - sh) ; frame[y0:y1, x0:x1] = frame[y0:y1, x0:x1] * (1 - al_c) + col * al_c
    if 0 < r < 1:   # the beam writes the line: glowing head + underline
        fx = x + front; bloom(L, fx, y + h * 0.55, 26, 0.9)
        ribbon(L, np.array([[x - 10, y + h + 4], [fx, y + h + 4]], np.float32), 0.8, t, strands=4, spread=5, seed=11)

# ------------------------------------------------------------------ scenes (window content + anchors)
def S(id_):
    return next(s for s in C["scenes"] if s["id"] == id_)
def cam_at(sc, win, f):
    c = sc["cams"][win]; p = prog(f, sc["f0"], sc["f1"], eio)
    return lerp(c["s"][0], c["s"][1], p), lerp(c["c"][0][0], c["c"][1][0], p), lerp(c["c"][0][1], c["c"][1][1], p), lerp(*c.get("rot", [0, 0]), p)
def scene_frame(sc, f):
    out = np.zeros((H, W, 3), np.float32); vinfo = {}
    for win in ("L", "C", "R"):
        img = IMG[sc["img"][win]] if isinstance(sc["img"], dict) else IMG[sc["img"]]
        s, cx, cy, rot = cam_at(sc, win, f)
        punch = sc.get("punch", {}).get(win)
        if punch is not None and punch <= f <= punch + 14: s *= 1 + 0.08 * math.sin(math.pi * (f - punch) / 14)
        v, vi = view(img, BOX[win], s, cx, cy, rot); vinfo[win] = (vi, img)
        x0, y0, x1, y1 = BOX[win]; m = MASK[win][y0:y1, x0:x1][..., None]
        out[y0:y1, x0:x1] = out[y0:y1, x0:x1] * (1 - m) + v * m
    return out, vinfo
def anchor(vinfo, win, ix, iy): vi, img = vinfo[win]; return to_canvas(BOX[win], vi, ix, iy, img)

def close_frame(f, t):
    out = WIDE_BG * 0.85 + WIDE_BM * (0.35 + 0.1 * math.sin(t * 2))
    # pentagon emblem in the centre
    sc = 0.405; kw, kh = int(1920 * sc), int(1080 * sc); bm = cv2.resize(KVBM, (kw, kh), interpolation=cv2.INTER_AREA)
    ox, oy = int(CX - 950 * sc), int(CY + 4 - 520 * sc); x0, y0 = max(0, ox), max(0, oy); x1, y1 = min(W, ox + kw), min(H, oy + kh)
    out[y0:y1, x0:x1] += bm[y0 - oy:y1 - oy, x0 - ox:x1 - ox] * 1.1
    # Andrés in the side panels (photo untouched) + animated rays behind him
    for win in ("L", "R"):
        x0b, y0b, x1b, y1b = BOX[win]; v = cover(ANDRES, x1b - x0b, y1b - y0b)
        bgm = ((v[..., 1] - v[..., 0]) > 35).astype(np.float32)[..., None]
        rays = np.zeros_like(v); cxp, cyp = (x1b - x0b) * 0.5, (y1b - y0b) * 0.45
        for k in range(14):
            ang = k / 14 * 6.283 + t * 0.35; cv2.line(rays, (int(cxp), int(cyp)), (int(cxp + math.cos(ang) * 600), int(cyp + math.sin(ang) * 600)), (60, 255, 110), 3, cv2.LINE_AA)
        rays = cv2.GaussianBlur(rays, (0, 0), 6) * (0.6 + 0.4 * math.sin(t * 3))
        m = MASK[win][y0b:y1b, x0b:x1b][..., None]; out[y0b:y1b, x0b:x1b] = out[y0b:y1b, x0b:x1b] * (1 - m) + (v + rays * bgm) * m
    return out, (ox, oy, sc)

# ------------------------------------------------------------------ main timeline
A = {k: S(k) for k in ("S1", "S2", "S3", "S4")}
PENT = np.float32([(470, 425), (930, 105), (1430, 445), (1215, 915), (700, 905), (470, 425)])
def outline(L, f, a, b, inten, t, start_pts):
    p = prog(f, a, b, eio)
    for k, sp in start_pts.items():
        c = CONT[k]; i0 = int(np.argmin(np.hypot(c[:, 0] - sp[0], c[:, 1] - sp[1]))); n = len(c)
        half = int(p * n / 2)
        if half < 2: continue
        fw = c[[(i0 + j) % n for j in range(half)]]; bw = c[[(i0 - j) % n for j in range(half)]]
        tail = int(n * 0.18) if p < 1 else half
        ribbon(L, fw[-tail:], inten, t, strands=5, spread=5, seed=21); ribbon(L, bw[-tail:], inten, t, strands=5, spread=5, seed=22)
        if p < 1: bloom(L, *fw[-1], 18, 0.8); bloom(L, *bw[-1], 18, 0.8)

def render(f):
    t = f / FPS; L = np.zeros((H, W, 3), np.float32); fr = np.zeros((H, W, 3), np.float32); txt_jobs = []
    # ---------------- INTRO 0-65: spark -> screen outline -> KV ball -> logo -> 45-degree sweep into S1
    if f < 75:
        bloom(L, CX, 300, 10 + 30 * prog(f, 0, 8), 1.2 * (1 - prog(f, 10, 20)))
        outline(L, f, 6, 40, 1.0, t, {"C": (CX, 355), "L": (389, 160), "R": (1532, 160)})
        fill = prog(f, 14, 46); fr = WIDE_BG * fill
        rr = lerp(0, 1100, prog(f, 26, 58)); rd = np.hypot(XX - CX, (YY - CY) * 1.6)
        rev = np.clip((rr - rd) / 140, 0, 1)[..., None]; head = (1 + 1.8 * np.exp(-((rd - rr) / 50) ** 2))[..., None]
        fr = fr + WIDE_BM * rev * head * 0.9
        la = prog(f, 38, 54); lw = int(LOGO.shape[1] * 0.85); lh = int(LOGO.shape[0] * 0.85)
        if la > 0:
            lg = cv2.resize(LOGO, (lw, lh)); al = cv2.resize(LOGO_A, (lw, lh))[..., None] * la
            x0, y0 = int(CX - lw / 2), int(CY - lh / 2); fr[y0:y0 + lh, x0:x0 + lw] = fr[y0:y0 + lh, x0:x0 + lw] * (1 - al) + lg * al
        if f >= 56:   # 45-degree sweep (same angle as the die-cut bands) reveals S1
            q = prog(f, 56, 74, eio); x0 = lerp(-H, W + H, q); xl = x0 - (YY - H / 2)
            m = np.clip((xl - XX) / 12 + 0.5, 0, 1)[..., None]; s1, _ = scene_frame(A["S1"], f); fr = fr * (1 - m) + s1 * m
            ribbon(L, np.array([[x0 + H / 2 + 20, -20], [x0 - H / 2 - 20, H + 20]], np.float32), 1.0, t, strands=9, spread=20, seed=3)
    # ---------------- S1 boots: triptych detail / action / destination; the beam is the path to the pitch
    elif f < 215:
        sc = A["S1"]; fr, vi = scene_frame(sc, f)
        p0 = anchor(vi, "L", 0.36, 0.56); p4 = anchor(vi, "R", 0.56, 0.18)
        path = catmull([p0, (p0[0] + 120, 330), (560, 318), (900, 300), (1250, 262), (1440, 200), (1600, 150), p4], 260)
        ribbon(L, seg(path, prog(f, 78, 150, eio), 0.55), 1.0, t, strands=8, spread=10, seed=4)
        if f >= 140: bloom(L, p4[0], p4[1], 60 + 40 * prog(f, 140, 175), 0.9 * (1 - 0.5 * prog(f, 175, 200)))
        if 84 <= f <= 98: bloom(L, p0[0], p0[1], 30, 0.8 * math.sin(math.pi * (f - 84) / 14))     # lace pulled tight
        txt_jobs += [("s1a", CX, 18, 80, 196), ("s1b", CX, 46, 86, 196), ("s1c", CX, 116, 124, 196)]
        if f >= 196:   # pinch into the mind: everything converges to the centre, flash, iris opens S2
            q = prog(f, 196, 214, lambda x: x * x); s = 1 + 1.4 * q
            M = cv2.getRotationMatrix2D((CX, CY), 0, s); acc = sum(cv2.warpAffine(fr, cv2.getRotationMatrix2D((CX, CY), 0, s * (1 + 0.04 * k)), (W, H)) for k in range(3)) / 3
            fr = acc * (1 - 0.6 * q)
            for k, (sx, sy) in enumerate([(150, 40), (150, 320), (1770, 40), (1770, 320), (700, 0), (1220, 356)]):
                ribbon(L, seg(np.array([[sx, sy], [CX, CY]], np.float32) if False else resample([[sx, sy], [CX, CY]], 3), q, 0.5), 1.0, t, strands=4, spread=6, seed=30 + k)
            bloom(L, CX, CY, 20 + 60 * q, 1.5 * q)
    # ---------------- S2 concentration: faces triptych; the light enters the mind, eyes open, synapses connect the team
    elif f < 352:
        sc = A["S2"]; fr, vi = scene_frame(sc, f)
        if f < 232:   # iris from the centre
            q = prog(f, 214, 232, eio); r = lerp(0, 1150, q); d = np.hypot(XX - CX, (YY - CY) * 1.3)
            m = np.clip((r - d) / 40, 0, 1)[..., None]; fr = fr * m; bloom(L, CX, CY, 80, 1.6 * (1 - q))
        temple = anchor(vi, "C", 0.36, 0.22)
        if 232 <= f < 280:
            hb = (math.exp(-(((t - 9.28) % 1.1) - 0.1) ** 2 / 0.003) + 0.6 * math.exp(-(((t - 9.28) % 1.1) - 0.32) ** 2 / 0.003))
            ribbon(L, seg(catmull([(temple[0] + 40, -10), (temple[0] + 25, temple[1] * 0.5), temple], 80), prog(f, 232, 252), 1.0), 0.5 + 0.6 * hb, t, strands=5, spread=5, seed=40)
            bloom(L, *temple, 16 + 10 * hb, 0.4 + 0.8 * hb)
        if f >= 274:   # eyes open -> synapse burst across the bands to the teammates
            targets = [anchor(vi, "L", 0.62, 0.40), anchor(vi, "L", 0.70, 0.60), anchor(vi, "R", 0.62, 0.50), anchor(vi, "R", 0.76, 0.74)]
            q = prog(f, 274, 296, eio)
            for k, tg in enumerate(targets):
                ribbon(L, seg(lightning(temple, tg, 50 + k, jag=9), q, 1.0), 0.75 * (1 - 0.4 * prog(f, 310, 335)), t, strands=3, spread=3, seed=50 + k)
            bloom(L, *temple, 40, 1.4 * (1 - prog(f, 274, 290)))
            for win in ("L", "R"):   # side panels light up when the synapse arrives
                x0, y0, x1, y1 = BOX[win]; fr[y0:y1, x0:x1] *= 1 + 0.35 * prog(f, 290, 300) * (1 - prog(f, 300, 330))
        txt_jobs += [("s2a", 1180, 92, 238, 334), ("s2b", 1180, 140, 272, 334)]
        if f >= 330:   # synapses straighten into vertical floodlight rays; S3 is revealed from the top
            q = prog(f, 330, 348, eio)
            for k in range(11):
                x = 300 + k * 132 + 20 * math.sin(k); ribbon(L, seg(resample([[x, H + 10], [x, -10]], 3), q, 0.7), 0.9, t, strands=4, spread=5, seed=60 + k)
            if f >= 338:
                q2 = prog(f, 338, 352, eio); yl = lerp(-10, H + 30, q2); s3, _ = scene_frame(A["S3"], f)
                m = np.clip((yl - YY) / 14, 0, 1)[..., None]; fr = fr * (1 - m) + s3 * m
                ribbon(L, resample([[-10, yl], [W + 10, yl]], 3), 1.0, t, strands=8, spread=12, seed=70)
    # ---------------- S3 huddle: the leader's light passes to the team across the screen
    elif f < 490:
        sc = A["S3"]; fr, vi = scene_frame(sc, f)
        if f < 362:
            yl = lerp(-10, H + 30, prog(f, 338, 352, eio)); ribbon(L, resample([[-10, yl], [W + 10, yl]], 3), 1.0 - prog(f, 352, 362), t, strands=8, spread=12, seed=70)
        finger = anchor(vi, "C", 0.475, 0.55); top = (finger[0] + 10, 14)
        ribbon(L, seg(catmull([finger, (finger[0] + 5, finger[1] - 60), top], 60), prog(f, 372, 392, eio), 1.0), 1.0, t, strands=7, spread=8, seed=80)
        if f >= 390:
            q = prog(f, 390, 430, eio)
            for k, (win, ix, iy) in enumerate([("L", 0.20, 0.27), ("L", 0.31, 0.50), ("R", 0.79, 0.16), ("R", 0.74, 0.46)]):
                tg = anchor(vi, win, ix, iy); mid = ((top[0] + tg[0]) / 2, 8)
                ribbon(L, seg(catmull([top, mid, tg], 120), q, 0.7), 0.95, t, strands=6, spread=8, seed=90 + k)
                if q >= 1: bloom(L, *tg, 34, 0.7 * (1 - prog(f, 432, 470)))
        txt_jobs += [("s3a", 760, 70, 362, 470), ("s3b", 760, 116, 398, 470)]
        if f >= 466:   # light runs down the 45-degree band edges; S4 grows out of the bands
            q = prog(f, 466, 484, eio)
            for k in ("L", "C", "R"):
                c = CONT[k]; inner = c[(c[:, 1] > 6) & (c[:, 1] < H - 6) & (c[:, 0] > 6) & (c[:, 0] < W - 6)]
                if len(inner) > 10:
                    inner = inner[np.argsort(inner[:, 1])]
                    for side in (inner[inner[:, 0] < CX], inner[inner[:, 0] >= CX]):
                        if len(side) > 10: ribbon(L, seg(side, q, 0.6), 1.0, t, strands=4, spread=4, seed=100)
            if f >= 474:
                q2 = prog(f, 474, 490, eio); s4, _ = scene_frame(A["S4"], f); r = lerp(0, 760, q2)
                m = np.clip((r - DIST) / 30, 0, 1)[..., None]; fr = fr * (1 - m) + s4 * m
    # ---------------- S4 helping up: the light rings the hands, then links the three panels into a network -> the ball
    elif f < 640:
        sc = A["S4"]; fr, vi = scene_frame(sc, f)
        if f < 492:
            s3f, _ = scene_frame(A["S3"], f); r = lerp(0, 760, prog(f, 474, 490, eio)); m = np.clip((r - DIST) / 30, 0, 1)[..., None]; fr = s3f * (1 - m) + fr * m
        hands = anchor(vi, "C", 0.43, 0.45)
        ring = np.stack([hands[0] + 46 * np.cos(np.linspace(0, 6.283, 120)), hands[1] + 20 * np.sin(np.linspace(0, 6.283, 120))], 1)
        if f < 545: ribbon(L, seg(ring, prog(f, 500, 524, eio), 1.0), 1.0 * (1 - prog(f, 535, 545)), t, strands=6, spread=6, seed=110)
        if f >= 535:
            left_p = anchor(vi, "L", 0.33, 0.30); right_p = anchor(vi, "R", 0.62, 0.58)
            line = catmull([left_p, (500, hands[1] - 30), hands, (1350, hands[1] + 20), right_p], 220)
            q = prog(f, 535, 560, eio); ribbon(L, seg(line, q, 1.0, start=0.5 - 0.5 * q), 1.0, t, strands=8, spread=9, seed=120)
            ribbon(L, seg(line[::-1], q, 1.0, start=0.5 - 0.5 * q), 1.0, t, strands=8, spread=9, seed=121)
        if f >= 566:   # one becomes many: a network across the whole screen
            q = prog(f, 566, 600, eio)
            for k in range(7):
                yk = 170 + k * 26; pts = catmull([(-10, yk + 20 * math.sin(k)), (480, yk + 30 * math.cos(k * 1.3)), (CX, max(165, hands[1] + (k - 3) * 18)), (1440, yk - 25 * math.sin(k * 0.7)), (W + 10, yk)], 220)
                ribbon(L, seg(pts, q, 1.0), 0.55 + 0.25 * q, t, strands=4, spread=6, seed=130 + k)
        txt_jobs += [("s4a", CX, 12, 500, 618), ("s4b", CX, 40, 546, 618), ("s4c", CX, 104, 574, 618)]
        if f >= 600:   # the network becomes the ball (KV seams), flash
            q = prog(f, 600, 628, eio); fr = fr + WIDE_BM * 2.4 * q
            fl = prog(f, 624, 640); fr = fr * (1 - fl) + FLASH * fl
    # ---------------- CLOSE: KV ball emblem, the beam frames the name; Andrés untouched in the side panels; screen outline closes the loop
    else:
        fr, (ox, oy, s) = close_frame(f, t)
        fl = 1 - prog(f, 640, 656); fr = fr * (1 - fl) + FLASH * fl
        pent = PENT * s + np.float32([ox, oy]); pent = resample(pent, 3)
        ribbon(L, seg(pent, prog(f, 648, 676, eio), 1.0), 1.0, t, strands=7, spread=8, seed=140)
        la = prog(f, 652, 664); lw, lh = int(LOGO.shape[1] * 0.42), int(LOGO.shape[0] * 0.42)
        if la > 0:
            lg = cv2.resize(LOGO, (lw, lh)); al = cv2.resize(LOGO_A, (lw, lh))[..., None] * la; x0, y0 = int(CX - lw / 2), 118
            fr[y0:y0 + lh, x0:x0 + lw] = fr[y0:y0 + lh, x0:x0 + lw] * (1 - al) + lg * al
        wa = TXT["c1a"][0].shape[1]; wb = TXT["c1b"][0].shape[1]; tot = wa + wb - 6
        txt_jobs += [("c1a", CX - tot / 2 + wa / 2, 140, 660, 999), ("c1b", CX - tot / 2 + wa - 6 + wb / 2, 140, 664, 999), ("c2", CX, 206, 676, 999)]
        outline(L, f, 700, 736, 0.7, t, {"C": (CX, 355), "L": (389, 160), "R": (1532, 160)})
    # ---------------- typography + compose
    for key, x, y, a, b in txt_jobs: put_text(fr, L, key, x, y, f, a, b, t)
    out = (fr + glow(L)) * VIS
    return np.clip(out, 0, 255)

# ------------------------------------------------------------------ info strip + encode
INFO = C["info"]; fb = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 17); fs = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
def strip(img, f):
    t = f / FPS; info = next(i for i in INFO if i["a"] <= t < i["b"]); STR = 112
    canvas = Image.new("RGB", (W, H + STR), (12, 16, 14)); canvas.paste(Image.fromarray(img), (0, 0)); d = ImageDraw.Draw(canvas)
    for i in INFO:
        x0 = 20 + i["a"] / 30 * (W - 40); x1 = 20 + i["b"] / 30 * (W - 40)
        d.rectangle([x0 + 1, H + 8, x1 - 1, H + 18], fill=(127, 255, 0) if i is info else (45, 85, 20))
    px = 20 + t / 30 * (W - 40); d.line([(px, H + 4), (px, H + 22)], fill=(255, 255, 255), width=2)
    d.text((20, H + 28), f"00:{int(t):02d}:{f % FPS:02d} / 00:30:00", font=fb, fill=(255, 255, 255))
    d.text((20, H + 54), info["name"], font=fb, fill=(127, 255, 0))
    d.text((520, H + 28), "PANTALLA: " + info["screen"], font=fs, fill=(230, 235, 230))
    d.text((520, H + 50), "HAZ DE LUZ: " + info["beam"], font=fs, fill=(200, 255, 170))
    d.text((520, H + 72), "TRANSICIÓN: " + info["trans"], font=fs, fill=(170, 210, 255))
    d.text((520, H + 94), "SFX: " + info["sfx"], font=fs, fill=(255, 220, 150))
    return np.asarray(canvas)
def pipe(path, w, h):
    return subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-r", str(FPS), "-i", "-",
                             "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", path], stdin=subprocess.PIPE)
p_clean = pipe(f"{OUT}/_clean_noaudio.mp4", W, H); p_ann = pipe(f"{OUT}/_annot_noaudio.mp4", W, H + 112)
for f in range(N):
    img = render(f).astype(np.uint8); p_clean.stdin.write(img.tobytes()); ann = strip(img, f); p_ann.stdin.write(ann.tobytes())
    if f in C.get("snapshots", []): Image.fromarray(ann).save(f"{OUT}/frames/_f{f:03d}.jpg", quality=88)
    if f % 150 == 0: print("frame", f, flush=True)
for p in (p_clean, p_ann): p.stdin.close(); p.wait()
print("video done")
