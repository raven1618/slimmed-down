"""Align a studio VO take to the teaser's on-screen beats: each beat's words are found in the take (word timestamps),
the take is cut only at natural pauses, and each cut phrase is moved so it lands with its text."""
import json, sys, unicodedata, re
def norm(s): return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode())
def beat_words(C):
    out = []
    for b in C["beats"]:
        ws = [norm(w) for l in b["lines"] for r in l.get("runs", []) for w in r[0].split()]
        out.append((b, [w for w in ws if w]))
    return out
def match(C, W):
    """for each beat: index of its first and last word in the take (sequential, tolerant)."""
    wn = [norm(w["w"]) for w in W]; pos = 0; res = []
    for b, ws in beat_words(C):
        first = last = None
        for w in ws:
            for j in range(pos, min(pos + 8, len(wn))):
                if wn[j] == w or (len(w) > 3 and (wn[j].startswith(w[:4]) or w.startswith(wn[j][:4]))):
                    if first is None: first = j
                    last = j; pos = j + 1; break
        res.append((b, first, last))
    return res
if __name__ == "__main__":
    name, cfg = sys.argv[1], sys.argv[2]
    W = json.load(open(sys.argv[3]))[name]; C = json.load(open(cfg))
    for b, f, l in match(C, W):
        if f is None: print(f"  {b['id']:4s} NOT FOUND in take"); continue
        gap_before = W[f]["s"] - (W[f - 1]["e"] if f > 0 else 0)
        print(f"  {b['id']:4s} text in {b['impact']/25:5.2f}-{b.get('out',0)/25:5.2f} | VO {W[f]['s']:5.2f}-{W[l]['e']:5.2f} ({' '.join(w['w'] for w in W[f:l+1])}) | off {W[f]['s'] - b['impact']/25:+.2f} | pause before {gap_before:.2f}")
