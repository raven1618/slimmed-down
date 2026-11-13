"""Speaker cut-out from a chroma-green Seedance clip: colour-difference key + spill suppression, placed in both wings
so the final pose sits where the speaker photo sits (head matched, clip bottom = panel bottom). Usage: clip.mp4 out_dir"""
import cv2, numpy as np, os, json, sys
SRC, OUT = sys.argv[1], sys.argv[2]; R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
cap = cv2.VideoCapture(SRC); n = int(cap.get(7)); frames = []
for i in range(n):
    ok, fr = cap.read(); frames.append(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB))
def key(rgb):
    f = rgb.astype(np.float32); r, g, b = f[..., 0], f[..., 1], f[..., 2]
    d = g - np.maximum(r, b)                                     # how much greener than the other channels
    a = 1 - np.clip((d - 18) / 50, 0, 1)                         # green screen -> 0, subject -> 1
    a = cv2.GaussianBlur(cv2.erode(a, np.ones((3, 3), np.uint8)), (0, 0), 0.9)
    lim = np.maximum(r, b); g2 = np.minimum(g, lim + 6)          # despill: green never above max(r, b)
    out = np.stack([r, g2, b], -1); return np.clip(out, 0, 255).astype(np.uint8), np.clip(a, 0, 1)
last_rgb, last_a = key(frames[-1]); H, W = last_a.shape
ys, xs = np.where(last_a > 0.5); top_c = ys.min(); hc = xs[ys < top_c + 0.12 * (ys.max() - top_c)].mean()
geo = {}
for k in ("L", "R"):
    m = cv2.imread(R + f"drive-dl/andres/wing_andres_{k}_mask.png", 0) > 127; yy, xx = np.where(m); top_w = yy.min()
    hw = xx[yy < top_w + 0.12 * (yy.max() - top_w)].mean(); wh, ww = m.shape
    s = (wh - top_w + 6) / (H - top_c); geo[k] = dict(M=[[s, 0, hw - s * hc], [0, s, top_w - s * top_c]], size=[ww, wh]); os.makedirs(f"{OUT}/{k}", exist_ok=True)
json.dump(geo, open(f"{OUT}/geometry.json", "w"), indent=1, default=float)
for i, fr in enumerate(frames):
    rgb, a = key(fr)
    for k, g in geo.items():
        M = np.float32(g["M"]); ww, wh = g["size"]
        o = cv2.warpAffine(rgb, M, (ww, wh), flags=cv2.INTER_AREA, borderMode=cv2.BORDER_REPLICATE)
        al = cv2.warpAffine(a, M, (ww, wh), flags=cv2.INTER_AREA, borderValue=0)
        cv2.imwrite(f"{OUT}/{k}/{i:03d}.png", cv2.cvtColor(np.dstack([o, (al * 255).astype(np.uint8)]), cv2.COLOR_RGBA2BGRA))
        if i == n - 1:
            cv2.imwrite(R + f"carolina/wing_{k}_mask.png", ((al > 0.5) * 255).astype(np.uint8)); cv2.imwrite(R + f"carolina/wing_{k}.png", cv2.cvtColor(o, cv2.COLOR_RGB2BGR))
print("done", n)
