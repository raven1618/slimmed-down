"""J1->J2 spin transition (Seedance 38387eb9, start = J1 match frame, end = J2 at 0.33 s), remapped to 2.2 s:
speed ramp (push accelerates, spin fast, landing decelerates) + shutter blending = motion blur proportional to speed."""
import cv2, numpy as np
R = '/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/'
cap = cv2.VideoCapture(R + 'esfera_in/fisheye/J1J2_spin_raw.mp4'); S = []
while True:
    ok, f = cap.read()
    if not ok: break
    S.append(f.astype(np.float32))
S = np.array(S); n = len(S) - 1                                       # 120 source frame steps (24 fps)
FPS, D = 30, 2.2; N = int(round(D * FPS))
# key mapping: output seconds -> source frame, piecewise, then smoothed so the speed changes are ramps not steps
ko = np.array([0.0, 0.3, 1.6, 2.2]); ks = np.array([0.0, 28.0, 100.0, float(n)])
t = np.linspace(0, D, 2000); src = np.interp(t, ko, ks)
k = 60; src = np.convolve(np.pad(src, k, mode='edge'), np.ones(2 * k + 1) / (2 * k + 1), 'valid')
src = (src - src[0]) / (src[-1] - src[0]) * n                         # exact first and last frames kept
vw = cv2.VideoWriter(R + 'qc/J1J2_spin_v.mp4', cv2.VideoWriter_fourcc(*'mp4v'), FPS, (S.shape[2], S.shape[1]))
def at(x):
    i = int(np.floor(x)); f = x - i
    return S[min(i, n)] if f < 1e-3 else S[i] * (1 - f) + S[min(i + 1, n)] * f
for j in range(N):
    a = np.interp(j / FPS, t, src); b = np.interp(min((j + 1) / FPS, D), t, src)
    if j == 0: a = b = 0.0                                             # first frame = exact J1 match frame
    if j == N - 1: a = b = float(n)                                    # last frame = exact J2 frame
    m = max(1, int(np.ceil(abs(b - a) * 1.5)))                         # shutter: blend every source position the frame covers
    fr = np.mean([at(a + (b - a) * (s + 0.5) / m) for s in range(m)], 0) if m > 1 else at(a)
    vw.write(np.clip(fr, 0, 255).astype(np.uint8))
vw.release(); print('frames', N)
