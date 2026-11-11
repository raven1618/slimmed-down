"""Sound design v14: subtle, varied, motion-matched. No music, nothing on the phrases.
Every move has its own texture; all effects share one large-room reverb (a 19 m screen in a ballroom) and sit well under the VO."""
import json, sys, wave
import numpy as np
from scipy import signal
C = json.load(open(sys.argv[1])); VO = sys.argv[2]; OUT = sys.argv[3]
SR = 48000; DUR = 30.0; N = int(SR * DUR); FPS = 25; rng = np.random.default_rng(11)
fx = np.zeros((N, 2), np.float32); beds = np.zeros((N, 2), np.float32)
db = lambda d: 10 ** (d / 20)
def noise(d):
    n = int(d * SR); X = np.fft.rfft(rng.standard_normal(n)); fr = np.fft.rfftfreq(n, 1 / SR)
    X *= np.where(fr < 25, 0.0, 1 / np.sqrt(np.maximum(fr, 25) / 100.0))      # pink, nothing below 25 Hz
    x = np.fft.irfft(X, n); return (x / (x.std() + 1e-9)).astype(np.float32)
def sos(kind, f): return signal.butter(2, f, btype=kind, fs=SR, output="sos")
def filt(x, kind, f): return signal.sosfilt(sos(kind, f), x).astype(np.float32)
def sweep_bp(x, f_curve, q=1.2, blocks=64):
    """band-pass noise whose centre frequency follows f_curve (Hz per sample), smooth block crossfade"""
    n = len(x); out = np.zeros(n, np.float32); edges = np.linspace(0, n, blocks + 1).astype(int); pad = 2048
    for i in range(blocks):
        a, b = edges[i], edges[i + 1]; fc = float(np.mean(f_curve[a:b])); lo, hi = fc / (1 + 1 / q), min(fc * (1 + 1 / q), SR / 2 - 200)
        seg = signal.sosfilt(signal.butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x[max(0, a - pad):b])[-(b - a):]
        out[a:b] = seg
    return out
def smooth_env(n, att, rel, curve=2.0):
    t = np.linspace(0, 1, n); up = np.clip(t / max(att, 1e-4), 0, 1); dn = np.clip((1 - t) / max(rel, 1e-4), 0, 1)
    return (np.sin(up * np.pi / 2) ** curve * np.sin(dn * np.pi / 2) ** curve).astype(np.float32)
def norm(x): return x / (np.abs(x).max() + 1e-9)
def put(bus, sig_lr, t0, level_db):
    i = int(t0 * SR); sig_lr = sig_lr[: max(0, N - i)]; bus[i:i + len(sig_lr)] += norm(sig_lr) * db(level_db)
def pan_lr(x, pan):                      # pan: scalar or per-sample array in [-1, 1]
    th = (np.asarray(pan) + 1) * np.pi / 4; return np.stack([x * np.cos(th), x * np.sin(th)], 1) * 1.414
def wide(xl, xr, width):                 # mid/side width automation (0 = mono, 1 = full)
    m, s = (xl + xr) / 2, (xl - xr) / 2 * width; return np.stack([m + s, m - s], 1)
def sub_swell(d, f0, f1, att, dec):
    t = np.arange(int(d * SR)) / SR; f = f1 + (f0 - f1) * np.exp(-t / 0.25)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / att) * np.exp(-np.maximum(0, t - att) / dec)).astype(np.float32)
T = C["transitions"]; F0 = {s_["id"]: s_["f0"] for s_ in C["slides"]}

# ---------- INTRO: two soft airy swells travel in from the far left and right, a low bloom where they meet
d = 1.3; n = int(d * SR); tt = np.linspace(0, 1, n)
for side in (-1, 1):
    x = sweep_bp(noise(d), 300 * (1500 / 300) ** tt, 1.6) * smooth_env(n, 0.6, 0.35)
    put(fx, pan_lr(x, side * (1 - 0.8 * tt)), 0.0, -41)
put(fx, pan_lr(sub_swell(1.6, 60, 48, 0.12, 0.55), 0.0), 0.88, -31)
put(fx, pan_lr(filt(noise(1.0), "low", 900) * smooth_env(int(1.0 * SR), 0.15, 0.8), 0.0), 0.86, -43)

# ---------- per-transition sounds, each matched to its move
for sid, (kind, D) in T.items():
    t0 = F0[sid] / FPS; dd = D / FPS
    if kind == "slit":                     # an exhale: air opening from the centre out to both sides
        d = dd + 0.5; n = int(d * SR); tt = np.linspace(0, 1, n)
        xl = sweep_bp(noise(d), 700 + 1400 * tt, 1.0) * smooth_env(n, 0.25, 0.6); xr = sweep_bp(noise(d), 700 + 1400 * tt, 1.0) * smooth_env(n, 0.25, 0.6)
        put(fx, wide(xl, xr, np.minimum(1, tt * 1.6)), t0 - 0.05, -42)
        put(fx, pan_lr(filt(noise(0.6), "low", 160) * smooth_env(int(0.6 * SR), 0.2, 0.7), 0.0), t0, -41)
    if kind == "beam":                     # a single pass-by that travels the 19 m with the light (doppler, panned with the head)
        d = dd + 0.35; n = int(d * SR); tt = np.linspace(0, 1, n); q = np.clip(tt * d / dd, 0, 1); e = 4 * q ** 3 * (q < .5) + (1 - (-2 * q + 2) ** 3 / 2) * (q >= .5)
        prox = np.exp(-((e - 0.5) / 0.22) ** 2); fc = 550 + 1500 * prox * np.where(e < 0.5, 1.0, 0.75)
        x = sweep_bp(noise(d), fc, 2.2) * (0.25 + 0.75 * prox) * smooth_env(n, 0.08, 0.35)
        put(fx, pan_lr(x, -1 + 2 * e), t0, -23)
    if kind == "iris":                     # a breath in, then the room opens: low expansion widening into stereo
        d = 0.32; n = int(d * SR); tt = np.linspace(0, 1, n)
        put(fx, pan_lr(sweep_bp(noise(d), 2200 * (500 / 2200) ** tt, 1.0) * tt ** 2.5, 0.0), t0 - 0.28, -41)
        put(fx, pan_lr(sub_swell(2.2, 52, 38, 0.06, 0.8), 0.0), t0 + 0.05, -30)
        d = dd + 0.9; n = int(d * SR); tt = np.linspace(0, 1, n)
        xl = sweep_bp(noise(d), 350 + 1500 * tt ** 0.7, 0.9) * smooth_env(n, 0.12, 0.75); xr = sweep_bp(noise(d), 350 + 1500 * tt ** 0.7, 0.9) * smooth_env(n, 0.12, 0.75)
        put(fx, wide(xl, xr, np.minimum(1, tt * 1.3)), t0 + 0.05, -44)
    if kind == "sweep":                    # three thin, quick air cuts left to right: one per line of light
        for k in range(3):
            d = 0.42; n = int(d * SR); tt = np.linspace(0, 1, n)
            x = sweep_bp(noise(d), 1200 + 2200 * np.sin(np.pi * tt), 2.5) * smooth_env(n, 0.45, 0.45, 1.5)
            put(fx, pan_lr(x, -0.9 + 1.8 * tt), t0 + 0.06 + k * 0.075, -28 - 2 * k)
        put(fx, pan_lr(filt(noise(0.5), "low", 220) * smooth_env(int(0.5 * SR), 0.2, 0.7), 0.0), t0 + 0.2, -34)

# ---------- the network becomes the ball: a fine crackle of light gathering, then one deep, soft bloom on the cut
bx = C["ball"]; t0 = bx[0] / FPS; d = (bx[1] - bx[0]) / FPS + 0.1; n = int(d * SR); tt = np.linspace(0, 1, n)
rise = sweep_bp(noise(d), 300 * (2400 / 300) ** tt, 1.4) * tt ** 2.2
cr = np.zeros(n, np.float32); idx = rng.choice(n, int(140 * d), replace=False); cr[idx] = rng.uniform(0.3, 1, len(idx)) * (idx / n) ** 1.5
cr = filt(filt(cr, "high", 1500), "low", 5000) * 0.6
put(fx, wide(rise + cr * 0.6, sweep_bp(noise(d), 300 * (2400 / 300) ** tt, 1.4) * tt ** 2.2 + np.roll(cr, 97) * 0.6, 0.8), t0, -23)
put(fx, pan_lr(sub_swell(3.0, 50, 36, 0.04, 1.1), 0.0), 23.2, -28)
dd_ = 2.0; n = int(dd_ * SR); air = sweep_bp(noise(dd_), np.full(int(dd_ * SR), 2200.0), 1.0) * np.exp(-np.arange(n) / SR / 0.45)
put(fx, wide(air, sweep_bp(noise(dd_), np.full(int(dd_ * SR), 2200.0), 1.0) * np.exp(-np.arange(n) / SR / 0.45), 1.0), 23.2, -39)

t0, t1 = 676 / FPS, 724 / FPS; d = t1 - t0 + 0.3; n = int(d * SR); tt = np.linspace(0, 1, n)
x = sweep_bp(noise(d), 600 + 500 * np.sin(2 * np.pi * 2 * tt) ** 2, 2.0) * smooth_env(n, 0.3, 0.2)
put(fx, pan_lr(x, 0.85 * np.sin(2 * np.pi * 1.5 * tt)), t0, -39)
put(fx, pan_lr(sub_swell(2.2, 58, 46, 0.25, 0.7), 0.0), t1 - 0.1, -34)

# ---------- very low room tones per scene (no fake crowds, no heartbeat)
def room(t0, t1, lo, hi, level, mod=0.15, rate=0.12):
    d = t1 - t0; n = int(d * SR); t = np.arange(n) / SR; am = 1 + mod * np.sin(2 * np.pi * rate * t + rng.uniform(0, 6))
    e = smooth_env(n, 0.6 / d, 0.6 / d, 1.0) * am
    xl = signal.sosfilt(signal.butter(2, [lo, hi], btype="band", fs=SR, output="sos"), noise(d)) * e
    xr = signal.sosfilt(signal.butter(2, [lo, hi], btype="band", fs=SR, output="sos"), noise(d)) * e
    put(beds, np.stack([xl, xr], 1).astype(np.float32), t0, level)
room(1.6, 7.6, 40, 180, -38); room(1.6, 7.6, 300, 1200, -44)          # tunnel: low concrete rumble, distant air
room(7.5, 12.6, 150, 900, -44, 0.3, 0.2)                                # dressing room: still air, slow breath-like movement
room(12.5, 17.6, 120, 1500, -41)                                        # night stadium: wide distant air
room(17.5, 23.7, 150, 1800, -40, 0.25, 0.08)                            # golden hour: warmer, slowly swelling
d = 6.3; n = int(d * SR); t = np.arange(n) / SR                         # close: a soft, slowly moving shimmer with the rays
sh = [filt(filt(noise(d), "high", 1500), "low", 4500) * (1 + 0.4 * np.sin(2 * np.pi * 0.35 * t + p)) * smooth_env(n, 0.15, 0.25, 1.0) for p in (0, 2)]
put(beds, np.stack(sh, 1).astype(np.float32), 23.7, -41)

# ---------- one shared large-room reverb on the effects (makes them sit in the space instead of on top of it)
rt = 2.2; m = int(2.6 * SR); te = np.arange(m) / SR
ir = np.stack([filt(noise(2.6), "low", 6000) * np.exp(-6.9 * te / rt) for _ in range(2)], 1); ir[: int(0.02 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
fx = np.stack([filt(filt(fx[:, c], "low", 6500), "high", 30) for c in range(2)], 1)
wet = np.stack([signal.fftconvolve(fx[:, c], ir[:, c])[:N] for c in range(2)], 1).astype(np.float32)
effects = fx * 0.8 + wet * 0.45 + beds

# ---------- VO: final ElevenLabs take (one read), cut at its natural pauses, each thought placed on its phrase
import subprocess
TAKE = sys.argv[2]
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", TAKE, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
v = np.frombuffer(raw, np.float32).copy()
# --- breaths / sighs ("suspiros"): long breathy exhales after words and low unvoiced tails are pulled down;
#     consonants are kept (only the first 100 ms of any unvoiced stretch passes at full level)
def frames_feat(x, hop=480, win=960):
    n = len(x) // hop; lev = np.full(n, 1e-9); per = np.zeros(n)
    for k in range(n):
        seg = x[k * hop:k * hop + win]
        if len(seg) < win: break
        lev[k] = np.sqrt((seg ** 2).mean()) + 1e-9; s0 = seg - seg.mean(); ac = np.correlate(s0, s0, "full")[win - 1:]
        per[k] = ac[int(SR / 400):int(SR / 70)].max() / (ac[0] + 1e-9)
    return 20 * np.log10(lev / lev.max()), per
ldb, per = frames_feat(v)
unv = (per < 0.38) & (ldb > -62)
g = np.ones(len(ldb))
k = 0
while k < len(unv):
    if unv[k]:
        j = k
        while j < len(unv) and unv[j]: j += 1
        if np.mean(ldb[k:j]) < -30: g[k:j] = db(-14)            # quiet breath / tail: down 14 dB
        elif j - k > 10: g[k + 10:j] = db(-12)                   # long unvoiced stretch: keep the consonant, cut the exhale
        k = j
    else: k += 1
g_s = np.interp(np.arange(len(v)), np.arange(len(g)) * 480 + 240, g).astype(np.float32)
g_s = signal.sosfiltfilt(signal.butter(1, 20, btype="low", fs=SR, output="sos"), g_s).astype(np.float32)
v = v * np.clip(g_s, db(-14), 1)
# polish: rumble cut, slight low-mid clean-up, a little presence
v = filt(v, "high", 80)
lowmid = signal.sosfilt(signal.butter(2, [220, 450], btype="band", fs=SR, output="sos"), v).astype(np.float32); v = v - 0.18 * lowmid
pres = signal.sosfilt(signal.butter(2, [2000, 3800], btype="band", fs=SR, output="sos"), v).astype(np.float32); v = v + 0.10 * pres
# --- de-esser (zero-phase split band): 4.5-12 kHz sits 3 dB lower overall (less breathiness) and is pulled down
#     up to 10 dB more whenever it gets hot relative to the voice (s, z, sh, aspiration)
hb = signal.sosfiltfilt(signal.butter(3, [4500, 12000], btype="band", fs=SR, output="sos"), v).astype(np.float32); lo = v - hb
env_h = np.sqrt(np.convolve(hb ** 2, np.ones(240) / 240, mode="same")) + 1e-7
env_l = np.sqrt(np.convolve(lo ** 2, np.ones(240) / 240, mode="same")) + 1e-7
r = env_h / env_l; ghb = np.clip((0.25 / np.maximum(r, 1e-6)) ** 0.8, db(-10), 1.0) * db(-3)
ghb = signal.sosfiltfilt(signal.butter(1, 80, btype="low", fs=SR, output="sos"), ghb).astype(np.float32)
v = (lo + hb * ghb).astype(np.float32)
lvl = np.sqrt(np.convolve(v ** 2, np.ones(1440) / 1440, mode="same")) + 1e-7; ldb2 = 20 * np.log10(lvl)
gr = np.where(ldb2 > -26, (ldb2 + 26) * (1 - 1 / 2.5), 0.0)          # 2.5:1 above -26 dB
gr = signal.sosfiltfilt(signal.butter(1, 30, btype="low", fs=SR, output="sos"), gr)
v = (v * 10 ** (-gr / 20)).astype(np.float32)
import wave as _w
with _w.open(OUT.replace(".wav", "_vo_processed.wav"), "wb") as _f:
    _f.setnchannels(1); _f.setsampwidth(2); _f.setframerate(SR); _f.writeframes((np.clip(v / (np.abs(v).max() + 1e-9) * 0.9, -1, 1) * 32767).astype(np.int16).tobytes())
# (file start, file end, place at): male take, pauses measured by energy; each thought lands on its phrase
CUTS = [(0.00, 3.30, 2.96), (3.40, 5.60, 8.79), (5.65, 7.80, 13.78), (7.82, 10.80, 18.80), (10.85, 11.98, 24.29), (11.98, 13.09, 25.35)]
vo = np.zeros((N, 2), np.float32); duck = np.ones(N, np.float32); fd = int(0.015 * SR)
for a0, a1, t0 in CUTS:
    seg = v[int(a0 * SR):int(a1 * SR)].copy(); seg[:fd] *= np.linspace(0, 1, fd); seg[-fd:] *= np.linspace(1, 0, fd)
    i = int(t0 * SR); seg = seg[: N - i]; vo[i:i + len(seg)] += np.stack([seg, seg], 1); duck[i:i + len(seg)] = db(-4)
duck = np.convolve(duck, np.ones(4800) / 4800, mode="same").astype(np.float32)
vo = vo * (db(-24.3) / (np.sqrt((vo ** 2).mean()) + 1e-9))            # same loudness as the previous voice
pk = db(-3); vo = np.where(np.abs(vo) > pk, np.sign(vo) * (pk + (1 - pk) * np.tanh((np.abs(vo) - pk) / (1 - pk))), vo).astype(np.float32)   # soft peak limit
vo = vo + np.stack([signal.fftconvolve(vo[:, c], ir[:, c])[:N] for c in range(2)], 1).astype(np.float32) * 0.035   # a touch of the same room (halved)
# ---- v23: client's soundtrack (StudioKolomna) as a bed under the voice ----
NOVO = len(sys.argv) > 5 and sys.argv[5] == "novo"   # music + SFX only, no voice
MUS = sys.argv[4]; OFF = 23.60 - 23.35        # the track's stop (23.35 s) lands on the cut to the close card (frame 590 = 23.60 s)
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", MUS, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
mu = np.frombuffer(raw, np.float32).reshape(-1, 2).copy(); music = np.zeros((N, 2), np.float32)
i0 = int(OFF * SR); mu = mu[: N - i0]; music[i0:i0 + len(mu)] = mu
act = np.zeros(N, np.float32)                  # voice activity boxes, opening 0.15 s early
for a0, a1, t0 in CUTS: act[max(0, int((t0 - 0.15) * SR)):int((t0 + a1 - a0 + 0.05) * SR)] = 1
k = int(0.35 * SR); act = np.convolve(act, np.hanning(k) / np.hanning(k).sum(), mode="same").astype(np.float32)
if NOVO: act[:] = 0
tail = np.clip((np.arange(N) / SR - 23.6) / 0.3, 0, 1)                         # after the stop the ringing tail is already soft
mduck = db(-18) * 10 ** ((-7 * act * (1 - tail) - 3 * act * tail) / 20)       # bed at -18 dB, -7 dB more under the voice
mid = np.stack([signal.sosfiltfilt(signal.butter(2, [1200, 4500], btype="band", fs=SR, output="sos"), music[:, c]) for c in range(2)], 1).astype(np.float32)
music = (music - 0.45 * mid * act[:, None]) * mduck[:, None]                   # carve the voice's presence band while it speaks
music = np.stack([filt(music[:, c], "high", 35) for c in range(2)], 1)
m22 = np.abs(effects * duck[:, None] + vo).max(); g22 = min(1.0, db(-1) / m22)   # the exact gain v22 used, so the voice level matches it
effects = fx * 0.8 * db(-4) + wet * 0.45 * db(-4) + beds * db(-9)               # SFX tucked under the music, room beds mostly out
if NOVO: vo[:] = 0; duck[:] = 1
mix = effects * duck[:, None] + music + vo
mix = mix * g22
if NOVO: mix = mix * db(9)        # without a voice the track is the lead: bring the whole bed up
kn = db(-4); ce = db(-1); ax = np.abs(mix)
mix = np.where(ax > kn, np.sign(mix) * (kn + (ce - kn) * np.tanh((ax - kn) / (ce - kn))), mix).astype(np.float32)   # soft ceiling, no global gain change
with wave.open(OUT, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
def lv(x): return round(float(20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)), 1)
print("written", OUT, "| rms music", lv(music), "| rms mix", lv(mix), "| rms effects", lv(effects), "| rms VO", lv(vo), "| peak effects dBFS", round(20 * np.log10(np.abs(effects).max()), 1))
