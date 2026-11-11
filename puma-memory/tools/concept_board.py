"""Concept board: 'una imagen, una pantalla' — one panoramic image across all 19 m per slide; light pulls the KV green over the centre; text on top."""
import sys, math, importlib.util, numpy as np, cv2
cfg, out = sys.argv[1], sys.argv[2]
sys.argv = ["x", cfg]
spec = importlib.util.spec_from_file_location("sb", sys.argv[0].replace("x", "") or "", submodule_search_locations=None)
spec = importlib.util.spec_from_file_location("sb", "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/tools/storyboard_v3.py")
sb = importlib.util.module_from_spec(spec); spec.loader.exec_module(sb)
W, H, CX = sb.W, sb.H, sb.CX
XX = np.arange(W, dtype=np.float32)[None, :]
def veil(strength):   # KV green over the centre, fading out toward the sides where the photo stays 'en pleno'
    d = np.abs(XX - CX); a = np.clip(1 - (d - 330) / 330, 0, 1) ** 1.3 * 0.93 * strength
    return a[..., None]
def pano(img, s, cx, cy): v, vi = sb.view(img, (0, 0, W, H), s, cx, cy); return v, vi
SL = [("S1 · BOTINES", "boots", 1.65, 0.49, 0.58, (0.38, 0.56), ["B1", "B2"]),
      ("S2 · CONCENTRACIÓN", "conc", 1.0, 0.50, 0.36, (0.36, 0.22), ["B3", "B4"]),
      ("S3 · HUDDLE", "huddle", 1.0, 0.50, 0.45, (0.475, 0.55), ["B5", "B6"]),
      ("S4 · COMPAÑERISMO", "comp", 1.0, 0.50, 0.50, (0.44, 0.45), ["B7", "B8", "B9"])]
rows = []
for name, key, s, cx, cy, subj, beats in SL:
    img = sb.IMG[key]; v, vi = pano(img, s, cx, cy); sx, sy = sb.to_canvas((0, 0, W, H), vi, *subj, img)
    # (a) image moment: the full scene on the whole screen, the light is born at the subject
    L = np.zeros((H, W, 3), np.float32); sb.bloom(L, sx, sy, 22, 1.0)
    path = sb.catmull([(sx, sy), (sx + 120, sy - 40), (sx + 260, sy - 20)], 80); sb.ribbon(L, path, 0.9, 1.0, strands=6, spread=8, seed=3)
    a = np.clip((v + sb.glow(L)) * sb.VIS, 0, 255).astype(np.uint8); rows.append((name + " — 1. imagen en toda la pantalla", a))
    # (b) text moments: green pulled over the centre, image kept at the sides
    for k, bid in enumerate(beats if len(beats) < 3 else [beats[-1]]):
        fr = v * (1 - veil(1.0)) + (sb.WIDE_BG + sb.WIDE_BM * 0.5) * veil(1.0)
        L = np.zeros((H, W, 3), np.float32)
        b = next(bb for bb in sb.BEATS if bb["id"] == bid); show = [b] if len(beats) < 3 else [bb for bb in sb.BEATS if bb["id"] in beats]
        for bb in show:
            sb.CUR_F = bb["impact"] + 40
            for (items, rng_), has_rules, ld in sb.T_LINES[bb["id"]]:
                sb.draw_line(fr, L, items, bb["impact"] + ld, 99999, 1.0)
                if has_rules: sb.rules(fr, L, items[0]["y"] + items[0]["size"] * 0.62, rng_, bb["impact"] + ld, 99999)
        tail = sb.catmull([(sx, sy), ((sx + CX) / 2, sy - 60), (CX - 300, b["y_hit"] + 40), (CX + 500, b["y_hit"] + 70)], 200)
        sb.ribbon(L, tail, 0.7, 1.0, strands=5, spread=6, seed=7); sb.bloom(L, sx, sy, 18, 0.6)
        img2 = np.clip((fr + sb.glow(L)) * 1.08 * sb.VIS, 0, 255).astype(np.uint8)
        rows.append((name + f" — {k + 2}. texto (la luz trae el verde al centro)", img2))
# close as in v4 (Andrés real photo, corporate card)
sb.CUR_F = 0; cl = sb.render(700).astype(np.uint8); rows.append(("CIERRE — CON USTEDES, ANDRÉS SILVA", cl))
from PIL import Image, ImageDraw, ImageFont
fnt = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
board = Image.new("RGB", (W, (H + 36) * len(rows)), (16, 18, 17)); d = ImageDraw.Draw(board)
for i, (lbl, im) in enumerate(rows):
    y = i * (H + 36); d.text((12, y + 6), lbl, font=fnt, fill=(127, 255, 0)); board.paste(Image.fromarray(im), (0, y + 34))
board.save(out, quality=90); print("board", board.size, len(rows))
