import sys, numpy as np, cv2, json
D, SRC = sys.argv[1], sys.argv[2]
W, H = 1280, 308
raw = np.fromfile(f"{D}/pilot_10fps.rgb", np.uint8); n = raw.size // (W * H * 3); v = raw[: n * W * H * 3].reshape(n, H, W, 3)
lum = v.mean(3)
# content rows (exclude letterbox)
rows = np.where(lum.max(0).max(1) > 20)[0]; y0, y1 = rows.min(), rows.max() + 1; print("content rows", y0, y1, "height", y1 - y0)
# die-cut mask = black in >97% of frames
black = (lum[:, y0:y1] < 14).mean(0) > 0.97
cv2.imwrite(f"{D}/diecut_mask_pilot.png", (black * 255).astype(np.uint8))
# segment changes: mean abs diff of photo region (x>620) between consecutive samples
reg = v[:, y0:y1, 620:1270].astype(np.int16)
d = np.abs(np.diff(reg, axis=0)).mean((1, 2, 3)); t = np.arange(1, n) / 10
print("big changes (t, diff):", [(round(float(t[i]), 1), round(float(d[i]), 1)) for i in np.argsort(-d)[:14]])
# text panel activity: brightness of white/lime text area in green panel (x 330-620, rows y0+40..y0+200)
tp = v[:, y0 + 35:y0 + 200, 330:620].astype(np.int16)
txt = ((tp.min(3) > 200) | ((tp[..., 1] > 220) & (tp[..., 2] < 90))).mean((1, 2))
on = txt > 0.02; edges = [round(i / 10, 1) for i in range(1, n) if on[i] != on[i - 1]]
print("text on/off edges:", edges)
json.dump(dict(y0=int(y0), y1=int(y1)), open(f"{D}/pilot_geom.json", "w"))
# framing: match centre photo crop of each segment against source images
mid = {"concentracion": 16.0, "huddle": 27.0, "companerismo": 38.0}
for name, ts in mid.items():
    fr = v[int(ts * 10), y0:y1]; crop = fr[:, 760:1100]           # clean part of the centre photo
    src = cv2.cvtColor(cv2.imread(f"{SRC}/{ 'placa1.jpeg' if name=='x' else name + '.png'}"), cv2.COLOR_BGR2RGB)
    best = None
    for sw in np.linspace(500, 1600, 45):
        s = sw / src.shape[1]; sm = cv2.resize(src, (int(src.shape[1] * s), int(src.shape[0] * s)), interpolation=cv2.INTER_AREA)
        if sm.shape[0] < crop.shape[0] or sm.shape[1] < crop.shape[1]: continue
        r = cv2.matchTemplate(sm, crop, cv2.TM_CCOEFF_NORMED); _, mv, _, ml = cv2.minMaxLoc(r)
        if best is None or mv > best[0]: best = (mv, s, ml)
    mv, s, (mx, my) = best
    # pilot pixel (760,y0) -> source pixel (mx/s, my/s); pilot scale: 1 pilot px = 1/s source px
    print(f"{name}: score={mv:.3f} pilot_px_per_src_px={s:.4f} crop_origin_src=({mx/s:.0f},{my/s:.0f}) src={src.shape[1]}x{src.shape[0]}")
