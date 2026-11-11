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
BEAM_Y = 0.54 * 550; CLOSE_C = (0.49 * 960, 0.48 * 412)
_up = np.array([0.958, 0.287]); _cp = np.array([640.0, 311.5])            # sweep lines: direction and a point on the middle line
_ang = math.atan2(1, -1) - math.atan2(_up[1], _up[0])
PL = None
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
        fr = screen(np.clip(fr, 0, 255), plate_at(INTRO, 0.15 + f * 0.065).astype(np.float32) * (1 - sb.prog(f, 46, 58)))
        la = sb.prog(f, 26, 36)
        if la > 0:
            lw, lh = int(sb.LOGO.shape[1] * 0.75), int(sb.LOGO.shape[0] * 0.75); lg = cv2.resize(sb.LOGO, (lw, lh)); al = cv2.resize(sb.LOGO_A, (lw, lh))[..., None] * la
            x0, y0 = int(CX - lw / 2), int(CY - lh / 2); fr[y0:y0 + lh, x0:x0 + lw] = fr[y0:y0 + lh, x0:x0 + lw] * (1 - al) + lg * al
        return fr
    if sl["kind"] == "pano":
        v, vi, img = pano(sl, f); sx, sy = sb.to_canvas((0, 0, W, H), vi, *sl["subject"], img)
        if light and sl["born"] <= f < sl["born"] + 26:   # the light is born at the subject (Seedance birth plate)
            put(BIRTH, 1.6 + (f - sl["born"]) * 0.09, centre_M(BIRTH, sx, sy, 0.35))
        a0, a1 = sl["veil"]
        if f < a0: sa = 0.0
        else:   # the light brings a soft translucent shadow behind the copy (no solid panel: the animated image stays the protagonist)
            r = sb.lerp(0, 1150, sb.prog(f, a0, a1, sb.eio)); d = np.hypot(XX - CX, (YY - sl["y_hit"]) * 1.6)
            sa = SCRIM * np.clip((r - d) / 90, 0, 1)[..., None]
        fr = v * (1 - 0.58 * sa) + TINT * 0.58 * sa
        g = SIDE_G * (0.7 + 0.6 * (sb.prog(f, a0, a1) if f >= a0 else 0.0))   # grows a little when the copy arrives
        fr = fr * (1 - g) + green(t) * g
        return fr
    # close: Andrés (real photo) in the side panels with animated light behind him, corporate card in the centre
    fr = green(t) * sb.MASK["C"][..., None]; sides, _ = sb.side_frame(S5, f)
    for win in ("L", "R"):
        x0, y0, x1, y1 = sb.BOX[win]; m = sb.MASK[win][y0:y1, x0:x1][..., None]; v = sides[win]
        bgm = 1 - cv2.resize(sb.WMASK[win], (x1 - x0, y1 - y0))[..., None]
        cxr, cyr = (x1 - x0) * (0.40 if win == "L" else 0.60), (y1 - y0) * 0.42
        M_ = np.float32([[0.9, 0, cxr - 0.9 * CLOSE_C[0]], [0, 0.9, cyr - 0.9 * CLOSE_C[1]]])
        ray = cv2.warpAffine(plate_at(CLOSE, ((f - S5["f0"]) / FPS) % 5.9), M_, (x1 - x0, y1 - y0)).astype(np.float32)
        v = screen(np.clip(v, 0, 255), ray * bgm * 0.85)
        fr[y0:y1, x0:x1] = fr[y0:y1, x0:x1] * (1 - m) + v * m
    oc = C["outro"]
    if f >= oc["card_in"]:
        la = sb.prog(f, oc["card_in"], oc["card_in"] + 10); lw, lh = int(sb.LOGO.shape[1] * 0.62), int(sb.LOGO.shape[0] * 0.62)
        lg = cv2.resize(sb.LOGO, (lw, lh)); al = cv2.resize(sb.LOGO_A, (lw, lh))[..., None] * la; x0, y0 = int(CX - lw / 2), oc["logo_y"]
        fr[y0:y0 + lh, x0:x0 + lw] = fr[y0:y0 + lh, x0:x0 + lw] * (1 - al) + lg * al
        lp = sb.prog(f, oc["card_in"] + 6, oc["card_in"] + 20, sb.eout)
        cv2.line(fr, (int(CX - 230 * lp), oc["rule_y"]), (int(CX + 230 * lp), oc["rule_y"]), (255, 255, 255), 1, cv2.LINE_AA)
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
    if sl["kind"] == "pano" and i > 0 and f < sl["f0"] + 13:   # 45-degree light sweep reveals the new image
        prev = SL[i - 1]; old = slide_frame(prev, f, t, L, light=False)
        q = sb.prog(f, sl["f0"], sl["f0"] + 13, sb.eio); x0 = sb.lerp(-H, W + H, q); xl = x0 - (YY - H / 2)
        m = np.clip((xl - XX) / 10 + 0.5, 0, 1)[..., None]; fr = old * (1 - m) + fr * m
        put(SWEEP, 0.2 + (f - sl["f0"]) * 0.14, sweep_M(x0))
    gain = 1.0
    for b in sb.BEATS:
        fi = b["impact"]; fs = fi - b.get("travel", 13)
        if f < fs or f > b["out"] + 12: continue
        srcs = [b["from"]] if isinstance(b["from"][0], str) else b["from"]
        for si, src in enumerate(srcs):
            a = np.array(src_xy(src, min(f, fi)), np.float32); T = np.array([CX, b["y_hit"]], np.float32)
            if np.linalg.norm(T - a) > 60 and f <= fi + 12:
                tb = 0.15 + 1.45 * sb.clamp((f - fs) / max(1, fi - fs)) if f <= fi else 1.6 + (f - fi) * 0.12
                put(BEAM, tb, beam_M(a, T), 1 - sb.prog(f, fi, fi + 10))
        if fi - 5 <= f <= fi + 24: put(HALO, 1.0 + (f - fi) * 0.1, centre_M(HALO, CX, b["y_hit"], 0.6), 0.85)
        if f >= fi:
            d = f - fi; hb = math.exp(-d / 5.0); gain += 0.32 * hb
        for (items, rng_), has_rules, ld in sb.T_LINES[b["id"]]:
            sb.draw_line(fr, L, items, fi + ld, b["out"], t, exit_dir=b.get("exit", 1))
            if has_rules: sb.rules(fr, L, items[0]["y"] + items[0]["size"] * 0.62, rng_, fi + ld, b["out"])
    for (fa, fb, inten) in C.get("flashes", []):
        if fa <= f <= fb: q = math.sin(math.pi * (f - fa) / (fb - fa)) * inten; fr = fr * (1 - q) + sb.FLASH * q
    bx = C["ball"]
    if bx[0] <= f <= bx[1] + 14:   # the team network becomes the KV ball (Seedance ball plate)
        put(BALL, 0.8 + (f - bx[0]) * 0.1125, np.float32([[1, 0, 0], [0, 1, 0]]), 1 - sb.prog(f, bx[1], bx[1] + 14))
    return np.clip((screen(np.clip(fr, 0, 255), PL) + sb.glow(L)) * gain * sb.VIS, 0, 255)

if only:
    for f in only: Image.fromarray(sb.strip(render(f).astype(np.uint8), f)).save(f"{OUT}/frames/_v10_{f:03d}.jpg", quality=88)
    sys.exit(0)
pc = sb.pipe(f"{OUT}/_clean_noaudio.mp4", W, H); pa = sb.pipe(f"{OUT}/_annot_noaudio.mp4", W, H + 112)
for f in range(N):
    img = render(f).astype(np.uint8); pc.stdin.write(img.tobytes()); pa.stdin.write(sb.strip(img, f).tobytes())
    if f % 150 == 0: print("frame", f, flush=True)
for p in (pc, pa): p.stdin.close(); p.wait()
print("video done")
