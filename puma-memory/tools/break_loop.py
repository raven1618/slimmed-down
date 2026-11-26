"""Break loop for the long LED screen (client, Nov 25): KV + 'BREAK', animated KV halos on the sides, seamless loop.
One idea: light pulses flow outward along the KV ball seams on both sides; the centre (KV lockup + BREAK) stays still."""
import sys, numpy as np, cv2, math, subprocess
from PIL import Image, ImageDraw, ImageFont
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
W, H, FPS, DUR = 3840, 708, 30, 10.0
N = int(FPS * DUR)
rd = lambda p: cv2.cvtColor(cv2.imread(R + p), cv2.COLOR_BGR2RGB).astype(np.float32)
bg, bgb = rd("kv/kv_bg.png"), rd("kv/kv_bg_beams.png")
beam = np.clip(bgb - bg, 0, 255)                      # the KV's own halo light, in its own colours
def cover(img, w, h, y_c=0.5):
    s = w / img.shape[1]; im = cv2.resize(img, (w, int(img.shape[0] * s)), interpolation=cv2.INTER_CUBIC)
    y0 = int((im.shape[0] - h) * y_c); return im[y0:y0 + h]
BG = cover(bg, W, H)
# halos: KV beam layer at wing scale (pentagon ~ strip height), left = beam as is, right = mirrored
s = H * 1.25 / 1080
bw = cv2.resize(beam, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
Lb = bw[int(bw.shape[0] * 0.10):int(bw.shape[0] * 0.10) + H, :]
HB = np.zeros((H, W, 3), np.float32)
wseg = min(Lb.shape[1], int(W * 0.40))
HB[:, :wseg] = Lb[:, :wseg]                                     # left wing: the KV beam image as is
HB[:, W - wseg:] = HB[:, :wseg][:, ::-1]                       # right wing mirrored
xs = np.arange(W, dtype=np.float32)
side_mask = np.clip((np.abs(xs - W / 2) - W * 0.245) / (W * 0.07), 0, 1)[None, :, None]   # halos only in the side areas, clear of the text
HB *= side_mask
# distance from the centre along x (pulses travel outward)
dist = np.abs(xs - W / 2)[None, :, None] / W
# centre: KV lockup (client vector) + rule + BREAK
lk = Image.open(R + "kv/kv_logo_rgba.png").convert("RGBA")
lh = int(H * 0.66); lk = lk.resize((int(lk.width * lh / lk.height), lh), Image.LANCZOS)
F = ImageFont.truetype(R + "drive-dl/GothamCondensed-Black.otf", int(H * 0.62))
d0 = ImageDraw.Draw(Image.new("L", (10, 10)))
bb = d0.textbbox((0, 0), "BREAK", font=F); tw, th = bb[2] - bb[0], bb[3] - bb[1]
gap = int(H * 0.11); rule_w = 6
gw = lk.width + gap * 2 + rule_w + tw; x0 = (W - gw) // 2
T = Image.new("RGBA", (W, H), (0, 0, 0, 0))
T.alpha_composite(lk, (x0, (H - lh) // 2))
dr = ImageDraw.Draw(T); rx = x0 + lk.width + gap
dr.rectangle([rx, int(H * 0.2), rx + rule_w, int(H * 0.8)], fill=(127, 255, 0, 255))
ty = (H - th) // 2 - bb[1]; tx = rx + rule_w + gap - bb[0]
sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh).text((tx + 8, ty + 12), "BREAK", font=F, fill=(0, 0, 0, 170))
sh = np.array(sh).astype(np.float32); sh[..., 3] = cv2.GaussianBlur(sh[..., 3], (0, 0), 10)
dr.text((tx, ty), "BREAK", font=F, fill=(255, 255, 255, 255))
TX = np.array(T).astype(np.float32); TA = TX[..., 3:] / 255
# soft dark ellipse behind the type (contrast), as in the teasers
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
ell = np.clip(1 - (((xx - W / 2) / (gw * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2), 0, 1)[..., None] ** 1.3 * 0.38
def frame(i):
    t = i / N                                            # 0..1, periodic
    wave = 0.5 + 0.5 * np.cos(2 * math.pi * (dist * 6.0 - t * 3))          # 3 pulses per loop, travelling outward
    breathe = 0.82 + 0.18 * math.cos(2 * math.pi * t)                        # whole halo breathes once per loop
    f = BG * (1 - ell)
    f = f + HB * (1.1 + 1.6 * wave ** 3) * breathe
    f = f * (1 - sh[..., 3:] / 255 * 0.6)
    f = f * (1 - TA) + TX[..., :3] * TA
    return np.clip(f, 0, 255).astype(np.uint8)
if __name__ == "__main__":
    out = sys.argv[1]
    if out.endswith(".png"):
        cv2.imwrite(out, cv2.cvtColor(frame(int(sys.argv[2]) if len(sys.argv) > 2 else 0), cv2.COLOR_RGB2BGR)); sys.exit()
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "prores_ks", "-profile:v", "3", "-pix_fmt", "yuv422p10le", out], stdin=subprocess.PIPE)
    for i in range(N): p.stdin.write(frame(i).tobytes())
    p.stdin.close(); p.wait(); print("done", N)
