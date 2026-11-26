"""Break loop in the teaser format (user, Nov 26): same die-cut frame as the teasers.
Wings: the client's neon football footage (where the speaker stands in the teasers), over the teaser wing background.
Centre: teaser green panel (moving light band) + KV lockup | BREAK. Seamless loop."""
import sys, math, numpy as np, cv2, subprocess
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
MODE = sys.argv[1] if len(sys.argv) > 1 else "video"
src = open(R + "tools/storyboard_v24.py").read().split("\nif only:")[0]
sys.argv = ["sb", R + "tools/cfg_carolina.json"]; g = {"__name__": "sbmod"}; exec(compile(src, "storyboard_v24", "exec"), g)
sb, W, H, CX, CY = g["sb"], g["W"], g["H"], g["CX"], g["CY"]
from PIL import Image, ImageDraw, ImageFont
# --- neon clip (client), looped with a crossfade so the wing plays seamlessly
cap = cv2.VideoCapture(R + "closing/neon_sq.mp4"); NE = []
while True:
    ok, fr = cap.read()
    if not ok: break
    NE.append(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB))
NFPS = 30; XF = 12                                   # 0.4 s crossfade tail -> head
LN = len(NE) - XF                                    # neon loop length in frames
def neon_at(k):
    k %= LN
    if k < XF:
        a = (k + 0.5) / XF; return NE[k].astype(np.float32) * a + NE[LN + k].astype(np.float32) * (1 - a)
    return NE[k].astype(np.float32)
N = 2 * LN; DUR = N / NFPS                            # two neon cycles; the centre light band crosses once
# --- centre type: KV lockup (client artwork) | lime rule | BREAK
lk = Image.open(R + "kv/kv_logo_rgba.png").convert("RGBA")
lh = int(H * 0.62); lk = lk.resize((int(lk.width * lh / lk.height), lh), Image.LANCZOS)
F = ImageFont.truetype(R + "drive-dl/GothamCondensed-Black.otf", int(H * 0.56))
d0 = ImageDraw.Draw(Image.new("L", (8, 8))); bb = d0.textbbox((0, 0), "BREAK", font=F); tw, th = bb[2] - bb[0], bb[3] - bb[1]
gap, rw = int(H * 0.09), 3; gw = lk.width + 2 * gap + rw + tw; x0 = int(CX - gw / 2); yc = int(H * 0.50)
T = Image.new("RGBA", (W, H), (0, 0, 0, 0)); T.alpha_composite(lk, (x0, yc - lh // 2)); dr = ImageDraw.Draw(T)
rx = x0 + lk.width + gap; dr.rectangle([rx, int(yc - H * 0.27), rx + rw, int(yc + H * 0.27)], fill=(127, 255, 0, 255))
tx, ty = rx + rw + gap - bb[0], yc - th // 2 - bb[1]
SH = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(SH).text((tx + 4, ty + 6), "BREAK", font=F, fill=(0, 0, 0, 200))
SH = cv2.GaussianBlur(np.array(SH)[..., 3].astype(np.float32) / 255, (0, 0), 5)[..., None] * 0.55
dr.text((tx, ty), "BREAK", font=F, fill=(255, 255, 255, 255))
TX = np.array(T).astype(np.float32); TA = TX[..., 3:] / 255
XX, YY = sb.XX, sb.YY
SCR = (np.clip(1 - (((XX - CX) / (gw * 0.75)) ** 2 + ((YY - yc) / (H * 0.75)) ** 2), 0, 1) ** 1.4 * 0.45)[..., None]   # teaser scrim behind the copy
TZ = (1 - np.clip((np.maximum(np.abs(XX - CX) - gw / 2, 0) - 10) / 120, 0, 1))[..., None]   # copy zone, soft edges
MC = sb.MASK["C"][..., None].astype(np.float32)
def frame(i):
    ph = i / N
    band_x = ((ph * 8.75 * 0.16) % 1.4 - 0.2) * W                       # teaser centre panel: its light band crosses once per loop,
    band = (0.30 + 0.9 * np.exp(-((XX - band_x) / 160) ** 2))[..., None] # but never behind the copy (light never touches the text)
    fr = (sb.WIDE_BG + sb.WIDE_BM * (0.30 + (band - 0.30) * (1 - TZ))) * MC
    fr = fr * (1 - SCR * MC)
    nf = neon_at(i)
    for win in ("L", "R"):
        bx0, by0, bx1, by1 = sb.BOX[win]; m = sb.MASK[win][by0:by1, bx0:bx1][..., None].astype(np.float32)
        v, _ = sb.view(nf, (bx0, by0, bx1, by1), 1.0, 0.5, 0.5)           # the clip framed in the wing, like the speaker
        fr[by0:by1, bx0:bx1] = fr[by0:by1, bx0:bx1] * (1 - m) + v * m
    fr = fr * (1 - SH) ; fr = fr * (1 - TA) + TX[..., :3] * TA
    return np.clip(fr * sb.VIS, 0, 255).astype(np.uint8)
if __name__ == "__main__":
    if MODE == "still":
        for k in (0, N // 3, 2 * N // 3): cv2.imwrite(R + f"break/t_still_{k}.png", cv2.cvtColor(frame(k), cv2.COLOR_RGB2BGR))
        f0, fl, f1 = frame(0).astype(float), frame(N - 1).astype(float), frame(1).astype(float)
        print("N", N, "dur", round(DUR, 2), "seam", round(np.abs(f0 - fl).mean(), 2), "step", round(np.abs(f1 - f0).mean(), 2)); sys.exit()
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
                          "-vf", "scale=3840:708:flags=lanczos", "-c:v", "prores_ks", "-profile:v", "3", "-pix_fmt", "yuv422p10le",
                          R + "break/Puma_Break_loop_v2_3840x708_30fps.mov"], stdin=subprocess.PIPE)
    for i in range(N): p.stdin.write(frame(i).tobytes())
    p.stdin.close(); p.wait(); print("done", N)
