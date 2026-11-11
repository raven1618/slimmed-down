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
    shim = sum(np.sin(2 * np.pi * fr * tt + p) for fr, p in ((2210, 0), (3315, 1), (4420, 2), (6630, 3))) * 0.12 * np.exp(-tt / 0.55)
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
hum_d = 1.2; tt = np.arange(int(hum_d * SR)) / SR; hum = (bp(noise(hum_d), 3000, 9000) * 0.5 + 0.2 * np.sin(2 * np.pi * 880 * tt) * (1 + 0.5 * np.sin(2 * np.pi * 14 * tt))) * env(len(tt), 0.3, 0.4)
place(np.stack([hum, hum[::-1]], 1), 0.72, 0.35); halo_hit(1.36, 0.8)
# ----- side-panel wipes at each new slide
for f in (40, 190, 320, 450, 590): swish(0.55, 300, 3500, -0.9, -0.5, f / FPS, 0.28); swish(0.55, 300, 3500, 0.9, 0.5, f / FPS, 0.28)
# ----- beats: light travel from its side + halo impact on the text
for b in C["beats"]:
    fi = b["impact"]; tr = b.get("travel", 13) / FPS; srcs = [b["from"]] if isinstance(b["from"][0], str) else b["from"]
    for s in srcs:
        pan0 = -0.9 if s[0] == "L" else 0.9
        swish(tr + 0.08, 500, 7000, pan0, 0.0, fi / FPS - tr, 0.5 / len(srcs) ** 0.5)
    halo_hit(fi / FPS, 1.25 if b["id"] == "B11" else 0.85)
    if b["out"] < 900: swish(0.3, 3000, 900, 0.0, 0.6 * b.get("exit", 1), b["out"] / FPS, 0.18)
# ----- diegetic beds (very low) per slide
bed(1.6, 7.6, 80, 300, 0.10, 0.2); bed(1.6, 7.6, 300, 1300, 0.035, 0.3, 0.2)              # tunnel rumble + distant crowd
heartbeat(8.0, 12.6, 1.05, 0.35); bed(7.6, 12.8, 500, 1800, 0.03, 0.8, 0.45)              # heartbeat + breathing
bed(12.8, 18.0, 300, 2500, 0.06, 0.4, 0.5)                                                  # stadium
bed(18.0, 23.6, 300, 2800, 0.05, 0.3, 0.3); bed(19.2, 23.4, 300, 2800, 0.09, 0.2, 0.2)      # crowd swells
# ----- close: riser into the name, closing shimmer
rd = 2.2; n = int(rd * SR); tt = np.arange(n) / SR; ris = bp(noise(rd), 600, 9000) * (tt / rd) ** 2.5 + 0.15 * np.sin(2 * np.pi * (200 + 600 * (tt / rd) ** 2) * tt) * (tt / rd) ** 2
place(np.stack([ris, ris], 1).astype(np.float32), 25.12 - rd, 0.4)
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
