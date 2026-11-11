"""Screen-fit canvases for the speaker refs from the Brick deck (same method as tools/expand_refs.py for Andrés):
a window of the ref (y0..y1 = rows that must reach the 5.39:1 strip, cx = horizontal centre) becomes the screen band;
the ref is pasted on a grey 21:9 canvas around it and GPT Image 2.6 extends the grey. Usage: expand_speakers.py [names...]"""
import cv2, numpy as np, os, sys, json
from PIL import Image, ImageDraw, ImageFont
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
M = R + "feedback_in/speakers_deck/media/"; O = R + "frames_screen/speakers/"; os.makedirs(O, exist_ok=True)
A = 1920 / 356; CW = 2520; GREY = (127, 127, 127)
REFS = {  # name: (ref file, y0, y1, cx)  — fractions of the ref
 "CEP1_cancha":     ("s05_image11.jpg", 0.41, 0.83, 0.50),
 "CEP2_tunel":      ("s05_image22.jpg", 0.12, 0.62, 0.50),
 "CEP3_penal":      ("s05_image15.jpg", 0.16, 0.90, 0.50),
 "CEP4_tecnico":    ("s05_image12.jpg", 0.15, 0.65, 0.50),
 "CEP5_festejo":    ("s05_image10.jpg", 0.33, 0.85, 0.50),
 "CAR1_vestuario":  ("s11_image30.jpg", 0.15, 0.62, 0.45),
 "CAR2_jugada":     ("s11_image27.jpg", 0.25, 0.75, 0.50),
 "CAR3_ataque":     ("s11_image28.jpg", 0.27, 0.90, 0.50),
 "CAR4_pase":       ("s11_image35.jpg", 0.30, 0.92, 0.56),
 "CAR5_gol":        ("s11_image31.jpg", 0.22, 0.72, 0.47),
}
dm = cv2.resize(cv2.imread(R + "puma-kb/sources/S09-piloto-aprobado/diecut_mask_pilot.png", 0), (1920, 356), interpolation=cv2.INTER_NEAREST) > 127
dm[:4] = dm[4]; dm[-4:] = dm[-5]
f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 17)
meta = json.load(open(O + "placement.json")) if os.path.exists(O + "placement.json") else {}
names = sys.argv[1:] or list(REFS)
sheets = {}
for name in names:
    fn, y0, y1, cx = REFS[name]
    base = Image.open(M + fn).convert("RGB"); bw, bh = base.size
    hn = (y1 - y0) * bh; wn = hn * A; px, py = cx * bw, (y0 + y1) / 2 * bh
    hc = wn * 9 / 21; k = CW / wn; X = wn / 2 - px; Y = hc / 2 - py; CH = int(round(hc * k))
    canvas = Image.new("RGB", (CW, CH), GREY); b = base.resize((int(round(bw * k)), int(round(bh * k))), Image.LANCZOS)
    canvas.paste(b, (int(round(X * k)), int(round(Y * k)))); canvas.save(O + f"{name}__IMAGE1_canvas.png")
    base.save(O + f"{name}__IMAGE2_ref.jpg", quality=95)
    band = [0, (hc - hn) / 2 * k, CW, hn * k]
    meta[name] = dict(base=M + fn, canvas=[CW, CH], base_in_canvas=[X * k, Y * k, bw * k, bh * k], band=band)
    st = np.array(canvas.crop((0, int(round(band[1])), CW, int(round(band[1] + band[3])))).resize((1920, 356), Image.LANCZOS)).astype(np.float32)
    st[dm] *= 0.12
    r = Image.new("RGB", (1920, 356 + 30), (12, 12, 12)); d = ImageDraw.Draw(r)
    d.text((8, 6), f"{name}  ·  ref {fn}  ·  rows {y0:.2f}-{y1:.2f} of the ref on screen  ·  ref covers {bw * k / CW:.0%} of the width (grey = extended)", font=f, fill=(127, 255, 0))
    r.paste(Image.fromarray(st.astype(np.uint8)), (0, 30)); sheets.setdefault(name[:3], []).append(r)
json.dump(meta, open(O + "placement.json", "w"), indent=1)
for spk, rows in sheets.items():
    S = Image.new("RGB", (1920, sum(r.height + 10 for r in rows)), (0, 0, 0)); y = 0
    for r in rows: S.paste(r, (0, y)); y += r.height + 10
    S.save(R + f"qc/screen_{spk}.jpg", quality=85)
print("ok", names)
