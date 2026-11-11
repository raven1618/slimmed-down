"""Ink a FULL 21:9 frame into a manga panel exactly like Andrés S3/S4 (XDoG ink + 3-step screentone + solid blacks).
Usage: manga_full.py in_image out_png [p80 p55 p22]"""
import sys, math, numpy as np, cv2
from PIL import Image
W, H = 3360, 1440
src = cv2.resize(cv2.cvtColor(np.array(Image.open(sys.argv[1]).convert("RGB")), cv2.COLOR_RGB2BGR), (W, H), interpolation=cv2.INTER_AREA)
pc = [float(v) for v in sys.argv[3:6]] or [72, 45, 16]
YY, XX = np.mgrid[0:H, 0:W].astype(np.float32); c = math.cos(math.radians(45))
SCR = (np.cos(2 * np.pi * (XX * c - YY * c) / 11) + np.cos(2 * np.pi * (XX * c + YY * c) / 11)) / 4 + 0.5
ht = lambda v: np.where(SCR > 1 - v, 0.0, 1.0)
Lc = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(24, 24)).apply(cv2.cvtColor(src, cv2.COLOR_BGR2LAB)[..., 0])
sm = cv2.bilateralFilter(Lc, 9, 30, 7).astype(np.float32) / 255
p80, p55, p22 = np.percentile(sm, pc)
tone = np.where(sm > p80, 1.0, np.where(sm > p55, ht(0.18), np.where(sm > p22, ht(0.46), 0.0)))
def xdog(img, sig, k=1.6, tau=0.98, phi=120):
    a = cv2.GaussianBlur(img, (0, 0), sig); b = cv2.GaussianBlur(img, (0, 0), sig * k); D = a - tau * b
    return np.where(D >= 0, 1.0, 1 + np.tanh(phi * D))
ink = (xdog(sm, 1.5, tau=0.985, phi=200) < 0.5).astype(np.uint8)
n, lab, st, _ = cv2.connectedComponentsWithStats(ink, 8); keep = np.zeros(n, bool); keep[1:] = st[1:, cv2.CC_STAT_AREA] >= 40
ink = cv2.dilate(keep[lab].astype(np.uint8), np.ones((2, 2), np.uint8))
Image.fromarray((np.minimum(tone, 1.0 - ink) * 245 + 5).astype(np.uint8)).convert("RGB").save(sys.argv[2])
