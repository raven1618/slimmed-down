import sys, numpy as np, cv2
D = sys.argv[1]; PW, PH, y0, CH = 1280, 308, 30, 238
raw = np.fromfile(f"{D}/pilot_10fps.rgb", np.uint8); n = raw.size // (PW*PH*3); v = raw[:n*PW*PH*3].reshape(n, PH, PW, 3)
fr = v[60, y0:y0+CH].astype(np.float32)
dm = cv2.imread(f"{D}/diecut_mask_pilot.png", 0) > 127
nl, lab = cv2.connectedComponents((~dm).astype(np.uint8))
comps = sorted([(np.mean(np.where(lab == i)[1]), i) for i in range(1, nl) if (lab == i).sum() > 2000])
L, Cm, R = [(lab == i) for _, i in comps[:3]]
Lc = 600.0; DW, DH, TOP = 447, 252, -6.7
P = np.zeros((DH, DW, 3), np.float32); have = np.zeros((DH, DW), bool)
for mask, off, xmin in [(L, -95.9, 0), (R, 981.5, 0), (Cm, Lc, 730)]:   # window left edges for the boots segment
    ys, xs = np.where(mask & (np.arange(PW)[None, :] >= xmin))
    u = np.round(xs - off).astype(int); r = np.round(ys - TOP).astype(int)
    ok = (u >= 0) & (u < DW) & (r >= 0) & (r < DH) & ~have[np.clip(r,0,DH-1), np.clip(u,0,DW-1)]
    P[r[ok], u[ok]] = fr[ys[ok], xs[ok]]; have[r[ok], u[ok]] = True
print("coverage", round(have.mean(), 3))
P8 = np.clip(P, 0, 255).astype(np.uint8); hole = (~have).astype(np.uint8) * 255
filled = cv2.inpaint(cv2.cvtColor(P8, cv2.COLOR_RGB2BGR), hole, 9, cv2.INPAINT_TELEA)
big = cv2.resize(filled, (1920, 1082), interpolation=cv2.INTER_CUBIC)[1:1081]
cv2.imwrite(f"{D}/placeholder_botines_16x9.png", big); print("ok", big.shape)
