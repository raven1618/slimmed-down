"""Storyboard v5 — "una imagen, una pantalla".
Each slide is ONE image across the whole 19 m screen (the die-cut is a frame over a single scene).
Cycle per slide: image moment -> light born at the subject -> the light pulls the KV green over the centre ->
text in beats (halo + whole-screen glow) -> 45-degree light sweep reveals the next image.
Reuses the tested helpers (light, typography, close card) from storyboard_v3.py.
"""
import sys, math, importlib.util, subprocess, numpy as np, cv2
from PIL import Image
cfg = sys.argv[1]; only = [int(x) for x in sys.argv[2].split(",")] if len(sys.argv) > 2 else None
sys.argv = ["sb", cfg]
spec = importlib.util.spec_from_file_location("sb", "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/tools/storyboard_v3.py")
sb = importlib.util.module_from_spec(spec); spec.loader.exec_module(sb)
C = sb.C; W, H, CX, CY = sb.W, sb.H, sb.CX, sb.CY; XX, YY = sb.XX, sb.YY; FPS, N = 25, 750; OUT = C["out_dir"]
SL = C["slides"]; S5 = next(s for s in sb.SC if s["id"] == "S5")
VEIL = (np.clip(1 - (np.abs(XX - CX) - 330) / 330, 0, 1) ** 1.3 * 0.93)[..., None]
SCRIM = np.exp(-(((XX - CX) / 520.0) ** 2 + ((YY - 178) / 230.0) ** 2) ** 1.6)[..., None]   # soft ellipse behind the copy
TINT = np.float32([10, 60, 28])
# subtle KV green on the side panels: low opacity, a little stronger toward the outer edges, complements the key visual
_edge = np.clip(np.abs(XX - CX) / CX, 0, 1) ** 1.5
SIDE_G = ((sb.MASK["L"] | sb.MASK["R"]).astype(np.float32) * (0.10 + 0.22 * _edge))[..., None]

# ---- video sources: each pano slide plays its Seedance/Topaz clip; the screen strip is cropped from the 21:9 frame
class _Shape:
    def __init__(self, h, w): self.shape = (h, w)
class Clip:
    def __init__(self, path):
        self.cap = cv2.VideoCapture(path); self.n = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT)); self.fps = self.cap.get(cv2.CAP_PROP_FPS)
        self.W = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)); self.H = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)); self.pos = 0; self.cache = {}
    def frame(self, i):
        i = max(0, min(self.n - 1, i))
        if i in self.cache: return self.cache[i]
        if i < self.pos or i > self.pos + 60: self.cap.set(cv2.CAP_PROP_POS_FRAMES, i); self.pos = i
        while self.pos < i: self.cap.grab(); self.pos += 1
        ok, fr = self.cap.read(); self.pos += 1
        if len(self.cache) > 6: self.cache.pop(next(iter(self.cache)))
        self.cache[i] = fr; return fr
    def strip(self, i, dy, z=1.0, cx=0.5):
        fr = self.frame(i); hh = self.H * 623 / 1440 / z; ww = self.W / z
        yc = self.H * (408 + 623 / 2) / 1440 + dy * self.H
        x0 = min(max(cx * self.W - ww / 2, 0), self.W - ww); y0 = min(max(yc - hh / 2, 0), self.H - hh)
        M = np.float32([[ww / W, 0, x0], [0, hh / H, y0]])
        st = cv2.warpAffine(fr, M, (W, H), flags=cv2.INTER_AREA | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
        return cv2.cvtColor(st, cv2.COLOR_BGR2RGB).astype(np.float32), (x0 + ww / 2, y0 + hh / 2, ww, hh)
CLIPS = {s_["id"]: Clip(s_["clip"]) for s_ in SL if "clip" in s_}

# ---- Seedance light plates (pure black background, screen-blended over the picture)
import subprocess as _sp
def _load(name, w, h, strip=False):
    vf = (f"crop=3840:713:0:467,scale={w}:{h}" if strip else f"scale={w}:{h}")
    raw = _sp.run(["ffmpeg", "-loglevel", "error", "-i", C["plates"] + f"/{name}.mp4", "-vf", vf, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    a = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3).astype(np.int32)
    return np.clip((a - 6) * 255 // 249, 0, 255).astype(np.uint8)
INTRO, BALL = _load("intro", W, H, True), _load("ball", W, H, True)
BIRTH, CLOSE = _load("birth", 960, 412), _load("close", 960, 412)
BEAM, HALO, SWEEP = _load("beam", 1280, 550), _load("halo", 1280, 550), _load("sweep", 1280, 550)
def _load_outline():   # border clip: warped onto the exact die-cut (ECC-aligned), then the screen strip is cropped
    A = np.float32(json.load(open(C["plates"] + "/outline_align.json"))["clip_from_ref"]); frames = []
    pr = _sp.Popen(["ffmpeg", "-loglevel", "error", "-i", C["plates"] + "/outline.mp4", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=_sp.PIPE)
    fw, fh = 3840, 1648; y0 = round(fh * 408 / 1440); bh = round(fh * 623 / 1440)
    while True:
        b = pr.stdout.read(fw * fh * 3)
        if len(b) < fw * fh * 3: break
        fr = np.frombuffer(b, np.uint8).reshape(fh, fw, 3)
        fr = cv2.warpAffine(fr, A, (fw, fh), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP)
        frames.append(cv2.resize(fr[y0:y0 + bh], (W, H), interpolation=cv2.INTER_AREA))
    pr.wait(); a = np.stack(frames).astype(np.int32); return np.clip((a - 6) * 255 // 249, 0, 255).astype(np.uint8)
import json
OUTLINE = _load_outline()
BEAM_Y = 0.54 * 550; CLOSE_C = (0.49 * 960, 0.48 * 412)
_up = np.array([0.958, 0.287]); _cp = np.array([640.0, 311.5])            # sweep lines: direction and a point on the middle line
_ang = math.atan2(1, -1) - math.atan2(_up[1], _up[0])
PL = None
_HT = np.array([0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.6, 2.0, 2.6, 3.0])
_HX = np.array([4, 10, 18, 24, 34, 47, 54, 67, 161, 256, 356, 418, 493, 504, 517, 511, 506, 503])
_HY = np.array([4, 9, 17, 24, 34, 47, 55, 68, 82, 86, 91, 93, 104, 106, 109, 105, 104, 104])
def ring(t): return float(np.interp(t, _HT, _HX)), float(np.interp(t, _HT, _HY))
TR = C["transitions"]
def transition(sl, f):
    """Returns (mask for the new slide or None) and lays the light. Each scene change has its own move."""
    kind, D = TR[sl["id"]]; f0 = sl["f0"]; k = f - f0
    if kind == "slit":      # the intro line splits open like an eye: S1 appears between its two halves
        q = sb.prog(f, f0, f0 + D, sb.eio); h = q * (H / 2 + 30)
        for sg in (-1, 1): put(INTRO, 3.2, np.float32([[1, 0, 0], [0, 1, sg * h]]), 0.9 * (1 - sb.prog(f, f0 + 8, f0 + D + 4)))
        return np.clip((h - np.abs(YY - CY)) / 12 + 0.5, 0, 1)[..., None] if k < D else None
    if kind == "beam":      # one light runs the whole 19 m along the floor line; the next scene follows behind it
        q = sb.prog(f, f0, f0 + D, sb.eio); y = H * C.get("beam_y", 0.84); M = beam_M(np.array([-80, y], np.float32), np.array([W + 80, y], np.float32), 1.0)
        g = 1 - sb.prog(f, f0 + D - 8, f0 + D + 4)
        if k < D: put(BEAM, 0.15 + 1.45 * q, M, g)
        else: put(BEAM, 1.6 + (k - D) * 0.1, M, g)
        head = -80 + (W + 160) * q
        return np.clip((head - 30 - XX) / 40 + 0.5, 0, 1)[..., None] if k < D else None
    if kind == "iris":      # the thought ignites at the centre and opens outward as a ring: the huddle circle
        if k < 4: sc, tt = 0.3, 0.85 + k * 0.11
        else: q = sb.prog(f, f0 + 4, f0 + D, sb.eio); sc, tt = 0.3 + 2.1 * q, 1.3 + 1.2 * q
        put(HALO, tt, centre_M(HALO, CX, CY, sc), 1 - sb.prog(f, f0 + D - 8, f0 + D + 6))
        if k >= D: return None
        rx, ry = ring(tt); rx, ry = max(rx * sc, 1), max(ry * sc, 1)
        dd = np.sqrt(((XX - CX) / rx) ** 2 + ((YY - CY) / ry) ** 2)
        return np.clip((1 - dd) * rx / 30 + 0.5, 0, 1)[..., None]
    if kind == "sweep":     # three lines on the die-cut angle wipe night into golden hour
        q = sb.prog(f, f0, f0 + D, sb.eio); x0 = sb.lerp(-H, W + H, q)
        if k < D: put(SWEEP, 0.2 + 1.8 * q, sweep_M(x0))
        return np.clip((x0 - (YY - H / 2) - XX) / 10 + 0.5, 0, 1)[..., None] if k < D else None
    return None
def screen(a, b): return 255.0 - (255.0 - a) * (255.0 - b) / 255.0
def plate_at(P, t): return P[int(min(max(round(t * 30), 0), len(P) - 1))]
def put(P, t, M, g=1.0):
    global PL
    if t < 0 or t > len(P) / 30 or g <= 0: return
    X = cv2.warpAffine(plate_at(P, t), M, (W, H), flags=cv2.INTER_LINEAR).astype(np.float32) * g
    PL = screen(PL, X)
def centre_M(P, x, y, s, c=None):
    cx, cy = c if c else (P.shape[2] / 2, P.shape[1] / 2)
    return np.float32([[s, 0, x - s * cx], [0, s, y - s * cy]])
def beam_M(a, T, k=0.8):
    D = T - a; nn = np.array([-D[1], D[0]]) / (np.linalg.norm(D) + 1e-6); w = BEAM.shape[2]
    return np.float32([[D[0] / w, k * nn[0], a[0] - k * nn[0] * BEAM_Y], [D[1] / w, k * nn[1], a[1] - k * nn[1] * BEAM_Y]])
def sweep_M(x0, s=0.4):
    c_, s_ = math.cos(_ang) * s, math.sin(_ang) * s; R = np.array([[c_, -s_], [s_, c_]]); tr = np.array([x0, H / 2]) - R @ _cp
    return np.float32([[R[0, 0], R[0, 1], tr[0]], [R[1, 0], R[1, 1], tr[1]]])

def draw_text(fr, items, f0, f_out, exit_dir=1, shadow=None):
    sg, sk, sm = shadow or (1.6, 0.5, 0.4)
    for k, it in enumerate(sorted(items, key=lambda i: abs(i["x"] + i["a"].shape[1] / 2 - CX))):
        fa = f0 + k * 0.9
        if sb.CUR_F < fa: continue
        p = sb.prog(sb.CUR_F, fa, fa + 6, sb.eout); ex = sb.prog(sb.CUR_F, f_out, f_out + 9, lambda q: q * q)
        if ex >= 1: continue
        a = it["a"]; h, w = a.shape; sc = sb.lerp(1.45, 1.0, p); sx = sc * (1 + 2.5 * ex)
        a2 = cv2.resize(a, (max(1, int(w * sx)), max(1, int(h * sc))), interpolation=cv2.INTER_LINEAR)
        if ex > 0: a2 = cv2.blur(a2, (int(1 + 25 * ex), 1))
        hh, ww = a2.shape; cx = it["x"] + w / 2 + exit_dir * 140 * ex; cy = it["y"] + h / 2
        x0, y0 = int(cx - ww / 2), int(cy - hh / 2); xa, ya = max(0, x0), max(0, y0); xb, yb = min(W, x0 + ww), min(H, y0 + hh)
        if xb <= xa or yb <= ya: continue
        al = a2[ya - y0:yb - y0, xa - x0:xb - x0][..., None] * p * (1 - ex)
        sh = np.clip(cv2.GaussianBlur(al[..., 0], (0, 0), sg)[..., None] * sk, 0, sm)   # tight edge shadow for legibility only
        fr[ya:yb, xa:xb] = fr[ya:yb, xa:xb] * (1 - sh) * (1 - al) + sb.COL[it["col"]] * al

def green(t):
    band_x = ((t * 0.16) % 1.4 - 0.2) * W
    return sb.WIDE_BG + sb.WIDE_BM * (0.30 + 0.9 * np.exp(-((XX - band_x) / 160) ** 2))[..., None]
def pano(sl, f):
    if "clip" in sl:
        c = CLIPS[sl["id"]]; tt = sl.get("clip_off", 0.0) + (f - sl["f0"]) / FPS
        q = sb.prog(f, sl["f0"], sl["f1"], sb.eio); P_ = lambda k, d: sb.lerp(*sl.get(k, [d, d]), q)
        v, vi = c.strip(int(round(tt * c.fps)), P_("strip_dy", 0.0), P_("zoom", 1.0), P_("cx", 0.5))
        return v, vi, _Shape(c.H, c.W)
    p = sb.prog(f, sl["f0"], sl["f1"], sb.eio); img = sb.IMG[sl["img"]]
    v, vi = sb.view(img, (0, 0, W, H), sb.lerp(*sl["s"], p), sb.lerp(sl["c"][0][0], sl["c"][1][0], p), sb.lerp(sl["c"][0][1], sl["c"][1][1], p))
    return v, vi, img
def subject_xy(sl, f, ix, iy): v, vi, img = pano(sl, f); return sb.to_canvas((0, 0, W, H), vi, ix, iy, img)
def slide_of(fr_): return next(s for s in SL if s["f0"] <= fr_ < s["f1"])
def outline(L, f, a, b, inten, t, seed=21):
    p = sb.prog(f, a, b, sb.eio)
    for k, sp in {"C": (CX, 355), "L": (389, 160), "R": (1532, 160)}.items():
        c = sb.CONT[k]; i0 = int(np.argmin(np.hypot(c[:, 0] - sp[0], c[:, 1] - sp[1]))); nn = len(c); half = int(p * nn / 2)
        if half > 2:
            tail = int(nn * 0.16) if p < 1 else half
            sb.ribbon(L, c[[(i0 + j) % nn for j in range(half)]][-tail:], inten, t, strands=4, spread=4, seed=seed)
            sb.ribbon(L, c[[(i0 - j) % nn for j in range(half)]][-tail:], inten, t, strands=4, spread=4, seed=seed + 1)

def slide_frame(sl, f, t, L, light=True):
    if sl["kind"] == "intro":
        fr = green(t) * sb.MASK["C"][..., None]
        fr = fr * (0.15 + 0.85 * sb.prog(f, 18, 34))
        fr = screen(np.clip(fr, 0, 255), plate_at(INTRO, min(0.15 + f * 0.075, 3.4)).astype(np.float32) * 0.85 * (1 - sb.prog(f, 40, 52)))
        la = sb.prog(f, 26, 36)
        if la > 0:
            lw, lh = int(sb.LOGO.shape[1] * 0.75), int(sb.LOGO.shape[0] * 0.75); lg = cv2.resize(sb.LOGO, (lw, lh)); al = cv2.resize(sb.LOGO_A, (lw, lh))[..., None] * la
            x0, y0 = int(CX - lw / 2), int(CY - lh / 2); fr[y0:y0 + lh, x0:x0 + lw] = fr[y0:y0 + lh, x0:x0 + lw] * (1 - al) + lg * al
        return fr
    if sl["kind"] == "pano":
        v, vi, img = pano(sl, f); sx, sy = sb.to_canvas((0, 0, W, H), vi, *sl["subject"], img)
        a0, a1 = sl["veil"]
        if f < a0: sa = 0.0
        else:   # the light brings a soft translucent shadow behind the copy (no solid panel: the animated image stays the protagonist)
            r = sb.lerp(0, 1150, sb.prog(f, a0, a1, sb.eio)); d = np.hypot(XX - CX, (YY - sl["y_hit"]) * 1.6)
            sa = SCRIM * np.clip((r - d) / 90, 0, 1)[..., None]
        fr = v                                     # no background behind the copy
        g = SIDE_G
        fr = fr * (1 - g) + green(t) * g
        return fr
    # close: Andrés (real photo) in the side panels with animated light behind him, corporate card in the centre
    fr = green(t) * sb.MASK["C"][..., None]; sides, _ = sb.side_frame(S5, f)
    for win in ("L", "R"):
        x0, y0, x1, y1 = sb.BOX[win]; m = sb.MASK[win][y0:y1, x0:x1][..., None]; v = sides[win]
        # Andrés: his Seedance clip, keyed; he walks in and settles into the photo pose. Star rays stay fixed behind his final head position.
        an = C["andres_anim"]; ci = int(min(max(round((f - S5["f0"]) / FPS * 30), 0), an["frames"] - 1))
        fa = cv2.cvtColor(cv2.imread(f"{an['dir']}/{win}/{ci:03d}.png", cv2.IMREAD_UNCHANGED), cv2.COLOR_BGRA2RGBA).astype(np.float32)
        v, _ = sb.view(fa[..., :3], (x0, y0, x1, y1), 1.0, 0.5, 0.5); av, _ = sb.view(fa[..., 3] / 255.0, (x0, y0, x1, y1), 1.0, 0.5, 0.5)
        a3 = av[..., None]; dec = cv2.GaussianBlur(v * a3, (0, 0), 2.5) / (cv2.GaussianBlur(av, (0, 0), 2.5)[..., None] + 1e-4)   # edge colour decontamination:
        v = np.where(a3 < 0.97, dec, v)                                                                            # no grey studio rim on the green
        bgm = 1 - a3
        mv, _ = sb.view(sb.WMASK[win], (x0, y0, x1, y1), 1.0, 0.5, 0.5)
        rows = np.where(mv.max(1) > 0.5)[0]; top = rows[0] if len(rows) else 0; hb = min(len(mv), top + int(0.14 * (y1 - y0)))
        cols = np.where(mv[top:hb].max(0) > 0.5)[0]; cxr = cols.mean() if len(cols) else (x1 - x0) * 0.4; cyr = top + 0.11 * (y1 - y0)
        sc_ = 1.0; M_ = np.float32([[sc_, 0, cxr - sc_ * CLOSE_C[0]], [0, sc_, cyr - sc_ * CLOSE_C[1]]])
        ray = cv2.warpAffine(plate_at(CLOSE, ((f - S5["f0"]) / FPS) % 5.9), M_, (x1 - x0, y1 - y0)).astype(np.float32)
        bgv = screen(green(t)[y0:y1, x0:x1] * 0.55, ray)
        v = np.clip(v, 0, 255) * (1 - bgm) + bgv * bgm
        fr[y0:y1, x0:x1] = fr[y0:y1, x0:x1] * (1 - m) + v * m
    oc = C["outro"]
    if f >= oc["card_in"]:
        la = sb.prog(f, oc["card_in"], oc["card_in"] + 10); lw, lh = int(sb.LOGO.shape[1] * 0.62), int(sb.LOGO.shape[0] * 0.62)
        lg = cv2.resize(sb.LOGO, (lw, lh)); al = cv2.resize(sb.LOGO_A, (lw, lh))[..., None] * la; x0, y0 = int(CX - lw / 2), oc["logo_y"]
        fr[y0:y0 + lh, x0:x0 + lw] = fr[y0:y0 + lh, x0:x0 + lw] * (1 - al) + lg * al
        lp = sb.prog(f, oc["card_in"] + 6, oc["card_in"] + 20, sb.eout)
        cv2.line(fr, (int(CX - 230 * lp), oc["rule_y"]), (int(CX + 230 * lp), oc["rule_y"]), (255, 255, 255), 1, cv2.LINE_AA)
    if light and f >= 676:   # the light traces the screen's own border around the close (Seedance outline clip)
        put(OUTLINE, 0.3 + (f - 676) * 0.058, np.float32([[1, 0, 0], [0, 1, 0]]), 0.8 * (1 - sb.prog(f, 742, 751)))
    return fr

def src_xy(src, f):
    if src[0] == "pano": return subject_xy(slide_of(f), f, src[1], src[2])
    if src[0] == "abs": return (src[1], src[2])
    _, vin = sb.side_frame(S5, f); return sb.anchor(vin, src[0], src[1], src[2])

def render(f):
    global PL
    sb.CUR_F = f; t = f / FPS; L = np.zeros((H, W, 3), np.float32); PL = np.zeros((H, W, 3), np.float32)
    sl = slide_of(f); fr = slide_frame(sl, f, t, L)
    i = SL.index(sl)
    if sl["id"] in TR and f < sl["f0"] + TR[sl["id"]][1] + 14:
        m = transition(sl, f)
        if m is not None: fr = slide_frame(SL[i - 1], f, t, L, light=False) * (1 - m) + fr * m
    gain = 1.0
    for b in sb.BEATS:
        fi = b["impact"]; fs = fi - b.get("travel", 13)
        if f < fs or f > b["out"] + 12: continue
        srcs = [b["from"]] if isinstance(b["from"][0], str) else b["from"]
        for (items, rng_), has_rules, ld in sb.T_LINES[b["id"]]:
            draw_text(fr, items, fi + ld, b["out"], exit_dir=b.get("exit", 1), shadow=b.get("shadow"))
            if has_rules: sb.rules(fr, L, items[0]["y"] + items[0]["size"] * 0.62, rng_, fi + ld, b["out"])
    for (fa, fb, inten) in C.get("flashes", []):
        if fa <= f <= fb: q = math.sin(math.pi * (f - fa) / (fb - fa)) * inten; fr = fr * (1 - q) + sb.FLASH * q
    bx = C["ball"]
    if bx[0] <= f <= bx[1] + 14:   # the team network becomes the KV ball (Seedance ball plate)
        put(BALL, 0.8 + (f - bx[0]) * 0.1, np.float32([[1, 0, 0], [0, 1, 0]]), 0.85 * (1 - sb.prog(f, bx[1], bx[1] + 7)))
    return np.clip((screen(np.clip(fr, 0, 255), PL) + sb.glow(L)) * gain * sb.VIS, 0, 255)

if only:
    for f in only: Image.fromarray(sb.strip(render(f).astype(np.uint8), f)).save(f"{OUT}/frames/_v20_{f:03d}.jpg", quality=88)
    sys.exit(0)
OUT_FPS = C.get("out_fps", 30)
def pipe30(path, w, h):
    return subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-r", str(OUT_FPS), "-i", "-",
                             "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", path], stdin=subprocess.PIPE)
pc = pipe30(f"{OUT}/_clean_noaudio.mp4", W, H); pa = pipe30(f"{OUT}/_annot_noaudio.mp4", W, H + 112)
for i in range(int(N / FPS * OUT_FPS)):
    f = i * FPS / OUT_FPS
    img = render(f).astype(np.uint8); pc.stdin.write(img.tobytes()); pa.stdin.write(sb.strip(img, int(f)).tobytes())
    if i % 180 == 0: print("frame", i, flush=True)
for p in (pc, pa): p.stdin.close(); p.wait()
print("video done")
