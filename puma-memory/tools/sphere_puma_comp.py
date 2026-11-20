"""Composite the chrome puma run (on black) onto an equirect background, standing on the light path, front + back.
Usage: sphere_puma_comp.py bg_equirect.png puma.mp4 out.mp4 [path_lat_deg=-31] [width_deg=46]"""
import sys, math, subprocess, numpy as np, cv2
bg_p, pm_p, out = sys.argv[1:4]; PLAT = float(sys.argv[4]) if len(sys.argv) > 4 else -31.0; WDEG = float(sys.argv[5]) if len(sys.argv) > 5 else 46.0
BG = cv2.cvtColor(cv2.imread(bg_p), cv2.COLOR_BGR2RGB).astype(np.float32); EH, EW = BG.shape[:2]
raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", pm_p, "-vf", "scale=1920:-2", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
pw = 1920; ph = len(raw) // (150 * pw * 3) if False else None
probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", pm_p], capture_output=True, text=True).stdout.strip().split(",")
ph = int(round(int(probe[1]) * 1920 / int(probe[0]) / 2) * 2)
F = np.frombuffer(raw, np.uint8).reshape(-1, ph, pw, 3)
# tight box around the puma over all frames
mx = F.max(0).max(-1); ys, xs = np.where(mx > 40); y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
pad = 20; y0, x0 = max(0, y0 - pad), max(0, x0 - pad); y1, x1 = min(ph - 1, y1 + pad), min(pw - 1, x1 + pad)
F = F[:, y0:y1 + 1, x0:x1 + 1].astype(np.float32); fh, fw = F.shape[1:3]
# size on the sphere: WDEG of longitude at the path latitude, widened by 1/cos(lat) so it reads with true proportions
lat_r = math.radians(PLAT); wpx = int(WDEG / 360 * EW / math.cos(lat_r)); hpx = int(wpx * fh / fw * math.cos(lat_r))
# feet sit on the path: bottom of the puma box at the path row
yrow = int(EH * (0.5 - PLAT / 180)); top = yrow - int(hpx * 0.80)
pe = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{EW}x{EH}", "-r", "30", "-i", "-",
                       "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
for i in range(len(F)):
    fr = BG.copy()
    p = cv2.resize(F[i], (wpx, hpx), interpolation=cv2.INTER_AREA)
    for c, flip in ((0.0, False), (180.0, False)):              # same orientation both sides: on a sphere seen from outside nothing is mirrored
        q = p[:, ::-1] if flip else p
        cx = int((c / 360 + 0.5) * EW) % EW; xa = cx - wpx // 2
        cols = (np.arange(xa, xa + wpx)) % EW
        reg = fr[top:top + hpx][:, cols]
        al = np.clip((q.max(-1, keepdims=True) - 10) / 55, 0, 1)                   # black = transparent; footage on black is premultiplied
        fr[top:top + hpx][:, cols] = reg * (1 - al) + q                              # solid chrome over the scene, glow kept
    pe.stdin.write(np.clip(fr, 0, 255).astype(np.uint8).tobytes())
pe.stdin.close(); pe.wait(); print("ok", out, wpx, hpx, top)
