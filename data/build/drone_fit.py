"""Place things seen in an oblique drone photo onto the model.

The photo's camera (position, heading, tilt, field of view) is fitted so that, projected onto the
terrain, the photo lines up with the georeferenced site photo (data/site-*.webp). One or two
anchors (a pixel in the photo and the local x, z it shows, e.g. a roof also visible from above)
pin the fit down. Then any pixel where something meets the ground can be located.

  python3 drone_fit.py PHOTO --start x,y,z,bearing,pitch,vfov --anchor px,py,x,z [--anchor ...]
                             [--locate name=px,py ...]

Local frame as everywhere here: x east, z south, metres from the model origin; y is metres above sea
level. Used for data/objects.json (the homestead).
"""
import argparse, json, os
import numpy as np
from PIL import Image
from scipy import ndimage, optimize

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
HALF = 2000
dtm = np.load(os.path.join(HERE, "cache", "dtm10.npy")).astype(np.float32)          # 401 x 401 vertices, 10 m
imagery = np.asarray(Image.open(os.path.join(OUT, "imagery.jpg")).convert("RGB")).astype(np.float32) / 255
site = json.load(open(os.path.join(OUT, "sites.json")))["patches"][0]
patch = np.asarray(Image.open(os.path.join(OUT, site["file"])).convert("RGBA")).astype(np.float32) / 255
PRES = (site["x1"] - site["x0"]) / patch.shape[1]


def ground(x, z):
    gx, gz = np.clip((x + HALF) / 10, 0, 399.999), np.clip((z + HALF) / 10, 0, 399.999)
    return ndimage.map_coordinates(dtm, [gz, gx], order=1, mode="nearest")


def colour(x, z):
    n = imagery.shape[0]
    u, v = np.clip((x + HALF) / (2 * HALF) * n - 0.5, 0, n - 1), np.clip((z + HALF) / (2 * HALF) * n - 0.5, 0, n - 1)
    c = np.stack([ndimage.map_coordinates(imagery[..., k], [v, u], order=1) for k in range(3)], -1)
    pu, pv = (x - site["x0"]) / PRES - 0.5, (z - site["z0"]) / PRES - 0.5
    inside = (pu >= 0) & (pu < patch.shape[1] - 1) & (pv >= 0) & (pv < patch.shape[0] - 1)
    if inside.any():
        p = np.stack([ndimage.map_coordinates(patch[..., k], [pv[inside], pu[inside]], order=1) for k in range(4)], -1)
        c[inside] = c[inside] * (1 - p[:, 3:]) + p[:, :3] * p[:, 3:]
    return c


def basis(cam):
    cx, cy, cz, bearing, pitch, vfov = cam
    b, p = np.radians(bearing), np.radians(pitch)
    f = np.array([np.sin(b) * np.cos(p), np.sin(p), -np.cos(b) * np.cos(p)])
    r = np.array([np.cos(b), 0, np.sin(b)])
    return np.array([cx, cy, cz]), f, r, np.cross(r, f), np.tan(np.radians(vfov) / 2)


def rays(cam, px, size):
    """Unit rays through photo pixels px (N x 2)."""
    o, f, r, u, th = basis(cam)
    w, h = size
    nx, ny = (px[:, 0] + 0.5) / w * 2 - 1, 1 - (px[:, 1] + 0.5) / h * 2
    d = f[None] + nx[:, None] * th * w / h * r[None] + ny[:, None] * th * u[None]
    return o, d / np.linalg.norm(d, axis=1, keepdims=True)


def hit(o, d, smax=1500):
    """First ground point along each ray (march, then bisect)."""
    t = np.full(len(d), np.nan); prev = np.zeros(len(d)); alive = np.ones(len(d), bool)
    for s in np.concatenate([np.arange(1, 300, 1.0), np.arange(300, smax, 5.0)]):
        P = o + d * s
        h = alive & (P[:, 1] <= ground(P[:, 0], P[:, 2]))
        if h.any():
            lo, hi = prev[h], np.full(h.sum(), s)
            for _ in range(8):
                m = (lo + hi) / 2; Q = o + d[h] * m[:, None]
                below = Q[:, 1] <= ground(Q[:, 0], Q[:, 2])
                hi, lo = np.where(below, m, hi), np.where(below, lo, m)
            t[h] = hi; alive &= ~h
        prev = np.where(alive, s, prev)
        if not alive.any():
            break
    return o + d * np.nan_to_num(t)[:, None], t


def project(cam, pts, size):
    o, f, r, u, th = basis(cam)
    w, h = size
    v = np.asarray(pts, float) - o
    zf = v @ f
    return np.stack([((v @ r) / zf / (th * w / h) + 1) / 2 * w, (1 - (v @ u) / zf / th) / 2 * h], 1)


def features(rgb):
    s = rgb.sum(-1) + 1e-3
    return np.stack([(rgb[..., 0] - rgb[..., 1]) / s * 3, rgb.mean(-1)], -1)


def score(cam, photo, size):
    ny, nx = photo.shape[:2]
    gx, gy = np.meshgrid((np.arange(nx) + 0.5) / nx * size[0], (np.arange(ny) + 0.5) / ny * size[1])
    o, d = rays(cam, np.stack([gx.ravel(), gy.ravel()], 1), size)
    P, t = hit(o, d)
    ok = ~np.isnan(t) & (P[:, 0] > site["x0"] + 3) & (P[:, 0] < site["x1"] - 3) & (P[:, 2] > site["z0"] + 3) & (P[:, 2] < site["z1"] - 3)
    if ok.mean() < 0.25:
        return -1.0
    A, B = features(colour(P[:, 0], P[:, 2])), features(photo.reshape(-1, 3))
    return float(0.65 * np.corrcoef(A[ok, 0], B[ok, 0])[0, 1] + 0.35 * np.corrcoef(A[ok, 1], B[ok, 1])[0, 1])


def fit(path, start, anchors, px_tol=25.0, weight=0.15):
    """anchors: [(px, py, x, z)]. Returns (score, camera)."""
    img = np.asarray(Image.open(path).convert("RGB")).astype(np.float32) / 255
    size = (img.shape[1], img.shape[0])
    pts = [(x, float(ground(np.array([x]), np.array([z]))[0]), z) for _, _, x, z in anchors]
    pix = np.array([(a[0], a[1]) for a in anchors], float)
    cam = list(start)
    for nx, ny in ((48, 36), (96, 72)):
        photo = ndimage.zoom(ndimage.gaussian_filter(img, (img.shape[0] / ny / 2, img.shape[1] / nx / 2, 0)), (ny / img.shape[0], nx / img.shape[1], 1), order=1)
        def fun(c):
            if not 20 < c[5] < 80:
                return 9.0
            e = np.linalg.norm(project(c, pts, size) - pix, axis=1) if len(pts) else np.zeros(0)
            return -score(c, photo, size) + weight * float(((e / px_tol) ** 2).sum())
        simplex = [cam] + [list(np.array(cam) + np.eye(6)[i] * dv) for i, dv in enumerate([10, 8, 10, 5, 4, 4])]
        r = optimize.minimize(fun, cam, method="Nelder-Mead", options={"maxiter": 900, "xatol": 0.1, "fatol": 1e-5, "initial_simplex": simplex})
        cam = list(r.x)
    return -r.fun, cam, size


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("photo")
    ap.add_argument("--start", required=True, help="x,y,z,bearing,pitch,vfov: a rough camera, e.g. from matching the model's view by eye")
    ap.add_argument("--anchor", action="append", default=[], help="px,py,x,z")
    ap.add_argument("--locate", action="append", default=[], help="name=px,py")
    a = ap.parse_args()
    s, cam, size = fit(a.photo, [float(v) for v in a.start.split(",")], [tuple(float(v) for v in t.split(",")) for t in a.anchor])
    print("camera", [round(v, 2) for v in cam], "score", round(s, 3))
    if a.locate:
        names, px = zip(*[(t.split("=")[0], [float(v) for v in t.split("=")[1].split(",")]) for t in a.locate])
        o, d = rays(cam, np.array(px), size)
        P, _ = hit(o, d)
        for n, p in zip(names, P):
            print(f"{n}: x {p[0]:.1f}, z {p[2]:.1f}")
