"""Puma Energy · Esfera LED 2 m · APERTURA (no-credit build: light, transitions, globe, photos, texts, KV).
Canvas 2688x1296 equirectangular (x = longitude, canvas centre x=1344 faces the audience; rows pole to pole).
Usage: sphere_render.py [scale] [t0,t1,...]   scale 0.5 = preview (1344x648). With times -> stills only.
Outputs (out dir): Esfera_apertura_equirect.mp4 (the file for the LED) + Esfera_apertura_vista.mp4 (front+back view preview).
The puma run and the ball kick are Higgsfield items: placeholders here (marked PLACEHOLDER)."""
import sys, os, json, math, subprocess, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
OUT = R + "puma-kb/production/esfera/"
SC = float(sys.argv[1]) if len(sys.argv) > 1 else 0.5
STILLS = [float(x) for x in sys.argv[2].split(",")] if len(sys.argv) > 2 else None
EW, EH = int(2688 * SC), int(1296 * SC); FPS = 30
DN = EH                                     # disc (front composition) size in px
GREEN = np.array([60, 255, 40], np.float32); CORE = np.array([225, 255, 215], np.float32)

def sm(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
def ease(t): t = min(max(t, 0.0), 1.0); return t * t * (3 - 2 * t)

# ---------- sphere geometry ----------
lon = (np.arange(EW) + 0.5) / EW * 2 * np.pi - np.pi
lat = (0.5 - (np.arange(EH) + 0.5) / EH) * np.pi
LON, LAT = np.meshgrid(lon, lat)
P = np.stack([np.cos(LAT) * np.sin(LON), np.sin(LAT), np.cos(LAT) * np.cos(LON)], -1).astype(np.float32)   # front = +z

def roty(a):
    c, s = math.cos(a), math.sin(a); return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]], np.float32)
def rotz(a):
    c, s = math.cos(a), math.sin(a); return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]], np.float32)
def rotx(a):
    c, s = math.cos(a), math.sin(a); return np.array([[1, 0, 0], [0, c, -s], [0, s, c]], np.float32)

# ---------- football (truncated icosahedron): 12 pentagons + 20 hexagons, one pentagon facing the audience ----------
ph = (1 + 5 ** 0.5) / 2
ico = [(0, s1, s2 * ph) for s1 in (1, -1) for s2 in (1, -1)]
ico = np.array([v for a in ico for v in (a, (a[1], a[2], a[0]), (a[2], a[0], a[1]))], np.float32)
ico /= np.linalg.norm(ico, axis=1, keepdims=True)
import itertools
_e = float(np.sort((ico @ ico.T).ravel())[-13])                     # cos of the edge angle
dod = np.array([ico[list(c)].sum(0) for c in itertools.combinations(range(12), 3)
                if all(ico[i] @ ico[j] > _e - 1e-4 for i, j in itertools.combinations(c, 2))], np.float32)   # 20 face centres = hexagons
dod /= np.linalg.norm(dod, axis=1, keepdims=True)
# rotate so pentagon (0,1,phi) faces +z
v = ico[0]; ang = math.atan2(v[1], v[2]); ALIGN = rotx(ang)          # rotx(a) maps (0,y,z) -> towards +z
ico = ico @ ALIGN.T; dod = dod @ ALIGN.T
RP, RH = 2.32744, 2.26728                                          # face plane distances (edge = 1)
NF = np.concatenate([ico / RP, dod / RH]).astype(np.float32)       # score = P.n / r  (ray hits nearest plane first)
f0 = int(np.argmax(ico[:, 2]))
# pentagon edges in the gnomonic plane of the front face (for the pulse)
hx = dod[np.argsort(-(dod @ ico[f0]))[:5]]
U = hx[:, :2] / np.linalg.norm(hx[:, :2], axis=1, keepdims=True)
A0 = float(np.mean((RH / RP - hx[:, 2]) / np.linalg.norm(hx[:, :2], axis=1)))

def ball_field(Rm):
    """seam distance d (score units), panel centrality, face id; Rm rotates the ball (ball = Rm @ display)."""
    Q = P.reshape(-1, 3) @ Rm.T
    s = Q @ NF.T
    idx = np.argpartition(-s, 1, axis=1)[:, :2]
    s1 = np.take_along_axis(s, idx[:, :1], 1)[:, 0]; s2 = np.take_along_axis(s, idx[:, 1:2], 1)[:, 0]
    top = np.where(s1 >= s2, idx[:, 0], idx[:, 1]); a, b = np.maximum(s1, s2), np.minimum(s1, s2)
    return (a - b).reshape(EH, EW), a.reshape(EH, EW), top.reshape(EH, EW), Q.reshape(EH, EW, 3)

def ball_field_dirs(D, Rm):
    """ball_field for arbitrary display directions D (EHxEWx3)."""
    Q = D.reshape(-1, 3) @ Rm.T
    s_ = Q @ NF.T
    idx = np.argpartition(-s_, 1, axis=1)[:, :2]
    s1 = np.take_along_axis(s_, idx[:, :1], 1)[:, 0]; s2 = np.take_along_axis(s_, idx[:, 1:2], 1)[:, 0]
    top = np.where(s1 >= s2, idx[:, 0], idx[:, 1]); a, b = np.maximum(s1, s2), np.minimum(s1, s2)
    return (a - b).reshape(EH, EW), a.reshape(EH, EW), top.reshape(EH, EW), Q.reshape(EH, EW, 3)
SYM = np.where((P[..., 2] >= 0)[..., None], P, np.stack([-P[..., 0], P[..., 1], -P[..., 2]], -1)).astype(np.float32)   # back = front rotated (same content)
_th = np.arccos(np.clip(SYM[..., 2], -1, 1)); _phi = np.arctan2(SYM[..., 1], SYM[..., 0])
def sym_scaled(sc):
    """SYM directions with the ball shrunk to angular size sc (1 = fills the hemisphere); returns dirs, inside mask."""
    th2 = np.minimum(_th / sc, np.pi / 2)
    D = np.stack([np.sin(th2) * np.cos(_phi), np.sin(th2) * np.sin(_phi), np.cos(th2)], -1).astype(np.float32)
    return D, sm(np.pi / 2 * sc + 0.01, np.pi / 2 * sc - 0.01, _th)

_pz = P[..., 2]; _pth = np.arccos(np.clip(np.abs(_pz), 0, 1)); _paz = np.arctan2(P[..., 1], P[..., 0])
def pole_scaled(sc):
    """true directions zoomed about each hemisphere's own pole (sc>1 = ball bigger); = P at sc 1 (no side seam)."""
    th2 = np.minimum(_pth / sc, np.pi / 2)
    D = np.stack([np.sin(th2) * np.cos(_paz), np.sin(th2) * np.sin(_paz), np.sign(_pz + 1e-9) * np.cos(th2)], -1).astype(np.float32)
    return D, sm(np.pi / 2 * sc + 0.01, np.pi / 2 * sc - 0.01, _pth)

def neon(d, w, inten=1.0, strands=3, Q=None, t=0.0):
    """multi-strand light along d=0 (white core, green glow) -> RGB layer."""
    g = np.zeros(d.shape, np.float32); c = np.zeros(d.shape, np.float32)
    for k in range(strands):
        off = 0.0 if Q is None else (0.35 * w * k) * np.sin(7 * Q[..., 0] + 5 * Q[..., 1] + 1.7 * k + t * (0.8 + 0.3 * k))
        dd = np.abs(d - off)
        c = np.maximum(c, np.exp(-(dd / (0.28 * w)) ** 2)); g += np.exp(-(dd / w) ** 2) * 0.55 + np.exp(-dd / (4 * w)) * 0.18
    return (c[..., None] * CORE * 0.9 + np.clip(g, 0, 1.6)[..., None] * GREEN) * inten

def green_fill(cent, Q):
    """KV green panels: lighter at panel centres + fine dot texture."""
    base = np.array([18, 120, 52], np.float32); hi = np.array([40, 165, 70], np.float32)
    k = sm(0.42, 0.445, cent)[..., None]
    dots = (np.sin(140 * Q[..., 0]) * np.sin(140 * Q[..., 1]) * np.sin(140 * Q[..., 2]))
    return base * (1 - k) + hi * k + (dots > 0.25)[..., None] * 9

SW = 0.0016 / SC ** 0.5 * 2                                           # seam width (score units)

# ---------- text / disc compositing (front + back copies, see sphere_proj.py) ----------
sys.path.insert(0, R + "tools"); import sphere_proj as SPJ
_lon0 = LON; _lat0 = LAT
def _disc_maps(centres=(0, 180), feather=0.04):
    mx = np.full((EH, EW), -1, np.float32); my = np.full((EH, EW), -1, np.float32); al = np.zeros((EH, EW), np.float32)
    for c in centres:
        dl = LON - math.radians(c); x = np.cos(LAT) * np.sin(dl); y = np.sin(LAT); z = np.cos(LAT) * np.cos(dl)
        a = np.clip((1 - np.hypot(x, y)) / feather, 0, 1) * (z > 0); sel = a > al
        mx[sel] = (x[sel] + 1) / 2 * DN; my[sel] = (1 - y[sel]) / 2 * DN; al[sel] = a[sel]
    return mx, my, al
DMX, DMY, DMA = _disc_maps()
def disc_put(fr, rgba, alpha=1.0):
    """rgba: DNxDNx4 float (0..255) front composition -> composited on both hemispheres."""
    o = cv2.remap(rgba, DMX, DMY, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    a = o[..., 3:] / 255.0 * DMA[..., None] * alpha
    return fr * (1 - a) + o[..., :3] * a

FONT = {k: R + f"drive-dl/GothamCondensed-{v}.otf" for k, v in dict(black="Black", bold="Bold", medium="Medium").items()}
_fc = {}
def font(k, s):
    if (k, s) not in _fc: _fc[(k, s)] = ImageFont.truetype(FONT[k], s)
    return _fc[(k, s)]
_tc = {}
# ---------- motion-graphics text layer (browser-rendered PNG sequences, mg/seq_<key>) ----------
import json as _json, os as _os
MGD = R + "mg/"; MG_META = _json.load(open(MGD + "meta.json")) if _os.path.exists(MGD + "meta.json") else {}
_mgc = {}
def mg(key, tt):
    """RGBA DNxDN text layer of beat `key` at tt seconds after its start (None outside the sequence)."""
    d = MGD + f"seq_{key}"
    if not _os.path.isdir(d) or tt < 0: return None
    fs = _mgc.setdefault(("ls", key), sorted(_os.listdir(d))); k = int(round(tt * 30))
    if k >= len(fs): return None
    if (key, k) not in _mgc:
        im = cv2.imread(d + "/" + fs[k], cv2.IMREAD_UNCHANGED)
        if im.shape[0] != DN: im = cv2.resize(im, (DN, DN), interpolation=cv2.INTER_AREA)
        im = im.astype(np.float32); _mgc[(key, k)] = np.dstack([im[..., 2], im[..., 1], im[..., 0], im[..., 3]])
        if len(_mgc) > 400: [_mgc.pop(x) for x in list(_mgc)[1:200] if x[0] != "ls"]
    return _mgc[(key, k)]
def mg_put(fr, key, tt, alpha=1.0):
    L = mg(key, tt); return fr if L is None else disc_put(fr, L, alpha)
def beam_boost(t):
    """the light path answers every text landing."""
    return 1.0 + 1.1 * sum(math.exp(-((t - m["land"]) / 0.28) ** 2) for m in MG_META.values())

def lockup(lines, width=0.62, y_c=0.47, gap=0.02):
    """KV-style lockup on a transparent DN disc. lines: [(text, weight, rel_height, colour)] ; fitted to width*DN."""
    key = (tuple(lines), width, y_c)
    if key in _tc: return _tc[key]
    L = Image.new("RGBA", (DN, DN), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    rows = []
    for t, k, rh, col in lines:
        s = int(DN * rh)
        while s > 8 and d.textlength(t, font=font(k, s)) > width * DN: s -= 2
        bb = d.textbbox((0, 0), t, font=font(k, s), anchor="ls"); rows.append((t, k, s, col, -bb[1]))
    tot = sum(r[4] for r in rows) + gap * DN * (len(rows) - 1); y = y_c * DN - tot / 2
    sh = Image.new("RGBA", (DN, DN), (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
    for t, k, s, col, cap in rows:
        y += cap; f = font(k, s); x = DN / 2 - d.textlength(t, font=f) / 2
        ds.text((x + s * 0.03, y + s * 0.05), t, font=f, fill=(0, 0, 0, 200), anchor="ls")
        d.text((x, y), t, font=f, fill=col + (255,), anchor="ls"); y += gap * DN
    a = np.array(L).astype(np.float32); s_ = np.array(sh).astype(np.float32)
    s_[..., 3] = cv2.GaussianBlur(s_[..., 3], (0, 0), DN * 0.006)
    out = s_.copy(); al = a[..., 3:] / 255.0
    out[..., :3] = a[..., :3]; out[..., 3:] = np.maximum(a[..., 3:], s_[..., 3:] * 0.45); out[..., :3] *= al / np.maximum(out[..., 3:] / 255.0, 1e-3)
    _tc[key] = out; return out
W_, LIME = (255, 255, 255), (127, 255, 0)
def text_in(rgba, t, t_in, t_out=None):
    """impact entry: scale 1.25->1 + fade over 0.25 s; quick fade out."""
    p = ease((t - t_in) / 0.25); q = 1.0 if t_out is None else 1 - ease((t - t_out) / 0.2)
    a = p * q
    if a <= 0: return None, 0
    s = 1.25 - 0.25 * p
    if abs(s - 1) > 1e-3:
        M = cv2.getRotationMatrix2D((DN / 2, DN / 2), 0, s); rgba = cv2.warpAffine(rgba, M, (DN, DN))
    return rgba, a

# ---------- KV logo (lockup RGBA; the top bar = PUMA ENERGY logo) ----------
LOGO = cv2.cvtColor(cv2.imread(R + "kv/kv_logo_rgba.png", cv2.IMREAD_UNCHANGED), cv2.COLOR_BGRA2RGBA).astype(np.float32)
def place(img, w_rel, cx=0.5, cy=0.5):
    h, w = img.shape[:2]; s = w_rel * DN / w
    M = np.float32([[s, 0, cx * DN - s * w / 2], [0, s, cy * DN - s * h / 2]])
    return cv2.warpAffine(img, M, (DN, DN), flags=cv2.INTER_CUBIC)
LOGO_BAR = LOGO[:58].copy()                                        # PUMA ENERGY bar (white on transparent)
cat_box = (LOGO_BAR[..., 3] > 0)
# cat = the green knock-out inside the right white panel -> panel filled solid; cat kept as its own white layer
xs = np.where(cat_box.any(0))[0]; xr0 = int(xs.min() + 0.53 * (xs.max() - xs.min()))
panel = LOGO_BAR[:, xr0:].copy(); hole = (panel[..., 3] < 128)
rows_ = np.where((~hole).any(1))[0]; colsn = np.where((~hole).any(0))[0]
inside = np.zeros_like(hole)
for yy in range(rows_.min(), rows_.max() + 1):
    c = np.where(~hole[yy])[0]
    if len(c): inside[yy, c.min():c.max() + 1] = True
CAT = np.zeros_like(LOGO_BAR); CAT[:, xr0:][inside & hole] = (255, 255, 255, 255)
BAR_NOCAT = LOGO_BAR.copy(); BAR_NOCAT[:, xr0:][inside & hole] = (255, 255, 255, 255)
CAT_G = CAT.copy(); CAT_G[..., :3] = (20, 130, 55)                 # cat as green knock-out colour when it lands in the panel

# ---------- globe ----------
GW, GH = 4096, 2048
def _geo_layers():
    import os
    cache = R + "esfera_in/geo/_globe_layers.npz"
    if os.path.exists(cache): z = np.load(cache); return z["land"], z["border"], z["py"], z["coast"]
    land = np.zeros((GH, GW), np.uint8); border = np.zeros((GH, GW), np.uint8); py = np.zeros((GH, GW), np.uint8)
    def pts(ring): a = np.array(ring, np.float64); return np.stack([(a[:, 0] + 180) / 360 * GW, (90 - a[:, 1]) / 180 * GH], 1).astype(np.int32)
    for ft in json.load(open(R + "esfera_in/geo/ne_50m_admin_0_countries.geojson"))["features"]:
        g = ft["geometry"]; polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        for poly in polys:
            p = [pts(r) for r in poly]
            if np.ptp(p[0][:, 0]) > GW * 0.6: continue          # antimeridian-crossing slivers (Fiji / Chukotka)
            cv2.fillPoly(land, p[:1], 255); cv2.polylines(border, p, True, 255, 2, cv2.LINE_AA)
            if ft["properties"]["ADMIN"] == "Paraguay": cv2.fillPoly(py, p[:1], 255)
    coast = cv2.morphologyEx(land, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8))
    np.savez_compressed(cache, land=land, border=border, py=py, coast=coast); return land, border, py, coast
G_LAND, G_BORDER, G_PY, G_COAST = [x.astype(np.float32) / 255 for x in _geo_layers()]
_tp = R + "geo/earth_tex_4096.png"
G_TEX = cv2.cvtColor(cv2.imread(_tp), cv2.COLOR_BGR2RGB).astype(np.float32) if os.path.exists(_tp) else None
def _py_layers():
    """Paraguay traced on the texture's OWN border lines (geo/py_tex_mask.png), so the highlight sits exactly on the map the viewer sees."""
    m = cv2.imread(R + "geo/py_tex_mask.png", 0)
    if m is None: return None
    m = cv2.dilate(m, np.ones((3, 3), np.uint8)).astype(np.float32) / 255
    ys, xs = np.where(m > 0); y0, y1, x0, x1 = ys.min() - 40, ys.max() + 40, xs.min() - 40, xs.max() + 40
    c = (m[y0:y1, x0:x1] > 0.5).astype(np.uint8)
    edge = cv2.morphologyEx(c, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)).astype(np.float32)
    glow = cv2.GaussianBlur(edge, (0, 0), 5); glow /= glow.max()
    dist = cv2.distanceTransform(c, cv2.DIST_L2, 5); inner = c * (0.35 + 0.65 * np.exp(-dist / 9))   # brighter toward the border
    ang = np.arctan2(*np.mgrid[y0:y1, x0:x1] - np.array([(y0 + y1) / 2, (x0 + x1) / 2])[:, None, None])
    L = [np.zeros_like(m) for _ in range(7)]
    vv, uu = np.mgrid[0:y1 - y0, 0:x1 - x0].astype(np.float32); uu /= (x1 - x0); vv /= (y1 - y0)
    soft = cv2.GaussianBlur(c.astype(np.float32), (0, 0), 1.2)
    for k, a in enumerate((cv2.GaussianBlur(edge, (0, 0), 0.8), glow, inner.astype(np.float32), ang.astype(np.float32), soft, uu, vv)): L[k][y0:y1, x0:x1] = a
    return L
PY_T = _py_layers()
PY_LL = (-58.36, -21.6)                                              # Paraguay centre (lon, lat)
ASU = (-57.58, -25.28)
HUBS = [(-74, 4.6), (-77, -12), (-70.6, -33.4), (-58.4, -34.6), (-56.2, -34.9), (-43.2, -22.9), (-79.5, 9), (-90.5, 14.6), (-87.2, 14.1),
        (-86.3, 12.1), (-69.9, 18.5), (-66.1, 18.4), (-76.8, 18), (-3.7, 40.4), (-0.1, 51.5), (4.9, 52.4), (8.5, 47.4), (28, -26.2),
        (31, -17.8), (32.6, -25.9), (39.3, -6.8), (36.8, -1.3), (3.4, 6.5), (-0.2, 5.6), (-4, 5.3), (13.2, -8.8), (15.3, -4.3),
        (55.3, 25.2), (51.5, 25.3), (72.9, 19), (100.5, 13.7), (106.8, -6.2), (103.8, 1.35), (121, 14.6), (114.2, 22.3), (151.2, -33.9),
        (147.2, -9.4), (174.8, -36.8), (-99.1, 19.4), (-118.2, 34)]

def ll2v(lo, la):
    lo, la = math.radians(lo), math.radians(la); return np.array([math.cos(la) * math.sin(lo), math.sin(la), math.cos(la) * math.cos(lo)], np.float32)
def look_at(lo, la):
    """rotation taking geographic direction (lo,la) to the display front (+z)."""
    return rotx(math.radians(la)) @ roty(-math.radians(lo))
def globe(t, lo_c, la_c, zoom, arcs=0.0, py_glow=0.0, dim=1.0):
    """front: the real globe; while zooming in, the back crossfades to the same view as the front (rotated copy)."""
    fr = _globe(P, t, lo_c, la_c, zoom, arcs, py_glow)
    w = sm(1.0, 1.45, zoom)
    if w > 0:
        back = (P[..., 2] < 0)[..., None] * w
        fs = _globe(SYM, t, lo_c, la_c, zoom, arcs, py_glow) * sm(0.0, 0.2, np.abs(P[..., 2]))[..., None]   # soft edge at the side joins
        fr = fr * (1 - back) + fs * back
    return fr * dim
def _globe(B, t, lo_c, la_c, zoom, arcs, py_glow):
    """display directions B -> geographic: azimuthal zoom about +z, then inverse look_at."""
    z = np.clip(B[..., 2], -1, 1); th = np.arccos(z); az = np.arctan2(B[..., 1], B[..., 0])
    th2 = th / zoom; D = np.stack([np.sin(th2) * np.cos(az), np.sin(th2) * np.sin(az), np.cos(th2)], -1)
    Gm = look_at(lo_c, la_c); Dg = D.reshape(-1, 3) @ Gm                     # = Gm^T applied
    glo = np.degrees(np.arctan2(Dg[:, 0], Dg[:, 2])); gla = np.degrees(np.arcsin(np.clip(Dg[:, 1], -1, 1)))
    mx = ((glo + 180) / 360 * GW).reshape(EH, EW).astype(np.float32); my = ((90 - gla) / 180 * GH).reshape(EH, EW).astype(np.float32)
    smp = lambda L: cv2.remap(L, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    land, coast, bord, py = smp(G_LAND), smp(G_COAST), smp(G_BORDER), smp(G_PY)
    lit = 0.6 + 0.4 * np.clip(B[..., 2], 0, 1)
    if G_TEX is not None:                                         # client: "muy planito este mapa" -> rich night-earth texture (fitted to our map)
        fr = smp(G_TEX) * lit[..., None] * 1.25
        tw = 0.85 + 0.15 * np.sin(t * 6 + mx * 0.05 + my * 0.07)        # city lights twinkle
        warm = np.clip(fr[..., 0] - fr[..., 2] - 25, 0, None) / 60; fr += (warm * (tw - 0.85) * 120)[..., None] * np.array([1, .9, .7], np.float32)
        fr += coast[..., None] * GREEN * 0.35
    else:
        ocean = np.array([4, 14, 18], np.float32); lc = np.array([10, 60, 30], np.float32)
        fr = (ocean * (1 - land[..., None]) + lc * land[..., None]) * lit[..., None]
        fr += coast[..., None] * GREEN * 0.9 + bord[..., None] * GREEN * 0.25
    if py_glow > 0 and PY_T is not None:                         # neon outline + inner gradient + light running round the border
        e, g, inn, ang, msk, uu, vv = [smp(L) for L in PY_T]
        breath = 0.85 + 0.15 * math.sin(t * 4.0)
        run = 0.5 + 0.5 * np.cos(ang - t * 3.0) ** 8                  # a bright bead travelling round the outline
        fr = fr * (1 - 0.35 * inn[..., None] * py_glow) + inn[..., None] * py_glow * breath * GREEN * 0.45
        fr += g[..., None] * py_glow * GREEN * (0.9 + 0.6 * run[..., None])
        # client: fill the country with the beam -> horizontal laser strands, bright dashes racing left to right inside the outline
        bm = np.zeros_like(uu)
        for k in range(15):
            v0 = 0.22 + k * 0.04 + 0.005 * math.sin(t * 1.3 + k)
            core = np.exp(-((vv - v0) / (0.007 + 0.003 * (k % 3))) ** 2)
            dash = 0.15 + 0.85 * np.clip(np.sin((uu - (0.55 + 0.12 * (k % 4)) * t - 0.37 * k) * np.pi / (0.16 + 0.05 * (k % 3))), 0, 1) ** 4
            bm += core * dash
        sweep = np.exp(-((uu - ((t * 0.45) % 1.4 - 0.2)) / 0.09) ** 2)                # a wide bar of light crossing the country
        bm = (bm * (0.75 + 0.6 * sweep) + sweep * 0.22) * msk * py_glow
        fr = fr + bm[..., None] * LASER_LIME * 1.7 + np.clip(bm, 0, 1)[..., None] ** 2 * LASER_CORE * 1.1
        fr = fr * (1 - e[..., None] * py_glow) + e[..., None] * py_glow * (np.array([200, 255, 170], np.float32) * (0.8 + 0.2 * run[..., None]))
    elif py_glow > 0:
        fr = fr * (1 - py[..., None] * py_glow) + py[..., None] * py_glow * (GREEN * 0.9 + 60)
    if arcs > 0:
        L = np.zeros((GH, GW), np.float32); a0 = ll2v(*ASU)
        for i, h in enumerate(HUBS):
            a1 = ll2v(*h); om = math.acos(float(np.clip(a0 @ a1, -1, 1)))
            p_ = np.clip((arcs * 1.4 - (i % 13) / 13 * 0.4), 0, 1)
            if p_ <= 0 or om < 1e-3: continue
            ts = np.linspace(0, p_, max(8, int(80 * p_)))
            pts = np.array([(math.sin((1 - u) * om) * a0 + math.sin(u * om) * a1) / math.sin(om) for u in ts])
            gx = (np.degrees(np.arctan2(pts[:, 0], pts[:, 2])) + 180) / 360 * GW; gy = (90 - np.degrees(np.arcsin(np.clip(pts[:, 1], -1, 1)))) / 180 * GH
            seg = np.stack([gx, gy], 1)
            for j in range(len(seg) - 1):
                if abs(seg[j + 1, 0] - seg[j, 0]) < GW / 2: cv2.line(L, tuple(map(int, seg[j])), tuple(map(int, seg[j + 1])), 1.0, 3, cv2.LINE_AA)
            cv2.circle(L, tuple(map(int, seg[-1])), 9, 1.0, -1, cv2.LINE_AA)
        L = np.maximum(L, cv2.GaussianBlur(L, (0, 0), 6) * 1.5)
        fr += np.clip(smp(L), 0, 1.5)[..., None] * (GREEN * 0.8 + 40)
    return fr

# ---------- photo discs ----------
_pc = {}
ZOOM_OVR = {"4_calidad/RFV1561.jpg": 1.45}          # car-maker grille kept out of frame (no third-party brands)
def photo_disc(path, fx=0.5, fy=0.5, z=1.0):
    z *= next((v for k, v in ZOOM_OVR.items() if path.endswith(k)), 1.0)
    key = (path, fx, fy, z)
    if key in _pc: return _pc[key]
    im = cv2.imread(path, cv2.IMREAD_COLOR); im = cv2.cvtColor(im, cv2.COLOR_BGR2RGB)
    h, w = im.shape[:2]; s = DN / min(h, w) * z; im = cv2.resize(im, (max(DN, math.ceil(w * s)), max(DN, math.ceil(h * s))), interpolation=cv2.INTER_AREA)
    x0 = int((im.shape[1] - DN) * fx); y0 = int((im.shape[0] - DN) * fy)
    d = im[y0:y0 + DN, x0:x0 + DN].astype(np.float32); _pc[key] = d; return d
YY, XX = np.mgrid[0:DN, 0:DN]; RR = np.hypot(XX - DN / 2, YY - DN / 2) / (DN / 2)
def ball_look(disc):
    """photo inside a glass ball: darker limb, slight top highlight."""
    v = (1 - 0.6 * sm(0.55, 1.0, RR))[..., None]; hl = np.exp(-(((XX - DN * 0.38) / (DN * 0.25)) ** 2 + ((YY - DN * 0.2) / (DN * 0.12)) ** 2)) * 28
    return np.clip(disc * v + hl[..., None], 0, 255)
def rgba(rgb, a=None):
    return np.dstack([rgb, np.full(rgb.shape[:2], 255, np.float32) if a is None else a])

# swoosh: the KV light path around the ball (tilted great circle bands, moving) — also the puma's track
# client mockup: one diagonal band under the puma (a tilted ring: low on the left, rising to the right for the front
# audience) + multi-strand ribbons around the rim of the ball = the side meridians where the front and back views meet.
PATH_B, PATH_A = math.radians(33), math.radians(10)              # band latitude at the front/back centre, tilt amplitude
def path_lat(lon): return -PATH_B + 0.5 * PATH_A * np.sin(2 * lon)    # rises to the right through BOTH the front (0) and back (180) centres
# real light: the teaser Seedance plates (organic multi-strand KV light) mapped along the band and the rims
def _plate(name, w=1280):
    raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", R + f"plates_4k/{name}.mp4", "-vf", f"scale={w}:-2", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    h = int(round(1648 * w / 3840 / 2) * 2); return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)
PL_INTRO = _plate("intro"); PL_BEAM = _plate("beam")
BANDH = math.radians(38)                                            # plate height spread over this many degrees of the band
def _band(plate, u, v):
    """sample a plate tiled twice around the ball (u in tiles), crossfading the tile ends so no seam shows."""
    ph_, pw_ = plate.shape[:2]; out = 0
    for off, wfun in ((0.0, lambda f: np.sin(np.pi * f) ** 2), (0.5, lambda f: np.cos(np.pi * f) ** 2)):
        f = (u + off + (0.27 if off else 0.0)) % 1.0
        mx = (f * (pw_ - 1)).astype(np.float32); my = (np.clip(v, 0, 1) * (ph_ - 1)).astype(np.float32)
        s_ = cv2.remap(plate, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT).astype(np.float32)
        out = out + s_ * (wfun((u) % 1.0) if off == 0.0 else wfun((u) % 1.0))[..., None]
    return out * ((v > 0) & (v < 1))[..., None]
def _intro_frame(tl):
    n = len(PL_INTRO); fps = 30
    if tl < 2.9: return PL_INTRO[min(int(tl * fps), n - 1)]           # the strands fly in and form the path
    a, b = int(1.9 * fps), min(int(2.9 * fps), n - 1); k = int((tl - 2.9) * fps * 0.6) % (2 * (b - a))
    return PL_INTRO[a + (k if k < (b - a) else 2 * (b - a) - k)]       # then a calm ping-pong of the intertwined strands
def bloom(L, k=0.6):
    sm = cv2.resize(L, (EW // 4, EH // 4), interpolation=cv2.INTER_AREA)
    g = cv2.GaussianBlur(sm, (0, 0), 6) * 0.6 + cv2.GaussianBlur(sm, (0, 0), 18) * 0.4
    return L + cv2.resize(g, (EW, EH)) * k
def light_over(fr, L, k=1.4, dark=0.45):
    """light that reads over bright footage: a soft dark halo under the strands, then screen the light on top."""
    m = np.clip(L.max(-1) / 110.0, 0, 1); m = cv2.GaussianBlur(m, (0, 0), 9 * SC * 2)
    fr = np.clip(fr, 0, 255) * (1 - dark * m[..., None]); Lk = np.clip(L * k, 0, 255)
    return 255 - (255 - fr) * (255 - Lk) / 255
# client ref (Nov 20, CLEANTEC stage lasers): a bundle of straight parallel laser strands, hot yellow-white cores,
# saturated lime glow, heavy bloom, bright streaks racing along the beam
LASER_CORE = np.array([215, 255, 200], np.float32); LASER_LIME = np.array([150, 255, 30], np.float32); LASER_GLOW = np.array([40, 255, 40], np.float32)
def laser_band(t, inten=1.0):
    d = LAT - path_lat(LON)                                            # radians from the band centre line
    ph_ = (LON / (2 * np.pi)) * 360                                    # degrees around the ball
    out = np.zeros((EH, EW, 3), np.float32)
    offs = [-0.075, -0.052, -0.031, -0.012, 0.006, 0.024, 0.045, 0.068]   # wider spread: strands read separately
    for k, o in enumerate(offs):
        w = (0.0042 + 0.0018 * (k % 3)) / max(SC, 0.5) * 0.5             # strand width: ~1.5-2.5 px at preview, crisp at 2688
        dd = np.abs(d - o - 0.0025 * np.sin(0.9 * LON + 0.7 * t + k))
        core = np.exp(-(dd / w) ** 2)
        # streaks: bright dashes travelling along the strand (left to right, the puma's direction)
        sp = 140 + 35 * (k % 4); ln = 22 + 9 * (k % 3)
        streak = 0.18 + 0.82 * np.clip(np.sin((ph_ - sp * t - 37 * k) * np.pi / ln), 0, 1) ** 4
        a = core * streak * (0.75 + 0.25 * (k % 2))
        hot = np.exp(-(dd / (w * 0.45)) ** 2) * streak                   # white-yellow hot core inside each strand
        out += a[..., None] * LASER_LIME * 0.95 + hot[..., None] * LASER_CORE * 0.9
    # wide lime glow under the bundle
    g = np.exp(-(np.abs(d) / 0.07) ** 2) * 0.22 + np.exp(-np.abs(d) / 0.12) * 0.08
    out += g[..., None] * LASER_GLOW * 0.6
    sm_ = cv2.resize(out, (EW // 4, EH // 4), interpolation=cv2.INTER_AREA)
    blo = cv2.GaussianBlur(sm_, (0, 0), 2) * 0.7 + cv2.GaussianBlur(sm_, (0, 0), 8) * 0.45
    return (out + cv2.resize(blo, (EW, EH))) * inten
def swoosh(t, inten=1.0, rim=False, **_):
    inten = inten * beam_boost(t)
    tl = t - TL["path"]
    if tl < 1.4:                                                          # the bundle shoots out from the front and back centres
        reach = ease(max(tl, 0) / 1.4) * math.pi * 0.55
        dl = np.minimum(np.abs(np.angle(np.exp(1j * LON))), np.abs(np.angle(np.exp(1j * (LON - math.pi)))))
        m = np.clip((reach - dl) / 0.15, 0, 1)[..., None]
        return laser_band(t, inten) * m
    return laser_band(t, inten)
def swoosh_plates(t, inten=1.0, rim=False, **_):
    pl = _intro_frame(t - TL["path"])
    u = LON / np.pi + 0.5                                             # one plate per half: centre (spark) at the front and back
    v = 0.5 - (LAT - path_lat(LON)) / BANDH
    out = _band(pl, u, v) * inten
    if rim:                                                           # calm beam light along the rim of the ball (side joins)
        pb = PL_BEAM[int(t * 30) % len(PL_BEAM)]
        ur = (LAT / np.pi + 0.5) * 1.0; vr = 0.5 + P[..., 2] / math.sin(math.radians(16))
        out = out + _band(pb, ur, vr) * inten * 0.85
    return bloom(out, 0.5)

# chrome puma run (4K Seedance + Topaz, on black): runs in place on the band, front (lon 0) and back (lon 180)
def _load_puma():
    import os
    vsrc = R + "esfera_in/puma/puma_vector.mp4"                    # client: flat white logo-cat silhouette running (Seedance from the logo, Nov 24)
    if PUMA_VECTOR and os.path.exists(vsrc):
        cap = cv2.VideoCapture(vsrc); F = []
        while True:
            ok, f = cap.read()
            if not ok: break
            g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY); g = cv2.resize(g, (g.shape[1] * 2, g.shape[0] * 2), interpolation=cv2.INTER_CUBIC)
            g = cv2.GaussianBlur(np.clip((g.astype(np.float32) - 60) * 2.0, 0, 255), (0, 0), 0.7)   # crisp vector edge, no grey halo
            F.append(np.repeat(g[..., None], 3, -1).astype(np.uint8))
        F = np.array(F); mx = F.max(0).max(-1); ys, xs = np.where(mx > 40)
        return F[:, max(0, ys.min() - 12):ys.max() + 12, max(0, xs.min() - 12):xs.max() + 12]
    src = R + "esfera_in/puma/puma_4k.mp4"
    if not os.path.exists(src): return None
    raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", src, "-vf", "scale=1280:-2", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    h = int(round(1648 * 1280 / 3840 / 2) * 2); F = np.frombuffer(raw, np.uint8).reshape(-1, h, 1280, 3)
    mx = F.max(0).max(-1); ys, xs = np.where(mx > 40)
    F = F[:, max(0, ys.min() - 12):ys.max() + 12, max(0, xs.min() - 12):xs.max() + 12]
    if not VECTOR_FROM_CHROME: return F
    out = np.zeros_like(F)                                         # (rejected: chrome reflections break the silhouette; vector run comes from the logo cat)
    for i in range(len(F)):
        fr_ = F[i].astype(np.int16); b = ((fr_.max(-1) > 70) & (fr_[..., 1] - fr_[..., 0] < 60)).astype(np.uint8)   # body above the soft glow, no green rim
        b = cv2.morphologyEx(b, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
        bp = cv2.copyMakeBorder(b, 2, 2, 2, 2, cv2.BORDER_CONSTANT, value=0); ff = np.zeros((bp.shape[0] + 2, bp.shape[1] + 2), np.uint8)
        cv2.floodFill(bp, ff, (0, 0), 2); solid = (bp[2:-2, 2:-2] != 2).astype(np.uint8)   # fill enclosed holes only: legs stay open
        a = cv2.GaussianBlur(solid.astype(np.float32), (0, 0), 0.9)    # crisp vector edge, anti-aliased
        out[i] = (a[..., None] * 255).astype(np.uint8)
    return out
VECTOR_FROM_CHROME = False
PUMA_VECTOR = False                                                  # the beam run stays chrome (client)
PUMA = _load_puma()
def _load_cat_run():
    """client (Cambios 1): the WHITE logo-cat silhouette runs in and lands in the logo, at the start (logo) and the end (cat_in)."""
    import os
    src = R + "esfera_in/puma/puma_vector.mp4"
    if not os.path.exists(src): return None
    cap = cv2.VideoCapture(src); F = []
    while True:
        ok, f = cap.read()
        if not ok: break
        g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY); g = cv2.resize(g, (g.shape[1] * 2, g.shape[0] * 2), interpolation=cv2.INTER_CUBIC)
        F.append(cv2.GaussianBlur(np.clip((g.astype(np.float32) - 60) * 2.0, 0, 255), (0, 0), 0.7))
    return np.array(F, np.float32)
CAT_RUN = _load_cat_run()
if CAT_RUN is not None:
    _ys, _xs = np.where(CAT_RUN[0] > 128); CAT_RUN0 = (_xs.min(), _xs.max(), _ys.min(), _ys.max())   # frame 0 = the logo pose
_cy_, _cx_ = np.where(CAT[..., 3] > 0); CAT_BOX = (_cx_.min(), _cx_.max(), _cy_.min(), _cy_.max())   # the cat inside the logo bar
def cat_run_in(fr, t, t0, dur, w_rel, cx, cy, land_layer):
    """white silhouette gallops in from the left and lands exactly on the logo cat (its loop frame 0 = the logo pose), then the logo cat takes over."""
    p = ease((t - t0) / dur)
    if CAT_RUN is not None and p < 1:
        n = len(CAT_RUN); idx = (-int(round((t0 + dur - t) * 30))) % n; q = CAT_RUN[idx]
        s = w_rel * DN / CAT.shape[1]; tw = (CAT_BOX[1] - CAT_BOX[0] + 1) * s; th = (CAT_BOX[3] - CAT_BOX[2] + 1) * s
        tx0 = cx * DN - s * CAT.shape[1] / 2 + CAT_BOX[0] * s; ty0 = cy * DN - s * CAT.shape[0] / 2 + CAT_BOX[2] * s
        bx0, bx1, by0, by1 = CAT_RUN0
        g = 1 + 2.6 * (1 - p) ** 1.5                                     # comes in big from the lower left, shrinks into the panel (below the bar, never over the type)
        k = tw / (bx1 - bx0 + 1) * g; ky = th / (by1 - by0 + 1) * g
        ex = tx0 + tw / 2 - (1 - p) * 0.42 * DN; ey = ty0 + th / 2 + (1 - p) ** 0.8 * 0.26 * DN   # bbox centre path
        M = np.float32([[k, 0, ex - (bx0 + bx1) / 2 * k], [0, ky, ey - (by0 + by1) / 2 * ky]])
        a = cv2.warpAffine(q, M, (DN, DN), flags=cv2.INTER_LINEAR)
        L = np.concatenate([np.repeat(np.full_like(a, 255)[..., None], 3, -1), a[..., None]], -1)
        fr = disc_put(fr, L, 1.0 - ease((p - 0.8) / 0.2))
    return disc_put(fr, place(land_layer, w_rel, cx, cy), ease((p - 0.8) / 0.2))
PUMA_WDEG = 64.0
PUMA_FOOT = 1.0 - 14.0 / PUMA.shape[1] if PUMA is not None else 0.9   # paw contact row (crop has 12 px pad under the lowest paw) -> sits on the band centre
if PUMA is not None:                                               # client: the puma must be seen stepping ON the beam -> damp the gallop's flight phase
    _low = np.array([np.where((f.max(-1) > 65).any(1))[0].max() for f in PUMA], np.float32)
    _low = np.convolve(np.concatenate([_low[-2:], _low, _low[:2]]), np.ones(5) / 5, "valid")
    PUMA_DROP = 0.65 * (_low.max() - _low) / PUMA.shape[1]        # fraction of the puma height to lower each frame
def puma_put(fr, t, alpha=1.0, centres=(0.0, math.pi)):
    if PUMA is None or alpha <= 0: return fr
    fi = int(t * 30) % len(PUMA); q = PUMA[fi].astype(np.float32); fh, fw = q.shape[:2]
    for c in centres:
        lat0 = float(path_lat(np.array(c))); slope = PATH_A * math.cos(2 * c)          # band slope at this centre (rad/rad)
        wpx = int(PUMA_WDEG / 360 * EW / math.cos(lat0)); hpx = int(wpx * fh / fw * math.cos(lat0))
        img = cv2.resize(q, (wpx, hpx), interpolation=cv2.INTER_AREA)
        ang = math.degrees(math.atan(slope * (EH / 180) / (EW / 360)))         # +: counter-clockwise = rising to the right, along the band
        pad = hpx; img = cv2.copyMakeBorder(img, pad, pad, 0, 0, cv2.BORDER_CONSTANT)
        M = cv2.getRotationMatrix2D((wpx / 2, img.shape[0] / 2), ang, 1.0); img = cv2.warpAffine(img, M, (wpx, img.shape[0]))
        cx = int((c / (2 * math.pi) + 0.5) * EW) % EW; yrow = int(EH * (0.5 - math.degrees(lat0) / 180))
        top = yrow - int(hpx * (PUMA_FOOT - PUMA_DROP[fi])) - pad; cols = np.arange(cx - wpx // 2, cx - wpx // 2 + wpx) % EW
        y0, y1 = max(0, top), min(EH, top + img.shape[0]); img = img[y0 - top:y1 - top]
        al = np.clip((img.max(-1, keepdims=True) - 10) / 55, 0, 1) * alpha
        reg = fr[y0:y1][:, cols]; fr[y0:y1][:, cols] = reg * (1 - al) + img * alpha
    return fr

# ---------- seam reveal: the KV ball's seams draw on, the next scene appears panel by panel (centre -> rim) ----------
_RD, _RC, _RT, _RQ = ball_field(np.eye(3, dtype=np.float32))
_pd = NF[_RT] / np.linalg.norm(NF[_RT], axis=-1, keepdims=True)
_jit = ((np.sin(_RT * 12.9898) * 43758.5453) % 1.0).astype(np.float32)
RV_DELAY = (1 - np.abs(_pd[..., 2])) * 0.75 + _jit * 0.12            # same order on the front and the back (|z|)
RV_W = 0.32; RV_K = 0.87 + RV_W
def reveal(old, new, t, ts, dur=0.8):
    """old -> new through the ball pattern; returns the composite with the seam light (bloomed) screened on top."""
    p = min(max((t - ts) / dur, 0.0), 1.0)
    if p >= 1: return new
    if p <= 0: return old
    loc = np.clip((p * RV_K - RV_DELAY) / RV_W, 0, 1)
    m = (loc * loc * (3 - 2 * loc))[..., None]
    out = old * (1 - m) + new * m
    out = out * (1 + 0.35 * np.sin(np.pi * loc)[..., None] * m)            # each panel glints as it turns over
    seam = 0.35 * math.sin(math.pi * p) + 1.1 * np.sin(np.pi * loc)       # the net draws on, each panel's edge flares as it flips
    L = neon(_RD, SW, 1.0, Q=_RQ, t=t) * seam[..., None]
    L = bloom(L, 0.8)
    Lk = np.clip(L, 0, 255); return 255 - (255 - np.clip(out, 0, 255)) * (255 - Lk) / 255

# ---------- below the light path: black with soft lime light (client pitch) ----------
def lower_black(fr, t, alpha=1.0):
    if alpha <= 0: return fr
    d = LAT - path_lat(LON)                                              # radians, negative below the band
    m = sm(0.0, -0.10, d)[..., None] * alpha
    out = fr * (1 - m)
    dep = np.clip(-d, 0, None)
    ph_ = (LON / (2 * np.pi)) * 360; fx = np.zeros_like(d)
    for k, o in enumerate((0.13, 0.21, 0.31, 0.44)):                   # thin streaks drifting left -> right, fading with depth
        dd = np.abs(dep - o - 0.012 * np.sin(1.3 * LON + 0.5 * t + k))
        dash = 0.25 + 0.75 * np.clip(np.sin((ph_ - (60 + 18 * k) * t - 53 * k) * np.pi / 40), 0, 1) ** 3
        fx += np.exp(-(dd / (0.0045 / max(SC, 0.5) * 0.5)) ** 2) * dash * (0.55 - 0.1 * k)
    glow = np.exp(-dep / 0.09) * 0.35 + np.exp(-dep / 0.3) * 0.08          # the band's light spilling down
    L = (fx[..., None] * LASER_LIME * 0.55 + glow[..., None] * LASER_GLOW * 0.5) * (d < 0)[..., None]
    sm_ = cv2.resize(L, (EW // 4, EH // 4), interpolation=cv2.INTER_AREA)
    L = L + cv2.resize(cv2.GaussianBlur(sm_, (0, 0), 3), (EW, EH)) * 0.6
    return out + L * m

def wipe(t, t0, dur=0.6):
    """light sweep across the sphere (left->right over the front): returns mask of NEW scene + light band."""
    p = (t - t0) / dur; xpos = -1.25 + 2.5 * ease(p)
    m = sm(-0.06, 0.06, xpos - P[..., 0]); band = np.exp(-((P[..., 0] - xpos) / 0.05) ** 2) * (0 < p < 1)
    return m[..., None], band[..., None] * (GREEN + 60)

# ---------- timeline (seconds; temporary until the VO is recorded) ----------
TL = dict(pulse0=0.4, pulseN=5, pulse_dt=1.05, open=6.0, ball=7.4, somos=8.6, logo=10.0, path=12.2, globe=13.4,
          txt_global=14.2, txt_40=16.8, txt_cal=19.4, zoom=21.6, py=23.0, km=25.6, entrega=28.4, destino=33.8,
          calidad=36.6, juntos=39.4, collage=46.4, pulse2=49.2, ballspin=52.6, kick=52.6, kv_flash=57.6, logo2=58.2, cat_in=59.2,
          logro=61.4, hoy=63.2, listos=64.8, y2027=67.0, kv=70.6, end=75.2)
ENTREGA = ["2_entrega/p2_cilindro.png", "2_entrega/p3_aerea02.jpg", "2_entrega/p4_convoy.png", "2_entrega/p4_ladario03.jpg", "2_entrega/p5_DSC3209.tif"]
DESTINO = [("3_destino/p1_eess.jpg", 0.6), ("3_destino/p2_aeropuerto.jpg", 0.25)]   # airport: crop away the airline tail (right)
IN = R + "esfera_in/"
JV = None
def juntos_frame(t):
    global JV
    if JV is None:
        raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-ss", "4", "-t", "7", "-i", IN + "5_juntos/parar_cargar_seguir_20s.mp4",
                              "-vf", f"fps=30,scale=-2:{DN}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
        w = int(round(1920 * DN / 1080 / 2) * 2); JV = np.frombuffer(raw, np.uint8).reshape(-1, DN, w, 3)
    i = int(min(max(t * 30, 0), len(JV) - 1)); fr = JV[i]; x0 = (fr.shape[1] - DN) // 2
    return fr[:, x0:x0 + DN].astype(np.float32)

FISH = IN + "fisheye/"
_fc_cache = {}
def fish_clip(name):
    if name not in _fc_cache:
        import os
        if not os.path.exists(FISH + name): _fc_cache[name] = None
        else:
            raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", FISH + name, "-r", "30", "-vf", "scale=640:640", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
            _fc_cache[name] = np.frombuffer(raw, np.uint8).reshape(-1, 640, 640, 3)
    return _fc_cache[name]
_m = np.where((P[..., 2] >= 0)[..., None], P, np.stack([-P[..., 0], P[..., 1], -P[..., 2]], -1))   # back half = rotated, not mirrored
_r = np.arccos(np.clip(_m[..., 2], -1, 1)) / np.pi * 0.985; _ph = np.arctan2(_m[..., 1], _m[..., 0])
FMX = ((0.5 + _r * np.cos(_ph)) * 640).astype(np.float32); FMY = ((0.5 - _r * np.sin(_ph)) * 640).astype(np.float32)
def fish_frame(name, tt, speed=1.0):
    F = fish_clip(name)
    if F is None: return None
    i = int(min(max(tt * speed * 30, 0), len(F) - 1))                      # play once, hold the last frame (never loop)
    return cv2.remap(F[i], FMX, FMY, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE).astype(np.float32)

_BK = (P[..., 2] < 0)
def fish_frame_kick(name, tt, back_rot):
    """fish_frame, but the back copy is rolled by back_rot (rad) so the frozen ball can land on the KV ball's real back pentagon."""
    F = fish_clip(name)
    if F is None: return None
    i = int(min(max(tt * 30, 0), len(F) - 1))
    ph = _ph + np.where(_BK, back_rot, 0.0)
    mx = ((0.5 + _r * np.cos(ph)) * 640).astype(np.float32); my = ((0.5 - _r * np.sin(ph)) * 640).astype(np.float32)
    return cv2.remap(F[i], mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE).astype(np.float32)

def pulse_layer(t, s, inten, down=0.0, echo=1.0, true_back=False):
    """the pentagon halo at scale s (1 = true panel) on the front AND the back (rotated copy), with echo rings,
    a soft inner glow and bloom; `down` (rad) moves its centre below the front/back centre."""
    D = SYM if down == 0 else SYM @ rotx(-down).T
    zz = np.maximum(D[..., 2], 1e-3); q = -D[..., :2] / zz[..., None]; ok = D[..., 2] > 0.05      # point up (client)
    if true_back:                                                 # back: sit on the ball's real back pentagon (antipode), so the ball forms under it
        q = np.where((P[..., 2] < 0)[..., None], q * np.array([1, -1], np.float32), q)
    base = np.max(np.stack([q @ U[i] for i in range(5)], 0), 0)
    pdist = lambda sc: np.where(ok, base - sc * A0, 9)
    w = 0.012 + 0.01 * s; pd = pdist(s)
    L = neon(pd, w, inten, strands=3, Q=P, t=t * 3)
    if echo > 0:                                                  # trailing echo rings ride outward and fade
        L += neon(pdist(s * 1.22), w * 1.5, inten * 0.30 * echo, strands=2, Q=P, t=t * 2) + neon(pdist(s * 1.5), w * 2.2, inten * 0.12 * echo, strands=1)
    L += (sm(0.0, -0.06, pd) * 0.10 * inten)[..., None] * GREEN    # the pentagon's face breathes with light
    return bloom(L, 0.8)

KICK = "K_neon.mp4"                                                   # client neon sequence (4K original), pushed in to land on the KV ball seams
RZ_UP = rotz(math.pi / 5)                                              # opening ball: front pentagon with its point up (client, Nov 22)
KICK_BACK_ROT = math.pi / 5                                            # back: upright pentagon -> the KV ball's back pentagon (points down)
BALL_DOWN = 0.31                                                       # the ball on the spot sits ~20 deg below the centre of the kick clip
_bc = np.array([0, -math.sin(BALL_DOWN), math.cos(BALL_DOWN)], np.float32); BALL_ANG = np.arccos(np.clip(SYM @ _bc, -1, 1))
SCN_KEY = ["km", "entrega", "destino", "calidad", "juntos"]
SCN = [(lambda: TL["km"], ["F1_anim.mp4"], [("EN CADA KM", "black", 0.14, W_), ("RECORRIDO", "black", 0.18, W_)], lambda: TL["entrega"]),
       (lambda: TL["entrega"], ["F2_dolly.mp4", "F3_flyby.mp4", "F4_anim.mp4"], [("EN CADA", "black", 0.14, W_), ("ENTREGA", "black", 0.18, W_)], lambda: TL["destino"]),
       (lambda: TL["destino"], ["F5_anim.mp4", "F6_anim.mp4"], [("EN CADA", "black", 0.14, W_), ("DESTINO", "black", 0.18, W_)], lambda: TL["calidad"]),
       (lambda: TL["calidad"], ["F7_anim.mp4"], [("CON COMBUSTIBLES", "black", 0.11, W_), ("DE CALIDAD", "black", 0.15, W_)], lambda: TL["juntos"]),
       (lambda: TL["juntos"], ["J1_anim.mp4", "J2_anim.mp4", "J3_anim.mp4"], [], lambda: TL["pulse2"])]      # CONSTRUIMOS JUNTOS: client video re-made as 3 fisheye scenes
_TU, _TV = FMX / 640.0, FMY / 640.0                                   # clip coordinates of every sphere pixel (the fisheye scenes' own frame)
TIDE = False
TIDE_HZ = 0.545                                                       # horizon row shared by J1's road end and J2's sea
def tide(f1, f2, t, tm):
    """J1 land -> J2 sea. The sea floods up from the bottom of the circle to the horizon behind a foam crest,
    the sky slides from J1's sunset to J2's, and at tm (truck = tanker size, same spot) a glint at the vanishing
    point swaps truck for ship while a lime streak runs out along the horizon."""
    k = (t - (tm - 1.0)) / 1.0                                        # 0..1 the water rises
    vf = 1.02 - (1.02 - TIDE_HZ) * ease(min(max(k, 0), 1)) ** 0.9       # crest row (clip v)
    vf = vf + 0.005 * np.sin(_TU * 14 + t * 3.0) + 0.0025 * np.sin(_TU * 33 - t * 5.0)        # a soft rolling swell
    below = _TV > TIDE_HZ
    sea = sm(vf - 0.004, vf + 0.012, _TV) * below                     # 1 where the water has arrived
    sky = ease((t - (tm - 0.75)) / 0.9) * (~below)                     # the sky slides over, top first
    sky = np.clip(sky * (1.15 - 0.6 * np.clip((_TV - 0.05) / TIDE_HZ, 0, 1)) , 0, 1) * (~below) if k < 1.6 else (~below) * 1.0
    centre = sm(0.105, 0.085, np.abs(_TU - 0.5)) * sm(0.13, 0.11, np.abs(_TV - 0.49))      # the whole truck stays solid until the glint swaps it
    swap = ease((t - tm + 0.05) / 0.1)
    m = np.maximum(sea, sky); m = m * (1 - centre) + np.maximum(m, swap) * centre
    out = f1 * (1 - m[..., None]) + f2 * m[..., None]
    on = min(max(k, 0), 1) * (1 - ease((k - 0.9) / 0.25))
    crest = np.exp(-((_TV - vf) / 0.009) ** 2) * below * on * (0.75 + 0.25 * np.sin(_TU * 60 + t * 6) ** 2)   # foam riding the crest
    wake = np.exp(-np.clip(_TV - vf, 0, None) / 0.03) * (_TV > vf) * below * on                          # wet sheen just behind it
    out = out * (1 + 0.25 * wake[..., None]) + crest[..., None] * np.array([235, 255, 225], np.float32) * 0.75 + bloom(crest[..., None] * GREEN * 0.5, 0.6)
    g = np.exp(-max(t - tm, 0) * 4.0) * ease((t - tm + 0.12) / 0.12)   # glint + horizon streak
    if g > 0.01:
        cy_ = 0.50; d2 = ((_TU - 0.5) / 0.05) ** 2 + ((_TV - cy_) / 0.055) ** 2          # big enough to cover the whole swap
        star = 1.2 * np.exp(-d2) + 0.6 * np.exp(-((_TV - cy_) / 0.006) ** 2) * np.exp(-np.abs(_TU - 0.5) / 0.12) \
               + 0.45 * np.exp(-((_TU - 0.5) / 0.006) ** 2) * np.exp(-np.abs(_TV - cy_) / 0.08)
        reach = 0.05 + 0.6 * ease((t - tm) / 0.5)
        streak = np.exp(-((_TV - TIDE_HZ) / 0.005) ** 2) * sm(reach, reach - 0.15, np.abs(_TU - 0.5))
        out = out + bloom((star[..., None] * np.array([255, 255, 235], np.float32) * 1.6 + streak[..., None] * (GREEN + 80)) * g, 0.9)
    return out
CLIP_DELAY = {"J1_anim.mp4": 0.35}                                     # -> the truck is exactly the tanker's size when the centre panel flips to J2
CLIP_SPEED = {}                                                        # J1 truck is pre-slowed 2x (interpolated) so it matches the J2 tanker size at the flip
def scene_foot(i, t):
    t0, photos, _, t1 = SCN[i][0](), SCN[i][1], SCN[i][2], SCN[i][3]()
    n = len(photos); seg = (t1 - t0) / n; j = int(min(max((t - t0) / seg, 0), n - 1))
    pic = lambda jj: fish_frame(photos[jj], t - (t0 + jj * seg - 0.45) - CLIP_DELAY.get(photos[jj], 0.0), CLIP_SPEED.get(photos[jj], 1.0))
    if TIDE and photos[0] == "J1_anim.mp4":                 # land -> sea (REJECTED Nov 24: looked improvised): the tide rolls in up to the horizon, the truck becomes the tanker in a glint
        tm = t0 + seg - 0.1
        if tm - 1.1 <= t < tm + 0.45: return tide(pic(0), pic(1), t, tm)
    f = pic(j)
    if j > 0 and t < t0 + j * seg + 0.45:                   # seam reveal between photos of the same line
        f = reveal(pic(j - 1), f, t, t0 + j * seg - 0.35, 0.8)
    return f
def scene_full(i, t):
    t0, t1 = SCN[i][0](), SCN[i][3]()
    clear = 0.0                                             # J1: puma + beam stay (the truck is in the clip itself)
    fr = lower_black(scene_foot(i, t), t, 1 - clear)
    fr = light_over(fr, swoosh(t, 1.0 - 0.85 * clear), 1.6, 0.5); fr = puma_put(fr, t, 1 - clear)
    fr = mg_put(fr, SCN_KEY[i], t - t0)
    return fr
def juntos_full(t):
    v = juntos_frame(t - TL["juntos"]); fr = disc_put(np.zeros((EH, EW, 3), np.float32), rgba(ball_look(v)))
    fr = lower_black(fr, t); fr = light_over(fr, swoosh(t, 1.0), 1.6, 0.5); return puma_put(fr, t)
def kick_to_kv(fr, t):
    """filmed ball -> KV ball: the code ball crossfades in with a soft radial blur, its seams swell, the panels light up to KV green."""
    T = TL; p = (t - (T["kv_flash"] - 0.3)) / 0.3                    # 0..1 crossfade from the clip
    q = (t - T["kv_flash"]) / (T["logo2"] - T["kv_flash"])          # 0..1 the panels fill to KV green
    Rb = RZ_UP @ roty(-0.10 * max(t - T["kv_flash"], 0.0))          # closing ball upright too (same fix as the opening)
    if p < 1:                                                        # start at the filmed ball's size (~0.86 of the circle) so the patterns line up
        D, inside = pole_scaled(1.33 - 0.33 * ease(p)); d, cent, top, Q = ball_field_dirs(D, Rb)   # filmed panels read ~1.33x larger
    else:
        d, cent, top, Q = ball_field(Rb); inside = 1.0
    if p < 1:                                                        # soft radial (zoom) blur on the filmed ball as it hits the lens
        sm_ = cv2.resize(np.clip(fr, 0, 255), (EW // 2, EH // 2))
        acc = sm_.copy()
        for k in (1.02, 1.045, 1.07):
            M = np.float32([[k, 0, (1 - k) * EW / 4], [0, k, (1 - k) * EH / 4]]); acc += cv2.warpAffine(sm_, M, (EW // 2, EH // 2), borderMode=cv2.BORDER_REFLECT)
        fr = fr * (1 - 0.6 * ease(p)) + cv2.resize(acc / 4, (EW, EH)) * 0.6 * ease(p)
        hot = np.clip(fr - 150, 0, None) * 2.2                         # the filmed seams flare as the code ball takes over (hides the swap)
        fr = fr + bloom(hot, 1.2) * math.sin(math.pi * p) * 0.9
    fill = 0.45 + 0.55 * ease(q)
    seams = 1.0 + 1.0 * math.sin(math.pi * min(max(p * 0.6 + q * 0.6, 0), 1))    # the seams swell to hot, then settle
    ball = green_fill(cent, Q) * fill + bloom(neon(d, SW, seams, Q=Q, t=t), 0.4 + 0.4 * ease(q))
    a = (ease(p) if q <= 0 else 1.0) * inside
    a = a[..., None] if np.ndim(a) == 2 else a
    out = fr * (1 - a) + ball * a
    return out + bloom(neon(d, SW, 1.0, Q=Q, t=t), 0.8) * math.sin(math.pi * min(max(p, 0), 1)) * 0.5

def render(t):
    T = TL; fr = np.zeros((EH, EW, 3), np.float32)
    spin = roty(-0.10 * t)
    # ---- 1. pulses (black sphere, pentagon halo opens and closes x5) ----
    if t < T["ball"] + 0.1:
        k = (t - T["pulse0"]) / T["pulse_dt"]
        if 0 <= k < T["pulseN"]:
            ph_ = k % 1; n = int(k); amp = 0.35 + 0.1 * n
            s = 0.18 + amp * math.sin(math.pi * min(ph_ / 0.8, 1)) ** 0.7; inten = 0.5 + 0.9 * math.sin(math.pi * min(ph_ / 0.8, 1))
            fr += pulse_layer(t, s, inten, true_back=True)
        if t >= T["open"]:
            p = ease((t - T["open"]) / (T["ball"] - T["open"]))
            d, cent, top, Q = ball_field(RZ_UP)
            reach = sm(np.cos(p * math.pi * 0.55), np.cos(p * math.pi * 0.55) + 0.15, SYM[..., 2])[..., None]   # light spreads from the front AND back centres
            fr = fr * (1 - p) + reach * (green_fill(cent, Q) * p + neon(d, SW, 1.0, Q=Q, t=t))
            fr += pulse_layer(t, 1.0 + 0.0 * p, 1.2 * (1 - p), true_back=True)
        return fr
    # ---- 2. green ball + SOMOS / PUMA ENERGY ----
    if t < T["path"] + 0.6:
        d, cent, top, Q = ball_field(RZ_UP @ roty(-0.10 * (t - T["ball"]))); fr = green_fill(cent, Q) + neon(d, SW, 1.0, Q=Q, t=t)   # continuous with the ball forming (no jump)
        fr = mg_put(fr, "somos", t - T["somos"])
        lb = place(BAR_NOCAT if t < T["logo"] + 0.6 else LOGO_BAR, 0.62, 0.5, 0.56)
        r, a = text_in(lb, t, T["somos"] + 0.35, T["path"] - 0.2)
        if a: fr = disc_put(fr, r, a)
        if T["logo"] - 0.2 <= t < T["logo"] + 0.6:     # the white logo-cat silhouette runs in and lands in the panel
            fr = cat_run_in(fr, t, T["logo"] - 0.2, 0.8, 0.62, 0.5, 0.56, CAT)
        if t >= T["path"]:                              # the halo becomes a path; the ball goes dark
            p = ease((t - T["path"]) / 0.6); fr = fr * (1 - p) + swoosh(t, 1.0); fr = puma_put(fr, t, ease((t - T["path"] - 1.6) / 0.6))
        return fr
    # ---- 3. globe ----
    if t < T["km"]:
        lo = -20 + (t - T["globe"]) * 9.0; la = 8.0; zoom = 1.0; pyg = 0.0
        if t >= T["zoom"]:
            p = ease((t - T["zoom"]) / (T["py"] - T["zoom"] + 0.6))
            lo = lo * (1 - p) + PY_LL[0] * p; la = la * (1 - p) + PY_LL[1] * p; zoom = 1 + 3.0 * p ** 1.6; pyg = sm(0.6, 1.0, p)
        arcs = ease((t - T["txt_40"]) / 2.2) * (1 - ease((t - T["zoom"]) / 0.8))
        fa = ease((t - T["globe"]) / 0.8)
        fr = globe(t, lo, la, zoom, arcs=arcs, py_glow=pyg) * fa; fr = light_over(fr, swoosh(t, 1.0), 1.3, 0.3); fr = puma_put(fr, t)
        for key, lines, nxt in (("txt_global", [("UNA COMPAÑÍA", "black", 0.12, W_), ("GLOBAL", "black", 0.2, LIME)], "txt_40"),
                                ("txt_40", [("+40", "black", 0.26, LIME), ("PAÍSES", "black", 0.14, W_)], "txt_cal"),
                                ("txt_cal", [("CALIDAD", "black", 0.15, W_), ("INTERNACIONAL", "black", 0.12, LIME)], "zoom"),
                                ("py", [("Y EN", "bold", 0.08, W_), ("PARAGUAY", "black", 0.17, W_)], "km")):
            if T[key] <= t < T[nxt]: fr = mg_put(fr, {"txt_global": "global", "txt_40": "40", "txt_cal": "cal", "py": "py"}[key], t - T[key])
        if t >= T["km"] - 0.8:
            fr = reveal(fr, scene_full(0, t), t, T["km"] - 0.8, 0.8)
        return fr
    # ---- 4. photo scenes: text in the sky, the light path low, black below it ----
    for i in range(len(SCN)):
        t0, t1 = SCN[i][0](), SCN[i][3]()
        if t0 <= t < t1:
            fr = scene_full(i, t)
            if i + 1 < len(SCN) and t >= t1 - 0.8:              # seam reveal into the next scene
                fr = reveal(fr, scene_full(i + 1, t), t, t1 - 0.8, 0.8)
            elif i + 1 == len(SCN) and t >= t1 - 0.6:           # the last scene fades out into the pulses
                fr = fr * (1 - ease((t - t1 + 0.6) / 0.5))
            return fr
    # ---- 5. construimos juntos (video seconds 4-11) + collage ----
    if t < T["pulse2"]:
        if t < T["collage"]:
            v = juntos_frame(t - T["juntos"]); fr = disc_put(np.zeros((EH, EW, 3), np.float32), rgba(ball_look(v)))
        else:
            fr = np.zeros((EH, EW, 3), np.float32) + np.array([6, 20, 10], np.float32)
            cards = [ENTREGA[0], "3_destino/p1_eess.jpg", "1_km/SAN ANTONIO 02.jpg", "2_entrega/p3_aerea01.jpg", "2_entrega/p4_convoy.png", "4_calidad/RFV1561.jpg"]
            L = np.zeros((DN, DN, 4), np.float32)
            pos = [(0.28, 0.58, -8), (0.72, 0.56, 6), (0.3, 0.8, 7), (0.7, 0.8, -5), (0.5, 0.68, 3), (0.5, 0.88, -3)]
            for k, (cp, (cx, cy, rot)) in enumerate(zip(cards, pos)):
                p = ease((t - T["collage"] - 0.25 * k) / 0.5)
                if p <= 0: continue
                im = photo_disc(IN + cp, 0.5, 0.5, 1.0); sz = int(DN * 0.34); im = cv2.resize(im, (sz, int(sz * 0.75)))
                card = np.full((im.shape[0] + 16, im.shape[1] + 16, 4), 255, np.float32); card[8:-8, 8:-8, :3] = im
                M = cv2.getRotationMatrix2D((card.shape[1] / 2, card.shape[0] / 2), rot, 1.0 + 0.4 * (1 - p))
                M[0, 2] += cx * DN - card.shape[1] / 2; M[1, 2] += cy * DN - card.shape[0] / 2 + 60 * (1 - p)
                c = cv2.warpAffine(card, M, (DN, DN)); c[..., 3] *= p; a = c[..., 3:] / 255
                L[..., :3] = L[..., :3] * (1 - a) + c[..., :3] * a; L[..., 3:] = np.maximum(L[..., 3:], c[..., 3:])
            fr = disc_put(fr, L)
        fr = lower_black(fr, t, 1.0 if t < T["collage"] else 1.0 - ease((t - T["collage"]) / 0.5))
        fr = light_over(fr, swoosh(t, 1.0), 1.6, 0.5); fr = puma_put(fr, t, 1.0 - ease((t - T["pulse2"] + 0.9) / 0.4))
        fr = mg_put(fr, "juntos", t - T["juntos"])
        if t >= T["pulse2"] - 0.5: fr *= 1 - ease((t - T["pulse2"] + 0.5) / 0.5)
        return fr
    # ---- 6. pulses again -> the pulses become the ball -> (kick: PLACEHOLDER) -> KV ----
    if t < T["logo2"]:
        k = (t - T["pulse2"]) / 0.8
        if k < 3:
            ph_ = k % 1; s = 0.2 + (0.35 + 0.12 * int(k)) * math.sin(math.pi * min(ph_ / 0.8, 1)) ** 0.7
            fr += pulse_layer(t, s, 0.5 + 0.9 * math.sin(math.pi * min(ph_ / 0.8, 1)))
        else:
            pp = ease((t - T["pulse2"] - 2.4) / (T["kick"] - T["pulse2"] - 2.4))       # the last pulse condenses onto the ball on the spot
            fr += pulse_layer(t, 0.55 * (1 - pp) + 0.07 * pp, 0.9 + 1.6 * pp, down=BALL_DOWN * pp, echo=1 - pp)
            kt = t - T["kick"]
            if kt >= 0 and fish_clip(KICK) is not None:                      # the stadium opens out of the ball: radial reveal with a lime edge
                kf = fish_frame_kick(KICK, kt, KICK_BACK_ROT * ease((kt - 112 / 30) / (27 / 30)))   # back rolls 36 deg during the push-in
                rad = 3.4 * ease(kt / 1.0); m = sm(rad, rad - 0.22, BALL_ANG)[..., None]           # opens all the way round (no wedges at the side joins)
                edge = np.exp(-((BALL_ANG - rad) / 0.035) ** 2) * (kt < 0.8)
                fr = fr * (1 - m) + kf * m + bloom(edge[..., None] * (GREEN + 70), 0.8) * 0.9
            if t >= T["kv_flash"] - 0.3:                                       # the KV ball (code, pentagon facing front) takes over the filmed ball
                fr = kick_to_kv(fr, t)
        return fr
    # ---- 7. logo without the puma; the puma enters ----
    d, cent, top, Q = ball_field(RZ_UP @ roty(-0.10 * (t - T["kv_flash"])))
    q = 1 - ease((t - T["logo2"]) / 0.5)                    # the hand-off glow settles
    dk = 1 - 0.5 * ease((t - T["logro"] + 0.4) / 0.8)    # closing: the ball sinks to deep emerald (KV background) so the type reads
    fr = green_fill(cent, Q) * dk + (bloom(neon(d, SW, 1.0, Q=Q, t=t), 0.8 * q) if q > 0 else neon(d, SW, 0.55 + 0.45 * dk, Q=Q, t=t))
    if t < T["logro"]:
        fr = disc_put(fr, place(BAR_NOCAT, 0.72, 0.5, 0.5), ease((t - T["logo2"]) / 0.4))
        if t >= T["cat_in"]:                            # the white logo-cat silhouette runs in and lands as the logo cat
            fr = cat_run_in(fr, t, T["cat_in"], 0.9, 0.72, 0.5, 0.5, CAT_G)
        return fr
    # ---- 8. closing lines, 2027 grows to fill, KV loop ----
    for key, lines, nxt in (("logro", [("NUESTRO PRÓXIMO", "black", 0.1, W_), ("LOGRO", "black", 0.2, W_)], "hoy"),
                            ("hoy", [("EMPIEZA", "black", 0.1, W_), ("HOY", "black", 0.24, W_)], "listos"),
                            ("listos", [("LISTOS PARA", "black", 0.09, W_), ("JUGAR EN", "black", 0.15, W_), ("GRANDE", "black", 0.17, LIME)], "y2027")):
        if T[key] <= t < T[nxt]:
            fr = mg_put(fr, key, t - T[key])
    if t >= T["kv"]:                                    # the KV lockup builds row by row (client's own artwork, animated)
        fr = mg_put(fr, "kvend", t - T["kv"])
    if t >= T["y2027"]:                                 # 2027: pops in small, grows until it overflows the sphere
        fr = mg_put(fr, "2027", t - T["y2027"])
        wq = ease((t - T["kv"] + 0.55) / 0.45) * (1 - ease((t - T["kv"] - 0.15) / 0.7))   # client: end in full white, the KV comes out of it
        fr = fr * (1 - wq) + 255 * wq
    return fr

def front_view(eq, n=540, back=False):
    """what the audience sees (orthographic) from the front (or back) -> preview."""
    u = (np.arange(n) + 0.5) / n * 2 - 1; X, Y = np.meshgrid(u, -u); r2 = X ** 2 + Y ** 2; Z = np.sqrt(np.clip(1 - r2, 0, 1))
    Xd, Zd = (-X, -Z) if back else (X, Z)
    lo = np.arctan2(Xd, Zd); la = np.arcsin(np.clip(Y, -1, 1))
    mx = ((lo + np.pi) / (2 * np.pi) * eq.shape[1]).astype(np.float32); my = ((0.5 - la / np.pi) * eq.shape[0]).astype(np.float32)
    v = cv2.remap(eq, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP) * (r2 <= 1)[..., None]
    return v

if __name__ == "__main__":
    import os; os.makedirs(OUT + "frames", exist_ok=True)
    if STILLS:
        for t in STILLS:
            eq = np.clip(render(t), 0, 255).astype(np.uint8)
            fv = np.hstack([front_view(eq, 400), front_view(eq, 400, back=True)])
            e2 = cv2.resize(eq, (800, int(800 * EH / EW)))
            img = np.vstack([fv, e2]); cv2.putText(img, f"{t:.1f}s", (8, 28), 0, 0.9, (255, 255, 0), 2)
            cv2.imwrite(OUT + f"frames/esf_{t:05.1f}.jpg", cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
        sys.exit(0)
    N = int(TL["end"] * FPS)
    tag = "" if SC == 1 else f"_preview{EW}"
    pe = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{EW}x{EH}", "-r", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", OUT + f"Esfera_apertura_equirect{tag}.mp4"], stdin=subprocess.PIPE)
    VW = 1080
    pv = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{VW}x{VW // 2}", "-r", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", OUT + "Esfera_apertura_vista_frente_dorso.mp4"], stdin=subprocess.PIPE)
    for i in range(N):
        eq = np.clip(render(i / FPS), 0, 255).astype(np.uint8); pe.stdin.write(eq.tobytes())
        pv.stdin.write(np.hstack([front_view(eq, VW // 2), front_view(eq, VW // 2, back=True)]).astype(np.uint8).tobytes())
        if i % 150 == 0: print("frame", i, "/", N, flush=True)
    for p in (pe, pv): p.stdin.close(); p.wait()
    print("done")
