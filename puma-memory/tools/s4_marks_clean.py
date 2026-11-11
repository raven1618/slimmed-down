"""Track and paint out the two small brand marks in the S4 clip (sock tick, white blip in the '0' of the 10)."""
import cv2, numpy as np, subprocess, json
SRC, DST = "clips_4k/S4_companerismo.mp4", "clips_4k/S4_companerismo_clean.mp4"
cap = cv2.VideoCapture(SRC); n = int(cap.get(7)); fps = cap.get(5); W, H = int(cap.get(3)), int(cap.get(4))
enc = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
                        "-c:v", "libx264", "-preset", "slow", "-crf", "12", "-pix_fmt", "yuv420p", DST], stdin=subprocess.PIPE)
marks = {"sock": np.array([1630.0, 985.0]), "num": np.array([1448.0, 580.0])}
prev = None; pts = {}; log = []
for i in range(n):
    ok, fr = cap.read(); g = cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY)
    if prev is not None:
        for k in marks:
            if pts.get(k) is not None and len(pts[k]):
                nx, st, _ = cv2.calcOpticalFlowPyrLK(prev, g, pts[k], None, winSize=(31, 31), maxLevel=3)
                good = st.ravel() == 1
                if good.sum() >= 3: marks[k] = marks[k] + np.median((nx - pts[k])[good].reshape(-1, 2), 0); pts[k] = nx[good].reshape(-1, 1, 2)
    for k, c in marks.items():   # refresh the tracked texture points around the mark
        m = np.zeros_like(g); cv2.circle(m, tuple(int(v) for v in c), 70, 255, -1); cv2.circle(m, tuple(int(v) for v in c), 14, 0, -1)
        p = cv2.goodFeaturesToTrack(g, 40, 0.01, 6, mask=m); pts[k] = p.astype(np.float32) if p is not None else None
    mask = np.zeros_like(g)
    for k, c in marks.items():
        x, y = int(c[0]), int(c[1]); r = 26; x0, y0 = max(0, x - r), max(0, y - r); win = g[y0:y + r, x0:x + r].astype(np.int16)
        if win.size == 0: continue
        med = cv2.medianBlur(g[y0:y + r, x0:x + r], 21).astype(np.int16)
        if k == "sock": cand = (med - win) > 22                       # dark tick on the mint sock
        else:
            dark = cv2.dilate((win < 70).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
            cand = (win > 105) & dark & (cv2.erode((win < 70).astype(np.uint8), np.ones((3, 3), np.uint8)) == 0)   # bright blip inside the black digit
        nlab, lab, st, _ = cv2.connectedComponentsWithStats(cand.astype(np.uint8), 8)
        keep = np.zeros(cand.shape, np.uint8)
        for j in range(1, nlab):
            if 6 <= st[j, cv2.CC_STAT_AREA] <= 700: keep[lab == j] = 255
        mask[y0:y0 + keep.shape[0], x0:x0 + keep.shape[1]] |= keep
        log.append((i, k, x, y, int((keep > 0).sum())))
    mask = cv2.dilate(mask, np.ones((7, 7), np.uint8))
    out = cv2.inpaint(fr, mask, 6, cv2.INPAINT_TELEA) if mask.any() else fr
    if i in (0, 60, 105, 160, 209): cv2.imwrite(f"qc/s4clean_{i:03d}.png", np.hstack([fr[500:1100, 1350:1800], out[500:1100, 1350:1800]]))
    enc.stdin.write(out.tobytes()); prev = g
enc.stdin.close(); enc.wait()
json.dump(log, open("qc/s4clean_log.json", "w"))
print("done", n, "frames")
