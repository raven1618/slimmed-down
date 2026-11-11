import sys, numpy as np, cv2, json
D, SRC = sys.argv[1], sys.argv[2]; W, H = 1280, 308
raw = np.fromfile(f"{D}/pilot_10fps.rgb", np.uint8); n = raw.size // (W*H*3); v = raw[:n*W*H*3].reshape(n, H, W, 3)
y0, y1 = 30, 268
sift = cv2.SIFT_create(4000)
out = {}
for name, ts, fn in [("concentracion", 16.0, "concentracion.png"), ("huddle", 27.0, "huddle.png"), ("companerismo", 38.0, "companerismo.png")]:
    fr = v[int(ts*10), y0:y1]
    for region, (xa, xb) in {"centre": (700, 1110), "left": (0, 230), "right": (1060, 1280)}.items():
        crop = cv2.resize(fr[:, xa:xb], None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
        g1 = cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY); src = cv2.imread(f"{SRC}/{fn}"); g2 = cv2.cvtColor(src, cv2.COLOR_BGR2GRAY)
        k1, d1 = sift.detectAndCompute(g1, None); k2, d2 = sift.detectAndCompute(g2, None)
        m = cv2.BFMatcher().knnMatch(d1, d2, k=2); good = [a for a, b in m if a.distance < 0.75 * b.distance]
        if len(good) < 8: print(name, region, "few matches", len(good)); continue
        p1 = np.float32([k1[a.queryIdx].pt for a in good]); p2 = np.float32([k2[a.trainIdx].pt for a in good])
        M, inl = cv2.estimateAffinePartial2D(p1, p2, method=cv2.RANSAC, ransacReprojThreshold=6)
        s = float(np.hypot(M[0, 0], M[1, 0])); flip = M[0, 0] < 0
        # map pilot-content corners of this region into source px
        corners = np.float32([[0, 0], [crop.shape[1], 0], [0, crop.shape[0]], [crop.shape[1], crop.shape[0]]])
        mapped = (M[:, :2] @ corners.T).T + M[:, 2]
        print(f"{name:13s} {region:6s} inliers={int(inl.sum()):4d}/{len(good):4d} src_px_per_pilot_px={s*3:.3f} rot={np.degrees(np.arctan2(M[1,0],M[0,0])):.1f} "
              f"src_box=({mapped[:,0].min():.0f},{mapped[:,1].min():.0f})-({mapped[:,0].max():.0f},{mapped[:,1].max():.0f}) of {src.shape[1]}x{src.shape[0]}")
        out[f"{name}_{region}"] = dict(box=[float(mapped[:,0].min()), float(mapped[:,1].min()), float(mapped[:,0].max()), float(mapped[:,1].max())], pilot_x=[xa, xb], inliers=int(inl.sum()))
json.dump(out, open(f"{D}/pilot_framing.json", "w"), indent=1)
