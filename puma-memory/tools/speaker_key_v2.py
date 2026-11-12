"""Speaker cut-out v2 (light studio backgrounds): full-resolution matte.
1) human-seg on the frame, then again on a square crop around the person (the model sees him large, not as a speck in 21:9)
2) the clean studio background is estimated around him; a difference matte gives the precise edge (hair, shoulders, hands)
3) the seg mask only fills the inside (white shirt on a white wall) and limits the region.  Warped from the 4K frame.
Usage: speaker_key_v2.py clip.mp4 out_dir"""
import cv2, numpy as np, os, json, sys
from PIL import Image
from rembg import remove, new_session
SRC, OUT = sys.argv[1], sys.argv[2]
cap = cv2.VideoCapture(SRC); n = int(cap.get(7)); W, H = int(cap.get(3)), int(cap.get(4))
ses = new_session("u2net_human_seg"); geo = json.load(open(OUT + "/geometry.json"))
for k in geo: os.makedirs(f"{OUT}/{k}", exist_ok=True)
seg = lambda rgb: np.asarray(remove(Image.fromarray(rgb), session=ses, only_mask=True)).astype(np.float32) / 255
prev = None
for i in range(n):
    ok, fr = cap.read(); rgb = cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)
    c0 = cv2.resize(seg(cv2.resize(rgb, (1280, 549))), (W, H)); ys, xs = np.where(c0 > 0.4)
    if len(xs) == 0: ys, xs = np.array([0, H - 1]), np.array([W // 2 - 200, W // 2 + 200])
    cx, cy = (xs.min() + xs.max()) // 2, (ys.min() + ys.max()) // 2; half = int(max(xs.max() - xs.min(), ys.max() - ys.min()) * 0.58) + 40
    x0, x1, y0, y1 = max(0, cx - half), min(W, cx + half), max(0, cy - half), min(H, cy + half)
    m = np.zeros((H, W), np.float32); m[y0:y1, x0:x1] = cv2.resize(seg(rgb[y0:y1, x0:x1]), (x1 - x0, y1 - y0))
    hard = (m > 0.5).astype(np.uint8)
    far = cv2.dilate(hard, np.ones((121, 121), np.uint8)) == 0                                   # safely background
    small = cv2.resize(rgb, (W // 8, H // 8), interpolation=cv2.INTER_AREA).astype(np.float32); fm = cv2.resize(far.astype(np.float32), (W // 8, H // 8))
    bg = cv2.GaussianBlur(small * fm[..., None], (0, 0), 14) / (cv2.GaussianBlur(fm, (0, 0), 14)[..., None] + 1e-4)
    bg = cv2.resize(bg, (W, H), interpolation=cv2.INTER_LINEAR)
    d = np.abs(rgb.astype(np.float32) - bg).max(-1); d = cv2.GaussianBlur(d, (0, 0), 1.0)
    ad = np.clip((d - 6) / 16, 0, 1); ad = ad * ad * (3 - 2 * ad)
    core = cv2.erode(hard, np.ones((15, 15), np.uint8)).astype(np.float32); region = cv2.GaussianBlur(cv2.dilate(hard, np.ones((25, 25), np.uint8)).astype(np.float32), (0, 0), 4)
    a = np.maximum(ad, cv2.GaussianBlur(core, (0, 0), 3)) * region
    a = cv2.GaussianBlur(cv2.erode(a, np.ones((3, 3), np.uint8)), (0, 0), 0.8)
    if prev is not None: a = 0.75 * a + 0.25 * prev                                               # light temporal steadying
    prev = a
    for k, g in geo.items():
        M = np.float32(g["M"]); M[:, :2] *= 0.5; ww, wh = g["size"]                               # geometry was defined on the half-res frame
        o = cv2.warpAffine(rgb, M, (ww, wh), flags=cv2.INTER_AREA, borderMode=cv2.BORDER_REPLICATE)
        al = cv2.warpAffine(a, M, (ww, wh), flags=cv2.INTER_AREA, borderValue=0)
        cv2.imwrite(f"{OUT}/{k}/{i:03d}.png", cv2.cvtColor(np.dstack([o, (np.clip(al, 0, 1) * 255).astype(np.uint8)]), cv2.COLOR_RGBA2BGRA))
    if i % 30 == 0: print("keyed", i, flush=True)
print("done", n)
