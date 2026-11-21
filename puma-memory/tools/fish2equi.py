"""Circular 180-degree fisheye still -> 2688x1296 equirect (front + back = same image rotated, not mirrored).
Usage: fish2equi.py fisheye.png out.png [trim=0.985]"""
import sys, numpy as np, cv2
src, out = sys.argv[1], sys.argv[2]; TRIM = float(sys.argv[3]) if len(sys.argv) > 3 else 0.985
EW, EH = 2688, 1296
lon = (np.arange(EW) + 0.5) / EW * 2 * np.pi - np.pi; lat = np.pi / 2 - (np.arange(EH) + 0.5) / EH * np.pi
LON, LAT = np.meshgrid(lon, lat)
n = np.stack([np.cos(LAT) * np.sin(LON), np.sin(LAT), np.cos(LAT) * np.cos(LON)], -1)
front = n[..., 2] >= 0
m = np.where(front[..., None], n, np.stack([-n[..., 0], n[..., 1], -n[..., 2]], -1))
th = np.arccos(np.clip(m[..., 2], -1, 1)); r = th / np.pi * TRIM; ph = np.arctan2(m[..., 1], m[..., 0])
img = cv2.imread(src); fh, fw = img.shape[:2]
MX = ((0.5 + r * np.cos(ph)) * fw).astype(np.float32); MY = ((0.5 - r * np.sin(ph)) * fh).astype(np.float32)
cv2.imwrite(out, cv2.remap(img, MX, MY, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)); print("ok", out)
