"""Render one beat with the new motion-graphics text layer: front/back preview mp4.  Usage: mg_preview.py t_start t_end out.mp4"""
import sys; a = sys.argv[1:]; sys.argv = ["sphere_render.py", "0.5"]
sys.path.insert(0, "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/tools")
import numpy as np, cv2, math, subprocess, os, sphere_render as SR
MG = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/mg/"
SEQ = {0: (MG + "seq_km", 0.60)}                       # scene -> (png sequence, text landing time after scene start)
_cache = {}
def mg_layer(i, tt):
    d, _ = SEQ[i]; k = int(round(tt * 30))
    fs = sorted(os.listdir(d)); k = min(max(k, 0), len(fs) - 1)
    if (i, k) not in _cache:
        im = cv2.imread(d + "/" + fs[k], cv2.IMREAD_UNCHANGED).astype(np.float32)
        _cache[(i, k)] = np.dstack([im[..., 2], im[..., 1], im[..., 0], im[..., 3]])
    return _cache[(i, k)]
def scene_full(i, t):
    t0, t1 = SR.SCN[i][0](), SR.SCN[i][3]()
    fr = SR.lower_black(SR.scene_foot(i, t), t)
    if i in SEQ:
        pulse = math.exp(-((t - t0 - SEQ[i][1]) / 0.28) ** 2)        # the beam answers the text landing
        fr = SR.light_over(fr, SR.swoosh(t, 1.0 + 1.1 * pulse), 1.6, 0.5); fr = SR.puma_put(fr, t)
        if t >= t0: fr = SR.disc_put(fr, mg_layer(i, t - t0))
        return fr
    fr = SR.light_over(fr, SR.swoosh(t, 1.0), 1.6, 0.5); fr = SR.puma_put(fr, t)
    r, al = SR.text_in(SR.lockup(SR.SCN[i][2], width=0.70, y_c=0.24), t, t0 + 0.1)
    if al: fr = SR.disc_put(fr, r, al * (1 - SR.ease((t - t1 + 0.6) / 0.4)))
    return fr
SR.scene_full = scene_full
t0, t1, out = float(a[0]), float(a[1]), a[2]; VW = 1080
pv = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{VW}x{VW // 2}", "-r", "30", "-i", "-",
                       "-c:v", "libx264", "-crf", "17", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
for i in range(int((t1 - t0) * 30)):
    eq = np.clip(SR.render(t0 + i / 30), 0, 255).astype(np.uint8)
    pv.stdin.write(np.hstack([SR.front_view(eq, VW // 2), SR.front_view(eq, VW // 2, back=True)]).astype(np.uint8).tobytes())
pv.stdin.close(); pv.wait(); print("ok", out)
