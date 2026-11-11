"""S2 composition sketch (shapes only, no text) at 3360x1440 = same size as SCREEN_overlay_21x9.png."""
import math
from PIL import Image, ImageDraw, ImageFilter
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
W, H = 3360, 1440
def E(cx, cy, rx, ry, ang=0, n=72):
    a = math.radians(ang); return [(cx + rx * math.cos(t) * math.cos(a) - ry * math.sin(t) * math.sin(a),
                                    cy + rx * math.cos(t) * math.sin(a) + ry * math.sin(t) * math.cos(a)) for t in [2 * math.pi * i / n for i in range(n)]]
def limb(d, p, q, w1, w2, col):
    dx, dy = q[0] - p[0], q[1] - p[1]; L = math.hypot(dx, dy); nx, ny = -dy / L, dx / L
    d.polygon([(p[0] + nx * w1 / 2, p[1] + ny * w1 / 2), (q[0] + nx * w2 / 2, q[1] + ny * w2 / 2), (q[0] - nx * w2 / 2, q[1] - ny * w2 / 2), (p[0] - nx * w1 / 2, p[1] - ny * w1 / 2)], fill=col)
    d.ellipse([p[0] - w1 / 2, p[1] - w1 / 2, p[0] + w1 / 2, p[1] + w1 / 2], fill=col); d.ellipse([q[0] - w2 / 2, q[1] - w2 / 2, q[0] + w2 / 2, q[1] + w2 / 2], fill=col)
# ---------- background: dressing room, telephoto (close, soft)
bg = Image.new("RGB", (W, H), (34, 44, 40)); d = ImageDraw.Draw(bg)
d.rectangle([0, 0, W, 250], fill=(26, 28, 28))                                                    # ceiling
for x in (420, 1180, 1980, 2760): d.ellipse([x - 70, 120, x + 70, 165], fill=(240, 232, 205))       # recessed downlights
for i, x in enumerate(range(-120, W, 300)):                                                       # wooden locker bays along the wall
    d.rectangle([x + 12, 270, x + 288, 1130], fill=(92, 78, 62)); d.rectangle([x + 34, 300, x + 266, 1110], fill=(52, 46, 40))
    d.rectangle([x + 34, 300, x + 266, 330], fill=(92, 78, 62))                                    # shelf
    jx = x + 150; d.polygon([(jx - 55, 420), (jx - 95, 470), (jx - 75, 520), (jx - 55, 505), (jx - 55, 700), (jx + 55, 700), (jx + 55, 505), (jx + 75, 520), (jx + 95, 470), (jx + 55, 420), (jx + 22, 412), (jx, 432), (jx - 22, 412)], fill=(46, 110, 80))   # hanging jersey
d.rectangle([0, 1130, W, 1185], fill=(110, 92, 70)); d.rectangle([0, 1185, W, H], fill=(30, 32, 32))  # bench along the lockers + floor
bg = bg.filter(ImageFilter.GaussianBlur(14))                                                       # shallow depth of field
img = bg.copy()
def player(s, hx, hy, depth_blur, skin, jersey, hair, layer_on, rim=True):
    """Seated, leaning forward, head bowed toward the floor on the right. Head length = 420*s."""
    L = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    a = math.radians(25); ax = (-math.sin(a), math.cos(a)); nx = (math.cos(a), math.sin(a))     # crown->chin axis, face normal
    P = lambda u, v: (hx + (u * nx[0] + v * ax[0]) * s, hy + (u * nx[1] + v * ax[1]) * s)        # u: toward the face, v: toward the chin
    X = lambda x, y: (hx + x * s, hy + y * s)
    # torso: back on the left, chest leaning forward on the right, near shoulder rounded
    d.polygon([X(-120, 250), X(-330, 300), X(-470, 420), X(-560, 800), X(-600, 1000), X(170, 1000), X(150, 600), X(60, 330)], fill=jersey)
    d.ellipse([*X(-470, 300), *X(-130, 640)], fill=jersey)                                          # near shoulder (deltoid)
    limb(d, X(-300, 470), X(-120, 860), 230 * s, 190 * s, jersey)                                   # upper arm in sleeve
    limb(d, X(-150, 790), X(-110, 870), 170 * s, 170 * s, skin)                                     # arm below the sleeve
    limb(d, X(-110, 870), X(240, 960), 150 * s, 130 * s, skin)                                      # forearm resting on the knee
    d.ellipse([*X(200, 900), *X(330, 1010)], fill=skin)                                             # hands together
    limb(d, P(-40, 150), X(-120, 300), 170 * s, 200 * s, skin)                                      # neck down into the shoulders
    # head: skull, face toward lower right, hair on crown and back, ear, nose
    d.polygon(E(hx, hy, 165 * s, 210 * s, 25), fill=hair)
    d.polygon([P(u * 150 + 18, v * 192 + 20) for (u, v) in [(math.cos(t), math.sin(t)) for t in [2 * math.pi * i / 72 for i in range(72)]]], fill=skin)
    d.polygon(E(*P(-70, -95), 140 * s, 120 * s, 25), fill=hair)                                     # hair cap over crown and back
    d.polygon(E(*P(-60, 20), 30 * s, 46 * s, 25), fill=tuple(int(c * 0.82) for c in skin))          # ear
    d.polygon([P(150, -10), P(198, 60), P(150, 78)], fill=skin)                                     # nose pointing down-right
    if rim: d.line([P(160, -120), P(172, -40), P(165, 60), P(140, 150), P(95, 205)], fill=(120, 205, 190), width=max(2, int(7 * s)))   # teal rim on the face
    if depth_blur: L = L.filter(ImageFilter.GaussianBlur(depth_blur))
    layer_on.alpha_composite(L)
canvas = img.convert("RGBA")
# teammates seated beside him, receding to the right along the bench (back to front), then the hero
player(0.28, 2060, 1030, 5, (128, 118, 108), (40, 66, 54), (24, 22, 20), canvas, rim=False)
player(0.38, 1935, 945, 3, (140, 129, 118), (42, 70, 57), (24, 22, 20), canvas, rim=False)
player(0.52, 1800, 850, 1.5, (156, 144, 132), (44, 74, 60), (22, 20, 18), canvas, rim=False)
player(1.00, 1480, 640, 0, (196, 178, 160), (40, 76, 60), (18, 17, 16), canvas)
sk = canvas.convert("RGB"); sk.save(R + "frames_screen/expand_v8/S2_concentracion__SKETCH_guide.png")
ov = Image.open(R + "frames_screen/expand_v8/SCREEN_overlay_21x9.png"); both = canvas.copy(); both.alpha_composite(ov)
both.convert("RGB").save(R + "frames_screen/expand_v8/S2_concentracion__SKETCH_with_overlay.png")
both.convert("RGB").resize((1680, 720)).save(R + "qc/s2_sketch_prev.jpg", quality=88)
