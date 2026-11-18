"""Real-photo 2.5D move (Roque+Haedo, client: real photos, not AI): cut the player (BiRefNet), fill the hole behind him,
then move the background and the player at different speeds (parallax push) on a 21:9 canvas with a blurred photo fill.
Usage: photo_parallax.py in.png out.mp4 [seconds] [fx] -- fx = horizontal placement of the photo (0..1)."""
import sys, cv2, numpy as np, subprocess
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
sys.path.insert(0, R + "tools"); from matte_birefnet import matte
src, out = sys.argv[1], sys.argv[2]; dur = float(sys.argv[3]) if len(sys.argv) > 3 else 5.0; fx = float(sys.argv[4]) if len(sys.argv) > 4 else 0.5
img = cv2.imread(src)[:, :, ::-1].copy(); h, w = img.shape[:2]
a = matte(img).astype(np.float32); a = cv2.GaussianBlur(a, (0, 0), 1.0)
hole = cv2.dilate((a > 0.15).astype(np.uint8), np.ones((25, 25), np.uint8)) * 255
bg = cv2.inpaint(img, hole, 12, cv2.INPAINT_TELEA); bg = cv2.GaussianBlur(bg, (0, 0), 1.5)
import os; W, H = int(os.environ.get("PW", 3840)), int(os.environ.get("PH", 1648))
def canvas(layer, scale, dx, dy, alpha=None):
    s = H / h * scale; lw, lh = int(w * s), int(h * s); L = cv2.resize(layer, (lw, lh), interpolation=cv2.INTER_LANCZOS4)
    x0 = int((W - lw) * fx + dx); y0 = int((H - lh) / 2 + dy)
    out = np.zeros((H, W, 3), np.float32); m = np.zeros((H, W), np.float32)
    xa, ya, xb, yb = max(0, x0), max(0, y0), min(W, x0 + lw), min(H, y0 + lh)
    out[ya:yb, xa:xb] = L[ya - y0:yb - y0, xa - x0:xb - x0]
    am = np.ones((lh, lw), np.float32) if alpha is None else cv2.resize(alpha, (lw, lh))
    m[ya:yb, xa:xb] = am[ya - y0:yb - y0, xa - x0:xb - x0]
    return out, m
fill = cv2.resize(cv2.GaussianBlur(img, (0, 0), 25), (W, H)).astype(np.float32) * 0.45   # blurred, darkened photo fill for 21:9
p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
                      "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
N = int(dur * 30)
for i in range(N):
    t = i / (N - 1); e = t * t * (3 - 2 * t)
    b, bm = canvas(bg, 1.06 + 0.04 * e, -60 * e, 0)            # background: slow push + drift
    f, fm = canvas(img, 1.06 + 0.12 * e, 40 * e, -10 * e, a)   # player: faster push, opposite drift -> depth
    edge = np.clip(bm * 1.0, 0, 1)[..., None]; fr = fill * (1 - edge) + b * edge
    fr = fr * (1 - fm[..., None]) + f * fm[..., None]
    p.stdin.write(np.clip(fr, 0, 255).astype(np.uint8).tobytes())
p.stdin.close(); p.wait(); print("ok", out)
