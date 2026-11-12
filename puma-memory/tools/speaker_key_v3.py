"""Speaker cut-out v3: BiRefNet matte on a square crop around the person, per frame, warped from the 4K frame.
Usage: speaker_key_v3.py clip.mp4 out_dir   (out_dir/geometry.json must exist)"""
import cv2, numpy as np, os, json, sys
from PIL import Image
from rembg import remove, new_session
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from matte_birefnet import _run
SRC, OUT = sys.argv[1], sys.argv[2]
cap = cv2.VideoCapture(SRC); n = int(cap.get(7)); W, H = int(cap.get(3)), int(cap.get(4))
ses = new_session("u2net_human_seg"); geo = json.load(open(OUT + "/geometry.json")); prev = None
for k in geo: os.makedirs(f"{OUT}/{k}", exist_ok=True)
for i in range(n):
    ok, fr = cap.read(); rgb = cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)
    c0 = cv2.resize(np.asarray(remove(Image.fromarray(cv2.resize(rgb, (1280, 549))), session=ses, only_mask=True)).astype(np.float32) / 255, (W, H)); ys, xs = np.where(c0 > 0.4)
    cx, cy = (xs.min() + xs.max()) // 2, (ys.min() + ys.max()) // 2; half = int(max(xs.max() - xs.min(), ys.max() - ys.min()) * 0.56) + 40
    x0, x1, y0, y1 = max(0, cx - half), min(W, cx + half), max(0, cy - half), min(H, cy + half)
    a = np.zeros((H, W), np.float32); a[y0:y1, x0:x1] = cv2.resize(_run(np.ascontiguousarray(rgb[y0:y1, x0:x1])), (x1 - x0, y1 - y0), interpolation=cv2.INTER_LINEAR)
    if prev is not None: a = 0.8 * a + 0.2 * prev
    prev = a
    for k, g in geo.items():
        M = np.float32(g["M"]); M[:, :2] *= 0.5; ww, wh = g["size"]
        o = cv2.warpAffine(rgb, M, (ww, wh), flags=cv2.INTER_AREA, borderMode=cv2.BORDER_REPLICATE); al = cv2.warpAffine(a, M, (ww, wh), flags=cv2.INTER_AREA, borderValue=0)
        cv2.imwrite(f"{OUT}/{k}/{i:03d}.png", cv2.cvtColor(np.dstack([o, (np.clip(al, 0, 1) * 255).astype(np.uint8)]), cv2.COLOR_RGBA2BGRA))
    if i % 10 == 0: print("keyed", i, flush=True)
print("done", n)
