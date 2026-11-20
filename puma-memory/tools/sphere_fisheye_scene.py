"""One photo scene on the sphere from a circular 180-degree fisheye clip: the same clip on the front and back halves
(rotated, not mirrored), title lockup, KV plate light band and the chrome puma.
Usage: sphere_fisheye_scene.py fisheye.mp4 out_equirect.mp4 "LINE 1" "LINE 2" [scale=0.5] [trim=0.985]"""
import sys, math, subprocess, numpy as np, cv2
src, out, L1, L2 = sys.argv[1:5]
SC = sys.argv[5] if len(sys.argv) > 5 else "0.5"; TRIM = float(sys.argv[6]) if len(sys.argv) > 6 else 0.985
sys.argv = ["sphere_render.py", SC]
sys.path.insert(0, "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/tools")
import sphere_render as SR
EW, EH = SR.EW, SR.EH
# fisheye -> sphere map (equidistant, 180 deg); back half = front rotated 180 deg about the vertical axis
n = SR.P; front = n[..., 2] >= 0
m = np.where(front[..., None], n, np.stack([-n[..., 0], n[..., 1], -n[..., 2]], -1))
th = np.arccos(np.clip(m[..., 2], -1, 1)); r = th / np.pi * TRIM; ph = np.arctan2(m[..., 1], m[..., 0])
probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip().split(",")
fw, fh = int(probe[0]), int(probe[1])
MX = ((0.5 + r * np.cos(ph)) * fw).astype(np.float32); MY = ((0.5 - r * np.sin(ph)) * fh).astype(np.float32)
raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", src, "-r", "30", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, fh, fw, 3)
LOCK = SR.lockup([(L1, "black", 0.14, SR.W_), (L2, "black", 0.18, SR.W_)], width=0.70, y_c=0.24)
pe = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{EW}x{EH}", "-r", "30", "-i", "-",
                       "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
T0 = SR.TL["path"] + 6.0                         # light band already formed: calm loop
for i in range(len(F)):
    t = i / 30.0
    fr = cv2.remap(F[i], MX, MY, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE).astype(np.float32)
    fr = SR.light_over(fr, SR.swoosh(T0 + t, 1.0), 1.6, 0.5)
    fr = SR.puma_put(fr, T0 + t)
    fr = SR.disc_put(fr, LOCK, 1.0)                 # title held for the whole scene (the clip loops; no re-entry)
    pe.stdin.write(np.clip(fr, 0, 255).astype(np.uint8).tobytes())
pe.stdin.close(); pe.wait(); print("ok", out, len(F), fw, fh)
