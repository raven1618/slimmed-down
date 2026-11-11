"""Storyboard v3 — Andrés Silva teaser, applying the client's corrections (review of Nov 8).

Client rules: text centred in the CENTRE panel, big, typographic play (size/weight/height) like the KV lockup;
images in full on the SIDE panels; centre image kept but under a long green fade to the right; phrases enter in
two beats ("pum pum"); the light starts in the side panels and enters the centre, same behaviour every time
(sequence); when the halo appears the whole screen glows brighter; no music: light/impact SFX + AI voice-over.
Canvas 1920x356 = half of 3840x708.
"""
import json, math, os, subprocess, sys
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

C = json.load(open(sys.argv[1])); OUT = C["out_dir"]; os.makedirs(f"{OUT}/frames", exist_ok=True)
FPS, N, W, H = 25, 750, 1920, 356
FONTS = {"black": C["fonts"] + "/GothamCondensed-Black.otf", "bold": C["fonts"] + "/GothamCondensed-Bold.otf", "medium": C["fonts"] + "/GothamCondensed-Medium.otf"}
COL = {"white": np.float32([255, 255, 255]), "lime": np.float32([127, 255, 0])}
FLASH = np.float32([205, 255, 215])
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def ease(t): t = clamp(t); return t * t * (3 - 2 * t)
def eout(t): t = clamp(t); return 1 - (1 - t) ** 3
def eio(t): t = clamp(t); return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2
def prog(f, a, b, fn=ease): return fn(clamp((f - a) / max(1e-6, b - a)))
def lerp(a, b, t): return a + (b - a) * t

# ---------------- geometry (die-cut measured from the approved pilot)
dm = cv2.resize(cv2.imread(C["diecut_mask"], 0), (W, H), interpolation=cv2.INTER_NEAREST) > 127
dm[:4] = dm[4]; dm[-4:] = dm[-5]; VIS = (~dm).astype(np.float32)[..., None]
n, lab = cv2.connectedComponents((~dm).astype(np.uint8))
comps = sorted([(np.mean(np.where(lab == i)[1]), i) for i in range(1, n) if (lab == i).sum() > 2000])
MASK = {k: (lab == i) for k, (_, i) in zip(["L", "C", "R"], comps[:3])}
BOX = {k: (np.where(m)[1].min(), np.where(m)[0].min(), np.where(m)[1].max() + 1, np.where(m)[0].max() + 1) for k, m in MASK.items()}
def resample(p, step=3.0):
    p = np.asarray(p, np.float32); d = np.r_[0, np.cumsum(np.hypot(*np.diff(p, axis=0).T))]
    if d[-1] < step: return p
    s = np.arange(0, d[-1], step); return np.stack([np.interp(s, d, p[:, 0]), np.interp(s, d, p[:, 1])], 1)
CONT = {}
for k, m in MASK.items():
    cs, _ = cv2.findContours(m.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cs, key=len)[:, 0, :].astype(np.float32); CONT[k] = resample(np.vstack([c, c[:1]]), 3.0)
XX = np.arange(W, dtype=np.float32)[None, :]; YY = np.arange(H, dtype=np.float32)[:, None]; CX, CY = 960.0, 178.0

# ---------------- assets
def load_rgb(p): return cv2.cvtColor(cv2.imread(p), cv2.COLOR_BGR2RGB).astype(np.float32)
def cover(img, w, h):
    ih, iw = img.shape[:2]; r = max(w / iw, h / ih); im = cv2.resize(img, (int(iw * r + 1), int(ih * r + 1)), interpolation=cv2.INTER_AREA)
    y = (im.shape[0] - h) // 2; x = (im.shape[1] - w) // 2; return im[y:y + h, x:x + w]
IMG = {k: load_rgb(v) for k, v in C["images"].items()}
KVBG = load_rgb(C["kv"] + "/kv_bg.png"); KVBM = load_rgb(C["kv"] + "/kv_beams_add.png")
KVF = load_rgb(C["kv"] + "/kv_full.png"); KVU = load_rgb(C["kv"] + "/kv_bg_beams.png")
lm = (np.abs(KVF - KVU).sum(2) > 40); lm[392:] = 0; lm[:330] = 0; ys, xs = np.where(lm)
LOGO = KVF[ys.min():ys.max() + 1, xs.min():xs.max() + 1]; LOGO_A = cv2.GaussianBlur(lm[ys.min():ys.max() + 1, xs.min():xs.max() + 1].astype(np.float32), (0, 0), 0.7)
WIDE_BG = cover(KVBG, W, H); WIDE_BM = cover(KVBM, W, H)
WMASK = {k: cv2.imread(v, 0).astype(np.float32) / 255.0 for k, v in C.get("wing_masks", {}).items()}

def view(img, box, s=1.0, cx=0.5, cy=0.5):
    x0, y0, x1, y1 = box; bw, bh = x1 - x0, y1 - y0; ih, iw = img.shape[:2]; a = bw / bh
    vw, vh = (ih * a, ih) if iw / ih > a else (iw, iw / a); vw /= s; vh /= s
    px = min(max(cx * iw, vw / 2), iw - vw / 2); py = min(max(cy * ih, vh / 2), ih - vh / 2)
    M = np.float32([[vw / bw, 0, px - vw / 2], [0, vh / bh, py - vh / 2]])
    return cv2.warpAffine(img, M, (bw, bh), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT), (px, py, vw, vh)
def to_canvas(box, vi, ix, iy, img):
    x0, y0, x1, y1 = box; px, py, vw, vh = vi; ih, iw = img.shape[:2]
    return x0 + (ix * iw - (px - vw / 2)) * (x1 - x0) / vw, y0 + (iy * ih - (py - vh / 2)) * (y1 - y0) / vh

# ---------------- light
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
def bloom(L, x, y, r, inten, sy=1.0):
    d2 = ((XX - x) ** 2 + ((YY - y) * sy) ** 2) / (r * r); L += (np.exp(-d2)[..., None] * np.float32([150, 255, 170]) * inten).astype(np.float32)

# ---------------- typography: lockups of runs (size/weight/colour) on a shared baseline, letter-by-letter light pop
FCACHE = {}
def font(kind, size):
    k = (kind, size)
    if k not in FCACHE: FCACHE[k] = ImageFont.truetype(FONTS[kind], size)
    return FCACHE[k]
def glyph(ch, kind, size):
    f = font(kind, size); w = max(2, int(f.getlength(ch)) + 6); h = int(size * 1.3)
    im = Image.new("L", (w, h)); ImageDraw.Draw(im).text((3, 0), ch, font=f, fill=255); return np.asarray(im, np.float32) / 255.0
def layout_line(runs, y_base):
    """runs: [(text, kind, size, colour)]; returns glyph list centred on CX with a shared baseline y_base"""
    items = []; x = 0.0
    for txt, kind, size, col in runs:
        f = font(kind, size); asc = f.getmetrics()[0]
        for ch in txt:
            adv = f.getlength(ch)
            if ch != " ": items.append(dict(ch=ch, kind=kind, size=size, col=col, x=x, y=y_base - asc, a=glyph(ch, kind, size)))
            x += adv
        x += size * 0.18
    x -= runs[-1][2] * 0.18; off = CX - x / 2
    for it in items: it["x"] += off
    return items, (off, off + x)
def draw_line(fr, L, items, f0, f_out, t, exit_dir=1):
    for k, it in enumerate(sorted(items, key=lambda i: abs(i["x"] + i["a"].shape[1] / 2 - CX))):
        fa = f0 + k * 0.9
        if CUR_F < fa: continue
        p = prog(CUR_F, fa, fa + 6, eout); fl = 1 - prog(CUR_F, fa, fa + 7)
        ex = prog(CUR_F, f_out, f_out + 9, lambda q: q * q)
        if ex >= 1: continue
        a = it["a"]; h, w = a.shape; s = lerp(1.45, 1.0, p); sx = s * (1 + 2.5 * ex)
        a2 = cv2.resize(a, (max(1, int(w * sx)), max(1, int(h * s))), interpolation=cv2.INTER_LINEAR)
        if ex > 0: a2 = cv2.blur(a2, (int(1 + 25 * ex), 1))
        hh, ww = a2.shape; cx = it["x"] + w / 2 + exit_dir * 140 * ex; cy = it["y"] + h / 2
        x0, y0 = int(cx - ww / 2), int(cy - hh / 2); xa, ya = max(0, x0), max(0, y0); xb, yb = min(W, x0 + ww), min(H, y0 + hh)
        if xb <= xa or yb <= ya: continue
        al = a2[ya - y0:yb - y0, xa - x0:xb - x0][..., None] * p * (1 - ex)
        col = COL[it["col"]] * (1 - fl) + np.float32([255, 255, 255]) * fl
        sh = np.clip(cv2.GaussianBlur(al[..., 0], (0, 0), 5)[..., None] * 0.95, 0, 0.85)
        fr[ya:yb, xa:xb] = fr[ya:yb, xa:xb] * (1 - sh) * (1 - al) + col * al
        L[ya:yb, xa:xb] += al * np.float32([60, 255, 110]) * (0.25 + 1.2 * fl)
def rules(fr, L, y, x_in, f0, f_out, side_len=70):
    """thin rules + small pitch icons either side of a connector line (KV 'A JUGAR EN' style)"""
    p = prog(CUR_F, f0, f0 + 10, eout) * (1 - prog(CUR_F, f_out, f_out + 8))
    if p <= 0: return
    for sgn, xe in ((-1, x_in[0] - 10), (1, x_in[1] + 10)):
        xb = xe + sgn * side_len * p
        cv2.line(fr, (int(xe), int(y)), (int(xb), int(y)), (255 * p, 255 * p, 255 * p), 1, cv2.LINE_AA)
        bx = int(xb + sgn * 9); cv2.rectangle(fr, (bx - 7, int(y) - 6), (bx + 7, int(y) + 6), (255 * p,) * 3, 1, cv2.LINE_AA)
        cv2.ellipse(fr, (bx - sgn * 7, int(y)), (4, 4), 0, -90 if sgn > 0 else 90, 90 if sgn > 0 else 270, (255 * p,) * 3, 1, cv2.LINE_AA)

# ---------------- timeline from config
SC = C["scenes"]; BEATS = C["beats"]; T_LINES = {}
for b in BEATS:
    T_LINES[b["id"]] = [(layout_line([tuple(r) for r in ln["runs"]], ln["y"]), ln.get("rules", False), ln.get("delay", 0)) for ln in b["lines"]]
def scene_at(f):
    for s in SC:
        if s["f0"] <= f < s["f1"]: return s
    return SC[-1]
def side_frame(sc, f):
    out = {}; vinfo = {}
    for win in ("L", "R"):
        c = sc["cams"][win]; p = prog(f, sc["f0"], sc["f1"], eio); img = IMG[c["img"]]
        if "subject" in sc:   # same image, same scale, same move on both sides
            s_ = lerp(*sc["s"], p); x0, y0, x1, y1 = BOX[win]; ih, iw = img.shape[:2]; vwf = (ih * (x1 - x0) / (y1 - y0) / s_) / iw
            u = 0.40 if win == "L" else 0.60; sx, sy = sc["subject"]
            v, vi = view(img, BOX[win], s_, sx + (0.5 - u) * vwf, sy)
        else:
            v, vi = view(img, BOX[win], lerp(*c["s"], p), lerp(c["c"][0][0], c["c"][1][0], p), lerp(c["c"][0][1], c["c"][1][1], p))
        out[win] = v; vinfo[win] = (vi, img)
    return out, vinfo
def anchor(vinfo, win, ix, iy): vi, img = vinfo[win]; return to_canvas(BOX[win], vi, ix, iy, img)
CEN_A = np.clip((XX - C["centre_fade"][0]) / (C["centre_fade"][1] - C["centre_fade"][0]), 0, 1) ** 1.6 * C["centre_fade"][2]   # stretched green fade
CEN_A = (CEN_A * MASK["C"])[..., None]
def centre_frame(sc, f, t):
    band_x = ((t * 0.16) % 1.4 - 0.2) * W
    bm = WIDE_BM * (0.30 + 0.9 * np.exp(-((XX - band_x) / 160) ** 2))[..., None]
    base = WIDE_BG + bm
    if sc.get("centre_img"):
        c = sc["centre_img"]; x0, y0, x1, y1 = BOX["C"]; v, _ = view(IMG[c["img"]], BOX["C"], c["s"], c["c"][0], c["c"][1])
        img = np.zeros_like(base); img[y0:y1, x0:x1] = v; base = base * (1 - CEN_A) + img * CEN_A
    return base

def render(f):
    global CUR_F; CUR_F = f; t = f / FPS
    L = np.zeros((H, W, 3), np.float32); sc = scene_at(f)
    fr = centre_frame(sc, f, t) * MASK["C"][..., None]
    # side panels: current scene image, with a 45-degree light wipe from the band outward when the scene changes
    sides, vinfo = side_frame(sc, f)
    prev = next((s for s in SC if s["f1"] == sc["f0"]), None)
    for win in ("L", "R"):
        x0, y0, x1, y1 = BOX[win]; m = MASK[win][y0:y1, x0:x1][..., None]; v = sides[win]
        if sc.get("intro"): v = v * 0
        if prev is not None and f < sc["f0"] + 14:
            q = prog(f, sc["f0"], sc["f0"] + 14, eio); pv, _ = side_frame(prev, f); old = pv[win] * (0.0 if prev.get("intro") else 1.0)
            lx = np.arange(x1 - x0, dtype=np.float32)[None, :]; ly = np.arange(y1 - y0, dtype=np.float32)[:, None]
            span = (x1 - x0) + (y1 - y0)
            if win == "L":   # from the band (right edge) toward the outer edge, at 45 degrees
                line = (x1 - x0) - q * span + ly * 1.0; mm = np.clip((lx - line) / 8 + 0.5, 0, 1)[..., None]
                pts = np.array([[x0 + (x1 - x0) - q * span + 0, y0], [x0 + (x1 - x0) - q * span + (y1 - y0), y1]], np.float32)
            else:
                line = q * span - ly * 1.0; mm = np.clip((line - lx) / 8 + 0.5, 0, 1)[..., None]
                pts = np.array([[x0 + q * span, y0], [x0 + q * span - (y1 - y0), y1]], np.float32)
            v = old * (1 - mm) + v * mm
            if 0 < q < 1: ribbon(L, resample(pts, 3), 1.0, t, strands=6, spread=10, seed=5 if win == "L" else 6)
        if sc.get("andres_rays") and f >= sc["f0"]:
            bgm = 1 - cv2.resize(WMASK[win], (x1 - x0, y1 - y0))[..., None]
            ray = np.zeros_like(v); cxr, cyr = (x1 - x0) * (0.40 if win == "L" else 0.60), (y1 - y0) * 0.42
            for k in range(12):
                ang = k / 12 * 6.283 + t * 0.4; cv2.line(ray, (int(cxr), int(cyr)), (int(cxr + math.cos(ang) * 700), int(cyr + math.sin(ang) * 700)), (60, 255, 110), 3, cv2.LINE_AA)
            v = v + cv2.GaussianBlur(ray, (0, 0), 7) * (0.5 + 0.3 * math.sin(t * 3)) * bgm
        fr[y0:y1, x0:x1] = fr[y0:y1, x0:x1] * (1 - m) + v * m
    if sc.get("intro"):   # INTRO: light enters from both side panels, outlines the screen, ignites the centre
        q = prog(f, 0, 20, eio)
        for side, sx in (("L", 10), ("R", W - 10)):
            path = catmull([(sx, CY), (lerp(sx, CX, 0.35), CY - 30), (CX, CY)], 120)
            ribbon(L, seg(path, q, 0.5), 1.0, t, strands=7, spread=10, seed=1 if side == "L" else 2)
        if f >= 18:
            p = prog(f, 18, 46, eio)
            for k, sp in {"C": (CX, 355), "L": (389, 160), "R": (1532, 160)}.items():
                c = CONT[k]; i0 = int(np.argmin(np.hypot(c[:, 0] - sp[0], c[:, 1] - sp[1]))); nn = len(c); half = int(p * nn / 2)
                if half > 2:
                    tail = int(nn * 0.16) if p < 1 else half
                    ribbon(L, c[[(i0 + j) % nn for j in range(half)]][-tail:], 0.9, t, strands=4, spread=4, seed=21)
                    ribbon(L, c[[(i0 - j) % nn for j in range(half)]][-tail:], 0.9, t, strands=4, spread=4, seed=22)
        ign = prog(f, 18, 34); fr[:, :] = fr * (0.15 + 0.85 * ign) if f < 34 else fr
        if f >= 30:
            la = prog(f, 30, 42); lw, lh = int(LOGO.shape[1] * 0.75), int(LOGO.shape[0] * 0.75)
            lg = cv2.resize(LOGO, (lw, lh)); al = cv2.resize(LOGO_A, (lw, lh))[..., None] * la * (1 - prog(f, 52, 60))
            x0, y0 = int(CX - lw / 2), int(CY - lh / 2); fr[y0:y0 + lh, x0:x0 + lw] = fr[y0:y0 + lh, x0:x0 + lw] * (1 - al) + lg * al
    gain = 1.0
    # beats: light from a side panel (subject anchor) -> through the band -> impact at the text -> halo + screen glow -> letters pop
    for b in BEATS:
        fi = b["impact"]; fs = fi - b.get("travel", 13)
        if f < fs or f > b["out"] + 12: continue
        srcs = [b["from"]] if isinstance(b["from"][0], str) else b["from"]
        sc_b = next(s for s in SC if s["f0"] <= fi < s["f1"]); _, vi_b = side_frame(sc_b, f)
        for si, src in enumerate(srcs):
            win, ix, iy = src; a = anchor(vi_b, win, ix, iy); ty = b["y_hit"]
            mid = (lerp(a[0], CX, 0.45), lerp(a[1], ty, 0.3) + (40 if si else -40))
            path = catmull([a, mid, (CX + (-60 if win == "L" else 60), ty), (CX, ty)], 200)
            q = prog(f, fs, fi, eio)
            if f <= fi + 2: ribbon(L, seg(path, q, 0.6), 1.0, t, strands=7, spread=10, seed=31 + si)
            if f > fi:   # the light settles as a flowing underline that drifts off to the other side
                k = prog(f, fi, fi + 30, eout); tail = catmull([(CX, ty), (CX + (300 if win == "L" else -300), ty + 30 * math.sin(t)), (CX + (800 if win == "L" else -800), ty + 60)], 160)
                ribbon(L, seg(tail, k, 0.5), 0.8 * (1 - prog(f, fi + 20, b["out"] + 10)), t, strands=5, spread=6, seed=41 + si)
                bloom(L, *a, 26, 0.6 * (1 - prog(f, fi - 13, fi)))
        if f >= fi:   # halo: bloom + expanding ring, and the whole screen glows brighter
            d = f - fi; hb = math.exp(-d / 5.0)
            bloom(L, CX, b["y_hit"], 70 + 6 * d, 1.6 * hb, sy=1.6)
            ring = np.stack([CX + (60 + 30 * d) * np.cos(np.linspace(0, 6.283, 160)), b["y_hit"] + (16 + 9 * d) * np.sin(np.linspace(0, 6.283, 160))], 1)
            if d < 10: ribbon(L, ring, 0.6 * (1 - d / 10) ** 1.5, t, strands=3, spread=4, seed=51)
            gain += 0.32 * hb
        for (items, rng_), has_rules, ld in T_LINES[b["id"]]:
            draw_line(fr, L, items, fi + ld, b["out"], t, exit_dir=b.get("exit", 1))
            if has_rules: rules(fr, L, items[0]["y"] + items[0]["size"] * 0.62, rng_, fi + ld, b["out"])
    # outro: card + closing outline of the screen
    oc = C["outro"]
    if f >= oc["card_in"]:
        la = prog(f, oc["card_in"], oc["card_in"] + 10); lw, lh = int(LOGO.shape[1] * 0.62), int(LOGO.shape[0] * 0.62)
        lg = cv2.resize(LOGO, (lw, lh)); al = cv2.resize(LOGO_A, (lw, lh))[..., None] * la
        x0, y0 = int(CX - lw / 2), oc["logo_y"]; fr[y0:y0 + lh, x0:x0 + lw] = fr[y0:y0 + lh, x0:x0 + lw] * (1 - al) + lg * al
        lp = prog(f, oc["card_in"] + 6, oc["card_in"] + 20, eout)
        cv2.line(fr, (int(CX - 230 * lp), oc["rule_y"]), (int(CX + 230 * lp), oc["rule_y"]), (255, 255, 255), 1, cv2.LINE_AA)
    if f >= oc["outline"][0]:
        p = prog(f, *oc["outline"], eio)
        for k, sp in {"C": (CX, 355), "L": (389, 160), "R": (1532, 160)}.items():
            c = CONT[k]; i0 = int(np.argmin(np.hypot(c[:, 0] - sp[0], c[:, 1] - sp[1]))); nn = len(c); half = int(p * nn / 2)
            if half > 2:
                tail = int(nn * 0.16) if p < 1 else half
                ribbon(L, c[[(i0 + j) % nn for j in range(half)]][-tail:], 0.7, t, strands=4, spread=4, seed=61)
                ribbon(L, c[[(i0 - j) % nn for j in range(half)]][-tail:], 0.7, t, strands=4, spread=4, seed=62)
    for (fa, fb, inten) in C.get("flashes", []):
        if fa <= f <= fb: q = math.sin(math.pi * (f - fa) / (fb - fa)) * inten; fr = fr * (1 - q) + FLASH * q
    out = (fr + glow(L)) * gain * VIS
    return np.clip(out, 0, 255)

# ---------------- info strip + encode
INFO = C["info"]; fb_ = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 17); fs_ = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
def strip(img, f):
    t = f / FPS; info = next(i for i in INFO if i["a"] <= t < i["b"]); STR = 112
    canvas = Image.new("RGB", (W, H + STR), (12, 16, 14)); canvas.paste(Image.fromarray(img), (0, 0)); d = ImageDraw.Draw(canvas)
    for i in INFO:
        x0 = 20 + i["a"] / 30 * (W - 40); x1 = 20 + i["b"] / 30 * (W - 40)
        d.rectangle([x0 + 1, H + 8, x1 - 1, H + 18], fill=(127, 255, 0) if i is info else (45, 85, 20))
    px = 20 + t / 30 * (W - 40); d.line([(px, H + 4), (px, H + 22)], fill=(255, 255, 255), width=2)
    d.text((20, H + 28), f"00:{int(t):02d}:{f % FPS:02d} / 00:30:00", font=fb_, fill=(255, 255, 255))
    d.text((20, H + 54), info["name"], font=fb_, fill=(127, 255, 0))
    d.text((20, H + 80), "LOCUCIÓN: " + info.get("vo", "—"), font=fs_, fill=(255, 235, 170))
    d.text((620, H + 28), "LATERALES: " + info["sides"], font=fs_, fill=(230, 235, 230))
    d.text((620, H + 50), "CENTRO: " + info["centre"], font=fs_, fill=(200, 255, 170))
    d.text((620, H + 72), "LUZ: " + info["light"], font=fs_, fill=(170, 210, 255))
    d.text((620, H + 94), "SFX: " + info["sfx"], font=fs_, fill=(255, 220, 150))
    return np.asarray(canvas)
def pipe(path, w, h):
    return subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-r", str(FPS), "-i", "-",
                             "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", path], stdin=subprocess.PIPE)
CUR_F = 0
if __name__ == "__main__":
    only = [int(x) for x in sys.argv[2].split(",")] if len(sys.argv) > 2 else None
    if only:
        for f in only: Image.fromarray(strip(render(f).astype(np.uint8), f)).save(f"{OUT}/frames/_v3_{f:03d}.jpg", quality=88)
        sys.exit(0)
    pc = pipe(f"{OUT}/_clean_noaudio.mp4", W, H); pa = pipe(f"{OUT}/_annot_noaudio.mp4", W, H + 112)
    for f in range(N):
        img = render(f).astype(np.uint8); pc.stdin.write(img.tobytes()); pa.stdin.write(strip(img, f).tobytes())
        if f % 150 == 0: print("frame", f, flush=True)
    for p in (pc, pa): p.stdin.close(); p.wait()
    print("video done")
