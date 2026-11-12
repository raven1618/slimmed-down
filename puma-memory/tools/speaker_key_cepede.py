"""Cut Andrés out of every frame of his Seedance clip and place him in both side-panel wings so his final pose
sits where the photo sat (head position matched; scaled so the clip's bottom edge reaches the panel's bottom)."""
import cv2, numpy as np, os, json
from PIL import Image
from rembg import remove, new_session
SRC = "cepede/anim4k/cepede_clip.mp4"; OUT = "cepede/anim4k"
cap = cv2.VideoCapture(SRC); n = int(cap.get(7)); W, H = int(cap.get(3)), int(cap.get(4))
ses = new_session("u2net_human_seg"); alphas = []; frames = []
for i in range(n):
    ok, fr = cap.read(); rgb = cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)
    a = np.asarray(remove(Image.fromarray(rgb).resize((1280, 549)), session=ses, only_mask=True)).astype(np.float32) / 255
    alphas.append(a); frames.append(cv2.resize(rgb, (1920, 824), interpolation=cv2.INTER_AREA))   # half-res working copy
    if i % 30 == 0: print("keyed", i, flush=True)
A = np.stack(alphas); A = (A + np.roll(A, 1, 0) + np.roll(A, -1, 0)) / 3; A[0], A[-1] = alphas[0], alphas[-1]   # temporal smoothing
# geometry from the last frame (= the photo pose)
last = cv2.resize(A[-1], (1920, 824)) > 0.5; ys, xs = np.where(last); top_c = ys.min()
hc = xs[ys < top_c + 0.12 * (ys.max() - top_c)].mean()
geo = {}
for k in ("L", "R"):
    m = cv2.imread(f"drive-dl/andres/wing_andres_{k}_mask.png", 0) > 127; yy, xx = np.where(m); top_w = yy.min()
    hw = xx[yy < top_w + 0.12 * (yy.max() - top_w)].mean(); wh, ww = m.shape
    s = (wh - top_w + 6) / (824 - top_c)                                  # clip bottom edge reaches the panel bottom
    geo[k] = dict(M=[[s, 0, hw - s * hc], [0, s, top_w - s * top_c]], size=[ww, wh])
    os.makedirs(f"{OUT}/{k}", exist_ok=True)
json.dump({k: v for k, v in geo.items()}, open(f"{OUT}/geometry.json", "w"), indent=1)
for i in range(n):
    a = cv2.resize(A[i], (1920, 824), interpolation=cv2.INTER_LINEAR)
    a = cv2.erode(a, np.ones((3, 3), np.uint8)); a = cv2.GaussianBlur(a, (0, 0), 0.8)          # tighten the edge, no grey fringe
    for k, g in geo.items():
        M = np.float32(g["M"]); ww, wh = g["size"]
        rgb = cv2.warpAffine(frames[i], M, (ww, wh), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        al = cv2.warpAffine(a, M, (ww, wh), flags=cv2.INTER_LINEAR, borderValue=0)
        cv2.imwrite(f"{OUT}/{k}/{i:03d}.png", cv2.cvtColor(np.dstack([rgb, (al * 255).astype(np.uint8)]), cv2.COLOR_RGBA2BGRA))
print("done", n, geo)
