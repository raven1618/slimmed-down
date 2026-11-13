"""Formento: headline panels shaped to the LED wings (chevrons outside the die-cut V's). Master scale 3840x708.
wing(sp, side) -> RGBA 3840x708 layer with content only inside that wing."""
import sys, json
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
W, H = 3840, 708; GREEN = (120, 230, 40)
F = {k: R + f"drive-dl/GothamCondensed-{v}.otf" for k, v in [("black", "Black"), ("bold", "Bold"), ("medium", "Medium")]}
def font(k, s): return ImageFont.truetype(F[k], s)
M = cv2.resize(cv2.imread(R + "puma-kb/sources/S09-piloto-aprobado/diecut_mask_pilot.png", 0), (W, H), interpolation=cv2.INTER_NEAREST) > 127
EDGE_L = np.array([np.argmax(M[y, :W // 2]) for y in range(H)])                       # left wing = x < EDGE_L[y]
EDGE_R = np.array([W - np.argmax(M[y, ::-1][:W // 2]) for y in range(H)])            # right wing = x >= EDGE_R[y]
xx = np.arange(W)[None, :]
WMASK = {"L": xx < EDGE_L[:, None], "R": xx >= EDGE_R[:, None]}
def avail(side, y0, y1, pad=34):
    """usable [x0,x1] for a text line spanning rows y0..y1"""
    y0, y1 = max(0, int(y0)), min(H - 1, int(y1))
    if side == "L": return pad + 10, int(EDGE_L[y0:y1 + 1].min()) - pad
    return int(EDGE_R[y0:y1 + 1].max()) + pad, W - pad - 10
def board(side, hi="D"):
    """fuel price board graphic (deck values) for headlines with no photo"""
    bw = int(EDGE_L.max()) + 20; im = Image.new("RGB", (bw, H), (6, 14, 10)); d = ImageDraw.Draw(im)
    for x in range(0, bw, 38): d.line([(x, 0), (x, H)], fill=(14, 30, 20))
    for y in range(0, H, 38): d.line([(0, y), (bw, y)], fill=(14, 30, 20))
    fb = font("black", 150); y = 10; ox = 18 if side == "L" else bw - 640
    for k, v in [("95", "7.620"), ("93", "7.260"), ("D", "6.950"), ("GNV", "4.990")]:
        c = (120, 230, 40) if k == hi else (225, 235, 225)
        c = tuple(int(v_ * 0.55) for v_ in c)
        d.rectangle([ox, y + 20, ox + 190, y + 152], outline=c, width=5); d.text((ox + 95 - d.textlength(k, font=font("black", 90)) / 2, y + 38), k, font=font("black", 90), fill=c)
        d.text((ox + 222, y + 2), v, font=fb, fill=c); y += 172
    im = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2BGR)
    if side == "R": im = im[:, ::-1] if False else im
    return im
def photo(sp, side):
    if sp.get("board"): im = board(side, sp.get("hi", "D")); sp = dict(sp, box=[0, 0, im.shape[1], im.shape[0]])
    else: im = cv2.imread(R + "formento/" + sp["src"])
    b = sp["box"]; im = im[b[1]:b[3], b[0]:b[2]]
    bw = int(EDGE_L.max()) + 20; s = max(bw / im.shape[1], H / im.shape[0]); im = cv2.resize(im, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    fx = sp.get("fx", 0.5); x = int((im.shape[1] - bw) * fx); y = (im.shape[0] - H) // 2; im = im[y:y + H, x:x + bw]
    out = np.zeros((H, W, 3), np.uint8)
    if side == "L": out[:, :bw] = im
    else: out[:, W - bw:] = im
    return cv2.cvtColor(out, cv2.COLOR_BGR2RGB)
def words_of(head):
    out, hi = [], False
    for tok in head.split():
        h = hi or tok.startswith("*"); out.append((tok.replace("*", ""), h)); hi = h and "*" not in tok[1:]
    return out
def layout(d, side, sp):
    """shape-fit: each line gets the width the chevron allows at its height; text block centred on the chevron tip."""
    ws = words_of(sp["head"])
    for size in (84, 78, 72, 66, 60, 56, 52):
        f = font("bold", size); lh = int(size * 1.02); tag_h = 44
        for _ in range(3):
            lines, cur, n = [], [], 0
            # estimate block height to centre it, then wrap row by row
            ytop = H / 2 - (tag_h + lh * max(1, sp.get("_n", 4))) / 2; y = ytop + tag_h
            for w in ws:
                x0, x1 = avail(side, y, y + lh)
                t = " ".join(a for a, _ in cur + [w])
                if cur and d.textlength(t, font=f) > x1 - x0:
                    lines.append((cur, y)); cur = [w]; y += lh
                else: cur.append(w)
            lines.append((cur, y)); y += lh
            sp["_n"] = len(lines)
        if ytop >= 40 and y <= H - 40 and all(d.textlength(" ".join(a for a, _ in c), font=f) <= (lambda r: r[1] - r[0])(avail(side, yy, yy + lh)) for c, yy in lines):
            return f, size, ytop, lines
    return f, size, ytop, lines
def wing(sp, side):
    img = Image.fromarray(photo(sp, side)).convert("RGBA")
    # uniform translucent wash over the whole wing (user, Nov 13: no patchy shadows behind the text)
    d0 = ImageDraw.Draw(img); f, size, ytop, lines = layout(d0, side, sp)
    a = np.full((H, W), int(255 * sp.get("wash", 0.58)), np.uint8)
    img = Image.alpha_composite(img, Image.fromarray(np.dstack([np.zeros((H, W, 3), np.uint8), a]), "RGBA"))
    d = ImageDraw.Draw(img); f, size, ytop, lines = layout(d, side, sp)
    ft = font("medium", 34); x0, x1 = avail(side, ytop, ytop + 40)
    tw = d.textlength(sp["tag"], font=ft); tx = x0 if side == "L" else x1 - tw
    d.rectangle([tx, ytop - 14, tx + 60, ytop - 8] if side == "L" else [x1 - 60, ytop - 14, x1, ytop - 8], fill=GREEN)
    d.text((tx, ytop), sp["tag"], font=ft, fill=GREEN)
    for ln, y in lines:
        x0, x1 = avail(side, y, y + size)
        lw = d.textlength(" ".join(a for a, _ in ln), font=f); x = x0 if side == "L" else x1 - lw
        for w, h in ln:
            d.text((x, y), w, font=f, fill=GREEN if h else (255, 255, 255)); x += d.textlength(w + " ", font=f)
    arr = np.array(img); arr[..., 3] = np.where(WMASK[side], arr[..., 3], 0)
    # thin inner edge line along the chevron (graphic, no glow)
    for y in range(H):
        e = EDGE_L[y] if side == "L" else EDGE_R[y]
        xs = slice(max(0, e - 5), e) if side == "L" else slice(e, min(W, e + 5))
        arr[y, xs, :3] = GREEN; arr[y, xs, 3] = 255
    return Image.fromarray(arr, "RGBA")
if __name__ == "__main__":
    specs = json.load(open(sys.argv[1])); out = sys.argv[2]
    for k, sp in specs.items(): wing(sp, k.split("_")[1][0]).save(f"{out}/wing_{k}.png")
