"""KV lockups for the Andrés Cepede teaser (same rules as text_layout_v21: justified blocks, plain rules, block height <= 226)."""
import json, sys
from PIL import ImageFont
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
FONTS = {"black": R + "drive-dl/GothamCondensed-Black.otf", "bold": R + "drive-dl/GothamCondensed-Bold.otf", "medium": R + "drive-dl/GothamCondensed-Medium.otf"}
FC = {}
def font(k, s):
    if (k, s) not in FC: FC[(k, s)] = ImageFont.truetype(FONTS[k], s)
    return FC[(k, s)]
def width(runs):
    w = 0.0
    for txt, k, s, c in runs: f = font(k, s); w += sum(f.getlength(ch) for ch in txt) + s * 0.18
    return w - runs[-1][2] * 0.18
def cap(runs): return max(font(k, s).getbbox("H")[3] - font(k, s).getbbox("H")[1] for t, k, s, c in runs)
def fit(runs, target):
    lo, hi = 4, 400
    for _ in range(30):
        m = (lo + hi) / 2; rr = [(t, k, max(6, round(s * m / 100)), c) for t, k, s, c in runs]
        lo, hi = (m, hi) if width(rr) < target else (lo, m)
    return [(t, k, max(6, round(s * lo / 100)), c) for t, k, s, c in runs]
CY, HMAX = 176, 226
def stack(lines, gap_k=0.15):
    caps = [cap(l) for l in lines]; gaps = [max(9, round(gap_k * max(caps[i], caps[i + 1]))) for i in range(len(lines) - 1)]
    total = sum(caps) + sum(gaps); y = CY - total / 2; top = y; base = []
    for i in range(len(lines)):
        y += caps[i]; base.append(round(y)); y += gaps[i] if i < len(gaps) else 0
    return base, caps, (top, top + total)
C = json.load(open(sys.argv[1])); B = {b["id"]: b for b in C["beats"]}; groups = []
def lockup(bid, spec, wt):
    """spec: list of ('fit', runs) or ('small', text, ratio_of_first_fit_line). Small lines carry the rules."""
    while True:
        fits = [fit(r, wt) for kind, *a in spec if kind == "fit" for r in [a[0]]]; it = iter(fits); lines = []; rules = []
        for kind, *a in spec:
            if kind == "fit": lines.append(next(it)); rules.append(False)
            else: lines.append([(a[0], "bold", round(fits[0][0][2] * a[1]), "white")]); rules.append(True)
        base, caps, (t, bt) = stack(lines)
        if bt - t <= HMAX or wt < 200: break
        wt -= 5
    out = []
    for i, (ln, b, r) in enumerate(zip(lines, base, rules)):
        d = dict(runs=[list(x) for x in ln], y=b, rules=r, delay=i * 4)
        if r: d.update(rule_y=round(b - caps[i] / 2), rule_span=[960 - wt / 2, 960 + wt / 2])
        out.append(d)
    B[bid]["lines"] = out
    groups.append(dict(beats=[bid], box=[960 - wt / 2, t, 960 + wt / 2, bt], f_in=B[bid]["impact"] - 6, f_out=B[bid]["out"] + 9))
W_, L_ = "white", "lime"
lockup("B1", [("small", "LOS GRANDES", 0.30), ("fit", [("RESULTADOS", "black", 100, L_)]), ("fit", [("NACEN DE EQUIPOS", "black", 100, W_)])], 560)
lockup("B2", [("fit", [("QUE COMPARTEN", "black", 100, W_)]), ("small", "UNA MISMA", 0.40), ("fit", [("VISIÓN", "black", 100, L_)])], 470)
lockup("B3", [("fit", [("CONFÍAN", "black", 100, W_), ("EN", "bold", 40, W_)]), ("fit", [("SUS FORTALEZAS", "black", 100, L_)])], 560)
lockup("B4", [("fit", [("ALINEAN", "black", 100, W_)]), ("fit", [("OBJETIVOS", "black", 100, L_)])], 480)
lockup("B5", [("fit", [("Y SE ATREVEN", "black", 100, W_)]), ("small", "A JUGAR EN", 0.40), ("fit", [("GRANDE", "black", 100, L_)])], 470)
name = [("ANDRÉS", "black", 104, "white"), ("CEPEDE", "black", 104, "lime")]; nw = width(name)
role = [("DIRECTOR COMERCIAL", "medium", 26, "white")]
logo_h = 32; cn, cr = cap(name), cap(role); g1, g2 = 18, 15
total = logo_h + g1 + cn + g2 + 1 + g2 + cr; top = CY - total / 2
nb = round(top + logo_h + g1 + cn); rule_y = round(nb + g2); rb = round(rule_y + g2 + cr)
B["B11"]["lines"][0].update(runs=[list(r) for r in name], y=nb); B["B11"]["lines"][1].update(runs=[list(r) for r in role], y=rb)
C["outro"].update(logo_y=round(top), rule_y=rule_y, rule_half=round(nw / 2))
cu = [("CON USTEDES", "bold", 40, "white")]; B["B10"]["lines"][0].update(runs=[list(r) for r in cu], y=196, rules=True, rule_y=round(196 - cap(cu) / 2), rule_span=[960 - nw / 2, 960 + nw / 2])
C["text_groups"] = groups; json.dump(C, open(sys.argv[2], "w"), indent=1, ensure_ascii=False)
for g in groups: print(g["beats"], [round(v) for v in g["box"]], [(l["runs"][0][0], l["runs"][0][2]) for l in B[g["beats"][0]]["lines"]])
