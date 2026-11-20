"""Pre-pass for the sphere placas: square crop per photo (framed for the front disc, with margin for the camera move),
subject matte (BiRefNet, people only) and a clean plate behind the subject (inpaint) -> esfera_in/placas/<id>.npz.
Framing table PLACAS is shared with sphere_render_v2.py."""
import sys, os, cv2, numpy as np
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
IN = R + "esfera_in/"; OUTD = IN + "placas/"; os.makedirs(OUTD, exist_ok=True)
SQ = 1800    # stored square (disc 1296 x ~1.39 margin for moves)
# id: (file, cx, cy, size = crop side as fraction of the photo's short side, person matte?)
PLACAS = {
    "km":       ("1_km/SAN ANTONIO 03.jpg", 0.60, 0.52, 1.00, False),
    "cilindro": ("2_entrega/p2_cilindro.png", 0.80, 0.50, 1.00, True),
    "planta":   ("2_entrega/p3_aerea02.jpg", 0.50, 0.55, 1.00, False),
    "convoy":   ("2_entrega/p4_convoy.png", 0.55, 0.55, 1.00, False),
    "ladario":  ("2_entrega/p4_ladario03.jpg", 0.48, 0.55, 1.00, False),
    "pico":     ("2_entrega/p5_DSC3209.tif", 0.55, 0.50, 1.00, True),
    "eess":     ("3_destino/p1_eess.jpg", 0.55, 0.50, 1.00, False),
    "aero":     ("3_destino/p2_aeropuerto.jpg", 0.36, 0.55, 0.95, False),   # airline tail (right) kept out
    "calidad":  ("4_calidad/RFV1561.jpg", 0.80, 0.50, 0.75, True),          # car-maker grille kept out
    "sa01":     ("1_km/SAN ANTONIO 01.jpg", 0.5, 0.5, 1.0, False),
    "sa02":     ("1_km/SAN ANTONIO 02.jpg", 0.5, 0.5, 1.0, False),
    "aerea01":  ("2_entrega/p3_aerea01.jpg", 0.5, 0.5, 1.0, False),
    "aerea03":  ("2_entrega/p3_aerea03.jpg", 0.5, 0.5, 1.0, False),
}
def build(k):
    f, cx, cy, sz, person = PLACAS[k]
    im = cv2.imread(IN + f, cv2.IMREAD_COLOR); im = cv2.cvtColor(im, cv2.COLOR_BGR2RGB); h, w = im.shape[:2]
    side = int(min(h, w) * sz); x0 = int(np.clip(cx * w - side / 2, 0, w - side)); y0 = int(np.clip(cy * h - side / 2, 0, h - side))
    sq = cv2.resize(im[y0:y0 + side, x0:x0 + side], (SQ, SQ), interpolation=cv2.INTER_AREA if side > SQ else cv2.INTER_CUBIC)
    a = np.zeros((SQ, SQ), np.float32); bg = sq
    if person:
        sys.path.insert(0, R + "tools"); from matte_birefnet import matte
        a = matte(sq).astype(np.float32); a = cv2.GaussianBlur(a, (0, 0), 1.2)
        hole = cv2.dilate((a > 0.12).astype(np.uint8), np.ones((31, 31), np.uint8)) * 255
        small = cv2.resize(sq, (SQ // 3, SQ // 3)); hs = cv2.resize(hole, (SQ // 3, SQ // 3), interpolation=cv2.INTER_NEAREST)
        bgs = cv2.inpaint(small, hs, 9, cv2.INPAINT_TELEA); bg = np.where(hole[..., None] > 0, cv2.resize(bgs, (SQ, SQ), interpolation=cv2.INTER_CUBIC), sq)
    np.savez_compressed(OUTD + k + ".npz", img=sq, alpha=(a * 255).astype(np.uint8), bg=bg.astype(np.uint8))
    return sq, a

if __name__ == "__main__":
    keys = sys.argv[1].split(",") if len(sys.argv) > 1 else list(PLACAS)
    tiles = []
    for k in keys:
        sq, a = build(k); t = cv2.resize(sq, (300, 300)); am = cv2.resize(a, (300, 300))
        t2 = (t * 0.35 + np.array([0, 255, 0]) * 0.65 * am[..., None] + t * 0.65 * (1 - am[..., None])).astype(np.uint8) if a.max() > 0 else t
        cv2.putText(t2, k, (6, 24), 0, 0.7, (255, 255, 0), 2); tiles.append(t2); print(k, flush=True)
    while len(tiles) % 5: tiles.append(np.zeros_like(tiles[0]))
    cv2.imwrite(R + "qc/_placas.jpg", cv2.cvtColor(np.vstack([np.hstack(tiles[i:i + 5]) for i in range(0, len(tiles), 5)]), cv2.COLOR_RGB2BGR))
