import sys, numpy as np, cv2, subprocess
from PIL import Image, ImageDraw, ImageFont
R = sys.argv[1]; sys.path.insert(0, R + "tools")
import news_broadcast as NB
W, H = 3840, 708
sp = {"tab1": "ÚLTIMO MOMENTO", "tab2": "MERCADO DEL PETRÓLEO",
      "ticker": ["IRÁN ANUNCIÓ EL CIERRE DEL ESTRECHO DE ORMUZ", "PETRÓLEO SUPERA LOS USD 100 POR ATAQUES EN ORMUZ",
                 "BRENT 74,32 ▲   WTI 76,85 ▲   DUBAI 72,40 ▲", "COMBUSTIBLES SUBEN HASTA G. 700 EN EMBLEMAS PRIVADOS",
                 "DIÉSEL SUBE POR SEXTA VEZ Y TEMEN MÁS AUMENTOS", "EL NIÑO DESAFÍA LA PREVISIBILIDAD DE LA HIDROVÍA"]}
bg0 = cv2.resize(cv2.imread(R + "formento/frames/FOR1_ormuz_REF_21x9.png"), (3840, 1646))
yy, xx = np.mgrid[0:H, 0:W]; g = (np.clip(1 - (((xx - 1920) / 900) ** 2 + ((yy - 330) / 400) ** 2), 0, 1) * 0.72)[..., None]
txt = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(txt)
fb = ImageFont.truetype(R + "drive-dl/GothamCondensed-Black.otf", 150); fm = ImageFont.truetype(R + "drive-dl/GothamCondensed-Bold.otf", 80)
for t, f, y, c in [("LOS ÚLTIMOS AÑOS", fb, 90, "white"), ("MARCARON EL RUMBO", fm, 258, "white"), ("DE NUESTRA INDUSTRIA", fb, 352, (120, 230, 40))]:
    w = d.textlength(t, font=f); d.text((1920 - w / 2, y), t, font=f, fill=c)
wing = {k: np.array(Image.open(R + f"formento/cards/wing_F1_{k}.png")).astype(np.float32) / 255 for k in ["L1", "L2", "R1", "R2"]}
m = cv2.resize(cv2.imread(R + "puma-kb/sources/S09-piloto-aprobado/diecut_mask_pilot.png", 0), (W, H)) > 127
p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "1920x354", "-r", "30", "-i", "-",
                      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", R + "formento/mock_F1_broadcast.mp4"], stdin=subprocess.PIPE)
N = 180
for i in range(N):
    t = i / 30; z = 1 + 0.04 * t / 6
    hh = int(708 / z); ww = int(3840 / z); y0 = int(1646 * (408 + 311) / 1440 - hh / 2); x0 = (3840 - ww) // 2
    bg = cv2.cvtColor(cv2.resize(bg0[y0:y0 + hh, x0:x0 + ww], (W, H)), cv2.COLOR_BGR2RGB).astype(np.float32) / 255
    fr = bg * (1 - g)
    # wings: 1 -> 2 at 3.0 s with a diagonal wipe along the V
    pr = np.clip((t - 3.0) / 0.6, 0, 1); pr = pr * pr * (3 - 2 * pr)
    for s in "LR":
        a, b = wing[s + "1"], wing[s + "2"]
        coord = (xx + 0.6 * (yy - 354)) / 900 if s == "L" else ((W - xx) + 0.6 * (yy - 354)) / 900
        rev = np.clip((pr * 1.4 - coord) * 8, 0, 1)[..., None]
        lay = a * (1 - rev) + b * rev
        fr = fr * (1 - lay[..., 3:]) + lay[..., :3] * lay[..., 3:]
    o = np.array(NB.overlay(t, sp)).astype(np.float32) / 255; fr = fr * (1 - o[..., 3:]) + o[..., :3] * o[..., 3:]
    ta = np.array(txt).astype(np.float32) / 255; fr = fr * (1 - ta[..., 3:]) + ta[..., :3] * ta[..., 3:]
    fr[m] = 0
    out = cv2.resize((fr * 255).astype(np.uint8), (1920, 354), interpolation=cv2.INTER_AREA)
    if i == 120: Image.fromarray(out).save(R + "formento/mock_F1_broadcast.jpg", quality=92)
    p.stdin.write(out.tobytes())
p.stdin.close(); p.wait()
