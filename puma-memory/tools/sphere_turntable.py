"""Client-ready turntable of an equirect frame/clip on the 2 m LED sphere (centre at 3 m), ray-cast in numpy.
Usage: sphere_turntable.py equirect.(png|mp4) out.mp4 [seconds=12] [label]"""
import sys, math, subprocess, numpy as np, cv2
src, out = sys.argv[1], sys.argv[2]; DUR = float(sys.argv[3]) if len(sys.argv) > 3 else 12.0; LABEL = sys.argv[4] if len(sys.argv) > 4 else ""
W, H, FPS = 1920, 1080, 30
import os; TURN = float(os.environ.get("TURN", "0")) or None
if src.endswith(".png") or src.endswith(".jpg"):
    EQ = [cv2.cvtColor(cv2.imread(src), cv2.COLOR_BGR2RGB).astype(np.float32)]
else:
    raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", src, "-vf", "scale=2688:1296", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    EQ = np.frombuffer(raw, np.uint8).reshape(-1, 1296, 2688, 3)        # uint8; converted per frame (memory)
EH, EW = EQ[0].shape[:2]
# camera: audience eye level 1.65 m, 4.6 m from the sphere axis, looking at the sphere centre (3 m high)
R, CY = 1.0, 3.0; cam = np.array([0, 1.65, 4.6]); tgt = np.array([0, CY - 0.15, 0])
fwd = tgt - cam; fwd /= np.linalg.norm(fwd); right = np.cross(fwd, [0, 1, 0]); right /= np.linalg.norm(right); up = np.cross(right, fwd)
f = 1.0 / math.tan(math.radians(34) / 2)
xs = (np.arange(W) + 0.5 - W / 2) / (H / 2); ys = -(np.arange(H) + 0.5 - H / 2) / (H / 2)
X, Y = np.meshgrid(xs, ys); D = fwd[None, None] * f + right[None, None] * X[..., None] + up[None, None] * Y[..., None]
D /= np.linalg.norm(D, axis=-1, keepdims=True)
oc = cam - np.array([0, CY, 0]); b = (D * oc).sum(-1); c = (oc * oc).sum() - R * R; disc = b * b - c
hit = disc > 0; tt = -b - np.sqrt(np.clip(disc, 0, None)); P = cam + D * tt[..., None]; N = (P - np.array([0, CY, 0])) / R
facing = np.clip(-(D * N).sum(-1), 0, 1)                      # LED brightness falls off a little at grazing angles
# floor (y=0) + soft reflection of the sphere glow, person silhouette for scale
tf = np.where(D[..., 1] < -1e-3, -cam[1] / D[..., 1], np.inf); fl = np.isfinite(tf) & ~hit
FP = cam + D * np.where(np.isfinite(tf), tf, 0)[..., None]
bg = np.zeros((H, W, 3), np.float32); bg[:] = (6, 9, 8)
bg += (np.clip(1 - np.abs(Y + 0.1) * 1.2, 0, 1) ** 2)[..., None] * np.array([8, 14, 11])
grid = ((np.abs((FP[..., 0] % 1.0) - 0.5) > 0.49) | (np.abs((FP[..., 2] % 1.0) - 0.5) > 0.49)) & fl
bg[grid] += (14, 26, 20)
person = np.zeros((H, W), bool)
def proj(p):
    v = p - cam; z = (v * fwd).sum(); return (W / 2 + (v * right).sum() / z * f * H / 2, H / 2 - (v * up).sum() / z * f * H / 2, z)
px, py, pz = proj(np.array([1.15, 0.0, 1.3])); hx, hy, _ = proj(np.array([1.15, 1.75, 1.3]))
sc = (py - hy) / 1.75
bg8 = bg.astype(np.uint8); cv2.ellipse(bg8, (int(px), int(hy + 0.11 * sc)), (int(0.11 * sc), int(0.12 * sc)), 0, 0, 360, (34, 46, 40), -1)
cv2.rectangle(bg8, (int(px - 0.2 * sc), int(hy + 0.25 * sc)), (int(px + 0.2 * sc), int(py)), (34, 46, 40), -1)
bg = bg8.astype(np.float32)
pe = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                       "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
n = int(DUR * FPS); TURN = TURN or DUR
for i in range(n):
    a = 2 * math.pi * i / (TURN * FPS)                            # TURN seconds per full turn (env TURN, default = clip duration)
    ca, sa = math.cos(a), math.sin(a)
    nx = N[..., 0] * ca - N[..., 2] * sa; nz = N[..., 0] * sa + N[..., 2] * ca
    lon = np.arctan2(nx, nz); lat = np.arcsin(np.clip(N[..., 1], -1, 1))
    eq = EQ[min(int(i / n * len(EQ) * (DUR * FPS / max(len(EQ), 1)) ) % len(EQ), len(EQ) - 1)] if len(EQ) > 1 else EQ[0]
    if len(EQ) > 1: eq = EQ[i % len(EQ)].astype(np.float32)
    mx = ((lon / (2 * math.pi) + 0.5) * EW).astype(np.float32); my = ((0.5 - lat / math.pi) * EH).astype(np.float32)
    s = cv2.remap(eq, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP) * (0.55 + 0.45 * facing[..., None])
    fr = np.where(hit[..., None], s, bg)
    glow = cv2.GaussianBlur(np.where(hit[..., None], s, 0), (0, 0), 40) * 0.35        # LED bloom spill
    refl = np.zeros_like(fr)
    ys_, xs_ = np.where(hit); 
    fr = fr + glow * (~hit)[..., None]
    fr = np.clip(fr, 0, 255).astype(np.uint8)
    if LABEL: cv2.putText(fr, LABEL, (40, H - 40), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (160, 200, 170), 2, cv2.LINE_AA)
    pe.stdin.write(fr.tobytes())
pe.stdin.close(); pe.wait(); print("done", out)
