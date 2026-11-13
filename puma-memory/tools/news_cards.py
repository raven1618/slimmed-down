"""Formento: mock-news headline cards for the LED side wings (real headlines retyped, no outlet logos).
card(spec) -> RGBA 330x600 (master scale; preview = /2)."""
import sys, json, textwrap
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
F = {k: R + f"drive-dl/GothamCondensed-{v}.otf" for k, v in [("black", "Black"), ("bold", "Bold"), ("medium", "Medium")]}
GREEN = (120, 230, 40); CW, CH, PH = 330, 600, 250
def font(k, s): return ImageFont.truetype(F[k], s)
def photo(src, box):
    im = cv2.imread(R + "formento/news_in/" + src)[box[1]:box[3], box[0]:box[2]]
    h, w = im.shape[:2]; s = max(CW / w, PH / h); im = cv2.resize(im, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    y = (im.shape[0] - PH) // 2; x = (im.shape[1] - CW) // 2
    return Image.fromarray(cv2.cvtColor(im[y:y + PH, x:x + CW], cv2.COLOR_BGR2RGB))
def wrap(d, words, f, wmax):
    lines, cur = [], []
    for w in words:
        t = " ".join(x[0] for x in cur + [w])
        if cur and d.textlength(t, font=f) > wmax: lines.append(cur); cur = [w]
        else: cur.append(w)
    return lines + [cur]
def card(sp):
    c = Image.new("RGBA", (CW, CH), (10, 12, 14, 235)); d = ImageDraw.Draw(c)
    y = 0
    if sp.get("src"): c.paste(photo(sp["src"], sp["box"]), (0, 0)); y = PH
    d.rectangle([0, y, CW, y + 6], fill=GREEN); y += 22
    d.text((14, y), sp["tag"], font=font("medium", 22), fill=GREEN); y += 36
    # headline: words between * are highlighted green
    words = []; hi = False
    for tok in sp["head"].split():
        h = hi or tok.startswith("*"); words.append((tok.strip("*"), h)); hi = h and not tok.endswith("*")
    for size in (44, 40, 36, 33, 30):
        f = font("bold", size); L = wrap(d, words, f, CW - 28)
        if y + len(L) * size * 1.08 <= CH - 16: break
    for ln in L:
        x = 14
        for w, h in ln:
            d.text((x, y), w, font=f, fill=GREEN if h else (255, 255, 255)); x += d.textlength(w + " ", font=f)
        y += int(size * 1.08)
    d.rectangle([0, 0, CW - 1, CH - 1], outline=(255, 255, 255, 60), width=2)
    return c
if __name__ == "__main__":
    specs = json.load(open(sys.argv[1]))
    for k, sp in specs.items(): card(sp).save(sys.argv[2] + f"/card_{k}.png")
