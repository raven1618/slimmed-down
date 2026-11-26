"""Fit a studio VO take (Nov 25, v2) to its teaser: cut only at silences, move each phrase so the word that opens
its text beat lands on the text. Phrases with no beat of their own keep their spacing to the previous one."""
import sys, json, numpy as np
from scipy.io import wavfile
sys.path.insert(0, "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/tools")
import vo_align as VA
name, cfg, take, words, out = sys.argv[1:6]
C = json.load(open(cfg)); W = json.load(open(words))[name]
sr, a = wavfile.read(take); a = a.astype(np.float32) / (2147483648.0 if a.dtype == np.int32 else 32768.0 if a.dtype == np.int16 else 1.0)   # studio takes are 24-bit (read as int32)
m = np.abs(a).max(1); hop = sr // 100; e = m[:len(m) // hop * hop].reshape(-1, hop).max(1); sp = 20 * np.log10(e + 1e-9) > -60
isl = []; i = 0
while i < len(sp):                                   # islands = speech separated by >= 0.30 s of silence
    if sp[i]:
        j = i
        while j < len(sp) and (sp[j] or sp[j:j + 30].any()): j += 1
        isl.append([i / 100, j / 100]); i = j
    else: i += 1
isl = [s for s in isl if s[1] - s[0] >= 0.15 or any(s[0] - 0.1 <= (w["s"] + w["e"]) / 2 <= s[1] + 0.1 for w in W)]   # drop clicks
FPS = 25
beat_at = {}                                         # word index -> beat time (first word of each beat)
for b, f, l in VA.match(C, W):
    if f is not None: beat_at[f] = (b["impact"] / FPS, b["id"], b.get("out", b["impact"]) / FPS)
plan = []; prev_shift = 0.0
own = [max(range(len(isl)), key=lambda q: min(w["e"], isl[q][1]) - max(w["s"], isl[q][0])) for w in W]   # each word -> the phrase it overlaps most
for qi, (s, e_) in enumerate(isl):
    idx = [k for k in range(len(W)) if own[k] == qi and min(W[k]["e"], e_) - max(W[k]["s"], s) > 0]
    keys = [k for k in idx if k in beat_at]
    if keys:                                          # one shift per phrase: centred over every beat it carries
        sh = []
        for k in keys:
            on = s if k == idx[0] else W[k]["s"]          # phrase-opening word: the audio onset is exact, Whisper is not
            sh.append(beat_at[k][0] - on)
        shift = float(np.mean(sh)); bid = "+".join(beat_at[k][1] for k in keys)
        over = (e_ + shift) - beat_at[keys[-1]][2]               # speech still running after its text has left
        if over > 0 and not any(beat_at[k][1] in ("B10", "B11") for k in keys): shift -= min(over / 2, 0.6)
    else:
        bid, shift = "-", prev_shift
    plan.append([s, e_, shift, bid, " ".join(W[k]["w"] for k in idx)]); prev_shift = shift
N = int(30.0 * sr); outa = np.zeros((N, 2), np.float32); last_end = 0.0; pre, post = 0.06, 0.10
for p in plan:
    s, e_, shift, bid, txt = p
    st = max(s + shift, last_end + 0.12 if last_end else 0.0)   # never overlap the previous phrase
    p[2] = st - s; seg = a[int(max(s - pre, 0) * sr):int(min(e_ + post, len(a) / sr) * sr)].copy()
    fl = int(0.012 * sr); r = np.linspace(0, 1, fl)[:, None]; seg[:fl] *= r; seg[-fl:] *= r[::-1]
    i0 = int(max(st - pre, 0) * sr); seg = seg[:N - i0]; outa[i0:i0 + len(seg)] += seg; last_end = st + (e_ - s)
    print(f"  {bid:9s} {s:5.2f}-{e_:5.2f} -> {st:5.2f}-{last_end:5.2f} ({p[2]:+.2f})  {txt}")
if last_end > 29.6: print("  WARNING: runs past 29.6 s")
assert np.abs(outa).max() <= 1.0, "clipping"
wavfile.write(out, sr, (outa * 2147483647).astype(np.int32))   # keep 24-bit precision (int32 container)
