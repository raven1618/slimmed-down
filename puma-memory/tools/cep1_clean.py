"""CEP1 from the client's real stadium photo, no generation: 21:9 crop + local cleanup (brands/colours)."""
import cv2, numpy as np
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
im = cv2.imread(R + "frames_screen/speakers/CEP1_crop_21x9.png"); H, W = im.shape[:2]
hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV).astype(np.float32); h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
rows = np.zeros((H, W), bool); rows[240:545] = True
blue = rows & (h > 95) & (h < 135) & (s > 40); yel = rows & (h > 12) & (h < 38) & (s > 60)
h[blue] = 78; s[blue] *= 0.45                                   # seats: KV dark green-grey
s[yel] *= 0.12; v[yel] *= 0.8                                   # yellow stairs/rails: concrete grey
im = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
mask = np.zeros((H, W), np.uint8)
for (x0, y0, x1, y1) in [(8, 250, 242, 332), (672, 328, 880, 392), (1020, 352, 1128, 416), (1555, 512, 1600, 612), (0, 562, 285, 590), (815, 552, 1190, 575)]:
    mask[y0:y1, x0:x1] = 255
im = cv2.inpaint(im, mask, 9, cv2.INPAINT_TELEA)
scr = im[352:416, 1020:1128]; im[352:416, 1020:1128] = (scr * 0.25).astype(np.uint8)  # dark screen panel
b0, b1 = 536, 559                                                 # pitch-side boards -> plain dark panel with a soft top highlight
band = np.full((b1 - b0, W, 3), (34, 38, 34), np.uint8); band[:2] = (70, 78, 72); im[b0:b1] = band
im[b0 - 1:b0 + 1] = cv2.GaussianBlur(im[b0 - 3:b0 + 3], (0, 0), 1)[2:4]
cv2.imwrite(R + "frames_screen/speakers/CEP1_cancha__FRAME_clean_21x9.png", im)
cv2.imwrite(R + "qc/_cep1_clean.jpg", cv2.resize(im, (1344, 576)), [cv2.IMWRITE_JPEG_QUALITY, 88])
