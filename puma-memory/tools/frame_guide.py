"""Image-prompt guide: the v8 frame at its exact screen placement, margins PRE-FILLED with a soft continuation of its own
edges (no flat grey), so the model keeps lens and proportions and only adds detail. Plus a screen overlay for checking."""
import sys, json, cv2, numpy as np
from PIL import Image, ImageDraw
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
O = R + "frames_screen/expand_v8/"
meta = json.load(open(O + "placement.json")); name = sys.argv[1]; m = meta[name]
GW = 3360; k = GW / m["canvas"][0]; GH = int(round(m["canvas"][1] * k))
x0, y0, bw, bh = [v * k for v in m["base_in_canvas"]]
base = cv2.imread(m["base"]); base = cv2.resize(base, (int(round(bw)), int(round(bh))), interpolation=cv2.INTER_AREA)
# place on a canvas big enough to hold everything, then edge-replicate outward and blur only the outside
pad = 2000; big = cv2.copyMakeBorder(base, pad, pad, pad, pad, cv2.BORDER_REPLICATE)
X, Y = int(round(x0)), int(round(y0)); ext = big[pad - Y: pad - Y + GH, pad - X: pad - X + GW].copy()
inside = np.zeros((GH, GW), np.float32); ys, xs = max(0, Y), max(0, X)
inside[ys:min(GH, Y + base.shape[0]), xs:min(GW, X + base.shape[1])] = 1
blur = cv2.GaussianBlur(ext, (0, 0), 38)
d = cv2.distanceTransform((1 - inside).astype(np.uint8), cv2.DIST_L2, 5)          # distance outside the photo
fall = np.clip(d / 260.0, 0, 1)[..., None]                                         # soft->blurred over ~260 px
soft = ext.astype(np.float32) * (1 - fall) + blur.astype(np.float32) * fall
soft *= (1 - 0.35 * np.clip(d / 600.0, 0, 1))[..., None]                            # gentle darkening toward the edges
a = inside[..., None]; feather = cv2.GaussianBlur(inside, (0, 0), 3)[..., None]
out = ext.astype(np.float32) * feather + soft * (1 - feather)
cv2.imwrite(O + f"{name}__GUIDE_image_prompt.png", np.clip(out, 0, 255).astype(np.uint8))
# screen overlay (same size): strip outline + die-cut + outside dimmed, transparent elsewhere
SW, SH = 1920, 356; bt = m["band"][1] * k; bhh = m["band"][3] * k
dm = cv2.resize(cv2.imread(R + "puma-kb/sources/S09-piloto-aprobado/diecut_mask_pilot.png", 0), (GW, int(round(bhh))), interpolation=cv2.INTER_NEAREST) > 127
dm[:4] = dm[4]; dm[-4:] = dm[-5]
ov = np.zeros((GH, GW, 4), np.uint8); ov[..., 3] = 150                              # dim outside the screen
b0 = int(round(bt)); ov[b0:b0 + dm.shape[0], :, 3] = 0
seg = ov[b0:b0 + dm.shape[0]]; seg[dm] = (0, 0, 0, 215)
im = Image.fromarray(ov, "RGBA"); dr = ImageDraw.Draw(im); dr.rectangle([0, b0, GW - 1, b0 + dm.shape[0]], outline=(127, 255, 0, 255), width=5)
im.save(O + "SCREEN_overlay_21x9.png")
prev = Image.open(O + f"{name}__GUIDE_image_prompt.png").convert("RGBA"); prev.alpha_composite(im)
prev.convert("RGB").resize((1680, int(1680 * GH / GW))).save(R + f"qc/{name}_guide_preview.jpg", quality=88)
print(GW, GH, "band", b0, b0 + dm.shape[0])
