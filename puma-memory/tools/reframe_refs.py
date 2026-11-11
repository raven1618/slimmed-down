"""Reframe the CLIENT images for the screen: place each original on a 21:9 canvas so that, inside the screen strip,
the key content is whole and clear of the die-cut, with the subject near the v8 light-birth point. Grey = to be extended."""
import cv2, numpy as np, os, json
from PIL import Image, ImageDraw, ImageFont
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
O = R + "frames_screen/reframe/"; os.makedirs(O, exist_ok=True)
SW, SH = 1920, 356                     # screen strip units (storyboard canvas)
CW, CH = 2520, 1080; K = CW / SW; SY = int(round((CH - SH * K) / 2))   # 21:9 canvas, strip centred
GREY = (127, 127, 127)
# subject = light-birth point (original px) -> target in strip units; key = box that must stay whole in the strip
SL = {
 "S1_botines":      dict(src="puma-kb/sources/S09-piloto-aprobado/placeholder_botines_16x9.png", s=0.40,  subj=(780, 600),  tgt=(720, 232)),
 "S2_concentracion": dict(src="drive-dl/concentracion.png",  s=0.393, subj=(330, 280),  tgt=(720, 140)),
 "S3_huddle":       dict(src="drive-dl/huddle.png",          s=0.58,  subj=(830, 515),  tgt=(900, 225)),
 "S4_companerismo": dict(src="drive-dl/companerismo.png",    s=0.237, subj=(1620, 820), tgt=(900, 217)),
}
dm = cv2.resize(cv2.imread(R + "puma-kb/sources/S09-piloto-aprobado/diecut_mask_pilot.png", 0), (SW, SH), interpolation=cv2.INTER_NEAREST) > 127
dm[:4] = dm[4]; dm[-4:] = dm[-5]
fb = R + "drive-dl/GothamCondensed-Black.otf"; fbo = R + "drive-dl/GothamCondensed-Bold.otf"
C = json.load(open(R + "tools/cfg_v5_andres.json")); beats = {b["id"]: b for b in C["beats"]}
COPY = {"S1_botines": ["B1", "B2"], "S2_concentracion": ["B3", "B4"], "S3_huddle": ["B5", "B6"], "S4_companerismo": ["B7", "B8", "B9"]}
meta = {}
for sid, p in SL.items():
    im = Image.open(R + p["src"]).convert("RGB"); W, H = im.size; s = p["s"] * K
    x0 = p["tgt"][0] * K - p["subj"][0] * s; y0 = SY + p["tgt"][1] * K - p["subj"][1] * s
    cv_ = Image.new("RGB", (CW, CH), GREY); ph = im.resize((int(round(W * s)), int(round(H * s))), Image.LANCZOS)
    cv_.paste(ph, (int(round(x0)), int(round(y0)))); cv_.save(O + f"{sid}_1_lienzo_21x9.png")
    im.save(O + f"{sid}_2_original.png")
    meta[sid] = dict(x0=x0, y0=y0, w=W * s, h=H * s, strip_y=SY, strip_h=SH * K)
    # check: screen strip + die-cut + copy (what the screen will show), and the extension areas
    a = np.asarray(cv_).astype(np.float32); strip = a[SY:SY + int(SH * K)].copy()
    m = cv2.resize(dm.astype(np.uint8), (CW, strip.shape[0]), interpolation=cv2.INTER_NEAREST) > 0
    strip[m] = strip[m] * 0.15
    chk = Image.fromarray(strip.astype(np.uint8)).resize((SW, SH)); d = ImageDraw.Draw(chk, "RGBA")
    for bid in COPY[sid]:
        rows = {}
        for l in beats[bid]["lines"]:
            for r in l["runs"]: rows.setdefault(l["y"], []).append(r)
        for y, runs in rows.items():
            fs = [ImageFont.truetype(fb if r[1] == "black" else fbo, int(r[2])) for r in runs]; ws = [d.textlength(r[0], font=f) for r, f in zip(runs, fs)]
            x = 960 - (sum(ws) + 8 * (len(runs) - 1)) / 2
            for r, f, w in zip(runs, fs, ws):
                d.text((x, y), r[0], font=f, fill=((127, 255, 0, 150) if r[3] == "lime" else (255, 255, 255, 150)), anchor="ls"); x += w + 8
    tx, ty = p["tgt"]; d.ellipse([tx - 9, ty - 9, tx + 9, ty + 9], outline=(127, 255, 0, 255), width=3)
    chk.save(O + f"_check_{sid}.png")
json.dump(meta, open(O + "placement.json", "w"), indent=1)
# sheet: canvas (with strip outline) + screen check
rows = []
for sid in SL:
    c = Image.open(O + f"{sid}_1_lienzo_21x9.png").resize((1260, 540)); d = ImageDraw.Draw(c)
    d.rectangle([0, SY / 2, 1259, (SY + SH * K) / 2], outline=(127, 255, 0), width=3)
    k = Image.open(O + f"_check_{sid}.png").resize((1260, 234))
    r = Image.new("RGB", (1260, 540 + 234 + 30), (12, 12, 12)); r.paste(c, (0, 0)); r.paste(k, (0, 548)); rows.append(r)
S = Image.new("RGB", (1260 * 2 + 20, (rows[0].height + 10) * 2), (12, 12, 12))
for i, r in enumerate(rows): S.paste(r, ((i % 2) * 1280, (i // 2) * (r.height + 10)))
S.save(R + "qc/reframe_sheet.jpg", quality=85); print(S.size, meta)
