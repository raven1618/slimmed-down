import numpy as np, cv2, subprocess, sys
# usage: kcmp.py preview.mp4 dumpprefix K f1,f2,...  -> compares dumped frames (downscaled if K>1) with the preview video frames
P, pre, K = sys.argv[1], sys.argv[2], float(sys.argv[3]); fs = [int(x) for x in sys.argv[4].split(",")]
for f in fs:
    i = int(round(f * 30 / 25)); r = subprocess.run(["ffmpeg", "-v", "error", "-i", P, "-vf", f"select=eq(n\\,{i})", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    v = np.frombuffer(r, np.uint8).reshape(356, 1920, 3).astype(np.float32)
    a = cv2.cvtColor(cv2.imread(f"{pre}_{f:03d}.png"), cv2.COLOR_BGR2RGB).astype(np.float32)
    if K != 1: a = cv2.resize(a, (1920, 356), interpolation=cv2.INTER_AREA)
    d = np.abs(a - v).mean(2); db = cv2.blur(d, (15, 15))
    y, x = np.unravel_index(np.argmax(db), db.shape)
    print(f"f{f}: mean {d.mean():.2f}  local max (15px) {db.max():.1f} at x={x},y={y}  p99.9 {np.percentile(db, 99.9):.1f}")
