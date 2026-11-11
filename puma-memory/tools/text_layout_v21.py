"""KV-style lockups for the v21 copy: justified blocks, tight leading, rules as plain lines; writes the beats + gradient boxes."""
import json, sys
from PIL import ImageFont
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
FONTS = {"black": R + "drive-dl/GothamCondensed-Black.otf", "bold": R + "drive-dl/GothamCondensed-Bold.otf", "medium": R + "drive-dl/GothamCondensed-Medium.otf"}
FC = {}
def font(k, s):
    if (k, s) not in FC: FC[(k, s)] = ImageFont.truetype(FONTS[k], s)
    return FC[(k, s)]
def width(runs):   # same maths as layout_line
    w = 0.0
    for txt, k, s, c in runs:
        f = font(k, s); w += sum(f.getlength(ch) for ch in txt) + s * 0.18
    return w - runs[-1][2] * 0.18
def cap(runs): return max(font(k, s).getbbox("H")[3] - font(k, s).getbbox("H")[1] for t, k, s, c in runs)
def fit(runs, target):   # scale every run together so the line is `target` px wide
    base = [(t, k, s, c) for t, k, s, c in runs]; lo, hi = 4, 400
    for _ in range(30):
        m = (lo + hi) / 2; rr = [(t, k, max(6, round(s * m / 100)), c) for t, k, s, c in base]
        lo, hi = (m, hi) if width(rr) < target else (lo, m)
    return [(t, k, max(6, round(s * lo / 100)), c) for t, k, s, c in base]
CY = 176
def stack(lines, gap_k=0.15):
    """lines: list of dicts {runs, rule}; returns baselines so the block is centred on CY, plus block box"""
    caps = [cap(l["runs"]) for l in lines]; gaps = []
    for i in range(len(lines) - 1):
        big = max(caps[i], caps[i + 1]); gaps.append(max(9, round(gap_k * big)))
    total = sum(caps) + sum(gaps); y = CY - total / 2; top = y; base = []
    for i, l in enumerate(lines):
        y += caps[i]; base.append(round(y)); y += gaps[i] if i < len(gaps) else 0
    return base, caps, (top, top + total)
C = json.load(open(sys.argv[1])); B = {b["id"]: b for b in C["beats"]}; groups = []
def asc(runs): return max(font(k, s).getmetrics()[0] for t, k, s, c in runs)
def setline(bid, idx, runs, base, rule=False, span=None, capv=None):
    ln = B[bid]["lines"][idx]; ln["runs"] = [list(r) for r in runs]; ln["y"] = base; ln["rules"] = bool(rule)
    if rule: ln["rule_y"] = round(base - capv / 2); ln["rule_span"] = span
    ln.pop("shadow", None)
def group(bids, top, bot, wt):
    fi = min(B[b]["impact"] for b in bids); fo = max(B[b]["out"] for b in bids)
    groups.append(dict(beats=bids, box=[960 - wt / 2, top, 960 + wt / 2, bot], f_in=fi - 6, f_out=fo + 9))
# G1  LOS GRANDES / RESULTADOS
wt = 560; big = fit([("RESULTADOS", "black", 100, "lime")], wt); small = [("LOS GRANDES", "bold", round(big[0][2] * 0.27), "white")]
(b0, b1), caps, (t, bt) = stack([{"runs": small}, {"runs": big}])
setline("B1", 0, small, b0, True, [960 - wt / 2, 960 + wt / 2], caps[0]); setline("B1", 1, big, b1); group(["B1"], t, bt, wt)
HMAX = 226
def shrink(build, wt):
    while True:
        r = build(wt)
        if r[-1][1] - r[-1][0] <= HMAX or wt < 200: return wt, r
        wt -= 5
# G2  NO EMPIEZAN / EN LA / CANCHA
def g2(wt):
    l1 = fit([("NO EMPIEZAN", "black", 100, "white")], wt); l3 = fit([("CANCHA", "black", 100, "lime")], wt)
    l2 = [("EN LA", "bold", round(l1[0][2] * 0.40), "white")]
    return l1, l2, l3, stack([{"runs": l1}, {"runs": l2}, {"runs": l3}])[0], stack([{"runs": l1}, {"runs": l2}, {"runs": l3}])[1], stack([{"runs": l1}, {"runs": l2}, {"runs": l3}])[2]
wt, (l1, l2, l3, (b0, b1, b2), caps, (t, bt)) = shrink(g2, 470)
if False:
    wt = 470; l1 = fit([("NO EMPIEZAN", "black", 100, "white")], wt); l3 = fit([("CANCHA", "black", 100, "lime")], wt)
    l2 = [("EN LA", "bold", round(l1[0][2] * 0.40), "white")]
    (b0, b1, b2), caps, (t, bt) = stack([{"runs": l1}, {"runs": l2}, {"runs": l3}])
setline("B2", 0, l1, b0); setline("B2", 1, l2, b1, True, [960 - wt / 2, 960 + wt / 2], caps[1]); setline("B2", 2, l3, b2); group(["B2"], t, bt, wt)
# G3  EMPIEZAN / EN LA / MENTE
def g3(wt):
    l1 = fit([("EMPIEZAN", "black", 100, "white")], wt); l3 = fit([("MENTE", "black", 100, "lime")], wt)
    l2 = [("EN LA", "bold", round(l1[0][2] * 0.36), "white")]; st = stack([{"runs": l1}, {"runs": l2}, {"runs": l3}])
    return l1, l2, l3, st[0], st[1], st[2]
wt, (l1, l2, l3, (b0, b1, b2), caps, (t, bt)) = shrink(g3, 420)
if False:
    wt = 420; l1 = fit([("EMPIEZAN", "black", 100, "white")], wt); l3 = fit([("MENTE", "black", 100, "lime")], wt)
    l2 = [("EN LA", "bold", round(l1[0][2] * 0.36), "white")]
    (b0, b1, b2), caps, (t, bt) = stack([{"runs": l1}, {"runs": l2}, {"runs": l3}])
setline("B3", 0, l1, b0); setline("B4", 0, l2, b1, True, [960 - wt / 2, 960 + wt / 2], caps[1]); setline("B4", 1, l3, b2); group(["B3", "B4"], t, bt, wt)
# G4  CON LÍDERES / QUE INSPIRAN
def g4(wt):
    l1 = fit([("CON", "bold", 40, "white"), ("LÍDERES", "black", 100, "white")], wt); l2 = fit([("QUE", "bold", 40, "lime"), ("INSPIRAN", "black", 100, "lime")], wt)
    st = stack([{"runs": l1}, {"runs": l2}]); return l1, l2, st[0], st[1], st[2]
wt, (l1, l2, (b0, b1), caps, (t, bt)) = shrink(g4, 560)
if False:
    wt = 560; l1 = fit([("CON", "bold", 40, "white"), ("LÍDERES", "black", 100, "white")], wt); l2 = fit([("QUE", "bold", 40, "lime"), ("INSPIRAN", "black", 100, "lime")], wt)
    (b0, b1), caps, (t, bt) = stack([{"runs": l1}, {"runs": l2}])
setline("B5", 0, l1, b0); setline("B6", 0, l2, b1); group(["B5", "B6"], t, bt, wt)
# G5  Y ENTIENDEN QUE / NINGUNA VICTORIA / SE CONSIGUE SOLO  (white lines share one size)
wt = 600; g = fit([("NINGUNA VICTORIA", "black", 100, "lime")], wt); sw = round(g[0][2] * 0.6)
l1 = [("Y ENTIENDEN QUE", "black", sw, "white")]; l3 = [("SE CONSIGUE SOLO", "black", sw, "white")]
(b0, b1, b2), caps, (t, bt) = stack([{"runs": l1}, {"runs": g}, {"runs": l3}])
setline("B7", 0, l1, b0); setline("B8", 0, g, b1); setline("B9", 0, l3, b2); group(["B7", "B8", "B9"], t, bt, wt)
# close card: logo / ANDRÉS SILVA / rule / ESPECIALISTA EN DIRECCIÓN DE EMPRESA, all centred; CON USTEDES with plain rules to the name width
name = [("ANDRÉS", "black", 104, "white"), ("SILVA", "black", 104, "lime")]; nw = width(name)
role = [("ESPECIALISTA EN DIRECCIÓN DE EMPRESA", "medium", 26, "white")]
logo_h = 32; cn, cr = cap(name), cap(role); g1, g2 = 18, 15
total = logo_h + g1 + cn + g2 + 1 + g2 + cr; top = CY - total / 2
logo_y = round(top); nb = round(top + logo_h + g1 + cn); rule_y = round(nb + g2); rb = round(rule_y + g2 + cr)
B["B11"]["lines"][0]["runs"] = [list(r) for r in name]; B["B11"]["lines"][0]["y"] = nb
B["B11"]["lines"][1]["runs"] = [list(r) for r in role]; B["B11"]["lines"][1]["y"] = rb
C["outro"].update(logo_y=logo_y, rule_y=rule_y, rule_half=round(nw / 2))
cu = [("CON USTEDES", "bold", 40, "white")]; setline("B10", 0, cu, 196, True, [960 - nw / 2, 960 + nw / 2], cap(cu))
C["text_groups"] = groups; json.dump(C, open(sys.argv[2], "w"), indent=1, ensure_ascii=False)
for gq in groups: print(gq["beats"], "box", [round(v) for v in gq["box"]], "h", round(gq["box"][3] - gq["box"][1]))
for bid in ("B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9", "B10", "B11"): print(bid, [(l["runs"], l["y"], l.get("rule_y")) for l in B[bid]["lines"]])
print("outro", C["outro"])
