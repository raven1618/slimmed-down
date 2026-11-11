"""Layout board: how each slide's frame is composed for the die-cut screen (4:1 frame, 5.43:1 screen strip)."""
import cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
SW, SH = 1920, 356                      # strip coords (same as the storyboard canvas)
dm = cv2.resize(cv2.imread(R + "puma-kb/sources/S09-piloto-aprobado/diecut_mask_pilot.png", 0), (SW, SH), interpolation=cv2.INTER_NEAREST) > 127
dm[:4] = dm[4]; dm[-4:] = dm[-5]
FW = 1600; FH = FW // 4; S = FW / SW; STRIP_H = int(round(SH * S)); OY = (FH - STRIP_H) // 2
def P(x, y): return (x * S, OY + y * S)
fb = R + "drive-dl/GothamCondensed-Black.otf"; fbo = R + "drive-dl/GothamCondensed-Bold.otf"
dj = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"; djb = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
LIME = (127, 255, 0); WHITE = (255, 255, 255)
HERO = (214, 150, 60); CTX = (70, 130, 170); SIL = (205, 205, 205)

SLIDES = [
 dict(id="S1", name="BOTINES", hero="L",
      copy=[("LOS GRANDES", "bold", 34, 92, WHITE), ("RESULTADOS", "black", 118, 222, LIME)],
      copy2=[("NO EMPIEZAN", "black", 70, 102, WHITE), ("EN LA", "bold", 30, 146, WHITE), ("CANCHA", "black", 118, 268, LIME)],
      birth=(215, 225), beat2=("R", (1790, 160)),
      L="Hands lacing the black boot, green sock, wet tunnel floor (close-up)",
      C="Dark tunnel walls and ceiling; wet floor reflections along the bottom (calm, behind the copy)",
      R="Tunnel exit: teammates in green walking out into the floodlit pitch",
      why="The light is born at the laces; the 2nd beat ('…EN LA CANCHA') comes from the pitch side"),
 dict(id="S2", name="CONCENTRACIÓN", hero="R",
      copy=[("EMPIEZAN", "black", 96, 118, WHITE)], copy2=[("EN LA", "bold", 30, 160, WHITE), ("MENTE", "black", 138, 304, LIME)],
      birth=(1690, 105), beat2=("L", (130, 170)),
      L="Teammates seated in a row, heads bowed, soft focus",
      C="Dark locker room / dugout, teal rim light, soft bokeh (calm, behind the copy)",
      R="The player in profile, head bowed, eyes closed, facing the centre",
      why="The light is born at his temple ('…EN LA MENTE'); the 2nd beat comes from the teammates"),
 dict(id="S3", name="HUDDLE", hero="L",
      copy=[("CON", "bold", 44, 140, WHITE), ("LÍDERES", "black", 112, 140, WHITE)], copy2=[("QUE", "bold", 44, 284, LIME), ("INSPIRAN", "black", 112, 284, LIME)],
      birth=(282, 42), beat2=("R", (1790, 170)),
      L="The captain (#10, armband) looking up, index finger raised high",
      C="Low angle from inside the huddle: open night sky and floodlight haze; tops of heads along the bottom edge",
      R="Two teammates leaning in, faces lit, looking at the captain",
      why="The light is born at the captain's fingertip; the 2nd beat answers from the teammates"),
 dict(id="S4", name="COMPAÑERISMO", hero="R",
      copy=[("Y ENTIENDEN QUE", "black", 44, 82, WHITE), ("NINGUNA VICTORIA", "black", 96, 192, LIME)], copy2=[("SE CONSIGUE SOLO", "black", 60, 272, WHITE)],
      birth=(1445, 222), beat2=("LR", (130, 200)),
      L="A teammate running in from the left toward the centre",
      C="Golden-hour stadium and crowd; the fallen player sits on the grass, lower right, reaching up",
      R="The helper leaning in from the right, pulling him up: the clasp sits just inside the centre panel",
      why="The light is born at the clasp; the last beat comes from both sides: nobody wins alone"),
]

def font(kind, px): return ImageFont.truetype({"black": fb, "bold": fbo}[kind], max(8, int(px * S)))
def draw_copy(img, lines):
    d = ImageDraw.Draw(img); rows = {}
    for t, k, px, y, col in lines: rows.setdefault(y, []).append((t, k, px, col))
    for y, runs in rows.items():
        fs = [font(k, px) for _, k, px, _ in runs]; ws = [d.textlength(t, font=f) for (t, *_), f in zip(runs, fs)]; gap = 8 * S
        x = FW / 2 - (sum(ws) + gap * (len(runs) - 1)) / 2
        for (t, k, px, col), f, w in zip(runs, fs, ws):
            d.text((x, OY + y * S), t, font=f, fill=col + (235,), anchor="ls"); x += w + gap

def silhouettes(d, sid):
    def E(x0, y0, x1, y1): d.ellipse([P(x0, y0), P(x1, y1)], fill=SIL + (150,))
    def Poly(pts): d.polygon([P(*p) for p in pts], fill=SIL + (150,))
    def Line(pts, w): d.line([P(*p) for p in pts], fill=SIL + (150,), width=int(w * S))
    if sid == "S1":
        Poly([(40, 330), (70, 268), (210, 250), (330, 300), (330, 336), (40, 340)])   # boot
        Line([(175, 0), (190, 250)], 70)                                              # sock/leg
        E(95, 175, 200, 245); E(205, 185, 300, 250)                                    # hands
        d.rectangle([P(1690, 40), P(1919, 320)], fill=(255, 240, 200, 70))           # bright tunnel mouth
        for x, s in ((1730, 1.0), (1800, 0.85), (1860, 0.7)):
            E(x - 12 * s, 150, x + 12 * s, 150 + 24 * s); Line([(x, 175), (x, 175 + 110 * s)], 26 * s)
    if sid == "S2":
        E(1600, 40, 1810, 250); Poly([(1560, 356), (1600, 240), (1850, 230), (1919, 300), (1919, 356)])
        for x, y, r in ((120, 190, 62), (250, 215, 50)):
            E(x - r, y - r, x + r, y + r)
        Poly([(20, 356), (60, 250), (320, 260), (360, 356)])
    if sid == "S3":
        E(60, 140, 235, 330); Line([(270, 356), (282, 150), (282, 45)], 34); E(250, 120, 315, 200)   # captain + arm + fist
        d.ellipse([P(840, -40), P(1080, 70)], fill=(255, 255, 230, 60))              # floodlight haze
        for x in (520, 700, 1220, 1400): E(x - 70, 318, x + 70, 400)                  # tops of heads at the bottom
        E(1600, 90, 1760, 270); E(1730, 140, 1900, 330)
    if sid == "S4":
        E(60, 50, 160, 150); Line([(110, 150), (150, 260), (90, 356)], 46); Line([(150, 260), (240, 356)], 40); Line([(110, 170), (220, 120)], 30)  # runner
        E(1720, 20, 1830, 130); Line([(1775, 120), (1720, 260), (1760, 356)], 70); Line([(1730, 150), (1455, 215)], 30)  # helper
        E(1215, 215, 1300, 300); Line([(1250, 300), (1300, 356)], 70); Line([(1290, 260), (1440, 225)], 26)            # seated + arm

def row(sl):
    base = Image.new("RGBA", (FW, FH), (28, 28, 30, 255)); ov = Image.new("RGBA", (FW, FH), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    vis = ~dm
    # zones: hero side tinted warm, other side cool, centre text zone neutral dark
    zx = np.zeros((SH, SW, 4), np.uint8); xx = np.arange(SW)[None, :]
    left = (xx < 640) & vis; right = (xx > 1280) & vis; mid = vis & ~left & ~right
    hc = HERO if sl["hero"] == "L" else CTX; oc = CTX if sl["hero"] == "L" else HERO
    zx[left] = hc + (95,); zx[right] = oc + (95,); zx[mid] = (60, 60, 64, 255)
    zx[dm] = (0, 0, 0, 255)
    z = Image.fromarray(zx, "RGBA").resize((FW, STRIP_H), Image.NEAREST); base.alpha_composite(z, (0, OY))
    silhouettes(d, sl["id"]); base.alpha_composite(ov)
    # copy (both beats, faded) inside the centre panel
    cp = Image.new("RGBA", (FW, FH), (0, 0, 0, 0)); draw_copy(cp, sl["copy"] + sl["copy2"]); base.alpha_composite(cp)
    # light: birth at the hero + 2nd beat entering from the side
    gl = Image.new("RGBA", (FW, FH), (0, 0, 0, 0)); g = ImageDraw.Draw(gl)
    bx, by = P(*sl["birth"]); g.ellipse([bx - 22, by - 22, bx + 22, by + 22], fill=LIME + (140,))
    gl = gl.filter(ImageFilter.GaussianBlur(9)); g = ImageDraw.Draw(gl); g.ellipse([bx - 7, by - 7, bx + 7, by + 7], fill=(235, 255, 220, 255))
    sides = {"L": [(40, 170)], "R": [(1880, 170)], "LR": [(40, 200), (1880, 200)]}[sl["beat2"][0]]
    for sx, sy in sides:
        a = P(sx, sy); b = P(760 if sx < 960 else 1160, 200)
        g.line([a, b], fill=LIME + (230,), width=3); ang = np.arctan2(b[1] - a[1], b[0] - a[0])
        g.polygon([b, (b[0] - 14 * np.cos(ang - .45), b[1] - 14 * np.sin(ang - .45)), (b[0] - 14 * np.cos(ang + .45), b[1] - 14 * np.sin(ang + .45))], fill=LIME + (230,))
    base.alpha_composite(gl)
    d = ImageDraw.Draw(base)
    d.rectangle([0, OY, FW - 1, OY + STRIP_H], outline=(140, 255, 60, 255), width=2)
    d.text((8, 6), f"{sl['id']} · {sl['name']}", font=ImageFont.truetype(djb, 17), fill=WHITE)
    d.text((FW - 8, 8), "4:1 frame · green line = what the screen shows (5.43:1)", font=ImageFont.truetype(dj, 13), fill=(170, 170, 170), anchor="ra")
    d.text((8, FH - 22), "extra height: camera moves / 21:9 for Seedance", font=ImageFont.truetype(dj, 12), fill=(120, 120, 120))
    # caption block
    cap = Image.new("RGBA", (FW, 112), (16, 16, 18, 255)); c = ImageDraw.Draw(cap); f = ImageFont.truetype(dj, 15); fbld = ImageFont.truetype(djb, 15)
    c.text((10, 8), "LEFT:", font=fbld, fill=HERO if sl["hero"] == "L" else CTX); c.text((70, 8), sl["L"], font=f, fill=(225, 225, 225))
    c.text((10, 32), "CENTRE:", font=fbld, fill=(200, 200, 200)); c.text((90, 32), sl["C"], font=f, fill=(225, 225, 225))
    c.text((10, 56), "RIGHT:", font=fbld, fill=HERO if sl["hero"] == "R" else CTX); c.text((78, 56), sl["R"], font=f, fill=(225, 225, 225))
    c.text((10, 82), "LIGHT: " + sl["why"], font=fbld, fill=LIME)
    out = Image.new("RGBA", (FW, FH + 112)); out.alpha_composite(base); out.alpha_composite(cap, (0, FH)); return out

rows = [row(s) for s in SLIDES]
head = Image.new("RGBA", (FW, 92), (10, 10, 10, 255)); h = ImageDraw.Draw(head)
h.text((10, 10), "Andrés Silva · frames composed for the die-cut screen", font=ImageFont.truetype(djb, 24), fill=WHITE)
h.text((10, 46), "Warm = hero side (subject + where the light is born) · blue = answering side · grey = copy zone (calm background) · black = die-cut", font=ImageFont.truetype(dj, 15), fill=(200, 200, 200))
h.text((10, 68), "The hero alternates sides (L, R, L, R) so the light keeps the same behaviour: born at the subject in a side panel → enters the centre → answered from the other side", font=ImageFont.truetype(dj, 15), fill=(200, 200, 200))
board = Image.new("RGBA", (FW, 92 + sum(r.height + 10 for r in rows)), (10, 10, 10, 255)); board.alpha_composite(head); y = 92
for r in rows: board.alpha_composite(r, (0, y)); y += r.height + 10
board.convert("RGB").save(R + "frames_screen/Layout_frames_pantalla.jpg", quality=92)
print(board.size, "strip", OY, STRIP_H)
