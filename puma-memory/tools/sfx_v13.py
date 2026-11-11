"""Temp sound design for storyboard v3: no music. Light travel swishes, halo impacts, side-panel wipes, low diegetic beds, AI VO (temp)."""
import json, sys, wave
import numpy as np
from scipy import signal
C = json.load(open(sys.argv[1])); VO = sys.argv[2]; OUT = sys.argv[3]
SR = 48000; DUR = 30.0; N = int(SR * DUR); FPS = 25
mix = np.zeros((N, 2), np.float32); rng = np.random.default_rng(7)
def sos_bp(lo, hi): return signal.butter(4, [lo, hi], btype="band", fs=SR, output="sos")
def bp(x, lo, hi): return signal.sosfilt(sos_bp(lo, hi), x).astype(np.float32)
def lp(x, hi): return signal.sosfilt(signal.butter(4, hi, btype="low", fs=SR, output="sos"), x).astype(np.float32)
def hp(x, lo): return signal.sosfilt(signal.butter(4, lo, btype="high", fs=SR, output="sos"), x).astype(np.float32)
def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)
def place(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR); 
    if i >= N: return
    sig = sig[: N - i] * gain; l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    if sig.ndim == 1: mix[i:i + len(sig), 0] += sig * l * 1.414; mix[i:i + len(sig), 1] += sig * r * 1.414
    else: mix[i:i + len(sig)] += sig
def env(n, a, r, shape=2.0):
    t = np.linspace(0, 1, n); e = np.minimum(1, t / max(a, 1e-3)) * np.clip((1 - t) / max(r, 1e-3), 0, 1) ** shape; return e.astype(np.float32)
def swish(d, f0, f1, pan0, pan1, t0, gain):
    n = int(d * SR); x = noise(d); out = np.zeros(n, np.float32); k = 24; edges = np.linspace(0, n, k + 1).astype(int)
    for i in range(k):
        fc = f0 * (f1 / f0) ** (i / (k - 1)); seg_ = bp(x[edges[i]:edges[i + 1]], fc * 0.6, min(fc * 1.6, 20000)); out[edges[i]:edges[i + 1]] = seg_
    out = out * env(n, 0.75, 0.25, 1.5)
    sh = hp(noise(d), 6000) * env(n, 0.9, 0.1) * 0.35                     # bright shimmer on top
    s = out + sh; tt = np.linspace(0, 1, n)
    pan = pan0 + (pan1 - pan0) * tt; l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    place(np.stack([s * l, s * r], 1) * 1.414, t0, gain)
def halo_hit(t0, gain=1.0):
    d = 1.6; n = int(d * SR); tt = np.arange(n) / SR
    f = 50 + 45 * np.exp(-tt / 0.06); sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.35)
    thump = lp(noise(d), 380) * np.exp(-tt / 0.05) * 1.4
    shim = 0.0
    air = hp(noise(d), 5000) * np.exp(-tt / 0.4) * 0.25
    s = (sub * 0.9 + thump * 0.5 + shim + air).astype(np.float32)
    place(np.stack([s, np.roll(s, 30)], 1), t0, gain)
def bed(t0, t1, lo, hi, level, mod=0.0, modf=0.3):
    d = t1 - t0; n = int(d * SR); x = bp(noise(d), lo, hi); tt = np.arange(n) / SR
    am = 1 + mod * np.sin(2 * np.pi * modf * tt + rng.uniform(0, 6)); e = env(n, 0.15, 0.15, 1.0)
    place(np.stack([x * am * e, bp(noise(d), lo, hi) * am * e], 1), t0, level)
def heartbeat(t0, t1, period, level):
    t = t0
    while t < t1:
        for off, g in ((0, 1.0), (0.24, 0.65)):
            d = 0.25; tt = np.arange(int(d * SR)) / SR; s = np.sin(2 * np.pi * 52 * tt) * np.exp(-tt / 0.06)
            place(s.astype(np.float32), t + off, level * g)
        t += period
# ----- intro: two lights from the edges, outline hum, ignition
swish(0.8, 400, 5000, -0.95, 0.0, 0.0, 0.45); swish(0.8, 400, 5000, 0.95, 0.0, 0.05, 0.45)
hum_d = 1.2; tt = np.arange(int(hum_d * SR)) / SR; hum = (bp(noise(hum_d), 1500, 7000) * 0.5) * env(len(tt), 0.3, 0.4)
place(np.stack([hum, hum[::-1]], 1), 0.6, 0.35); halo_hit(0.95, 0.8)
# ----- one sound per transition, matching its move (nothing on the phrases)
T = C["transitions"]; F0 = {s_["id"]: s_["f0"] for s_ in C["slides"]}
for sid, (kind, D) in T.items():
    t0 = F0[sid] / FPS; d = D / FPS
    if kind == "slit": swish(d + 0.3, 250, 3500, 0.0, 0.0, t0 - 0.1, 0.4); halo_hit(t0 + 0.1, 0.45)
    if kind == "beam": swish(d + 0.25, 500, 7000, -0.95, 0.95, t0, 0.55)
    if kind == "iris":
        swish(0.35, 4000, 600, 0.0, 0.0, t0 - 0.2, 0.25); halo_hit(t0 + 0.12, 0.9)
        swish(d, 300, 5000, 0.0, -0.8, t0 + 0.1, 0.3); swish(d, 300, 5000, 0.0, 0.8, t0 + 0.1, 0.3)
    if kind == "sweep": swish(d + 0.2, 350, 5500, -0.9, 0.9, t0, 0.5)
# ----- the team network becomes the ball: build, then the flash on the cut to the close
bx = C["ball"]; bd = (bx[1] - bx[0]) / FPS; n = int(bd * SR); tt = np.arange(n) / SR
ris = bp(noise(bd), 500, 8000) * (tt / bd) ** 2.2
place(np.stack([ris, ris[::-1]], 1).astype(np.float32), bx[0] / FPS, 0.45); halo_hit(23.2, 1.15)
# ----- diegetic beds (very low) per slide
bed(1.6, 7.5, 80, 300, 0.10, 0.2); bed(1.6, 7.5, 300, 1300, 0.035, 0.3, 0.2)              # tunnel rumble + distant crowd
heartbeat(7.6, 12.4, 1.05, 0.35); bed(7.5, 12.5, 500, 1800, 0.03, 0.8, 0.45)              # heartbeat + breathing
bed(12.5, 17.5, 300, 2500, 0.06, 0.4, 0.5)                                                  # stadium
bed(17.5, 23.6, 300, 2800, 0.05, 0.3, 0.3); bed(19.4, 23.4, 300, 2800, 0.09, 0.2, 0.2)      # crowd swells
# ----- close: soft shimmer with the rays behind Andrés
hd = 1.6; tt = np.arange(int(hd * SR)) / SR; sh = bp(noise(hd), 4000, 11000) * env(len(tt), 0.4, 0.5); place(np.stack([sh, sh[::-1]], 1), 27.6, 0.25)
# ----- duck beds/effects slightly under the VO, then add the VO (temp synthetic voice)
lines = json.load(open(f"{VO}/vo_lines.json")); starts = C["vo_starts"]; duck = np.ones(N, np.float32)
for k, t0 in starts.items():
    with wave.open(f"{VO}/{k}.wav") as w: sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    x = signal.resample_poly(x, SR, sr).astype(np.float32); i = int(t0 * SR); duck[i:i + len(x)] = np.minimum(duck[i:i + len(x)], 0.55)
duck = np.convolve(duck, np.ones(2400) / 2400, mode="same").astype(np.float32); mix *= duck[:, None]
for k, t0 in starts.items():
    with wave.open(f"{VO}/{k}.wav") as w: sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    x = signal.resample_poly(x, SR, sr).astype(np.float32); place(np.stack([x, x], 1) * 0.75, t0, 1.0)
# ----- master: soft clip + peak normalise
mix = np.tanh(mix * 1.2) ; mix = mix / (np.abs(mix).max() + 1e-6) * 0.89
with wave.open(OUT, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
print("mix written", OUT, round(float(20 * np.log10(np.sqrt((mix ** 2).mean()))), 1), "dBFS rms")
