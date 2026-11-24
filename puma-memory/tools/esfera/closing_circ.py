"""client neon closing -> circular type-A frame: exact client animation, sides trimmed, top/bottom caps extended with backdrop + halftone."""
import cv2, numpy as np, sys
src, out, D = sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 1024
CLEAN = len(sys.argv) > 4
cap = cv2.VideoCapture(src); F = []
while True:
    ok, f = cap.read()
    if not ok: break
    F.append(cv2.resize(f, (1920, 1080), interpolation=cv2.INTER_AREA) if CLEAN else f[12:471])
H0, W0 = F[0].shape[:2]
ch = int(D * 0.80); cw = int(W0 * ch / H0); xoff = (cw - D) // 2; yoff = (D - ch) // 2
yy, xx = np.mgrid[0:D, 0:D].astype(np.float32); r = np.hypot(xx - D / 2 + 0.5, yy - D / 2 + 0.5) / (D / 2)
circ = np.clip((1 - r) * D / 3, 0, 1)[..., None]
# halftone dots (screen pattern, rotated grid), stronger toward the caps like the client backdrop
p = 11.0; u = (xx * 0.866 + yy * 0.5) / p; v = (-xx * 0.5 + yy * 0.866) / p
dd = np.hypot(u - np.round(u), v - np.round(v))
dots = np.clip((0.28 - dd) * 12, 0, 1)
fade = np.ones((D, 1), np.float32); band = 70
for y in range(D):
    if y < yoff + band: fade[y] = np.clip((y - yoff) / band, 0, 1)
    elif y > yoff + ch - band: fade[y] = np.clip((yoff + ch - y) / band, 0, 1)
fade = fade[None, :, :].transpose(1, 0, 2) if False else fade[:, None, :]
vw = cv2.VideoWriter(out, cv2.VideoWriter_fourcc(*"mp4v"), 30, (D, D))
for f in F:
    s = cv2.resize(f, (cw, ch), interpolation=cv2.INTER_AREA)[:, xoff:xoff + D].astype(np.float32)
    top = np.median(s[:6].reshape(-1, 3), 0); bot = np.median(s[-6:].reshape(-1, 3), 0)
    g = np.zeros((D, D, 3), np.float32)
    t = np.clip((yy - yoff) / ch, 0, 1)[..., None]; g[:] = top * (1 - t) + bot * t
    cap_w = 1 - fade                                                   # 1 in the caps
    g = g * (1 - 0.35 * np.clip(np.abs(yy - D / 2) / (D / 2), 0, 1)[..., None])   # darken toward the poles like the client vignette
    g = g + dots[..., None] * cap_w * (top * 0.25 + 8)
    full = g.copy(); full[yoff:yoff + ch] = s
    o = full * fade + g * (1 - fade)
    vw.write(np.clip(o * circ, 0, 255).astype(np.uint8))
vw.release(); print("frames", len(F))
