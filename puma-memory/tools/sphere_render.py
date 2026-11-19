"""Puma Energy · Esfera LED 2 m · APERTURA (no-credit build: light, transitions, globe, photos, texts, KV).
Canvas 2688x1296 equirectangular (x = longitude, canvas centre x=1344 faces the audience; rows pole to pole).
Usage: sphere_render.py [scale] [t0,t1,...]   scale 0.5 = preview (1344x648). With times -> stills only.
Outputs (out dir): Esfera_apertura_equirect.mp4 (the file for the LED) + Esfera_apertura_vista.mp4 (front+back view preview).
The puma run and the ball kick are Higgsfield items: placeholders here (marked PLACEHOLDER)."""
import sys, json, math, subprocess, numpy as np, cv2
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
    out[..., :3] = a[..., :3]; out[..., 3:] = np.maximum(a[..., 3:], s_[..., 3:] * 0.85); out[..., :3] *= al / np.maximum(out[..., 3:] / 255.0, 1e-3)
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
PY_LL = (-58.0, -23.4)                                              # Paraguay centre (lon, lat)
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
    """display -> geographic: azimuthal zoom about the front, then inverse look_at."""
    z = np.clip(P[..., 2], -1, 1); th = np.arccos(z); az = np.arctan2(P[..., 1], P[..., 0])
    th2 = th / zoom; D = np.stack([np.sin(th2) * np.cos(az), np.sin(th2) * np.sin(az), np.cos(th2)], -1)
    Gm = look_at(lo_c, la_c); Dg = D.reshape(-1, 3) @ Gm                     # = Gm^T applied
    glo = np.degrees(np.arctan2(Dg[:, 0], Dg[:, 2])); gla = np.degrees(np.arcsin(np.clip(Dg[:, 1], -1, 1)))
    mx = ((glo + 180) / 360 * GW).reshape(EH, EW).astype(np.float32); my = ((90 - gla) / 180 * GH).reshape(EH, EW).astype(np.float32)
    smp = lambda L: cv2.remap(L, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    land, coast, bord, py = smp(G_LAND), smp(G_COAST), smp(G_BORDER), smp(G_PY)
    ocean = np.array([4, 14, 18], np.float32); lc = np.array([10, 60, 30], np.float32)
    lit = 0.55 + 0.45 * np.clip(P[..., 2], 0, 1)
    fr = (ocean * (1 - land[..., None]) + lc * land[..., None]) * lit[..., None]
    fr += coast[..., None] * GREEN * 0.9 + bord[..., None] * GREEN * 0.25
    if py_glow > 0:
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
    return fr * dim

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
def swoosh(t, inten=1.0, tilt=-0.35, y0=-0.32, speed=0.6):
    Rm = rotx(tilt) @ roty(t * speed); Q = P.reshape(-1, 3) @ Rm.T; Q = Q.reshape(EH, EW, 3)
    d = Q[..., 1] - y0 - 0.06 * np.sin(2 * np.arctan2(Q[..., 0], Q[..., 2]) + t)
    return neon(d, 0.012 / SC ** 0.3 * SC ** 0.3, inten, strands=4, Q=Q, t=t)

def wipe(t, t0, dur=0.6):
    """light sweep across the sphere (left->right over the front): returns mask of NEW scene + light band."""
    p = (t - t0) / dur; xpos = -1.25 + 2.5 * ease(p)
    m = sm(-0.06, 0.06, xpos - P[..., 0]); band = np.exp(-((P[..., 0] - xpos) / 0.05) ** 2) * (0 < p < 1)
    return m[..., None], band[..., None] * (GREEN + 60)

# ---------- timeline (seconds; temporary until the VO is recorded) ----------
TL = dict(pulse0=0.4, pulseN=5, pulse_dt=1.05, open=6.0, ball=7.4, somos=8.6, logo=10.0, path=12.2, globe=13.4,
          txt_global=14.2, txt_40=16.8, txt_cal=19.4, zoom=21.6, py=23.0, km=25.6, entrega=28.4, destino=33.8,
          calidad=36.6, juntos=39.4, collage=46.4, pulse2=49.2, ballspin=52.6, kv_flash=54.4, logo2=55.0, cat_in=56.0,
          logro=58.2, hoy=60.0, listos=61.6, y2027=63.8, kv=67.4, end=72.0)
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

def pulse_layer(t, s, inten):
    """the front pentagon halo at scale s (1 = true panel)."""
    z = np.maximum(P[..., 2], 1e-3); q = P[..., :2] / z[..., None]
    pd = np.max(np.stack([q @ U[i] for i in range(5)], 0), 0) - s * A0
    pd = np.where(P[..., 2] > 0.05, pd, 9)
    return neon(pd, 0.012 + 0.01 * s, inten, strands=3, Q=P, t=t * 3)

def render(t):
    T = TL; fr = np.zeros((EH, EW, 3), np.float32)
    spin = roty(-0.10 * t)
    # ---- 1. pulses (black sphere, pentagon halo opens and closes x5) ----
    if t < T["ball"] + 0.1:
        k = (t - T["pulse0"]) / T["pulse_dt"]
        if 0 <= k < T["pulseN"]:
            ph_ = k % 1; n = int(k); amp = 0.35 + 0.1 * n
            s = 0.18 + amp * math.sin(math.pi * min(ph_ / 0.8, 1)) ** 0.7; inten = 0.5 + 0.9 * math.sin(math.pi * min(ph_ / 0.8, 1))
            fr += pulse_layer(t, s, inten)
        if t >= T["open"]:
            p = ease((t - T["open"]) / (T["ball"] - T["open"]))
            d, cent, top, Q = ball_field(np.eye(3, dtype=np.float32))
            reach = sm(np.cos(p * math.pi * 1.05), np.cos(p * math.pi * 1.05) + 0.15, P[..., 2])[..., None]   # light spreads from the front
            fr = fr * (1 - p) + reach * (green_fill(cent, Q) * p + neon(d, SW, 1.0, Q=Q, t=t))
            fr += pulse_layer(t, 1.0 + 0.0 * p, 1.2 * (1 - p))
        return fr
    # ---- 2. green ball + SOMOS / PUMA ENERGY ----
    if t < T["path"] + 0.6:
        d, cent, top, Q = ball_field(spin); fr = green_fill(cent, Q) + neon(d, SW, 1.0, Q=Q, t=t)
        r, a = text_in(lockup([("SOMOS", "black", 0.16, W_)], y_c=0.40), t, T["somos"], T["path"] - 0.2)
        if a: fr = disc_put(fr, r, a)
        lb = place(BAR_NOCAT if t < T["logo"] + 0.6 else LOGO_BAR, 0.62, 0.5, 0.56)
        r, a = text_in(lb, t, T["somos"] + 0.35, T["path"] - 0.2)
        if a: fr = disc_put(fr, r, a)
        if T["logo"] - 0.2 <= t < T["logo"] + 0.6:     # PLACEHOLDER: the cat slides into the panel (Higgsfield puma run later)
            p = ease((t - T["logo"] + 0.2) / 0.8); cat = place(CAT, 0.62, 0.5 - 0.6 * (1 - p), 0.56)
            fr = disc_put(fr, cat, 1.0)
        if t >= T["path"]:                              # the halo becomes a path; the ball goes dark
            p = ease((t - T["path"]) / 0.6); fr = fr * (1 - p) + swoosh(t, p * 1.3)
        return fr
    # ---- 3. globe ----
    if t < T["km"]:
        lo = -20 + (t - T["globe"]) * 9.0; la = 8.0; zoom = 1.0; pyg = 0.0
        if t >= T["zoom"]:
            p = ease((t - T["zoom"]) / (T["py"] - T["zoom"] + 0.6))
            lo = lo * (1 - p) + PY_LL[0] * p; la = la * (1 - p) + PY_LL[1] * p; zoom = 1 + 5.5 * p ** 1.6; pyg = sm(0.6, 1.0, p)
        arcs = ease((t - T["txt_40"]) / 2.2) * (1 - ease((t - T["zoom"]) / 0.8))
        fa = ease((t - T["globe"]) / 0.8)
        fr = globe(t, lo, la, zoom, arcs=arcs, py_glow=pyg) * fa + swoosh(t, 1.0 - 0.6 * fa)
        for key, lines, nxt in (("txt_global", [("UNA COMPAÑÍA", "black", 0.12, W_), ("GLOBAL", "black", 0.2, LIME)], "txt_40"),
                                ("txt_40", [("+40", "black", 0.26, LIME), ("PAÍSES", "black", 0.14, W_)], "txt_cal"),
                                ("txt_cal", [("CALIDAD", "black", 0.15, W_), ("INTERNACIONAL", "black", 0.12, LIME)], "zoom"),
                                ("py", [("Y EN", "bold", 0.08, W_), ("PARAGUAY", "black", 0.17, W_)], "km")):
            r, a = text_in(lockup(lines, y_c=0.42 if key != "py" else 0.30), t, T[key], T[nxt] - 0.25)
            if a: fr = disc_put(fr, r, a)
        if t >= T["km"] - 0.6:
            m, band = wipe(t, T["km"] - 0.6); fr = fr * (1 - m) + band
        return fr
    # ---- 4. photo scenes: text on top, the light path (puma track) below ----
    scenes = [(T["km"], [("1_km/SAN ANTONIO 03.jpg", 0.62)], [("EN CADA KM", "black", 0.13, W_), ("RECORRIDO", "black", 0.13, W_)], T["entrega"]),
              (T["entrega"], [(p, 0.5) for p in ENTREGA], [("EN CADA", "black", 0.12, W_), ("ENTREGA", "black", 0.15, W_)], T["destino"]),
              (T["destino"], DESTINO, [("EN CADA", "black", 0.12, W_), ("DESTINO", "black", 0.15, W_)], T["calidad"]),
              (T["calidad"], [("4_calidad/RFV1561.jpg", 1.0)], [("CON COMBUSTIBLES", "black", 0.1, W_), ("DE CALIDAD", "black", 0.13, W_)], T["juntos"])]
    for i, (t0, photos, lines, t1) in enumerate(scenes):
        if t0 - 0.6 <= t < t1:
            n = len(photos); seg = (t1 - t0) / n; j = int(min(max((t - t0) / seg, 0), n - 1))
            def pic(jj, tt):
                p_, fx = photos[jj]; dsc = photo_disc(IN + p_, fx=fx, z=1.08 - 0.06 * ((tt - t0 - jj * seg) / max(seg, 1e-3)))
                return disc_put(np.zeros((EH, EW, 3), np.float32) + np.array([6, 20, 10], np.float32), rgba(ball_look(dsc)))
            fr = pic(j, t)
            if j > 0 and t < t0 + j * seg + 0.45:              # light sweep between photos of the same line
                m, band = wipe(t, t0 + j * seg - 0.15, 0.6); fr = pic(j - 1, t) * (1 - m) + fr * m + band
            fr = fr + swoosh(t, 1.0)
            r, a = text_in(lockup(lines, y_c=0.36), t, t0 + 0.1)
            if a: fr = disc_put(fr, r, a)
            if t >= t1 - 0.6:
                m, band = wipe(t, t1 - 0.6); fr = fr * (1 - m) + band
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
        fr = fr + swoosh(t, 1.0)
        r, a = text_in(lockup([("CONSTRUIMOS", "black", 0.13, W_), ("JUNTOS", "black", 0.17, LIME)], y_c=0.30), t, T["juntos"] + 0.4)
        if a: fr = disc_put(fr, r, a)
        if t >= T["pulse2"] - 0.5: fr *= 1 - ease((t - T["pulse2"] + 0.5) / 0.5)
        return fr
    # ---- 6. pulses again -> the pulses become the ball -> (kick: PLACEHOLDER) -> KV ----
    if t < T["logo2"]:
        k = (t - T["pulse2"]) / 0.8
        if k < 3:
            ph_ = k % 1; s = 0.2 + (0.35 + 0.12 * int(k)) * math.sin(math.pi * min(ph_ / 0.8, 1)) ** 0.7
            fr += pulse_layer(t, s, 0.5 + 0.9 * math.sin(math.pi * min(ph_ / 0.8, 1)))
        else:
            p = ease((t - T["pulse2"] - 2.4) / 1.0); acc = max(0.0, t - T["ballspin"])
            d, cent, top, Q = ball_field(roty(-0.10 * t - 1.6 * acc * acc) @ rotx(0.4 * acc * acc))
            reach = sm(np.cos(p * math.pi * 1.05), np.cos(p * math.pi * 1.05) + 0.15, P[..., 2])[..., None]
            fr = reach * (np.zeros_like(fr) + neon(d, SW, 1.2, Q=Q, t=t)) + pulse_layer(t, 1.0, 1.2 * (1 - p))
            if t >= T["kv_flash"] - 0.4:
                q = math.sin(math.pi * min(max((t - T["kv_flash"] + 0.4) / 0.6, 0), 1)); fr = fr * (1 - q) + q * 255
        return fr
    # ---- 7. logo without the puma; the puma enters ----
    d, cent, top, Q = ball_field(spin); fr = green_fill(cent, Q) + neon(d, SW, 1.0, Q=Q, t=t)
    if t < T["logro"]:
        fr = disc_put(fr, place(BAR_NOCAT, 0.72, 0.5, 0.5), ease((t - T["logo2"]) / 0.4))
        if t >= T["cat_in"]:                            # PLACEHOLDER for the running puma (Higgsfield)
            p = ease((t - T["cat_in"]) / 0.9); fr = disc_put(fr, place(CAT_G, 0.72, 0.5 + 0.7 * (1 - p), 0.5), 1.0)
        return fr
    # ---- 8. closing lines, 2027 grows to fill, KV loop ----
    for key, lines, nxt in (("logro", [("NUESTRO PRÓXIMO", "black", 0.1, W_), ("LOGRO", "black", 0.2, W_)], "hoy"),
                            ("hoy", [("EMPIEZA", "black", 0.1, W_), ("HOY", "black", 0.24, W_)], "listos"),
                            ("listos", [("LISTOS PARA", "black", 0.09, W_), ("JUGAR EN", "black", 0.15, W_), ("GRANDE", "black", 0.17, LIME)], "y2027")):
        if T[key] <= t < T[nxt]:
            r, a = text_in(lockup(lines, y_c=0.47), t, T[key], T[nxt] - 0.2)
            if a: fr = disc_put(fr, r, a)
    if T["y2027"] <= t < T["kv"]:
        p = (t - T["y2027"]) / (T["kv"] - T["y2027"]); s = 0.25 + 1.35 * ease(min(p / 0.8, 1)) ** 1.6     # grows to fill the visible face (no wrap)
        L = lockup([("2027", "black", 0.3, W_)], width=0.7, y_c=0.5); M = cv2.getRotationMatrix2D((DN / 2, DN / 2), 0, s)
        r = cv2.warpAffine(L, M, (DN, DN)); fr = disc_put(fr, r, ease(p / 0.1))
        q = math.sin(math.pi * min(max((p - 0.82) / 0.18, 0), 1)) if p < 1 else 0; fr = fr * (1 - q) + 255 * q   # flash into the KV
    if t >= T["kv"]:
        kv = place(LOGO, 0.62, 0.5, 0.5); fr = disc_put(fr, kv, ease((t - T["kv"]) / 0.5))
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
