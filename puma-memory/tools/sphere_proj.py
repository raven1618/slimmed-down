"""Sphere LED (2 m, canvas 2688x1296 equirectangular). The script's mockups are flat circles = what a viewer sees from
one side. We author each scene as a square 'front disc' and project it orthographically onto the hemisphere facing
that viewer; the same disc is repeated at the other centres (default front + back) so the audience on every side
reads it. lat_span: rows cover 180 deg ('stretch', standard equirect) until the LED vendor's mapping template says otherwise."""
import numpy as np, cv2
EW, EH = 2688, 1296

def _maps(disc_px, centres_deg=(0, 180), lat_span_deg=180.0, feather=0.04):
    lon = (np.arange(EW) + 0.5) / EW * 2 * np.pi - np.pi
    lat = (0.5 - (np.arange(EH) + 0.5) / EH) * np.radians(lat_span_deg)
    LON, LAT = np.meshgrid(lon, lat)
    mx = np.full((EH, EW), -1, np.float32); my = np.full((EH, EW), -1, np.float32); al = np.zeros((EH, EW), np.float32)
    for c in centres_deg:
        d = LON - np.radians(c); x = np.cos(LAT) * np.sin(d); y = np.sin(LAT); z = np.cos(LAT) * np.cos(d)
        vis = z > 0; r = np.hypot(x, y)
        a = np.clip((1 - r) / feather, 0, 1) * vis          # soft edge at the limb (seam between the two copies)
        sel = a > al
        mx[sel] = ((x[sel] + 1) / 2 * disc_px).astype(np.float32); my[sel] = ((1 - y[sel]) / 2 * disc_px).astype(np.float32); al[sel] = a[sel]
    return mx, my, al

_CACHE = {}
def disc_to_equi(disc, bg=None, **kw):
    """disc: square HxWx3 float/uint8 image (the mockup circle inscribed). bg: optional full equirect background."""
    n = disc.shape[0]; key = (n, tuple(kw.get("centres_deg", (0, 180))), kw.get("lat_span_deg", 180.0))
    if key not in _CACHE: _CACHE[key] = _maps(n, **kw)
    mx, my, al = _CACHE[key]
    out = cv2.remap(disc.astype(np.float32), mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    base = np.zeros_like(out) if bg is None else bg.astype(np.float32)
    return base * (1 - al[..., None]) + out * al[..., None]
