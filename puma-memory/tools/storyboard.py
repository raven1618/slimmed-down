"""Animated storyboard ("live storyboard") generator for the Puma Operadores 2026 speaker teasers.

Outputs (per speaker):
  refs/ref_O_apertura.mp4      3 s  1280x720  shared opening        (Seedance @Video reference)
  refs/ref_M_<speaker>.mp4    15 s  1280x720  speaker-specific story (Seedance @Video reference)
  refs/ref_C1_cierre_kv.mp4    5 s  1280x720  shared KV close       (Seedance @Video reference)
  refs/ref_C2_disertante.mp4   7 s  1280x720  shared speaker card   (Seedance @Video reference)
  storyboard_<speaker>_layout.mp4  30 s  1920x464  full-screen layout preview with die-cut + info strip
  stills/*.png  1920x1080 first/last-frame images for Seedance

Usage: python storyboard.py <config.json>
"""
import json, math, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

CFG = json.load(open(sys.argv[1]))
OUT = CFG["out_dir"]; KV = CFG["kv_dir"]; FONTS = CFG["font_dir"]
os.makedirs(f"{OUT}/refs", exist_ok=True); os.makedirs(f"{OUT}/stills", exist_ok=True)

FPS = 25
W, H = 1280, 720            # Seedance reference size (16:9)
BW, BH = 1920, 1080         # working size of source images
LIME = (127, 255, 0)
WHITE = (255, 255, 255)
FB = f"{FONTS}/GothamCondensed-Black.otf"; FBo = f"{FONTS}/GothamCondensed-Bold.otf"; FM = f"{FONTS}/GothamCondensed-Medium.otf"
INFO_FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"; INFO_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# ---------------------------------------------------------------- helpers
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def ease(t): t = clamp(t); return t * t * (3 - 2 * t)
def prog(f, f0, f1): return ease((f - f0) / max(1e-6, (f1 - f0)))
def lin(f, f0, f1): return clamp((f - f0) / max(1e-6, (f1 - f0)))
def lerp(a, b, t): return a + (b - a) * t

def font(path, size): return ImageFont.truetype(path, size)

def load_cover(path, size=(BW, BH)):
    im = Image.open(path).convert("RGB"); sw, sh = size
    r = max(sw / im.width, sh / im.height)
    im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    l = (im.width - sw) // 2; t = (im.height - sh) // 2
    return im.crop((l, t, l + sw, t + sh))

def cam(img, s=1.0, cx=0.5, cy=0.5, rot=0.0, out=(W, H)):
    """Virtual camera over a still: zoom s (1 = full frame), centre (cx,cy) normalised, roll in degrees."""
    iw, ih = img.size; ow, oh = out
    th = math.radians(rot); k = (iw / ow) / s
    hw, hh = ow / 2 * k, oh / 2 * k   # clamp so the view never leaves the image
    bw = abs(math.cos(th)) * hw + abs(math.sin(th)) * hh; bh = abs(math.sin(th)) * hw + abs(math.cos(th)) * hh
    px = min(max(cx * iw, bw), iw - bw) if bw < iw / 2 else iw / 2
    py = min(max(cy * ih, bh), ih - bh) if bh < ih / 2 else ih / 2
    a = math.cos(th) * k; b = -math.sin(th) * k; d = math.sin(th) * k; e = math.cos(th) * k
    c = px - a * ow / 2 - b * oh / 2; f_ = py - d * ow / 2 - e * oh / 2
    return img.transform(out, Image.AFFINE, (a, b, c, d, e, f_), resample=Image.BICUBIC)

def to_np(im): return np.asarray(im, dtype=np.float32)
def to_im(a): return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

YY, XX = np.mgrid[0:H, 0:W].astype(np.float32)

# ---------------------------------------------------------------- beams (procedural light ribbons in the KV style)
def bez(p0, p1, p2, n=80):
    t = np.linspace(0, 1, n)[:, None]; p0, p1, p2 = map(np.array, (p0, p1, p2))
    return (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2

def ellipse_pts(cx, cy, rx, ry, a0, a1, n=120):
    a = np.linspace(a0, a1, n); return np.stack([cx + rx * np.cos(a), cy + ry * np.sin(a)], 1)

def sub_path(pts, head, tail=1.0):
    """Portion of a path: head in [0,1] = how far drawn; tail = visible length as fraction."""
    n = len(pts); h = int(round(clamp(head) * (n - 1))); t0 = max(0, int(round(h - tail * (n - 1))))
    return pts[t0:h + 1] if h > t0 else None

def draw_ribbon(d, pts, inten, t=0.0, strands=7, spread=11.0, seed=1):
    if pts is None or len(pts) < 2 or inten <= 0.01: return
    p = np.asarray(pts, np.float32)
    tang = np.gradient(p, axis=0); nrm = np.stack([-tang[:, 1], tang[:, 0]], 1)
    nrm /= (np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-6)
    u = np.linspace(0, 1, len(p))
    rng = np.random.default_rng(seed)
    for i in range(strands):
        off = (i - (strands - 1) / 2) / ((strands - 1) / 2) * spread * 0.5
        ph = rng.uniform(0, 6.28); fr = rng.uniform(2, 5)
        wob = off + 3.0 * np.sin(u * fr * 6.28 + ph + t * 3)
        q = p + nrm * wob[:, None]
        g = 0.55 + 0.45 * rng.uniform()
        col = tuple(int(c * inten * g) for c in (70, 255, 120))
        d.line([tuple(x) for x in q], fill=col, width=2 if i % 3 else 1, joint="curve")
    core = tuple(int(c * inten) for c in (235, 255, 238))
    d.line([tuple(x) for x in p], fill=core, width=2, joint="curve")

def glow(layer_img):
    a = to_np(layer_img)
    g1 = to_np(layer_img.filter(ImageFilter.GaussianBlur(3)))
    small = layer_img.resize((W // 4, H // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(5))
    g2 = to_np(small.resize((W, H), Image.BILINEAR))
    tint = np.array([0.55, 1.0, 0.6], np.float32)
    return a + g1 * 1.3 + g2 * 2.2 * tint

def new_layer(): im = Image.new("RGB", (W, H)); return im, ImageDraw.Draw(im)

def diag_x(y, x0, slope=0.9):  # "/" diagonal (like the die-cut bands): x decreases going down
    return x0 - (y - H / 2) * slope

def sweep_pos(p):  # p 0..1 -> x0 so the diagonal crosses the whole frame
    return lerp(-0.5 * H - 120, W + 0.5 * H + 120, p)

def sweep_mask(x0, soft=10.0):
    return np.clip((diag_x(YY, x0) - XX) / soft + 0.5, 0, 1)[..., None]  # 1 = left of line (next shot)

def sweep_beam(d, x0, inten, t):
    pts = np.array([[diag_x(y, x0), y] for y in np.linspace(-60, H + 60, 90)])
    draw_ribbon(d, pts, inten, t, strands=9, spread=26, seed=7)

def heartbeat(t):  # two beats per ~1.1 s
    ph = (t % 1.1); return math.exp(-((ph - 0.1) ** 2) / 0.003) + 0.6 * math.exp(-((ph - 0.32) ** 2) / 0.003)

# ---------------------------------------------------------------- assets
kv_bg = Image.open(f"{KV}/kv_bg.png").convert("RGB")
kv_beams = Image.open(f"{KV}/kv_beams_add.png").convert("RGB")
kv_full = Image.open(f"{KV}/kv_full.png").convert("RGB")
kv_under = Image.open(f"{KV}/kv_bg_beams.png").convert("RGB")
PENT = [(470, 425), (930, 105), (1430, 445), (1215, 915), (700, 905)]  # KV centre pentagon (1920x1080)

def kv_logo_rgba():
    F = to_np(kv_full); U = to_np(kv_under)
    m = (np.abs(F - U).sum(2) > 40).astype(np.float32); m[392:, :] = 0; m[:330, :] = 0
    a = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    im = kv_full.copy().convert("RGBA"); im.putalpha(a); return im
LOGO = kv_logo_rgba()

def text_center(d, cx, y, s, fnt, fill, glow_img=None):
    w = d.textlength(s, font=fnt); d.text((cx - w / 2, y), s, font=fnt, fill=fill); return w

def make_opener():
    im = Image.fromarray(np.clip(to_np(kv_under), 0, 255).astype(np.uint8)).convert("RGBA")
    im.alpha_composite(LOGO); d = ImageDraw.Draw(im); cx = 950
    text_center(d, cx, 420, "CONVENCIÓN", font(FB, 150), WHITE)
    d.line([(735, 590), (1165, 590)], fill=(255, 255, 255, 200), width=2)
    text_center(d, cx, 600, "OPERADORES", font(FB, 96), LIME)
    d.line([(735, 712), (1165, 712)], fill=(255, 255, 255, 200), width=2)
    text_center(d, cx, 722, "2026", font(FB, 150), WHITE)
    return im.convert("RGB")

def make_speaker_card(photo_path=None, name="NOMBRE APELLIDO", talk="TÍTULO DE LA CHARLA", role="CARGO"):
    base = kv_under.copy().convert("RGBA")
    # inner pentagon (shrunk toward centre) holds the photo
    c = np.mean(np.array(PENT, np.float32), 0); inner = [tuple(c + (np.array(p) - c) * 0.9) for p in PENT]
    mask = Image.new("L", (BW, BH), 0); ImageDraw.Draw(mask).polygon(inner, fill=255)
    if photo_path and os.path.exists(photo_path):
        ph = load_cover(photo_path, (BW, BH))
    else:  # neutral placeholder silhouette
        ph = Image.new("RGB", (BW, BH), (18, 60, 35)); dd = ImageDraw.Draw(ph)
        dd.ellipse([840, 260, 1060, 500], fill=(40, 95, 60)); dd.rounded_rectangle([700, 520, 1200, 1000], 160, fill=(40, 95, 60))
        dd.text((902, 380), "FOTO", font=font(FBo, 44), fill=(90, 150, 110))
    # darken bottom for text legibility
    grad = np.linspace(0, 1, BH)[:, None, None]; arr = to_np(ph) * (1 - 0.75 * np.clip((grad - 0.55) / 0.3, 0, 1))
    photo = to_im(arr).convert("RGBA"); photo.putalpha(mask)
    base.alpha_composite(photo)
    beams_on_top = to_np(base.convert("RGB")) + to_np(kv_beams) * (np.asarray(mask, np.float32)[..., None] / 255.0) * 0.9  # re-light beams over the photo edge
    im = to_im(beams_on_top).convert("RGBA"); d = ImageDraw.Draw(im); cx = 950
    text_center(d, cx, 690, talk, font(FBo, 54), LIME)
    text_center(d, cx, 748, name, font(FB, 100), WHITE)
    text_center(d, cx, 856, role, font(FM, 36), (225, 240, 228))
    return im.convert("RGB")

# ---------------------------------------------------------------- per-speaker config
S = CFG["speaker"]
IM = [load_cover(p) for p in S["images"]]           # 4 images, story order
OPENER = make_opener(); CARD = make_speaker_card(S.get("photo"), S["name"], S["talk"], S["role"])
OPENER.save(f"{OUT}/stills/still_O_apertura_ultimo_cuadro.png")
kv_full.save(f"{OUT}/stills/still_C1_kv_ultimo_cuadro.png")
kv_under.save(f"{OUT}/stills/still_W_kv_sin_titulo.png")
CARD.save(f"{OUT}/stills/still_C2_ficha_{S['slug']}_ultimo_cuadro.png")
for i, im in enumerate(IM): im.save(f"{OUT}/stills/still_M{i+1}_primer_cuadro.png")

OPENER_S = OPENER.resize((W, H), Image.LANCZOS); KVF_S = kv_full.resize((W, H), Image.LANCZOS)
KVBG_S = kv_bg.resize((W, H), Image.LANCZOS); KVBM_S = to_np(kv_beams.resize((W, H), Image.LANCZOS))
CARD_S = CARD.resize((W, H), Image.LANCZOS)
F = {k: v * FPS for k, v in dict(O=3, M1=4, M2=3, M3=4, M4=4, C1=5, C2=7).items()}
SEGS = [("O", 0, 75), ("M", 75, 450), ("C1", 450, 575), ("C2", 575, 750)]
M_SH = [(75, 175), (175, 250), (250, 350), (350, 450)]   # M1..M4 global frames

# ---------------------------------------------------------------- shot renderers (return frame RGB float + meta)
def cam_M1(f): p = prog(f, 75, 175); return cam(IM[0], lerp(1.0, 1.25, p), lerp(0.5, 0.40, p), lerp(0.5, 0.42, p))
def cam_M2(f): p = prog(f, 175, 250); return cam(IM[1], lerp(1.05, 1.1, p), lerp(0.47, 0.53, p), 0.5)
def cam_M3(f): p = prog(f, 250, 350); tl = prog(f, 330, 350); return cam(IM[2], lerp(1.10, 1.16, p), 0.52, lerp(0.48, 0.40, tl), lerp(0.0, -3.0, p))
def cam_M4(f): p = prog(f, 350, 450); return cam(IM[3], lerp(1.2, 1.12, p), 0.47, lerp(0.6, 0.45, p))
def shot_O(f):  # 0..74
    t = f / FPS; p_draw = prog(f, 4, 52); front = lerp(-250, W + 250, p_draw)
    bg = to_np(KVBG_S) * lerp(0.18, 1.0, prog(f, 0, 50))
    reveal = np.clip((front - XX) / 220.0, 0, 1)[..., None]
    head = (1 + 2.5 * np.exp(-((XX - front) / 70.0) ** 2))[..., None]
    fr = bg + KVBM_S * reveal * head
    title_a = prog(f, 44, 62)
    fr = fr * (1 - title_a) + to_np(OPENER_S) * title_a if title_a > 0 else fr
    if f >= 62: fr = to_np(OPENER_S)   # static hold on the shared opener frame
    return fr, dict(sweep=None, flash=0.0)

def shot_M(f):  # global 75..449
    t = f / FPS; meta = dict(sweep=None, flash=0.0); lay, d = new_layer()
    if f < 175:   # M1 concentration: slow push-in on the lead player
        fr = to_np(cam_M1(f))
        if f < 92:  # opener -> first image, revealed by the diagonal beam
            x0 = sweep_pos(lin(f, 75, 92)); m = sweep_mask(x0); fr = to_np(OPENER_S) * (1 - m) + fr * m
            sweep_beam(d, x0, 1.0, t); meta["sweep"] = lin(f, 75, 92)
        hb = 0.25 + 0.55 * heartbeat(t)
        draw_ribbon(d, bez((0.56 * W, -30), (0.86 * W, 0.12 * H), (1.04 * W, 0.42 * H)), hb, t, strands=6, spread=14, seed=3)
        if f >= 165:  # exit: diagonal wipe to M2
            x0 = sweep_pos(lin(f, 165, 182)); sweep_beam(d, x0, 1.0, t); meta["sweep"] = lin(f, 165, 182)
            nxt = to_np(cam_M2(175)); m = sweep_mask(x0); fr = fr * (1 - m) + nxt * m
    elif f < 250:  # M2 boots: slow pan right, light of the pitch grows in the background
        p = prog(f, 175, 250); fr = to_np(cam_M2(f))
        if f < 182:
            x0 = sweep_pos(lin(f, 165, 182)); sweep_beam(d, x0, 1.0, t); meta["sweep"] = lin(f, 165, 182)
        draw_ribbon(d, sub_path(bez((1.06 * W, 0.20 * H), (0.82 * W, 0.02 * H), (0.60 * W, 0.10 * H)), prog(f, 178, 235), 1.0),
                    lerp(0.3, 0.9, p), t, strands=7, spread=16, seed=4)
        if f >= 243:  # fast wipe to M3
            x0 = sweep_pos(lin(f, 243, 256)); sweep_beam(d, x0, 1.0, t); meta["sweep"] = lin(f, 243, 256)
            nxt = to_np(cam_M3(250)); m = sweep_mask(x0); fr = fr * (1 - m) + nxt * m
    elif f < 350:  # M3 huddle: slight orbit (roll) + push; light ring connects the team; beam up the captain's finger
        fr = to_np(cam_M3(f))
        if f < 256:
            x0 = sweep_pos(lin(f, 243, 256)); sweep_beam(d, x0, 1.0, t); meta["sweep"] = lin(f, 243, 256)
        for k, (sx, sy) in enumerate([(0.69, 0.45)]):  # floodlight shimmer rays (short, in the sky gap)
            for j in range(3):
                ang = -2.3 + j * 0.3 + 0.05 * math.sin(t * 2 + j); L = 0.14 * W
                draw_ribbon(d, [(sx * W, sy * H), (sx * W + math.cos(ang) * L, sy * H + math.sin(ang) * L)],
                            0.18 + 0.08 * math.sin(t * 5 + j + k), t, strands=3, spread=6, seed=10 + j)
        ring = ellipse_pts(0.52 * W, 0.355 * H, 0.15 * W, 0.075 * H, math.pi, 3 * math.pi, 160)
        draw_ribbon(d, sub_path(ring, prog(f, 262, 318), 1.0), 0.95, t, strands=7, spread=12, seed=5)
        if f >= 322:  # beam shoots up the captain's raised finger, camera tilts up
            up = bez((0.48 * W, 0.55 * H), (0.48 * W, 0.2 * H), (0.47 * W, -0.15 * H))
            draw_ribbon(d, sub_path(up, prog(f, 322, 342), 0.6), 1.0, t, strands=8, spread=14, seed=6)
    else:  # M4 helping a teammate up: tilt up, green backlight rises through the clasped hands; bloom flash exit
        p = prog(f, 350, 450); fr = to_np(cam_M4(f))
        rise = bez((0.50 * W, 1.10 * H), (0.47 * W, 0.62 * H), (0.42 * W, -0.10 * H))
        draw_ribbon(d, sub_path(rise, prog(f, 352, 400), 0.8), lerp(0.6, 1.0, p), t, strands=8, spread=18, seed=8)
        if f < 362:  # carry-over of the upward beam from M3
            draw_ribbon(d, bez((0.48 * W, 1.1 * H), (0.48 * W, 0.5 * H), (0.47 * W, -0.15 * H)), 1.0 - lin(f, 350, 362), t, strands=6, spread=10, seed=6)
        fl = prog(f, 425, 450); meta["flash"] = fl
        if fl > 0:
            fr = fr + to_np(Image.fromarray(np.uint8(np.clip(KVBM_S, 0, 255)))) * 2.5 * fl
    fr = fr + glow(lay)
    if meta["flash"] > 0:
        a = meta["flash"] ** 1.5; fr = fr * (1 - a) + np.array([205, 255, 215], np.float32) * a
    return fr, meta

def shot_C1(f):  # 450..574 : from flash, beams build the ball net from the centre, KV resolves; slow pull back to static
    t = f / FPS; meta = dict(sweep=None, flash=1.0 - prog(f, 450, 468))
    cxp, cyp = 950 / BW * W, 520 / BH * H
    r = np.sqrt((XX - cxp) ** 2 + (YY - cyp) ** 2); front = lerp(0, 1150, prog(f, 452, 525))
    reveal = np.clip((front - r) / 160.0, 0, 1)[..., None]; head = (1 + 2.0 * np.exp(-((r - front) / 60.0) ** 2))[..., None]
    fr = to_np(KVBG_S) + KVBM_S * reveal * head
    ta = prog(f, 505, 540); fr = fr * (1 - ta) + to_np(KVF_S) * ta
    s = lerp(1.08, 1.0, prog(f, 452, 555)); img = cam(to_im(fr), s, 0.5, 0.5) if s > 1.0001 else to_im(fr)
    fr = to_np(img); a = meta["flash"] ** 1.5
    fr = fr * (1 - a) + np.array([205, 255, 215], np.float32) * a
    return fr, meta

def shot_C2(f):  # 575..749 : diagonal beam swaps the title for the speaker card; light pulses travel around the pentagon; static
    t = f / FPS; meta = dict(sweep=None, flash=0.0); lay, d = new_layer()
    fr = to_np(KVF_S)
    if 592 <= f:
        x0 = sweep_pos(lin(f, 592, 614)); m = sweep_mask(x0); fr = fr * (1 - m) + to_np(CARD_S) * m
        if f < 614: sweep_beam(d, x0, 1.0, t); meta["sweep"] = lin(f, 592, 614)
    if f >= 610:
        pent = np.array(PENT + [PENT[0]], np.float32) * np.array([W / BW, H / BH], np.float32)
        dense = np.concatenate([np.linspace(pent[i], pent[i + 1], 40, endpoint=False) for i in range(5)])
        n = len(dense)
        for k in range(2):  # two pulses chasing each other around the frame
            h = ((t - 610 / FPS) * 0.45 + k * 0.5) % 1.0; i1 = int(h * n); i0 = max(0, i1 - 22)
            seg_ = dense[i0:i1 + 1] if i1 > i0 else None
            draw_ribbon(d, seg_, 0.55 * (1 - prog(f, 720, 749)), t, strands=5, spread=8, seed=20 + k)
    fr = fr + glow(lay)
    return fr, meta

def render(f):
    if f < 75: return shot_O(f)
    if f < 450: return shot_M(f)
    if f < 575: return shot_C1(f)
    return shot_C2(f)

# ---------------------------------------------------------------- full-screen layout preview (3840x708 at half size)
LW, LH, STRIP = 1920, 354, 110
M2PX = LW / 19.0
def m2p(pts): return [(x * M2PX, y * M2PX) for x, y in pts]
DIE_L = m2p([(2.49, 0), (5.95, 0), (2.55, 3.5), (1.97, 3.5), (4.15, 1.4)])
DIE_R = m2p([(19 - 2.49, 0), (19 - 5.95, 0), (19 - 2.55, 3.5), (19 - 1.97, 3.5), (19 - 4.15, 1.4)])
CW = round(LH * 16 / 9); CX0 = (LW - CW) // 2
LXX = np.mgrid[0:LH, 0:LW][1].astype(np.float32)           # 16:9 centre window (629x354 at half size)
wide_bg = kv_bg.resize((LW, round(LW * BH / BW)), Image.LANCZOS); off = (wide_bg.height - LH) // 2
WIDE_BG = to_np(wide_bg.crop((0, off, LW, off + LH)))
wide_bm = kv_beams.resize((LW, round(LW * BH / BW)), Image.LANCZOS)
WIDE_BM = to_np(wide_bm.crop((0, off, LW, off + LH)))
die = Image.new("RGBA", (LW, LH), (0, 0, 0, 0)); dd = ImageDraw.Draw(die)
for poly in (DIE_L, DIE_R): dd.polygon(poly, fill=(55, 58, 60, 235))
for poly in (DIE_L, DIE_R):
    pts = poly + [poly[0]]
    for i in range(len(pts) - 1):
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]; L = math.hypot(x1 - x0, y1 - y0); n = int(L // 10)
        for k in range(0, n, 2):
            a = k / max(n, 1); b = min(1, (k + 1) / max(n, 1))
            dd.line([(x0 + (x1 - x0) * a, y0 + (y1 - y0) * a), (x0 + (x1 - x0) * b, y0 + (y1 - y0) * b)], fill=(230, 120, 40, 255), width=2)
dd.rectangle([CX0, 0, CX0 + CW - 1, LH - 1], outline=(255, 255, 255, 90), width=1)
dd.text((8, LH - 20), "troquel aprox. (esquema sin escala) · ventana central 16:9", font=font(INFO_FONT, 13), fill=(255, 255, 255, 160))

TEXTS = [  # (start_f, end_f, lines) on-screen copy added in post
    (95, 170, ["ANTES DE SALIR A LA CANCHA"]),
    (262, 342, ["UNA OPERACIÓN QUE CONECTA", "A TODO EL PAÍS"]),
    (362, 440, ["UN EQUIPO QUE LA HACE POSIBLE", "TODOS LOS DÍAS"]),
]
TXT_FONT = font(FB, 34)
INFO = CFG["shot_info"]   # list of {from,to,seg,shot,camera,beam,text}

def layout_frame(f, ref_rgb, meta):
    t = f / FPS
    band_x = ((t * 0.18) % 1.4 - 0.2) * LW
    band = (1.0 + 1.6 * np.exp(-((LXX - band_x) / 140.0) ** 2))[..., None]
    pulse = 0.6 + 0.2 * math.sin(t * 2.2); bm = WIDE_BM * band
    wide = WIDE_BG.copy() + bm * pulse
    if f < 75: wide = WIDE_BG * lerp(0.18, 1.0, prog(f, 0, 50)) + bm * prog(f, 4, 52)
    if meta.get("flash", 0) > 0: a = meta["flash"] ** 1.5; wide = wide * (1 - a) + np.array([205, 255, 215]) * a
    wide_im = to_im(wide)
    if meta.get("sweep") is not None:  # extend the diagonal sweep beam across the wings
        lay = Image.new("RGB", (LW, LH)); d = ImageDraw.Draw(lay)
        x0 = lerp(-LH, LW + LH, meta["sweep"])
        pts = [(x0 - (y - LH / 2) * 0.9, y) for y in np.linspace(-20, LH + 20, 40)]
        d.line(pts, fill=(235, 255, 238), width=2)
        for o in (-6, -3, 3, 6): d.line([(x + o, y) for x, y in pts], fill=(70, 255, 120), width=1)
        g = to_np(lay) + to_np(lay.filter(ImageFilter.GaussianBlur(3))) * 1.3 + to_np(lay.resize((LW // 4, LH // 4)).filter(ImageFilter.GaussianBlur(4)).resize((LW, LH))) * 2
        wide_im = to_im(to_np(wide_im) + g)
    centre = to_im(ref_rgb).resize((CW, LH), Image.LANCZOS)
    wide_im.paste(centre, (CX0, 0))
    # post-production copy
    d = ImageDraw.Draw(wide_im)
    for s0, s1, lines in TEXTS:
        if s0 <= f <= s1:
            rev = prog(f, s0, s0 + 10); fade = 1 - prog(f, s1 - 6, s1)
            y = LH - 14 - 38 * len(lines)
            gh = 40 * len(lines) + 30; g = Image.new("L", (CW, gh)); g.putdata([int(150 * fade * (i // CW) / gh) for i in range(CW * gh)])
            wide_im.paste((0, 0, 0), (CX0, LH - gh), g)
            for ln in lines:
                w = d.textlength(ln, font=TXT_FONT); x = CX0 + (CW - w) / 2
                timg = Image.new("RGBA", (int(w) + 4, 44), (0, 0, 0, 0)); ImageDraw.Draw(timg).text((2, 0), ln, font=TXT_FONT, fill=(255, 255, 255, int(255 * fade)))
                cut = int((w + 4) * rev); timg = timg.crop((0, 0, max(1, cut), 44))
                wide_im.paste(timg, (int(x), int(y)), timg); y += 40
    wide_im = wide_im.convert("RGBA"); wide_im.alpha_composite(die); wide_im = wide_im.convert("RGB")
    # info strip
    canvas = Image.new("RGB", (LW, LH + STRIP), (12, 16, 14)); canvas.paste(wide_im, (0, 0)); d = ImageDraw.Draw(canvas)
    info = next(i for i in INFO if i["from"] <= f < i["to"])
    colors = {"O": (90, 160, 255), "M": (127, 255, 0), "C1": (90, 160, 255), "C2": (90, 160, 255)}
    for i in INFO:  # timeline bar
        x0 = i["from"] / 750 * (LW - 40) + 20; x1 = i["to"] / 750 * (LW - 40) + 20
        c = colors[i["seg"]]; d.rectangle([x0 + 1, LH + 8, x1 - 1, LH + 20], fill=c if i is info else tuple(v // 3 for v in c))
    px = f / 750 * (LW - 40) + 20; d.line([(px, LH + 4), (px, LH + 24)], fill=(255, 255, 255), width=2)
    sec = f / FPS; tc = f"{int(sec // 60):02d}:{int(sec % 60):02d}:{f % FPS:02d}"
    d.text((20, LH + 30), f"{tc} / 00:30:00", font=font(INFO_BOLD, 20), fill=(255, 255, 255))
    d.text((20, LH + 58), info["shot"], font=font(INFO_BOLD, 17), fill=colors[info["seg"]])
    d.text((20, LH + 82), info["seg_label"], font=font(INFO_FONT, 13), fill=(170, 190, 175))
    d.text((660, LH + 32), "CÁMARA: " + info["camera"], font=font(INFO_FONT, 16), fill=(230, 235, 230))
    d.text((660, LH + 56), "HAZ: " + info["beam"], font=font(INFO_FONT, 16), fill=(200, 255, 170))
    d.text((660, LH + 80), "TEXTO: " + info["text"], font=font(INFO_FONT, 16), fill=(230, 235, 230))
    return canvas

# ---------------------------------------------------------------- encode
def pipe(path, w, h):
    return subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-r", str(FPS), "-i", "-",
                             "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", path], stdin=subprocess.PIPE)

names = {"O": "ref_O_apertura", "M": f"ref_M_{S['slug']}", "C1": "ref_C1_cierre_kv", "C2": "ref_C2_disertante"}
lay_p = pipe(f"{OUT}/storyboard_{S['slug']}_layout.mp4", LW, LH + STRIP)
for seg, f0, f1 in SEGS:
    p = pipe(f"{OUT}/refs/{names[seg]}.mp4", W, H)
    for f in range(f0, f1):
        fr, meta = render(f)
        rgb = np.clip(fr, 0, 255).astype(np.uint8)
        p.stdin.write(rgb.tobytes())
        lay_p.stdin.write(np.asarray(layout_frame(f, fr, meta), dtype=np.uint8).tobytes())
        if f in CFG.get("snapshots", []):
            to_im(fr).save(f"{OUT}/stills/_check_{f:03d}.jpg", quality=85)
            layout_frame(f, fr, meta).save(f"{OUT}/stills/_layout_{f:03d}.jpg", quality=85)
    p.stdin.close(); p.wait()
    print("done", seg, flush=True)
lay_p.stdin.close(); lay_p.wait(); print("layout done")
