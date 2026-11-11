"""Animated storyboard on top of the APPROVED PILOT (Andrés Silva teaser).

Keeps every pilot pixel (green panel, copy, beam, die-cut, intro, speaker card) and replaces only the photo
windows with the animated version of each frame, so the client sees "the pilot, but moving".

Outputs:
  refs/ref_S1_botines.mp4 ... ref_S4_companerismo.mp4   1280x720 (16:9) camera + light reference per frame (Seedance @Video)
  stills/still_S*_primer_cuadro.png                      first frames (approved framing)
  storyboard_piloto_animado.mp4                          full 49.7 s preview, pilot layout, with info strip
Usage: python storyboard_pilot.py <config.json>
"""
import json, math, os, subprocess, sys
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

C = json.load(open(sys.argv[1])); OUT = C["out_dir"]
os.makedirs(f"{OUT}/refs", exist_ok=True); os.makedirs(f"{OUT}/stills", exist_ok=True)
FPS = 25; W, H = 1280, 720; BW, BH = 1920, 1080
PW, PH, CY0, CH = 1280, 308, 30, 238          # pilot frame, content rows
INFO = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"; INFOB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def ease(t): t = clamp(t); return t * t * (3 - 2 * t)
def prog(x, a, b): return ease((x - a) / max(1e-6, b - a))
def lerp(a, b, t): return a + (b - a) * t

def load_cover(path):
    im = cv2.cvtColor(cv2.imread(path), cv2.COLOR_BGR2RGB); r = max(BW / im.shape[1], BH / im.shape[0])
    im = cv2.resize(im, (round(im.shape[1] * r), round(im.shape[0] * r)), interpolation=cv2.INTER_AREA if r < 1 else cv2.INTER_CUBIC)
    y = (im.shape[0] - BH) // 2; x = (im.shape[1] - BW) // 2; return im[y:y + BH, x:x + BW]

def cam(img, s=1.0, cx=0.5, cy=0.5, rot=0.0, out=(W, H)):
    ih, iw = img.shape[:2]; ow, oh = out; th = math.radians(rot); k = (iw / ow) / s
    hw, hh = ow / 2 * k, oh / 2 * k
    bw = abs(math.cos(th)) * hw + abs(math.sin(th)) * hh; bh = abs(math.sin(th)) * hw + abs(math.cos(th)) * hh
    px = min(max(cx * iw, bw), iw - bw) if bw < iw / 2 else iw / 2
    py = min(max(cy * ih, bh), ih - bh) if bh < ih / 2 else ih / 2
    a, b, d, e = math.cos(th) * k, -math.sin(th) * k, math.sin(th) * k, math.cos(th) * k
    M = np.float32([[a, b, px - a * ow / 2 - b * oh / 2], [d, e, py - d * ow / 2 - e * oh / 2]])
    return cv2.warpAffine(img, M, out, flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT).astype(np.float32)

def hblur(fr, k):
    k = int(k); return cv2.blur(fr, (k, 1)) if k > 2 else fr

def streak(h, w, y, inten, t, thick=1.0):
    """horizontal neon-green multi-strand light streak (KV beam style), additive layer"""
    lay = np.zeros((h, w, 3), np.float32); rng = np.random.default_rng(3); xs = np.linspace(-20, w + 20, 60)
    for i in range(7):
        off = (i - 3) * 3.0 * thick; ph = rng.uniform(0, 6.3)
        ys = y + off + 4 * thick * np.sin(xs / w * 9 + ph + t * 4)
        col = (70, 255, 120) if i != 3 else (235, 255, 238)
        pts = np.stack([xs, ys], 1).astype(np.int32)
        cv2.polylines(lay, [pts], False, tuple(c * inten for c in col), 2 if i == 3 else 1, cv2.LINE_AA)
    g1 = cv2.GaussianBlur(lay, (0, 0), 3 * thick); g2 = cv2.GaussianBlur(cv2.resize(lay, (w // 4, h // 4)), (0, 0), 4)
    return lay + g1 * 1.4 + cv2.resize(g2, (w, h)) * 2.2 * np.float32([0.55, 1.0, 0.6])

# ---------------------------------------------------------------- shots (camera language per approved frame)
SEGS = C["segments"]
IMG = {s["id"]: load_cover(s["image"]) for s in SEGS}

def shot(seg, tau):
    """returns frame (H,W,3 float) and dict(whip=0..1, flash=0..1) for time tau (s) since the segment started"""
    sid = seg["id"]; im = IMG[sid]; d = seg["t1"] - seg["t0"]; meta = dict(whip=0.0, flash=0.0)
    for sh in seg["shots"]:
        if sh["a"] <= tau < sh["b"] or sh is seg["shots"][-1]:
            p = prog(tau, sh["a"], sh["b"]) if sh.get("ease", True) else clamp((tau - sh["a"]) / (sh["b"] - sh["a"]))
            s0, s1 = sh["s"]; c0, c1 = sh["c"]; r0, r1 = sh.get("rot", [0, 0])
            fr = cam(im, lerp(s0, s1, p), lerp(c0[0], c1[0], p), lerp(c0[1], c1[1], p), lerp(r0, r1, p))
            if sh.get("focus_pull"):  # soft -> sharp
                fr = cv2.GaussianBlur(fr, (0, 0), max(0.1, 6 * (1 - prog(tau, sh["a"], sh["a"] + 0.8))))
            break
    if seg.get("whip_in") and tau < 0.35:          # resolves from the previous whip (left-to-right energy)
        q = tau / 0.35; fr = hblur(np.roll(fr, int(-(1 - q) ** 2 * 260), axis=1), 90 * (1 - q)); meta["whip"] = 1 - q
    if seg["exit"] == "whip" and tau > d - 0.5:     # whip pan left-to-right + green light streak
        q = (tau - (d - 0.5)) / 0.5; fr = hblur(np.roll(fr, int(q ** 2 * 300), axis=1), 120 * q); meta["whip"] = q
        fr = fr + streak(H, W, H * 0.52, min(1, q * 1.6), tau, 2.0)
    if seg["exit"] == "flash" and tau > d - 1.3:     # green backlight blooms into a flash
        q = prog(tau, d - 1.3, d); meta["flash"] = q
        fr = fr + streak(H, W, H * lerp(0.9, 0.4, q), q, tau, 2.5) * 1.2
        fr = fr * (1 - q ** 1.6) + np.float32([205, 255, 215]) * q ** 1.6
    return np.clip(fr, 0, 255), meta

# ---------------------------------------------------------------- reference clips + first frames
def pipe(path, w, h, audio=None):
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-r", str(FPS), "-i", "-"]
    cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", path]
    return subprocess.Popen(cmd, stdin=subprocess.PIPE)

for seg in SEGS:
    cv2.imwrite(f"{OUT}/stills/still_{seg['id']}_primer_cuadro.png", cv2.cvtColor(IMG[seg["id"]], cv2.COLOR_RGB2BGR))
    p = pipe(f"{OUT}/refs/ref_{seg['id']}.mp4", W, H); nfr = int(round((seg["t1"] - seg["t0"]) * FPS))
    for f in range(nfr):
        fr, _ = shot(seg, f / FPS); p.stdin.write(fr.astype(np.uint8).tobytes())
    p.stdin.close(); p.wait(); print("ref", seg["id"], nfr, "frames", flush=True)

# ---------------------------------------------------------------- composite into the approved pilot
dmask = cv2.imread(C["diecut_mask"], cv2.IMREAD_GRAYSCALE) > 127           # CH x PW, True = die-cut black
n, lab = cv2.connectedComponents((~dmask).astype(np.uint8))
comps = sorted([(np.mean(np.where(lab == i)[1]), i) for i in range(1, n) if (lab == i).sum() > 2000])
left_m, centre_m, right_m = [(lab == i).astype(np.float32) for _, i in comps[:3]]
xx = np.arange(PW, dtype=np.float32)[None, :]
# per-segment fade (photo -> green panel) measured from the pilot; clean green panel from the pilot's empty frame
PROF = json.load(open(C["alpha_profiles"])); GREEN = cv2.cvtColor(cv2.imread(C["green_empty"]), cv2.COLOR_BGR2RGB).astype(np.float32)
def centre_alpha(sid):
    a = np.clip(np.array(PROF[sid], np.float32), 0, 1); a[:450] = 0
    a = np.maximum.accumulate(cv2.GaussianBlur(a[None, :], (0, 0), 3)[0]); a[a > 0.9] = 1.0; a = np.minimum(a / 0.9, 1.0)
    return centre_m * a[None, :]
CA = {sg["id"]: centre_alpha(sg["id"]) for sg in SEGS}
DW, DH, TOP = 447.0, 252.0, -6.7                      # image display size in the pilot (fit to panel height)

def place(fr, L):
    """put a 1280x720 frame at pilot x=L (display 447x252), return CH x PW layer"""
    M = np.float32([[DW / W, 0, L], [0, DH / H, TOP]])
    return cv2.warpAffine(fr, M, (PW, CH), flags=cv2.INTER_AREA, borderMode=cv2.BORDER_CONSTANT)

reader = subprocess.Popen(["ffmpeg", "-v", "error", "-i", C["pilot"], "-f", "rawvideo", "-pix_fmt", "rgb24", "-r", str(FPS), "-"], stdout=subprocess.PIPE)
SC = 1.5; OW, OH, STRIP = int(PW * SC) // 2 * 2, int(CH * SC) // 2 * 2, 112
prev = pipe(f"{OUT}/storyboard_piloto_animado.mp4", OW, OH + STRIP)
fB = ImageFont.truetype(INFOB, 18); fS = ImageFont.truetype(INFO, 15); fT = ImageFont.truetype(INFOB, 16)
total = int(C["pilot_duration"] * FPS)
for f in range(total):
    buf = reader.stdout.read(PW * PH * 3)
    if len(buf) < PW * PH * 3: break
    pf = np.frombuffer(buf, np.uint8).reshape(PH, PW, 3)[CY0:CY0 + CH].astype(np.float32); t = f / FPS
    seg = next((s for s in SEGS if s["t0"] <= t < s["t1"]), None); info = next(i for i in C["info"] if i["a"] <= t < i["b"])
    if seg:
        fr, meta = shot(seg, t - seg["t0"]); L = seg["place"]
        ca = CA[seg["id"]]
        # under the fade: clean green panel, but keep the pilot's own copy (white / lime text) on top
        txt = ((pf.min(2) > 185) | ((pf[..., 1] > 200) & (pf[..., 2] < 110) & (pf[..., 0] > 70))).astype(np.uint8)
        txt[:, 612:] = 0; txt[182:, :] = 0                     # the pilot's copy lives only in this box
        txt = cv2.dilate(txt, np.ones((3, 3), np.uint8)).astype(bool)[..., None]
        zone = (ca > 0.001)[..., None]
        base = np.where(zone & ~txt, GREEN, pf)
        photo = place(fr, L["c"]) * ca[..., None] + place(fr, L["l"]) * left_m[..., None] + place(fr, L["r"]) * right_m[..., None]
        a = np.clip(ca + left_m + right_m, 0, 1)[..., None]
        pf = base * (1 - a) + photo
        pf = np.where(txt & zone, np.maximum(pf, pf * 0 + base * txt), pf)   # copy stays crisp over the photo
        if meta["whip"] > 0.05:   # the light streak crosses all three panels
            pf = pf + streak(CH, PW, CH * 0.52, min(1, meta["whip"] * 1.6), t, 0.9) * (~dmask)[..., None]
        if meta["flash"] > 0:
            q = meta["flash"] ** 1.6; pf = pf * (1 - q * (~dmask)[..., None]) + np.float32([205, 255, 215]) * q * (~dmask)[..., None]
    pf = np.clip(pf, 0, 255).astype(np.uint8)
    big = cv2.resize(pf, (OW, OH), interpolation=cv2.INTER_CUBIC)
    canvas = Image.new("RGB", (OW, OH + STRIP), (12, 16, 14)); canvas.paste(Image.fromarray(big), (0, 0)); dr = ImageDraw.Draw(canvas)
    for i in C["info"]:
        x0 = 20 + i["a"] / C["pilot_duration"] * (OW - 40); x1 = 20 + i["b"] / C["pilot_duration"] * (OW - 40)
        col = (127, 255, 0) if i.get("anim") else (90, 160, 255)
        dr.rectangle([x0 + 1, OH + 8, x1 - 1, OH + 18], fill=col if i is info else tuple(c // 3 for c in col))
    px = 20 + t / C["pilot_duration"] * (OW - 40); dr.line([(px, OH + 4), (px, OH + 22)], fill=(255, 255, 255), width=2)
    dr.text((20, OH + 28), f"{int(t // 60):02d}:{int(t % 60):02d}:{f % FPS:02d} / 00:49:17", font=fB, fill=(255, 255, 255))
    dr.text((20, OH + 54), info["name"], font=fT, fill=(127, 255, 0) if info.get("anim") else (120, 180, 255))
    dr.text((20, OH + 80), info.get("tag", ""), font=fS, fill=(170, 190, 175))
    dr.text((560, OH + 28), "CÁMARA: " + info["cam"], font=fS, fill=(230, 235, 230))
    dr.text((560, OH + 50), "ACCIÓN IA: " + info["act"], font=fS, fill=(200, 255, 170))
    dr.text((560, OH + 72), "SFX: " + info["sfx"], font=fS, fill=(255, 220, 150))
    if f in C.get("snapshots", []): canvas.save(f"{OUT}/stills/_prev_{f:04d}.jpg", quality=85)
    prev.stdin.write(np.asarray(canvas).tobytes())
prev.stdin.close(); prev.wait(); reader.stdout.close(); reader.wait(); print("preview done")
