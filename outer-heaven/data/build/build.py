"""Build the real-data layers for the Cerro Kavaju 3D view.

Everything is resampled onto one local grid in UTM zone 21S (EPSG:32721),
the projection Paraguayan title plans normally use. Local scene coordinates
are metres from the origin: x = easting - E0, z = -(northing - N0).

Outputs (in outer-heaven/data/):
  meta.json      origin, extent, sources
  terrain.json   ground heights on a 10 m grid (uint16, cm above BASE)
  imagery.jpg    Sentinel-2 colour composite with 1 m canopy detail
  trees.json     tree tops from the 1 m canopy height model
  context.json   roads, buildings, protected areas and place names (Overture)

Run from this folder:  python3 build.py [step ...]
Steps: grid dem chm s2 trees overture  (default: all)
"""
import base64, json, math, os, re, sys, time
import numpy as np
import rasterio
from rasterio.warp import reproject, transform_bounds, Resampling
from rasterio.windows import from_bounds
from rasterio.transform import from_origin
from pyproj import Transformer

os.environ.setdefault("CURL_CA_BUNDLE", "/root/.ccr/ca-bundle.crt")
if os.environ.get("HTTPS_PROXY") and not os.environ.get("GDAL_HTTP_PROXY"):
    os.environ["GDAL_HTTP_PROXY"] = os.environ["HTTPS_PROXY"].replace("http://", "")
os.environ.setdefault("GDAL_DISABLE_READDIR_ON_OPEN", "EMPTY_DIR")

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
CACHE = os.path.join(HERE, "cache")
os.makedirs(CACHE, exist_ok=True)

CRS = "EPSG:32721"
LAT0, LON0 = -25.3100, -57.1235          # between the summit and the valley
HALF = 2000                               # metres each way: a 4 x 4 km square
BASE = 90.0                               # metres; terrain stored as cm above this

to_utm = Transformer.from_crs("EPSG:4326", CRS, always_xy=True)
E0, N0 = to_utm.transform(LON0, LAT0)
E0, N0 = round(E0 / 10) * 10, round(N0 / 10) * 10


def grid(res, vertices=False):
    """Transform and shape of a north-up grid over the square.
    vertices=True puts pixel centres on the square's edges (for mesh vertices)."""
    if vertices:
        n = int(round(2 * HALF / res)) + 1
        return from_origin(E0 - HALF - res / 2, N0 + HALF + res / 2, res, res), (n, n)
    n = int(round(2 * HALF / res))
    return from_origin(E0 - HALF, N0 + HALF, res, res), (n, n)


def warp(url, transform, shape, resampling, band=1, pad=300, dtype=np.float32):
    """Read only the window we need from a remote COG and warp it onto our grid."""
    with rasterio.open("/vsicurl/" + url) as ds:
        b = transform_bounds(CRS, ds.crs, E0 - HALF - pad, N0 - HALF - pad, E0 + HALF + pad, N0 + HALF + pad)
        w = from_bounds(*b, ds.transform).round_offsets().round_lengths()
        arr = ds.read(band, window=w, boundless=True, fill_value=ds.nodata or 0)
        dst = np.zeros(shape, dtype)
        reproject(arr, dst, src_transform=ds.window_transform(w), src_crs=ds.crs,
                  dst_transform=transform, dst_crs=CRS, resampling=resampling,
                  src_nodata=ds.nodata, dst_nodata=0)
        return dst


def save_npy(name, a):
    np.save(os.path.join(CACHE, name), a)


def load_npy(name):
    return np.load(os.path.join(CACHE, name + ".npy"))


# ------------------------------------------------------------------ DEM --
def step_dem():
    url = "https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_S26_00_W058_00_DEM/Copernicus_DSM_COG_10_S26_00_W058_00_DEM.tif"
    t, shape = grid(10, vertices=True)
    dsm = warp(url, t, shape, Resampling.cubic)
    save_npy("dsm10", dsm)
    print("DSM 10 m", shape, float(dsm.min()), float(dsm.max()))


# ------------------------------------------------------------------ CHM --
def quadkey(lat, lon, z=9):
    n = 2 ** z
    x = int((lon + 180) / 360 * n)
    y = int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n)
    return "".join(str(((x >> (i - 1)) & 1) + 2 * ((y >> (i - 1)) & 1)) for i in range(z, 0, -1))


def step_chm():
    to_ll = Transformer.from_crs(CRS, "EPSG:4326", always_xy=True)
    keys = {quadkey(*to_ll.transform(E0 + dx, N0 + dy)[::-1]) for dx in (-HALF, HALF) for dy in (-HALF, HALF)}
    assert len(keys) == 1, keys
    url = f"https://dataforgood-fb-data.s3.amazonaws.com/forests/v1/alsgedi_global_v6_float/chm/{keys.pop()}.tif"
    t, shape = grid(1)
    chm = warp(url, t, shape, Resampling.bilinear)
    chm[chm < 0] = 0
    save_npy("chm1", chm.astype(np.float16))
    print("CHM 1 m", shape, float(chm.max()), "forest share (>5 m):", float((chm > 5).mean()))

    url = "https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_S27W060_Map.tif"
    t, shape = grid(10)
    wc = warp(url, t, shape, Resampling.nearest, dtype=np.uint8)
    save_npy("worldcover10", wc)
    vals, counts = np.unique(wc, return_counts=True)
    print("WorldCover classes", dict(zip(vals.tolist(), (counts / counts.sum()).round(3).tolist())))


# ------------------------------------------------------------ Sentinel-2 --
S2 = "https://sentinel-cogs.s3.us-west-2.amazonaws.com"
S2_TILE = "sentinel-s2-l2a-cogs/21/J/VN"


def s3_list(prefix, delim=True):
    import urllib.request, ssl
    ctx = ssl.create_default_context(cafile=os.environ["CURL_CA_BUNDLE"])
    url = f"{S2}/?list-type=2&prefix={prefix}" + ("&delimiter=/" if delim else "")
    with urllib.request.urlopen(url, context=ctx, timeout=60) as r:
        x = r.read().decode()
    tag = "Prefix" if delim else "Key"
    return [m for m in re.findall(f"<{tag}>([^<]*)</{tag}>", x) if m != prefix]


def s3_json(key):
    import urllib.request, ssl
    ctx = ssl.create_default_context(cafile=os.environ["CURL_CA_BUNDLE"])
    with urllib.request.urlopen(f"{S2}/{key}", context=ctx, timeout=60) as r:
        return json.loads(r.read())


def step_s2():
    """Median of the clearest recent passes, cloud-masked per pixel with the SCL band."""
    from concurrent.futures import ThreadPoolExecutor
    months = [(2025, m) for m in range(10, 13)] + [(2026, m) for m in range(1, 11)]
    scenes = []
    for y, m in months:
        scenes += s3_list(f"{S2_TILE}/{y}/{m}/")

    def cloud(prefix):
        sid = prefix.rstrip("/").split("/")[-1]
        try:
            p = s3_json(f"{prefix}{sid}.json")["properties"]
            return prefix, p["eo:cloud_cover"], p["datetime"][:10]
        except Exception:
            return prefix, 100, ""
    with ThreadPoolExecutor(16) as ex:
        info = [c for c in ex.map(cloud, scenes) if c[1] < 40]
    print(len(scenes), "passes;", len(info), "under 40% cloud for the whole tile")

    t20, sh20 = grid(20)
    def clear(item):
        prefix, cc, date = item
        try:
            scl = warp(f"{S2}/{prefix}SCL.tif", t20, sh20, Resampling.nearest, dtype=np.uint8)
        except Exception as e:
            return item, 0.0
        ok = np.isin(scl, [4, 5, 6, 7, 11])
        return item, float(ok.mean())
    with ThreadPoolExecutor(8) as ex:
        scored = sorted(ex.map(clear, info), key=lambda r: (-r[1], r[0][2]))
    good = [it for it, f in scored if f > 0.985]
    print("clear over the hill:", [(it[2], round(f, 3)) for it, f in scored[:14]])
    # Prefer the green season (Nov-Apr) when there are enough clear passes; keep the newest.
    green = [it for it in good if it[2][5:7] in ("11", "12", "01", "02", "03", "04")]
    pick = sorted(green if len(green) >= 3 else good, key=lambda it: it[2])[-7:]
    print("composite of", [it[2] for it in pick])

    t10, sh10 = grid(10)
    stack = []
    for prefix, cc, date in pick:
        bands = [warp(f"{S2}/{prefix}{b}.tif", t10, sh10, Resampling.bilinear) for b in ("B04", "B03", "B02")]
        scl = warp(f"{S2}/{prefix}SCL.tif", t10, sh10, Resampling.nearest, dtype=np.uint8)
        # These COGs are already harmonised to reflectance x 10000; the STAC offset does not apply.
        rgb = np.stack(bands, -1) * 0.0001
        rgb[~np.isin(scl, [4, 5, 6, 7, 11])] = np.nan
        stack.append(rgb)
    comp = np.nanmedian(np.stack(stack), axis=0)
    comp = np.where(np.isnan(comp), np.nanmedian(comp, axis=(0, 1)), comp)
    save_npy("s2rgb10", comp.astype(np.float32))
    with open(os.path.join(CACHE, "s2_dates.json"), "w") as f:
        json.dump([it[2] for it in pick], f)
    print("reflectance p2/p98:", np.percentile(comp, 2, axis=(0, 1)).round(3), np.percentile(comp, 98, axis=(0, 1)).round(3))


# --------------------------------------------- ground, texture and trees --
def step_trees():
    from scipy import ndimage
    from scipy.spatial import cKDTree
    from PIL import Image

    dsm = load_npy("dsm10")                       # 401 x 401 vertices, 10 m
    chm = load_npy("chm1").astype(np.float32)     # 4000 x 4000 pixels, 1 m
    n = chm.shape[0]

    # Bare ground: the radar surface model sits close to the canopy top in forest,
    # so subtract most of the local canopy height (smoothed to the DEM's 30 m scale).
    cell = chm.reshape(400, 10, 400, 10).mean(axis=(1, 3))
    cell = ndimage.gaussian_filter(cell, 1.5)
    vi = np.arange(401) - 0.5                      # vertex i sits between cells i-1 and i
    gy, gx = np.meshgrid(np.clip(vi, 0, 399), np.clip(vi, 0, 399), indexing="ij")
    canopy_at_v = ndimage.map_coordinates(cell, [gy, gx], order=1)
    dtm = dsm - 0.7 * canopy_at_v
    save_npy("dtm10", dtm.astype(np.float32))
    print("ground", float(dtm.min()), float(dtm.max()), "summit surface", float(dsm.max()))

    # Tree tops: local maxima of the lightly smoothed canopy model. The model is stored in
    # whole metres, so a touch of noise breaks ties on flat-topped crowns.
    noise = np.random.default_rng(7).uniform(-0.15, 0.15, chm.shape).astype(np.float32)
    c = ndimage.gaussian_filter(chm + noise, 1.0)
    m5 = ndimage.maximum_filter(c, size=5)
    m9 = ndimage.maximum_filter(c, size=9)
    tops = (c >= 4.0) & (c == m5) & ((c < 13) | (c == m9))
    ys, xs = np.nonzero(tops)
    h = chm[ys, xs]
    x = xs + 0.5 - HALF                            # local metres, x east
    z = ys + 0.5 - HALF                            # local metres, z south (row 0 is north)
    # No two tops closer than 3.5 m, keeping the taller one.
    order = np.argsort(-h)
    x, z, h = x[order], z[order], h[order]
    tree = cKDTree(np.stack([x, z], 1))
    alive = np.ones(len(h), bool)
    for i in range(len(h)):
        if alive[i]:
            for j in tree.query_ball_point((x[i], z[i]), 3.5):
                if j > i:
                    alive[j] = False
    x, z, h = x[alive], z[alive], h[alive]
    print("tree tops", len(h), "height p50/p95", np.percentile(h, [50, 95]).round(1))
    rng = np.random.default_rng(1)
    keep = np.ones(len(h), bool)
    r = np.zeros(len(h))
    LIMIT = 110000
    if len(h) > LIMIT:                              # thin the shortest first, never the tall ones
        p = np.clip((h - 3) / 10, 0.15, 1.0)
        p *= LIMIT / p.sum()
        keep = rng.random(len(h)) < p
    x, z, h = x[keep], z[keep], h[keep]
    # Each kept tree stands for the canopy around it: size crowns from the spacing that remains.
    d, _ = cKDTree(np.stack([x, z], 1)).query(np.stack([x, z], 1), k=4)
    spacing = d[:, 1:].mean(1)
    r = np.clip(0.62 * spacing, 1.4, 0.42 * h + 2.5)
    print("kept", len(h), "crown radius p50/p95", np.percentile(r, [50, 95]).round(1))
    rec = np.zeros(len(h), dtype=[("x", "<i2"), ("z", "<i2"), ("h", "u1"), ("r", "u1")])
    rec["x"] = np.round(x * 10); rec["z"] = np.round(z * 10)
    rec["h"] = np.clip(np.round(h * 10), 0, 255); rec["r"] = np.clip(np.round(r * 10), 0, 255)
    order = np.argsort(-rec["h"], kind="stable")   # tallest first, so a viewer can cut the tail on phones
    with open(os.path.join(OUT, "trees.json"), "w") as f:
        json.dump({"count": int(len(rec)), "layout": "int16 x dm, int16 z dm, uint8 height dm, uint8 crown radius dm; tallest first",
                   "data": base64.b64encode(rec[order].tobytes()).decode()}, f)

    # Ground texture: Sentinel-2 colour, upsampled, with crown detail from the 1 m canopy model.
    rgb = load_npy("s2rgb10")
    black = np.percentile(rgb, 0.5, axis=(0, 1)) * 0.85      # haze offset (dark-object subtraction)
    white = np.array([0.17, 0.15, 0.13])
    t = np.clip((rgb - black) / (white - black), 0, 1) ** (1 / 1.5)
    lum = t.mean(-1, keepdims=True)
    t = np.clip(lum + (t - lum) * 1.05, 0, 1)
    W = 2048
    base = np.asarray(Image.fromarray((t * 255).astype(np.uint8)).resize((W, W), Image.LANCZOS)).astype(np.float32) / 255
    c2 = np.asarray(Image.fromarray(chm).resize((W, W), Image.BOX))
    gyy, gxx = np.gradient(c2, 4000 / W)
    shade = (-gxx + gyy) / np.sqrt(1 + gxx ** 2 + gyy ** 2)
    hp = shade - ndimage.gaussian_filter(shade, 5)
    gaps = ndimage.gaussian_filter(c2, 6) - c2
    amt = np.clip(c2 / 6, 0, 1)
    detail = 1 + amt * (0.55 * np.clip(hp, -0.6, 0.6) - 0.02 * np.clip(gaps, 0, 8))
    out = np.clip(base * detail[..., None], 0, 1)
    Image.fromarray((out * 255).astype(np.uint8)).save(os.path.join(OUT, "imagery.jpg"), quality=84, optimize=True, progressive=True)
    print("imagery.jpg", W, "px over", 2 * HALF, "m")


# -------------------------------------------------------------- Overture --
OVERTURE = "release/2026-09-23.1/"


def overture_rows(typ, columns):
    """Rows of one Overture type whose bbox meets our square (row groups pruned by statistics)."""
    from concurrent.futures import ThreadPoolExecutor
    import pyarrow.parquet as pq
    import pyarrow as pa
    from overture_io import ls, RangeFile
    to_ll = Transformer.from_crs(CRS, "EPSG:4326", always_xy=True)
    lons, lats = zip(*[to_ll.transform(E0 + dx, N0 + dy) for dx in (-HALF, HALF) for dy in (-HALF, HALF)])
    x0, x1, y0, y1 = min(lons), max(lons), min(lats), max(lats)

    def scan(item):
        key, size = item
        pf = pq.ParquetFile(RangeFile(key, size))
        md = pf.metadata
        names = [md.row_group(0).column(i).path_in_schema for i in range(md.row_group(0).num_columns)]
        ix = {n: names.index("bbox." + n) for n in ("xmin", "xmax", "ymin", "ymax")}
        hits = []
        for g in range(md.num_row_groups):
            rg = md.row_group(g)
            st = {n: rg.column(i).statistics for n, i in ix.items()}
            if any(v is None or not v.has_min_max for v in st.values()):
                hits.append(g); continue
            if st["xmin"].min <= x1 and st["xmax"].max >= x0 and st["ymin"].min <= y1 and st["ymax"].max >= y0:
                hits.append(g)
        out = []
        for g in hits:
            t = pf.read_row_group(g, columns=columns + ["bbox"])
            b = t.column("bbox").combine_chunks()
            bx0, bx1 = b.field("xmin").to_numpy(), b.field("xmax").to_numpy()
            by0, by1 = b.field("ymin").to_numpy(), b.field("ymax").to_numpy()
            m = (bx0 <= x1) & (bx1 >= x0) & (by0 <= y1) & (by1 >= y0)
            if m.any():
                out.append(t.filter(pa.array(m)))
        return out

    files = ls(OVERTURE + typ)
    with ThreadPoolExecutor(24) as ex:
        parts = [t for ts in ex.map(scan, files) for t in ts]
    import pyarrow as pa
    return pa.concat_tables(parts).to_pylist() if parts else []


def local(geom):
    """WGS84 shapely geometry -> local metres (x east, z south), clipped to the square."""
    from shapely.ops import transform
    from shapely.geometry import box
    to = Transformer.from_crs("EPSG:4326", CRS, always_xy=True)
    g = transform(lambda x, y: (np.array(to.transform(x, y)[0]) - E0, -(np.array(to.transform(x, y)[1]) - N0)), geom)
    return g.intersection(box(-HALF, -HALF, HALF, HALF))


def coords(g):
    from shapely.geometry import Polygon, MultiPolygon, LineString, MultiLineString
    r = lambda cs: [round(v, 1) for xy in cs for v in xy]
    if isinstance(g, Polygon):
        return [[r(g.exterior.coords)] + [r(i.coords) for i in g.interiors]]
    if isinstance(g, MultiPolygon):
        return [p for q in g.geoms for p in coords(q)]
    if isinstance(g, LineString):
        return [r(g.coords)]
    if isinstance(g, MultiLineString):
        return [r(l.coords) for l in g.geoms]
    if hasattr(g, "geoms"):
        return [p for q in g.geoms for p in coords(q)]
    return []


def step_overture():
    from shapely import wkb
    name = lambda r: (r.get("names") or {}).get("primary")
    ctx = {"buildings": [], "roads": [], "landuse": [], "water": [], "places": []}

    for r in overture_rows("theme=buildings/type=building/", ["id", "geometry", "height", "num_floors", "class"]):
        g = local(wkb.loads(r["geometry"]))
        if g.is_empty or g.area < 6:
            continue
        h = r["height"] or (r["num_floors"] or 1) * 3.2
        for poly in coords(g):
            ctx["buildings"].append({"h": round(float(h), 1), "c": poly[0]})
    print("buildings", len(ctx["buildings"]))

    for r in overture_rows("theme=transportation/type=segment/", ["id", "geometry", "subtype", "class", "names"]):
        if r["subtype"] != "road":
            continue
        g = local(wkb.loads(r["geometry"]))
        for line in coords(g):
            if len(line) >= 4:
                ctx["roads"].append({"k": r["class"], "n": name(r), "c": line})
    print("roads", len(ctx["roads"]), sorted({x["k"] for x in ctx["roads"]}))

    for typ, key in (("theme=base/type=land_use/", "landuse"), ("theme=base/type=water/", "water")):
        for r in overture_rows(typ, ["id", "geometry", "subtype", "class", "names"]):
            g = local(wkb.loads(r["geometry"]))
            if g.is_empty:
                continue
            ctx[key].append({"k": r["class"], "s": r["subtype"], "n": name(r), "g": g.geom_type, "c": coords(g)})
        print(key, len(ctx[key]), sorted({(x["s"], x["k"], x["n"]) for x in ctx[key]}, key=str)[:30])

    for r in overture_rows("theme=places/type=place/", ["id", "geometry", "names", "basic_category", "confidence"]):
        g = local(wkb.loads(r["geometry"]))
        if g.is_empty or (r["confidence"] or 0) < 0.5:
            continue
        ctx["places"].append({"n": name(r), "k": r["basic_category"], "x": round(g.x, 1), "z": round(g.y, 1)})
    print("places", len(ctx["places"]), [p["n"] for p in ctx["places"]][:40])

    with open(os.path.join(OUT, "context.json"), "w") as f:
        json.dump(ctx, f, separators=(",", ":"))


# ---------------------------------------------------------------- export --
def step_export():
    dtm = load_npy("dtm10")
    dsm = load_npy("dsm10")
    enc = np.clip(np.round((dtm - BASE) * 100), 0, 65535).astype("<u2")
    with open(os.path.join(OUT, "terrain.json"), "w") as f:
        json.dump({"grid": int(dtm.shape[0]), "res": 10, "base": BASE, "scale": 100,
                   "layout": "uint16 little-endian, cm above base, row 0 = north, col 0 = west, vertices on a 10 m grid from -2000 to 2000 m",
                   "data": base64.b64encode(enc.tobytes()).decode()}, f)
    to_ll = Transformer.from_crs(CRS, "EPSG:4326", always_xy=True)
    lon0, lat0 = to_ll.transform(E0, N0)
    iy, ix = np.unravel_index(np.argmax(dsm), dsm.shape)
    dates = json.load(open(os.path.join(CACHE, "s2_dates.json")))
    meta = {
        "crs": CRS, "utm_zone": "21S", "origin": {"easting": E0, "northing": N0, "lat": round(lat0, 7), "lon": round(lon0, 7)},
        "half": HALF, "frame": "local metres: x = easting - E0, z = -(northing - N0), y up",
        "summit": {"x": float(ix * 10 - HALF), "z": float(iy * 10 - HALF), "surface_m": round(float(dsm.max()), 1), "ground_m": round(float(dtm[iy, ix]), 1)},
        "imagery": {"file": "imagery.jpg", "size_m": 2 * HALF, "dates": dates},
        "sources": {
            "elevation": "Copernicus DEM GLO-30 (ESA, 2011-2015 radar), surface model; ground estimated by subtracting 0.7 x local canopy height",
            "canopy": "Meta & WRI global canopy height map, 1 m (Tolan et al. 2024, imagery 2009-2020)",
            "imagery": "Sentinel-2 L2A (ESA Copernicus), cloud-masked median of " + ", ".join(dates),
            "landcover": "ESA WorldCover 2021, 10 m",
            "context": "Overture Maps " + OVERTURE.strip("/").split("/")[-1] + " (roads and buildings from OpenStreetMap, Google, Microsoft; places from Meta and Microsoft)",
        },
    }
    with open(os.path.join(OUT, "meta.json"), "w") as f:
        json.dump(meta, f, indent=1)
    print(json.dumps({k: meta[k] for k in ("origin", "summit")}))


if __name__ == "__main__":
    steps = sys.argv[1:] or ["dem", "chm", "s2", "trees", "overture", "export"]
    for s in steps:
        t0 = time.time()
        globals()["step_" + s]()
        print(f"[{s}] {time.time() - t0:.1f}s")
