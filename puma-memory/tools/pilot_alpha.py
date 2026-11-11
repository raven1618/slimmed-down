import sys, json, numpy as np, cv2, math
D, CFG = sys.argv[1], sys.argv[2]; C = json.load(open(CFG))
PW, PH, y0, CH = 1280, 308, 30, 238
raw = np.fromfile(f"{D}/pilot_10fps.rgb", np.uint8); n = raw.size // (PW*PH*3); v = raw[:n*PW*PH*3].reshape(n, PH, PW, 3)
G = v[452, y0:y0+CH].astype(np.float32)          # t=45.2 s: empty green panel
cv2.imwrite(f"{D}/pilot_green_empty.png", cv2.cvtColor(G.astype(np.uint8), cv2.COLOR_RGB2BGR))
def load_cover(path):
    im = cv2.cvtColor(cv2.imread(path), cv2.COLOR_BGR2RGB); r = max(1920/im.shape[1], 1080/im.shape[0])
    im = cv2.resize(im, (round(im.shape[1]*r), round(im.shape[0]*r)), interpolation=cv2.INTER_AREA)
    yy = (im.shape[0]-1080)//2; xx = (im.shape[1]-1920)//2; return im[yy:yy+1080, xx:xx+1920].astype(np.float32)
hold = {"S1_botines": 6.0, "S2_concentracion": 16.0, "S3_huddle": 27.0, "S4_companerismo": 38.0}
profiles = {}
for seg in C["segments"]:
    P = v[int(hold[seg["id"]]*10), y0:y0+CH].astype(np.float32); im = load_cover(seg["image"])
    M = np.float32([[447/1920, 0, seg["place"]["c"]], [0, 252/1080, -6.7]])
    S = cv2.warpAffine(im, M, (PW, CH), flags=cv2.INTER_AREA)
    num = ((P-G)*(S-G)).sum(2); den = ((S-G)**2).sum(2) + 1e-3
    a = np.clip(num/den, -0.5, 1.5); a[den < 300] = np.nan
    prof = np.nanmedian(a[20:220], axis=0)
    xs = [480, 520, 560, 600, 640, 680, 720, 760, 800]
    print(seg["id"], " ".join(f"{x}:{prof[x]:.2f}" for x in xs))
    profiles[seg["id"]] = np.nan_to_num(prof, nan=0).tolist()
    # residual where a~1 (grade mismatch check)
    m = (np.arange(PW) > 760) & (np.arange(PW) < 880); print("   mean |P-S| in full-photo zone:", round(float(np.abs(P[:, m]-S[:, m]).mean()), 1))
json.dump(profiles, open(f"{D}/pilot_alpha_profiles.json", "w"))
