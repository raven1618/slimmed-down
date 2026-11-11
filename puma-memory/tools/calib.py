import numpy as np
from PIL import Image, ImageDraw
import sys
KV=sys.argv[1]
full = Image.open(f"{KV}/kv_full.png").convert("RGB"); under = Image.open(f"{KV}/kv_bg_beams.png").convert("RGB")
F = np.asarray(full, dtype=np.int16); U = np.asarray(under, dtype=np.int16)
diff = np.abs(F-U).sum(axis=2)
ys, xs = np.where(diff[300:800, 650:1300] > 60); print("title/logo bbox", xs.min()+650, ys.min()+300, xs.max()+650, ys.max()+300)
# lime: pixels in JUGAR area with G high, R mid, B low
reg = F[520:600, 840:1040].reshape(-1,3); m = (reg[:,1]>200)&(reg[:,2]<80)&(reg[:,0]>80)
print("lime median", np.median(reg[m],axis=0) if m.any() else None, m.sum())
# logo rows: find rows with diff in 330..410
rows = diff[320:420, 700:1250].sum(axis=1); print("logo rows nonzero:", [i+320 for i,v in enumerate(rows) if v>2000][:3], [i+320 for i,v in enumerate(rows) if v>2000][-3:])
pent = [(470,425),(930,105),(1430,445),(1215,915),(700,905)]
im = full.copy(); d = ImageDraw.Draw(im)
d.line(pent+[pent[0]], fill=(255,0,255), width=4)
for p in pent: d.ellipse([p[0]-10,p[1]-10,p[0]+10,p[1]+10], outline=(255,255,0), width=3)
im.resize((960,540)).save(f"{KV}/pent_check.jpg")
