"""Client Nov 27: pre-show = 1-min loop of the pulsing pentagon with the Pulso intro track; the opening = epic track
entering when the pentagon opens into the ball (6.0 s). Builds both soundtracks + the opening VO mix."""
import numpy as np, subprocess
from scipy.io import wavfile
SR = 48000; db = lambda x: 10 ** (x / 20)
def load(p):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(r, np.float32).reshape(-1, 2).copy()
def fade(n, out=False):
    x = np.sin(np.linspace(0, np.pi / 2, n)) ** 2; return x[::-1] if out else x
pul = load("sphere_audio/pulso.mp3"); epi = load("sphere_audio/epic.wav")
# ---- 1. pre-show loop: 20 heartbeat cycles of the pulse track (hits every 3.0014 s from 0.41 s) ----
H0, HP = 0.41, 3.0014
NF = 1801; LOOP = NF / 30.0; CYC = LOOP / 20                      # 60.03 s = 20 cycles = 60 visual pulses
order = list(range(1, 6)) + list(range(1, 8)) + list(range(8, 16))  # heartbeat x5, heartbeat x7 (leads into the build), build x8; cycle 0 has the watermark
N = int(round(LOOP * SR)); out = np.zeros((N + SR, 2), np.float32); PRE, TAIL = int(0.03 * SR), int(0.25 * SR)
for j, k in enumerate(order):
    s0 = int(round((H0 + k * HP) * SR)) - PRE; L = int(round(CYC * SR)) + PRE + TAIL
    seg = pul[s0:s0 + L].copy(); seg[:PRE] *= fade(PRE)[:, None]; seg[-TAIL:] *= fade(TAIL, True)[:, None]
    d0 = int(round(j * CYC * SR)) - PRE
    if d0 < 0: out[N + d0:N] += seg[:-d0]; seg = seg[-d0:]; d0 = 0
    out[d0:d0 + len(seg)] += seg
out[:SR] += out[N:N + SR]; loop = out[:N]                         # wrap the last tail onto the start: seamless
loop *= db(-1) / np.abs(loop).max()
wavfile.write("sphere_audio/v3/Pulso_loop_60s.wav", SR, (loop * 2147483647).astype(np.int32))
# ---- 2. opening soundtrack: pulse 0-6 s, epic hit (its 23.77 s) lands on the pentagon opening at 6.0 s ----
NO = int(78.4 * SR); st = np.zeros((NO, 2), np.float32)
p = pul[int(2.5 * SR):int(2.5 * SR) + int(6.1 * SR)].copy(); p[:int(0.5 * SR)] *= fade(int(0.5 * SR))[:, None]
p[-int(0.4 * SR):] *= fade(int(0.4 * SR), True)[:, None]; st[:len(p)] += p
E0, AT = 23.5, 6.0 - (23.77 - 23.5)
e = epi[int(E0 * SR):int(E0 * SR) + NO - int(AT * SR)].copy(); e[:int(0.15 * SR)] *= fade(int(0.15 * SR))[:, None]
e[-3 * SR:] *= fade(3 * SR, True)[:, None]; st[int(AT * SR):int(AT * SR) + len(e)] += e
st *= db(-1) / np.abs(st).max()
wavfile.write("sphere_audio/v3/Esfera_soundtrack_v3.wav", SR, (st * 2147483647).astype(np.int32))
# ---- 3. + sphere VO, same subtle duck as before (bed -7 dB, -3 dB under the voice) ----
v = load("vo_esfera/esfera.wav"); v = np.pad(v, ((0, max(0, NO - len(v))), (0, 0)))[:NO]
hop = 960; r = np.sqrt(np.mean(v[:NO // hop * hop].reshape(-1, hop, 2) ** 2, axis=(1, 2))); act = (20 * np.log10(r + 1e-9) > -45).astype(float)
g = act.copy()
for i in range(len(g)):
    if act[i] == 0 and act[i:i + 20].any() and act[max(0, i - 20):i].any(): g[i] = 1
env = np.zeros_like(g); a_, rl = 1 - np.exp(-1 / 7.5), 1 - np.exp(-1 / 30)
for i in range(1, len(g)): env[i] = env[i - 1] + (a_ if g[i] > env[i - 1] else rl) * (g[i] - env[i - 1])
env = np.interp(np.arange(NO) / hop, np.arange(len(env)), env)
mix = st * (db(-7) * db(-3 * env))[:, None] + v; mix *= db(-1) / np.abs(mix).max()
wavfile.write("sphere_audio/v3/Esfera_mezcla_v3.wav", SR, (mix * 2147483647).astype(np.int32))
print("loop s", round(len(loop) / SR, 3), "opening s", NO / SR)
