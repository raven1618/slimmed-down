import sys, numpy as np, cv2
D = sys.argv[1]; W, H = 1280, 308; y0, y1 = 30, 268
raw = np.fromfile(f"{D}/pilot_10fps.rgb", np.uint8); n = raw.size // (W*H*3); v = raw[:n*W*H*3].reshape(n, H, W, 3)
fr = v[60, y0:y1]   # t=6.0 s, boots hold
sift = cv2.SIFT_create(3000)
def off(xa, xb, xc, xd):
    a = cv2.resize(fr[:, xa:xb], None, fx=3, fy=3); b = cv2.resize(fr[:, xc:xd], None, fx=3, fy=3)
    k1, d1 = sift.detectAndCompute(cv2.cvtColor(a, cv2.COLOR_RGB2GRAY), None); k2, d2 = sift.detectAndCompute(cv2.cvtColor(b, cv2.COLOR_RGB2GRAY), None)
    m = [p for p, q in cv2.BFMatcher().knnMatch(d1, d2, k=2) if p.distance < 0.75 * q.distance]
    dx = np.median([k2[p.trainIdx].pt[0] - k1[p.queryIdx].pt[0] for p in m]) / 3
    return (xc + dx) - xa, len(m)   # how far (pilot px) the image content of region1 sits left of region2
d_left, nl = off(0, 230, 700, 1110); d_right, nr = off(1060, 1280, 700, 1110)
print("left panel content is shifted", round(d_left, 1), "px vs centre (matches", nl, "); right panel", round(d_right, 1), "(", nr, ")")
# placeholder still: centre window 700..1099 is the clean photo part; assume image width = 447 (16:9 at 252 tall)
crop = fr[:, 700:1100]
img = cv2.resize(crop, (1600, 952), interpolation=cv2.INTER_CUBIC)
cv2.imwrite(f"{D}/placeholder_botines_from_pilot.png", cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
# Andrés placeholder from the card (t=48.5): left panel
card = v[485, y0:y1, 0:240]; cv2.imwrite(f"{D}/placeholder_andres_from_pilot.png", cv2.cvtColor(cv2.resize(card, None, fx=4, fy=4, interpolation=cv2.INTER_CUBIC), cv2.COLOR_RGB2BGR))
print("saved placeholders")
