"""Place phone screenshots of satellite maps onto the model.

A screenshot has no coordinates, and phone maps are often rotated. fit() finds its scale,
rotation and position by correlating it against our own imagery, then warp() resamples it
north-up onto the local frame (x east, z south, metres).
"""
import numpy as np
from scipy import ndimage
from scipy.signal import fftconvolve


def features(rgb):
    """Brightness and redness: clearings and bare soil stand out against forest in both."""
    return [rgb.mean(-1), rgb[..., 0] - rgb[..., 1]]


def ncc(A, T, M):
    """Masked normalised cross-correlation of template T (mask M) over image A, 'valid' positions."""
    n = M.sum()
    T0 = (T - (T * M).sum() / n) * M
    fl = lambda a: a[::-1, ::-1]
    num = fftconvolve(A, fl(T0), mode="valid")
    sA = fftconvolve(A, fl(M), mode="valid")
    sA2 = fftconvolve(A * A, fl(M), mode="valid")
    return num / np.sqrt(np.maximum(sA2 - sA * sA / n, 1e-9) * (T0 * T0).sum())


def screen_coords(shot_shape, fit, E, N):
    """Screen pixel (x, y) of ground offsets E (east) and N (north) in metres from the fit centre."""
    H, W = shot_shape[:2]
    b, s = np.radians(fit["up_bearing"]), fit["m_per_px"]
    return (E * np.cos(b) - N * np.sin(b)) / s + W / 2, -(E * np.sin(b) + N * np.cos(b)) / s + H / 2


def template(shot, valid, s, bearing, res):
    """The screenshot resampled north-up at res m/px, as feature channels plus a validity mask."""
    H, W = shot.shape[:2]
    n = int(np.hypot(H, W) * s / res) + 1
    e = (np.arange(n) - n / 2) * res
    E, N = np.meshgrid(e, -e)
    x, y = screen_coords(shot.shape, {"up_bearing": bearing, "m_per_px": s}, E, N)
    sig = max(0.5 * res / s - 0.5, 0)
    chans = []
    for ch in features(shot):
        ch = np.where(valid, ch, ch[valid].mean())
        chans.append(ndimage.map_coordinates(ndimage.gaussian_filter(ch, sig), [y, x], order=1, cval=0))
    m = ndimage.map_coordinates(ndimage.binary_erosion(valid, iterations=3).astype(np.float32), [y, x], order=0, cval=0)
    return chans, m


def search(shot, valid, imagery, half_world, res, centre, radius, scales, bearings, blur=1.5):
    """Best (score, m_per_px, bearing, x, z) over a grid of scales and bearings near centre."""
    k = imagery.shape[0] / (2 * half_world)
    small = ndimage.zoom(imagery, (1 / (res * k), 1 / (res * k), 1), order=1)
    r = 2 * half_world / small.shape[0]
    cx, cz = centre
    i0, j0 = int((cz - radius + half_world) / r), int((cx - radius + half_world) / r)
    n = int(2 * radius / r)
    ref = [ndimage.gaussian_filter(c, blur) for c in features(small[i0:i0 + n, j0:j0 + n])]
    ox, oz = j0 * r - half_world, i0 * r - half_world
    best = []
    for s in scales:
        for b in bearings:
            T, M = template(shot, valid, s, b, r)
            if T[0].shape[0] >= n:
                continue
            T = [ndimage.gaussian_filter(t, blur) for t in T]
            score = sum(ncc(a, t, M) for a, t in zip(ref, T)) / len(ref)
            i, j = np.unravel_index(np.argmax(score), score.shape)
            m = T[0].shape[0]
            best.append((float(score[i, j]), float(s), float(b), ox + (j + m / 2) * r, oz + (i + m / 2) * r))
    return sorted(best, reverse=True)


def fit(shot, valid, imagery, half_world, near, bearing_hint, radius=900):
    """Coarse search over scale and +/-12 degrees of the hint, then a fine one around the best."""
    coarse = search(shot, valid, imagery, half_world, 4.0, near, radius, np.geomspace(0.12, 0.8, 34),
                    np.arange(bearing_hint - 12, bearing_hint + 12.1, 2))
    _, s, b, x, z = coarse[0]
    fine = search(shot, valid, imagery, half_world, 2.0, (x, z), 450, s * np.geomspace(0.9, 1.1, 11), np.arange(b - 3, b + 3.1, 0.75))
    score, s, b, x, z = fine[0]
    return {"m_per_px": round(s, 4), "up_bearing": round(b, 2), "centre": [round(x, 1), round(z, 1)], "score": round(score, 3)}


def warp(shot, valid, fit, res):
    """North-up copy of the screenshot on the local grid. Returns rgb, validity, (x0, z0) of the top-left corner."""
    H, W = shot.shape[:2]
    b, s = np.radians(fit["up_bearing"]), fit["m_per_px"]
    cx, cz = fit["centre"]
    corners = []
    for px, py in [(0, 0), (W, 0), (W, H), (0, H)]:
        dx, dy = (px - W / 2) * s, (py - H / 2) * s
        corners.append((cx + dx * np.cos(b) - dy * np.sin(b), cz + dx * np.sin(b) + dy * np.cos(b)))
    xs, zs = zip(*corners)
    x0, z0 = np.floor(min(xs)), np.floor(min(zs))
    nx, nz = int(np.ceil((max(xs) - x0) / res)), int(np.ceil((max(zs) - z0) / res))
    X, Z = np.meshgrid(x0 + (np.arange(nx) + 0.5) * res, z0 + (np.arange(nz) + 0.5) * res)
    x, y = screen_coords(shot.shape, fit, X - cx, -(Z - cz))
    rgb = np.stack([ndimage.map_coordinates(shot[..., c], [y, x], order=1, cval=0) for c in range(3)], -1)
    ok = ndimage.map_coordinates(valid.astype(np.float32), [y, x], order=1, cval=0) > 0.99
    return rgb, ok, (float(x0), float(z0))


def clean_marks(shot, boxes, solid=()):
    """Take map furniture off the photo inside the given boxes (x0, y0, x1, y1 in screen pixels).
    Labels, icons and the location dot are covered with the texture just beside them; the
    translucent blue heading beam is unblended; solid boxes (pins) are covered whole."""
    inside = np.zeros(shot.shape[:2], bool)
    for x0, y0, x1, y1 in boxes:
        inside[y0:y1, x0:x1] = True
    lum, sat = shot.mean(-1), shot.max(-1) - shot.min(-1)
    blue = shot[..., 2] - shot[..., :2].max(-1)
    dot = ndimage.binary_dilation((blue > 0.45) & (shot[..., 2] > 0.85) & inside, iterations=17)
    text = ndimage.binary_dilation((lum > 0.72) & (sat < 0.2) & inside, iterations=6)
    hole = (dot | text) & inside
    for x0, y0, x1, y1 in solid:
        hole[y0:y1, x0:x1] = True
    # Beam: pixel = a * BEAM + (1 - a) * ground, assuming the ground's blue/green ratio matches its surroundings.
    beam = ndimage.binary_dilation((blue > 0.02) & inside, iterations=3) & inside & ~hole
    out = shot.copy()
    if beam.any():
        ring = ndimage.binary_dilation(beam, iterations=15) & ~ndimage.binary_dilation(beam | hole, iterations=4)
        q = shot[ring]
        k = float(np.median(q[:, 2] / np.maximum(q[:, 1], 1e-3))) if len(q) else 0.85
        C = np.array([0.02, 0.10, 1.0])          # the beam is close to pure blue: red barely changes under it
        a = np.clip((shot[..., 2] - k * shot[..., 1]) / (C[2] - k * C[1]), 0, 1)
        a = ndimage.gaussian_filter(np.where(beam, a, 0), 1.5) / np.maximum(ndimage.gaussian_filter(beam.astype(np.float32), 1.5), 1e-3)
        a = np.clip(a, 0, 0.6)                       # smoothed inside the beam only, so its edge is fully unblended
        g = (shot - a[..., None] * C) / (1 - a[..., None])
        out[beam] = np.clip(g[beam], 0, 1)
    return cover(out, hole)


def cover(rgb, hole):
    """Fill each hole with the texture just above or below it on screen, feathered into a smooth fill at its edge."""
    smooth = inpaint(rgb, hole)
    out = smooth.copy()
    lab, n = ndimage.label(hole)
    H, W = rgb.shape[:2]
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        m = lab[sl] == i
        h, w = sl[0].stop - sl[0].start + 6, sl[1].stop - sl[1].start + 6
        # Of the neighbouring blocks, borrow the one whose surroundings look most like the hole's.
        p = 4
        big = (slice(max(sl[0].start - p, 0), min(sl[0].stop + p, H)), slice(max(sl[1].start - p, 0), min(sl[1].stop + p, W)))
        ring = ndimage.binary_dilation(lab[big] == i, iterations=p) & ~hole[big]
        best, src = np.inf, None
        for dy, dx in ((-h, 0), (h, 0), (0, -w), (0, w), (-2 * h, 0), (2 * h, 0), (0, -2 * w), (0, 2 * w)):
            y0, y1, x0, x1 = big[0].start + dy, big[0].stop + dy, big[1].start + dx, big[1].stop + dx
            if y0 < 0 or y1 > H or x0 < 0 or x1 > W or hole[y0:y1, x0:x1][ring | (lab[big] == i)].any():
                continue
            cost = ((rgb[y0:y1, x0:x1][ring] - rgb[big][ring]) ** 2).mean()
            if cost < best:
                best, src = cost, rgb[sl[0].start + dy:sl[0].stop + dy, sl[1].start + dx:sl[1].stop + dx]
        if src is None:
            continue
        w = np.clip(ndimage.distance_transform_edt(m) / 8, 0, 1)[..., None]
        out[sl][m] = (src * w + smooth[sl] * (1 - w))[m]
    return out


def inpaint(rgb, hole):
    """Fill holes smoothly from their edges (coarse to fine), then add back a little texture."""
    out = rgb.copy()
    levels = []
    img, m = rgb, hole
    while min(m.shape) > 16:
        levels.append((img, m))
        img = ndimage.zoom(img, (0.5, 0.5, 1), order=1)
        m = ndimage.zoom(m.astype(np.float32), 0.5, order=1) > 0.01
    fill = np.where(m[..., None], img[~m].mean(0) if (~m).any() else 0.5, img)
    for img, m in reversed(levels):
        up = ndimage.zoom(fill, (img.shape[0] / fill.shape[0], img.shape[1] / fill.shape[1], 1), order=1)
        f = np.where(m[..., None], up, img)
        for _ in range(30):
            blur = ndimage.uniform_filter(f, (3, 3, 1))
            f = np.where(m[..., None], blur, img)
        fill = f
    rng = np.random.default_rng(3)
    grain = ndimage.gaussian_filter(rng.normal(0, 0.035, hole.shape), 1.2)[..., None]
    out[hole] = np.clip(fill * (1 + grain), 0, 1)[hole]
    return out


def open_ground(rgb, res):
    """True where the photo shows open ground (bare soil, grass, tracks) rather than tree crowns."""
    lum = ndimage.gaussian_filter(rgb.mean(-1), 1.5 / res)
    tex = ndimage.gaussian_filter(np.abs(rgb.mean(-1) - ndimage.gaussian_filter(rgb.mean(-1), 0.6 / res)), 1.5 / res)
    return (lum > 0.33) | ((lum > 0.27) & (tex < 0.035))
