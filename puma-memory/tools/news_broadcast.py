"""Formento: broadcast package for the centre panel (master 3840x708). Generic news look, no outlet/channel brand.
overlay(t, spec) -> RGBA layer: section tab + ticker bar (LIVE block, clock, crawling headlines)."""
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
W, H = 3840, 708; GREEN = (120, 230, 40); RED = (220, 30, 40)
F = {k: R + f"drive-dl/GothamCondensed-{v}.otf" for k, v in [("black", "Black"), ("bold", "Bold"), ("medium", "Medium")]}
_fc = {}
def font(k, s):
    if (k, s) not in _fc: _fc[(k, s)] = ImageFont.truetype(F[k], s)
    return _fc[(k, s)]
M = cv2.resize(cv2.imread(R + "puma-kb/sources/S09-piloto-aprobado/diecut_mask_pilot.png", 0), (W, H), interpolation=cv2.INTER_NEAREST) > 127
# centre region = between the inner edges of the two V's
IN_L = np.array([W // 2 - np.argmax(M[y, :W // 2][::-1]) for y in range(H)])
IN_R = np.array([W // 2 + np.argmax(M[y, W // 2:]) for y in range(H)])
CMASK = (np.arange(W)[None, :] >= IN_L[:, None]) & (np.arange(W)[None, :] < IN_R[:, None])
BAR_Y0, BAR_H, TAB_H = 622, 86, 54
_strip = {}
def crawl_strip(items):
    key = tuple(items)
    if key not in _strip:
        f = font("bold", 46); parts = []; x = 0
        for it in items: parts.append((x, it)); x += f.getlength(it.replace("▲", "")) + 40 * it.count("▲") + 120
        im = Image.new("RGBA", (int(x), BAR_H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        for px, it in parts:
            d.rectangle([px - 72, 36, px - 52, 56], fill=GREEN); x = px
            for k, seg in enumerate(it.split("▲")):
                if k: d.polygon([(x + 4, 52), (x + 26, 52), (x + 15, 32)], fill=GREEN); x += 40
                d.text((x, 18), seg, font=f, fill=(255, 255, 255)); x += f.getlength(seg)
        _strip[key] = im
    return _strip[key]
def overlay(t, sp):
    L = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    y0 = BAR_Y0; xl = int(IN_L[y0:H - 14].max()); xr = int(IN_R[y0:H - 14].min())
    # ticker bar
    d.rectangle([0, y0, W, H], fill=(8, 12, 18, 236)); d.rectangle([0, y0, W, y0 + 4], fill=GREEN)
    # crawl (behind the LIVE block)
    st = crawl_strip(sp["ticker"]); off = int(t * sp.get("speed", 240)) % st.width
    for k in range(-1, 3):
        L.alpha_composite(st, (xl + 380 + k * st.width - off, y0)) if 0 <= xl + 380 + k * st.width - off < W else None
        x = xl + 380 + k * st.width - off
        if x < 0 and x + st.width > 0: L.alpha_composite(st.crop((-x, 0, st.width, BAR_H)), (0, y0))
    # LIVE block + clock (left), on top of the crawl
    d = ImageDraw.Draw(L)
    d.rectangle([0, y0 + 4, xl + 360, H], fill=(8, 12, 18, 255))
    d.rectangle([xl + 20, y0 + 18, xl + 196, y0 + 70], fill=RED)
    a = 0.55 + 0.45 * np.cos(t * 2 * np.pi / 1.2)
    d.ellipse([xl + 32, y0 + 34, xl + 52, y0 + 54], fill=(255, 255, 255, int(255 * a)))
    d.text((xl + 62, y0 + 22), "EN VIVO", font=font("black", 40), fill=(255, 255, 255))
    m = int(sp.get("clock_min", 20 * 60 + 41) + t / 60); s_ = int(sp.get("clock_sec", 12) + t) % 60
    d.text((xl + 214, y0 + 22), f"{m // 60:02d}:{m % 60:02d}", font=font("bold", 42), fill=(255, 255, 255))
    d.rectangle([xl + 352, y0 + 16, xl + 356, y0 + 72], fill=GREEN)
    # section tab above the bar, left
    tx = int(IN_L[y0 - TAB_H:y0].max()) + 24; ty = y0 - TAB_H
    f1, f2 = font("black", 36), font("bold", 36)
    w1 = d.textlength(sp["tab1"], font=f1) + 36; w2 = d.textlength(sp["tab2"], font=f2) + 36
    wipe = min(1.0, max(0.0, (t - sp.get("tab_in", 0.4)) / 0.5))
    tab = Image.new("RGBA", (int(w1 + w2), TAB_H), (0, 0, 0, 0)); td = ImageDraw.Draw(tab)
    td.rectangle([0, 0, w1, TAB_H], fill=GREEN); td.text((18, 8), sp["tab1"], font=f1, fill=(8, 12, 18))
    td.rectangle([w1, 0, w1 + w2, TAB_H], fill=(255, 255, 255, 240)); td.text((w1 + 18, 8), sp["tab2"], font=f2, fill=(8, 12, 18))
    tab = tab.crop((0, 0, max(1, int(tab.width * wipe)), TAB_H)); L.alpha_composite(tab, (tx, ty))
    a = np.array(L); a[..., 3] = np.where(CMASK, a[..., 3], 0)
    return Image.fromarray(a, "RGBA")
