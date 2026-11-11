"""Edge-expansion refs built from the EXACT v8 frames. The v8 screen window is kept (same centre); it is only made a bit
taller so subjects fit whole, and the extra width this needs becomes grey margin for GPT Image 2.6 to extend."""
import cv2, numpy as np, os, json, shutil
from PIL import Image, ImageDraw, ImageFont
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
O = R + "frames_screen/expand_v8/"; shutil.rmtree(O, ignore_errors=True); os.makedirs(O)
A = 1920 / 356; CANV_W = 2520; GREY = (127, 127, 127)
C = json.load(open(R + "tools/cfg_v5_andres.json")); SLD = {s["id"]: s for s in C["slides"]}
SL = {  # base = image used in v8; px,py = window centre (base px); hn = new window height (base px)
 "S1_botines":       dict(sid="S1", base=C["images"]["boots"],  px=930,  py=630, hn=540),
 "S2_concentracion": dict(sid="S2", base=C["images"]["conc"],   px=1536, py=400, hn=680),
 "S3_huddle":        dict(sid="S3", base=C["images"]["huddle"], px=1552, py=640, hn=700),
 "S4_companerismo":  dict(sid="S4", base=C["images"]["comp"],   px=1552, py=600, hn=740),
}
dm = cv2.resize(cv2.imread(R + "puma-kb/sources/S09-piloto-aprobado/diecut_mask_pilot.png", 0), (1920, 356), interpolation=cv2.INTER_NEAREST) > 127
dm[:4] = dm[4]; dm[-4:] = dm[-5]
def v8_window(sl, img):          # same maths as storyboard view() at the slide's mid point
    ih, iw = img.shape[:2]; s = sum(sl["s"]) / 2; cx = sum(c[0] for c in sl["c"]) / 2; cy = sum(c[1] for c in sl["c"]) / 2
    vw, vh = (ih * A, ih) if iw / ih > A else (iw, iw / A); vw /= s; vh /= s
    px = min(max(cx * iw, vw / 2), iw - vw / 2); py = min(max(cy * ih, vh / 2), ih - vh / 2); return px, py, vw, vh
def strip_from(img_rgb, x0, y0, w, h):   # render a window of an (unbounded, grey-padded) image to 1920x356
    M = np.float32([[w / 1920, 0, x0], [0, h / 356, y0]])
    return cv2.warpAffine(img_rgb, M, (1920, 356), flags=cv2.INTER_AREA | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_CONSTANT, borderValue=GREY)
def dress(st):
    st = st.astype(np.float32); st[dm] *= 0.12; return Image.fromarray(st.astype(np.uint8))
meta = {}; rows = []
f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 17)
for name, p in SL.items():
    base = cv2.cvtColor(cv2.imread(p["base"]), cv2.COLOR_BGR2RGB); bh, bw = base.shape[:2]
    wn = p["hn"] * A; hc = wn * 9 / 21; X = wn / 2 - p["px"]; Y = hc / 2 - p["py"]; k = CANV_W / wn
    cw, ch = CANV_W, int(round(hc * k))
    canvas = Image.new("RGB", (cw, ch), GREY); b = Image.fromarray(base).resize((int(round(bw * k)), int(round(bh * k))), Image.LANCZOS)
    canvas.paste(b, (int(round(X * k)), int(round(Y * k)))); canvas.save(O + f"{name}__IMAGE1_canvas.png")
    Image.fromarray(base).save(O + f"{name}__IMAGE2_frame_v8.jpg", quality=95)
    meta[name] = dict(base=p["base"], canvas=[cw, ch], base_in_canvas=[X * k, Y * k, bw * k, bh * k], band=[0, (hc - p["hn"]) / 2 * k, cw, p["hn"] * k])
    # before / after on the screen
    px8, py8, vw8, vh8 = v8_window(SLD[p["sid"]], base)
    before = dress(strip_from(base, px8 - vw8 / 2, py8 - vh8 / 2, vw8, vh8))
    after = dress(strip_from(base, p["px"] - wn / 2, p["py"] - p["hn"] / 2, wn, p["hn"]))
    r = Image.new("RGB", (1920, 356 * 2 + 70), (12, 12, 12)); d = ImageDraw.Draw(r)
    d.text((8, 6), f"{name}  ·  v8 now", font=f, fill=(200, 200, 200)); r.paste(before, (0, 28))
    d.text((8, 356 + 36), "expanded: same frame, same centre; grey = edges GPT Image 2.6 extends", font=f, fill=(127, 255, 0)); r.paste(after, (0, 356 + 62))
    rows.append(r)
json.dump(meta, open(O + "placement.json", "w"), indent=1)
S = Image.new("RGB", (1920, sum(r.height + 12 for r in rows)), (0, 0, 0)); y = 0
for r in rows: S.paste(r, (0, y)); y += r.height + 12
S.save(O + "Antes_despues_pantalla.jpg", quality=88); print(S.size, json.dumps(meta)[:600])
