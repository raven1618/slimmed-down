"""Close swap (client, Nov 18, all teasers): after the name card has been shown in the centre panel, the speaker's
name + title move to the side panels, under the speaker, and the centre panel shows the generic event KV lockup
(Puma Energy logo + CONVOCADOS A JUGAR EN GRANDE).
Config: C["outro"]["swap"] = frame of the swap. B11 (name card) exits at the swap; logo + rule fade out (renderer)."""
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
GREEN = (127, 255, 0)
COLS = {"white": (255, 255, 255), "lime": GREEN}


def _kv_lockup(h_target):
    a = cv2.cvtColor(cv2.imread(R + "kv/kv_full.png"), cv2.COLOR_BGR2RGB).astype(np.float32)
    b = cv2.cvtColor(cv2.imread(R + "kv/kv_bg_beams.png"), cv2.COLOR_BGR2RGB).astype(np.float32)
    x0, x1, y0, y1 = 718, 1202, 330, 750
    rgb = a[y0:y1, x0:x1]; d = np.abs(a - b).max(2)[y0:y1, x0:x1]
    al = np.clip((d - 12) / 150, 0, 1)
    s = h_target / rgb.shape[0]
    rgb = cv2.resize(rgb, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    al = cv2.resize(al, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    rgb = np.where(al[..., None] > 0.05, np.maximum(rgb, 0), rgb)  # keep KV colours (white + lime JUGAR)
    return rgb, al


def _font(k, s):
    return ImageFont.truetype(R + f"drive-dl/GothamCondensed-{dict(black='Black', bold='Bold', medium='Medium')[k]}.otf", s)


class CloseSwap:
    def __init__(self, C, sb, W, H, CX, CY):
        self.on = "swap" in C["outro"]
        if not self.on: return
        self.sw = C["outro"]["swap"]; self.W, self.H, self.CX, self.CY = W, H, CX, CY
        self.kv_rgb, self.kv_a = _kv_lockup(int(H * 0.70))
        b11 = next(b for b in C["beats"] if b["id"] == "B11")
        name = [(t, k, c) for t, k, s, c in b11["lines"][0]["runs"]]
        role = b11["lines"][1]["runs"][0][0]
        # per wing: label under the speaker, fitted to the chevron width at the bottom of the panel
        self.lab = {}
        for side in "LR":
            m = np.asarray(sb.MASK[side]) > 0.5
            y_name, y_role = int(H * 0.80), int(H * 0.93)
            def span(y0, y1):
                cols = np.where(m[y0:y1].all(0))[0]
                return (cols.min(), cols.max()) if len(cols) else (0, 0)
            xa, xb = span(y_name - 30, y_role + 6)
            wmax = (xb - xa) - 16
            L = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
            for ns in range(40, 12, -1):  # name size fitted to the wing
                fn = _font("black", ns); wn = sum(d.textlength(t + " ", font=fn) for t, _, _ in name) - d.textlength(" ", font=fn)
                if wn <= wmax: break
            for rs in range(int(ns * 0.5), 8, -1):
                fr_ = _font("medium", rs); wr = d.textlength(role, font=fr_)
                if wr <= wmax: break
            cx = (xa + xb) / 2; x = cx - wn / 2
            for t, k, c in name:
                d.text((x, y_name), t, font=fn, fill=COLS.get(c, (255, 255, 255)), anchor="ls"); x += d.textlength(t + " ", font=fn)
            d.text((cx - wr / 2, y_role), role, font=fr_, fill=(255, 255, 255), anchor="ls")
            lab = np.array(L).astype(np.float32)
            # soft dark band behind the label, inside the wing only (legibility over the speaker's legs)
            yy = np.arange(H)[:, None]
            band = np.clip((yy - (y_name - ns - 18)) / 30.0, 0, 1) * 0.62 * m
            self.lab[side] = (lab, band[..., None].astype(np.float32))

    def frame_out(self, f):  # 1 -> 0 over the swap: name card logo + rule fade out
        return 1.0 if not self.on else 1.0 - float(np.clip((f - self.sw) / 8.0, 0, 1))

    def apply(self, fr, f):
        if not self.on or f < self.sw: return fr
        a_kv = float(np.clip((f - self.sw - 4) / 12.0, 0, 1)); a_kv = a_kv * a_kv * (3 - 2 * a_kv)
        if a_kv > 0:
            sc = 1.06 - 0.06 * a_kv
            rgb = cv2.resize(self.kv_rgb, None, fx=sc, fy=sc); al = cv2.resize(self.kv_a, None, fx=sc, fy=sc)[..., None] * a_kv
            h, w = al.shape[:2]; x0, y0 = int(self.CX - w / 2), int(self.CY - h / 2)
            fr[y0:y0 + h, x0:x0 + w] = fr[y0:y0 + h, x0:x0 + w] * (1 - al) + rgb * al
        a_l = float(np.clip((f - self.sw - 2) / 12.0, 0, 1)); a_l = a_l * a_l * (3 - 2 * a_l)
        if a_l > 0:
            for side in "LR":
                lab, band = self.lab[side]
                fr = fr * (1 - band * a_l)
                dy = int(10 * (1 - a_l)); la = np.roll(lab, dy, axis=0)
                al = la[..., 3:] / 255.0 * a_l
                fr = fr * (1 - al) + la[..., :3] * al
        return fr
