"""S2 composition guide as a manga panel: ink line art + screentone, 3360x1440 (same size as SCREEN_overlay_21x9.png)."""
import math, numpy as np
from PIL import Image, ImageDraw, ImageFilter
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
W, H = 3360, 1440; INK = (12, 12, 12); PAPER = (250, 250, 247); MARK = (0, 255, 0); MARK2 = (255, 0, 255)
def tone(sp, r, ang=45):
    t = Image.new("L", (W, H), 255); d = ImageDraw.Draw(t); a = math.radians(ang)
    for i in range(-W // sp - 40, W // sp + 40):
        for j in range(-H // sp - 40, H // sp + 40):
            x = (i * math.cos(a) - j * math.sin(a)) * sp + W / 2; y = (i * math.sin(a) + j * math.cos(a)) * sp + H / 2
            if -10 < x < W + 10 and -10 < y < H + 10: d.ellipse([x - r, y - r, x + r, y + r], fill=0)
    return np.asarray(t)
T_LIGHT, T_MED, T_DARK = tone(14, 2.2), tone(12, 3.6), tone(11, 4.6)
def E(cx, cy, rx, ry, ang=0, n=90):
    a = math.radians(ang); return [(cx + rx * math.cos(t) * math.cos(a) - ry * math.sin(t) * math.sin(a), cy + rx * math.cos(t) * math.sin(a) + ry * math.sin(t) * math.cos(a)) for t in [2 * math.pi * i / n for i in range(n)]]
def capsule(p, q, w1, w2, n=14):
    dx, dy = q[0] - p[0], q[1] - p[1]; base = math.atan2(dy, dx); pts = []
    for i in range(n + 1): t = base - math.pi / 2 + math.pi * i / n; pts.append((q[0] + w2 / 2 * math.cos(t), q[1] + w2 / 2 * math.sin(t)))
    for i in range(n + 1): t = base + math.pi / 2 + math.pi * i / n; pts.append((p[0] + w1 / 2 * math.cos(t), p[1] + w1 / 2 * math.sin(t)))
    return pts
def shape(d, pts, fill, w, col=INK):
    d.polygon(pts, fill=fill); d.line(list(pts) + [pts[0], pts[1]], fill=col, width=w, joint="curve")
def apply_tone(img, mark, tarr):
    a = np.asarray(img).copy(); m = np.all(a[..., :3] == mark, -1)
    a[m, 0] = a[m, 1] = a[m, 2] = tarr[m]; return Image.fromarray(a)
# ---------------- background: dressing room (thin, light ink = out of focus)
bg = Image.new("RGB", (W, H), PAPER); d = ImageDraw.Draw(bg); BL = (70, 70, 70)
d.rectangle([0, 0, W, 250], fill=MARK2)                                                     # ceiling -> dark tone
for i, x in enumerate(range(-120, W, 300)):
    shape(d, [(x + 12, 270), (x + 288, 270), (x + 288, 1130), (x + 12, 1130)], PAPER, 4, BL)  # locker frame
    shape(d, [(x + 36, 300), (x + 264, 300), (x + 264, 1110), (x + 36, 1110)], MARK, 3, BL)   # opening -> light tone
    d.line([(x + 36, 336), (x + 264, 336)], fill=BL, width=3)                                # shelf
    jx = x + 150; d.line([(jx, 345), (jx, 400)], fill=BL, width=3); d.line([(jx - 45, 412), (jx, 395), (jx + 45, 412)], fill=BL, width=3)   # hanger
    jer = [(jx - 55, 420), (jx - 100, 470), (jx - 78, 525), (jx - 55, 508), (jx - 55, 720), (jx + 55, 720), (jx + 55, 508), (jx + 78, 525), (jx + 100, 470), (jx + 55, 420), (jx + 22, 412), (jx, 436), (jx - 22, 412)]
    shape(d, jer, PAPER, 3, BL)
shape(d, [(0, 1130), (W, 1130), (W, 1185), (0, 1185)], PAPER, 4, BL)                          # bench
for x in range(0, W, 46): d.line([(x, 1200), (x - 220, H)], fill=(150, 150, 150), width=2)  # floor hatching
bg = apply_tone(bg, MARK, T_LIGHT); bg = apply_tone(bg, MARK2, T_DARK)
dl = ImageDraw.Draw(bg)
for x in (420, 1180, 1980, 2760):                                                          # downlights with a little burst
    dl.ellipse([x - 72, 118, x + 72, 168], fill=PAPER, outline=INK, width=4)
    for k in range(10):
        a = math.pi * (0.05 + 0.9 * k / 9); dl.line([(x + 95 * math.cos(a), 143 + 40 * math.sin(a)), (x + 160 * math.cos(a), 143 + 85 * math.sin(a))], fill=PAPER, width=3)
bg = bg.filter(ImageFilter.GaussianBlur(1.6))
bg = Image.blend(bg, Image.new("RGB", (W, H), PAPER), 0.28)                                 # push the room back
# ---------------- figures
def player(s, hx, hy, w, jt, detail=True):
    """Seated on the bench, leaning forward, elbows on knees, head hanging in front of the shoulders, face toward the floor on the right."""
    L = Image.new("RGB", (W, H), MARK2); d = ImageDraw.Draw(L)
    a = math.radians(38); ax = (-math.sin(a), math.cos(a)); nx = (math.cos(a), math.sin(a))
    P = lambda u, v: (hx + (u * nx[0] + v * ax[0]) * s, hy + (u * nx[1] + v * ax[1]) * s)
    X = lambda x, y: (hx + x * s, hy + y * s)
    shape(d, capsule(X(-120, 520), X(260, 560), 240 * s, 220 * s), MARK, w)                   # thigh in shorts (below the screen band)
    shape(d, capsule(P(-70, 150), X(-250, 150), 175 * s, 200 * s), PAPER, w)                   # neck: back-left into the shoulders
    back = [X(-250, 95), X(-420, 150), X(-560, 300), X(-660, 620), X(-700, 900), X(60, 900), X(90, 560), X(20, 330), X(-60, 240)]
    shape(d, back, MARK, w)                                                                   # back + chest, leaning forward
    d.line([X(-250, 95), X(-150, 190), X(-60, 240)], fill=INK, width=int(15 * s) + 2)         # collar
    shape(d, E(*X(-330, 330), 160 * s, 160 * s), MARK, w)                                     # near shoulder
    shape(d, capsule(X(-330, 330), X(-130, 650), 200 * s, 175 * s), MARK, w)                  # upper arm in the sleeve
    d.line([X(-290, 560), X(-110, 520)], fill=INK, width=int(10 * s) + 2)                     # sleeve hem
    shape(d, capsule(X(-160, 600), X(-110, 680), 150 * s, 150 * s), PAPER, w)                 # bare arm to the elbow
    shape(d, capsule(X(-110, 680), X(250, 700), 140 * s, 125 * s), PAPER, w)                  # forearm resting on the knee
    shape(d, E(*X(285, 700), 68 * s, 55 * s), PAPER, w)                                       # hands together
    d.line([X(255, 678), X(318, 684)], fill=INK, width=max(2, int(4 * s))); d.line([X(252, 705), X(320, 712)], fill=INK, width=max(2, int(4 * s)))
    shape(d, E(hx, hy, 160 * s, 205 * s, 38), INK, w)                                          # skull (hair)
    face = [P(math.cos(t) * 146 + 18, math.sin(t) * 188 + 22) for t in [2 * math.pi * i / 90 for i in range(90)]]
    shape(d, face, PAPER, w)
    shape(d, E(*P(-70, -92), 140 * s, 120 * s, 38), INK, w)                                   # hair over crown and back
    shape(d, E(*P(-58, 22), 29 * s, 44 * s, 38), PAPER, max(2, int(w * 0.8)))                 # ear
    d.arc([*P(-72, 2), *P(-44, 44)], 90, 270, fill=INK, width=max(2, int(4 * s)))
    d.polygon([P(148, -8), P(194, 62), P(148, 80)], fill=PAPER); d.line([P(148, -8), P(194, 62), P(158, 80)], fill=INK, width=w)   # nose
    if detail:
        d.line([P(80, -52), P(140, -50)], fill=INK, width=int(9 * s))                        # brow, relaxed
        d.arc([*P(82, -22), *P(140, 26)], 20, 160, fill=INK, width=int(7 * s))               # closed eye
        d.line([P(116, 122), P(148, 127)], fill=INK, width=int(6 * s))                        # mouth
        for k in range(5): d.line([P(-40 + 14 * k, 62), P(-60 + 14 * k, 150)], fill=INK, width=max(2, int(3 * s)))   # shadow by the ear
        for k in range(6): d.line([P(-10 + 16 * k, 212), P(-40 + 16 * k, 262)], fill=INK, width=max(2, int(3 * s)))   # under the chin
    L = apply_tone(L, MARK, jt); arr = np.asarray(L); alpha = np.where(np.all(arr == MARK2, -1), 0, 255).astype(np.uint8)
    return Image.fromarray(np.dstack([arr, alpha]), "RGBA")
panel = bg.convert("RGBA")
for args in ((0.30, 2120, 905, 3, T_LIGHT, False), (0.40, 1985, 860, 3, T_LIGHT, False), (0.55, 1820, 800, 4, T_MED, False), (1.0, 1480, 650, 8, T_DARK, True)):
    panel.alpha_composite(player(*args))
panel.convert("RGB").save(R + "frames_screen/expand_v8/S2_concentracion__MANGA_guide.png")
ov = Image.open(R + "frames_screen/expand_v8/SCREEN_overlay_21x9.png"); both = panel.copy(); both.alpha_composite(ov)
both.convert("RGB").save(R + "frames_screen/expand_v8/S2_concentracion__MANGA_with_overlay.png")
both.convert("RGB").resize((1680, 720), Image.LANCZOS).save(R + "qc/s2_manga_prev.jpg", quality=90)
