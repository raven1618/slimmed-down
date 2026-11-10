"""
RCM Holdings — shared brand geometry, colour and SVG helpers.

Every logo, icon and template in this kit is generated from the
definitions in this file, so the artwork stays mathematically
consistent. Run the build scripts from the repository root:

    python3 brand/rcm-holdings/source/build_logos.py
    python3 brand/rcm-holdings/source/build_assets.py
    python3 brand/rcm-holdings/source/build_templates.py

Requirements: fonttools, skia-pathops (pip install fonttools skia-pathops)
and the Inter font family (OFL) for the outlined secondary lettering.
"""

from __future__ import annotations

import math
import os
from dataclasses import dataclass

import pathops
from fontTools.pens.basePen import BasePen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

# --------------------------------------------------------------------------
# Paths
# --------------------------------------------------------------------------
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)  # brand/rcm-holdings

INTER_DIRS = [
    "/usr/share/fonts/opentype/inter",
    os.path.expanduser("~/.fonts"),
    os.path.expanduser("~/Library/Fonts"),
    "/Library/Fonts",
]


def inter_path(weight: str) -> str:
    for d in INTER_DIRS:
        p = os.path.join(d, f"Inter-{weight}.otf")
        if os.path.exists(p):
            return p
    raise FileNotFoundError(f"Inter-{weight}.otf not found; install the Inter font family")


# --------------------------------------------------------------------------
# Colour
# --------------------------------------------------------------------------
NAVY = "#0B1D3A"
GRAPHITE = "#2B2F36"
STONE = "#E6E7E9"
ORANGE = "#FF4A00"
WHITE = "#FFFFFF"
BLACK = "#000000"

# Supporting tints (derived from the core palette)
GRAPHITE_75 = "#606368"   # Graphite at 75% on white — "HOLDINGS" descriptor
NAVY_80 = "#3C4A61"
NAVY_60 = "#6D7789"
NAVY_40 = "#9DA5B0"
NAVY_20 = "#CED2D8"
NAVY_10 = "#E7E8EB"
ORANGE_80 = "#FF6E33"
ORANGE_20 = "#FFDBCC"
PAPER = "#F7F7F8"          # off-white page tone used across layouts


@dataclass(frozen=True)
class Swatch:
    key: str
    name: str
    hex: str
    cmyk: tuple
    pantone: str
    ral: str
    role: str
    share: int


PALETTE = [
    Swatch("navy", "Navy Blue", NAVY, (100, 78, 30, 60), "PANTONE 289 C", "RAL 5011",
           "Primary brand colour. Logo, headlines, large fields of colour.", 60),
    Swatch("graphite", "Graphite", GRAPHITE, (72, 62, 50, 65), "PANTONE 433 C", "RAL 7021",
           "Body copy, secondary text, UI chrome and dark neutral backgrounds.", 20),
    Swatch("stone", "Stone", STONE, (8, 5, 5, 0), "PANTONE Cool Gray 1 C", "RAL 9002",
           "Light neutral for panels, tables, dividers and quiet backgrounds.", 10),
    Swatch("orange", "Orange Red", ORANGE, (0, 80, 100, 0), "PANTONE 1655 C", "RAL 2004",
           "Accent only. The forward quadrant, highlights, key data, calls to action.", 10),
    Swatch("white", "White", WHITE, (0, 0, 0, 0), "—", "RAL 9016",
           "Space and clarity. The base for documents and digital layouts.", 0),
]


def hex_to_rgb(h: str) -> tuple:
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rel_luminance(h: str) -> float:
    def ch(c):
        c = c / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(c) for c in hex_to_rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a: str, b: str) -> float:
    la, lb = rel_luminance(a), rel_luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def mix(a: str, b: str, t: float) -> str:
    """Mix colour a into b; t=1 gives a, t=0 gives b."""
    ra, ga, ba = hex_to_rgb(a)
    rb, gb, bb = hex_to_rgb(b)
    return "#%02X%02X%02X" % (round(rb + (ra - rb) * t), round(gb + (ga - gb) * t), round(bb + (ba - bb) * t))


# --------------------------------------------------------------------------
# Number / path formatting
# --------------------------------------------------------------------------
def n(v: float) -> str:
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


class SVGPen(BasePen):
    """Minimal SVG path pen with compact number formatting."""

    def __init__(self):
        super().__init__(None)
        self.d = []

    def _moveTo(self, p):
        self.d.append(f"M{n(p[0])} {n(p[1])}")

    def _lineTo(self, p):
        self.d.append(f"L{n(p[0])} {n(p[1])}")

    def _curveToOne(self, p1, p2, p3):
        self.d.append(f"C{n(p1[0])} {n(p1[1])} {n(p2[0])} {n(p2[1])} {n(p3[0])} {n(p3[1])}")

    def _qCurveToOne(self, p1, p2):
        self.d.append(f"Q{n(p1[0])} {n(p1[1])} {n(p2[0])} {n(p2[1])}")

    def _closePath(self):
        self.d.append("Z")

    def _endPath(self):
        pass

    def path(self) -> str:
        return "".join(self.d)


def path_d(p: pathops.Path, transform=None) -> str:
    pen = SVGPen()
    if transform:
        p.draw(TransformPen(pen, transform))
    else:
        p.draw(pen)
    return pen.path()


# --------------------------------------------------------------------------
# Primitive shapes (pathops, y-down coordinates)
# --------------------------------------------------------------------------
def poly(points) -> pathops.Path:
    p = pathops.Path()
    pen = p.getPen()
    pen.moveTo(points[0])
    for pt in points[1:]:
        pen.lineTo(pt)
    pen.closePath()
    return p


def rrect(x0, y0, x1, y1, r=(0, 0, 0, 0), k=0.6) -> pathops.Path:
    """Rounded rectangle; r = (tl, tr, br, bl). k is the corner tension
    (0.5523 = circular; higher = squarer 'squircle' corners)."""
    if isinstance(r, (int, float)):
        r = (r, r, r, r)
    tl, tr, br, bl = r
    p = pathops.Path()
    pen = p.getPen()
    pen.moveTo((x0 + tl, y0))
    pen.lineTo((x1 - tr, y0))
    if tr:
        pen.curveTo((x1 - tr + k * tr, y0), (x1, y0 + tr - k * tr), (x1, y0 + tr))
    pen.lineTo((x1, y1 - br))
    if br:
        pen.curveTo((x1, y1 - br + k * br), (x1 - br + k * br, y1), (x1 - br, y1))
    pen.lineTo((x0 + bl, y1))
    if bl:
        pen.curveTo((x0 + bl - k * bl, y1), (x0, y1 - bl + k * bl), (x0, y1 - bl))
    pen.lineTo((x0, y0 + tl))
    if tl:
        pen.curveTo((x0, y0 + tl - k * tl), (x0 + tl - k * tl, y0), (x0 + tl, y0))
    pen.closePath()
    return p


def union(*paths) -> pathops.Path:
    out = paths[0]
    for p in paths[1:]:
        out = pathops.op(out, p, pathops.PathOp.UNION)
    return out


def diff(a, *bs) -> pathops.Path:
    out = a
    for b in bs:
        out = pathops.op(out, b, pathops.PathOp.DIFFERENCE)
    return out


def translate(p: pathops.Path, dx, dy, s=1.0) -> pathops.Path:
    q = pathops.Path()
    p.draw(TransformPen(q.getPen(), (s, 0, 0, s, dx, dy)))
    return q


# --------------------------------------------------------------------------
# THE SYMBOL
#
# A square turned 45° (the diamond) cut into four quadrants by a cross
# channel. The inner edge of each quadrant is parallel to the outer edge,
# leaving an open diamond at the centre. The lower-right quadrant — the
# "forward" quadrant — is Orange Red.
#
# Construction (outer half-diagonal = 1):
#   inner half-diagonal  = 0.56
#   channel width        = 0.13   (half = 0.065)
#   inner fillet radius  = 0.10
# --------------------------------------------------------------------------
SYM_INNER = 0.56
SYM_GAP = 0.13
SYM_FILLET = 0.10


def _fillet_corner(prev_pt, corner, next_pt, radius):
    """Return (t0, c1, c2, t1) cubic approximating a fillet at `corner`."""
    ax, ay = prev_pt[0] - corner[0], prev_pt[1] - corner[1]
    bx, by = next_pt[0] - corner[0], next_pt[1] - corner[1]
    la, lb = math.hypot(ax, ay), math.hypot(bx, by)
    ax, ay, bx, by = ax / la, ay / la, bx / lb, by / lb
    cos_a = max(-1.0, min(1.0, ax * bx + ay * by))
    alpha = math.acos(cos_a)                 # interior angle
    t = radius / math.tan(alpha / 2)         # tangent length
    turn = math.pi - alpha                   # arc sweep
    h = 4 / 3 * math.tan(turn / 4) * radius  # handle length
    t0 = (corner[0] + ax * t, corner[1] + ay * t)
    t1 = (corner[0] + bx * t, corner[1] + by * t)
    c1 = (t0[0] - ax * h, t0[1] - ay * h)
    c2 = (t1[0] - bx * h, t1[1] - by * h)
    return t0, c1, c2, t1


def symbol_quadrant(R: float, inner=SYM_INNER, gap=SYM_GAP, fillet=SYM_FILLET) -> pathops.Path:
    """Upper-left quadrant, centred on the origin, outer half-diagonal R."""
    g = gap * R / 2
    r = inner * R
    f = fillet * R
    tip_l = (-R + g, -g)
    tip_t = (-g, -R + g)
    in_t = (-g, -r + g)
    in_l = (-r + g, -g)
    p = pathops.Path()
    pen = p.getPen()
    pen.moveTo(tip_l)
    pen.lineTo(tip_t)
    a0, a1, a2, a3 = _fillet_corner(tip_t, in_t, in_l, f)
    pen.lineTo(a0)
    pen.curveTo(a1, a2, a3)
    b0, b1, b2, b3 = _fillet_corner(in_t, in_l, tip_l, f)
    pen.lineTo(b0)
    pen.curveTo(b1, b2, b3)
    pen.closePath()
    return p


def symbol_paths(size: float, x=0.0, y=0.0, **kw) -> dict:
    """Return the four quadrant path strings for a symbol whose bounding
    square is `size` wide, positioned with its top-left at (x, y)."""
    R = size / 2
    q = symbol_quadrant(R, **kw)
    cx, cy = x + R, y + R
    out = {}
    for name, (sx, sy) in {"tl": (1, 1), "tr": (-1, 1), "bl": (1, -1), "br": (-1, -1)}.items():
        out[name] = path_d(q, (sx, 0, 0, sy, cx, cy))
    return out


def symbol_svg(size, x=0.0, y=0.0, main=NAVY, accent=ORANGE, **kw) -> str:
    p = symbol_paths(size, x, y, **kw)
    return (
        f'<g class="rcm-symbol">'
        f'<path fill="{main}" d="{p["tl"]}"/>'
        f'<path fill="{main}" d="{p["tr"]}"/>'
        f'<path fill="{main}" d="{p["bl"]}"/>'
        f'<path fill="{accent}" d="{p["br"]}"/>'
        f"</g>"
    )


# --------------------------------------------------------------------------
# THE WORDMARK — custom extended letterforms for "RCM"
# Drawn on a cap height of 100 units.
# --------------------------------------------------------------------------
CAP = 100.0
STEM = 22.0      # vertical stroke
BAR = 18.0       # horizontal stroke
TRACK = 47.0     # letter spacing between R–C and C–M


def glyph_R() -> pathops.Path:
    stem = rrect(0, 0, STEM, CAP)
    bowl = rrect(0, 0, 113, 64, (0, 31, 31, 0), k=0.62)
    counter = rrect(STEM, BAR, 113 - 21, 64 - BAR, (0, 12, 12, 0), k=0.62)
    leg = poly([(63, 56), (88, 56), (119, CAP), (94, CAP)])
    return union(diff(bowl, counter), stem, leg)  # width 119


def glyph_C() -> pathops.Path:
    w = 126
    outer = rrect(0, 0, w, CAP, 37, k=0.62)
    inner = rrect(STEM, BAR, w - STEM, CAP - BAR, 19, k=0.62)
    aperture = rrect(w / 2, 37, w + 10, CAP - 37)
    return diff(outer, inner, aperture)  # width 126


def glyph_M() -> pathops.Path:
    w = 132
    mid = w / 2
    s1 = rrect(0, 0, STEM, CAP)
    s2 = rrect(w - STEM, 0, w, CAP)
    d1 = poly([(0, 0), (25, 0), (mid + 11, 90), (mid - 11, 90)])
    d2 = poly([(w - 25, 0), (w, 0), (mid + 11, 90), (mid - 11, 90)])
    return union(s1, s2, d1, d2)  # width 132


WORD_WIDTHS = {"R": 119.0, "C": 126.0, "M": 132.0}
WORDMARK_W = WORD_WIDTHS["R"] + TRACK + WORD_WIDTHS["C"] + TRACK + WORD_WIDTHS["M"]


def wordmark_rcm_path() -> pathops.Path:
    x = 0.0
    parts = []
    for ch, fn in (("R", glyph_R), ("C", glyph_C), ("M", glyph_M)):
        parts.append(translate(fn(), x, 0))
        x += WORD_WIDTHS[ch] + TRACK
    out = pathops.Path()
    for p in parts:
        p.draw(out.getPen())
    return out


# --------------------------------------------------------------------------
# Outlined secondary lettering (Inter, SIL Open Font License)
# --------------------------------------------------------------------------
_FONTS = {}


def _font(weight):
    if weight not in _FONTS:
        f = TTFont(inter_path(weight))
        _FONTS[weight] = (f, f.getGlyphSet(), f.getBestCmap(), f["OS/2"].sCapHeight)
    return _FONTS[weight]


def outline_text(text, cap_height, weight="SemiBold", fit_width=None, tracking_em=0.0):
    """Outline `text` so that capitals are `cap_height` tall, sitting on a
    baseline at y=0 (y-down, caps extend to -cap_height).
    If fit_width is given, letter-spacing is solved so the ink spans exactly
    that width. Returns (path_string, ink_width)."""
    font, gs, cmap, cap = _font(weight)
    s = cap_height / cap
    glyphs = [cmap[ord(c)] for c in text]
    adv = [gs[g].width * s for g in glyphs]

    def ink(g):
        bp = BoundsPen(gs)
        gs[g].draw(bp)
        return bp.bounds  # may be None for space

    first_b, last_b = ink(glyphs[0]), ink(glyphs[-1])
    lsb_first = first_b[0] * s
    rsb_last = (gs[glyphs[-1]].width - last_b[2]) * s
    natural = sum(adv) - lsb_first - rsb_last
    gaps = len(glyphs) - 1
    if fit_width is not None and gaps:
        track = (fit_width - natural) / gaps
    else:
        font_size = cap_height * font["head"].unitsPerEm / cap
        track = tracking_em * font_size
    pen = SVGPen()
    x = -lsb_first
    for g, a in zip(glyphs, adv):
        gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, 0)))
        x += a + track
    width = natural + track * gaps
    return pen.path(), width


# --------------------------------------------------------------------------
# Lockups
# --------------------------------------------------------------------------
@dataclass
class Art:
    body: str
    w: float
    h: float

    def svg(self, title="RCM Holdings", pad=0.0, bg=None, extra_attrs="") -> str:
        vb = f"{n(-pad)} {n(-pad)} {n(self.w + 2 * pad)} {n(self.h + 2 * pad)}"
        bgrect = f'<rect x="{n(-pad)}" y="{n(-pad)}" width="{n(self.w + 2 * pad)}" height="{n(self.h + 2 * pad)}" fill="{bg}"/>' if bg else ""
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" '
            f'width="{n(self.w + 2 * pad)}" height="{n(self.h + 2 * pad)}" role="img" aria-label="{title}"{extra_attrs}>'
            f"<title>{title}</title>{bgrect}{self.body}</svg>\n"
        )


@dataclass
class Scheme:
    main: str       # three quadrants
    accent: str     # forward quadrant
    word: str       # RCM
    desc: str       # HOLDINGS
    tag: str        # tagline
    rule: str       # tagline rule


SCHEMES = {
    "fullcolor": Scheme(NAVY, ORANGE, NAVY, GRAPHITE_75, GRAPHITE, ORANGE),
    "reverse": Scheme(WHITE, ORANGE, WHITE, STONE, STONE, ORANGE),
    "navy": Scheme(NAVY, NAVY, NAVY, NAVY, NAVY, NAVY),
    "white": Scheme(WHITE, WHITE, WHITE, WHITE, WHITE, WHITE),
    "black": Scheme(BLACK, BLACK, BLACK, BLACK, BLACK, BLACK),
}

# Lockup proportions, all in wordmark units (RCM cap height = 100)
SYMBOL_SIZE = 196.0       # symbol diagonal in the horizontal lockup
SYMBOL_GAP = 50.0         # symbol → wordmark
DESC_CAP = 32.0           # HOLDINGS cap height
DESC_GAP = 32.0           # RCM baseline → HOLDINGS cap line
TAG_CAP = 10.5
RULE_Y = 235.0
RULE_W = 1.4
TAG_BASE = 274.0

_DESC = None
TAGLINES = {
    "en": "GLOBAL TRADE. INTELLIGENTLY CONNECTED.",
    "es": "COMERCIO GLOBAL. CONECTADO CON INTELIGENCIA.",
}
_TAG = {}


def desc_path():
    global _DESC
    if _DESC is None:
        _DESC = outline_text("HOLDINGS", DESC_CAP, "SemiBold", fit_width=WORDMARK_W)[0]
    return _DESC


def tag_path(lang="en"):
    if lang not in _TAG:
        _TAG[lang] = outline_text(TAGLINES[lang], TAG_CAP, "Medium", fit_width=WORDMARK_W)[0]
    return _TAG[lang]


_RCM = None


def rcm_d():
    global _RCM
    if _RCM is None:
        _RCM = path_d(wordmark_rcm_path())
    return _RCM


def wordmark_block(sc: Scheme, x, y, scale=1.0) -> str:
    """RCM + HOLDINGS, top-left of RCM caps at (x, y)."""
    return (
        f'<g transform="translate({n(x)} {n(y)}) scale({n(scale) if scale != 1 else 1})">'
        f'<path fill="{sc.word}" d="{rcm_d()}"/>'
        f'<path fill="{sc.desc}" transform="translate(0 {n(CAP + DESC_GAP + DESC_CAP)})" d="{desc_path()}"/>'
        f"</g>"
    )


def lockup_horizontal(scheme="fullcolor", tagline=False, lang="en") -> Art:
    sc = SCHEMES[scheme]
    text_x = SYMBOL_SIZE + SYMBOL_GAP
    block_h = CAP + DESC_GAP + DESC_CAP
    text_y = SYMBOL_SIZE - block_h - 3.0   # descriptor baseline sits on the symbol's lower tip
    body = symbol_svg(SYMBOL_SIZE, 0, 0, sc.main, sc.accent) + wordmark_block(sc, text_x, text_y)
    h = SYMBOL_SIZE
    if tagline:
        body += f'<rect fill="{sc.rule}" x="{n(text_x)}" y="{n(RULE_Y)}" width="{n(WORDMARK_W)}" height="{n(RULE_W)}"/>'
        body += f'<path fill="{sc.tag}" transform="translate({n(text_x)} {n(TAG_BASE)})" d="{tag_path(lang)}"/>'
        h = TAG_BASE + 0.5
    return Art(body, text_x + WORDMARK_W, h)


def lockup_stacked(scheme="fullcolor") -> Art:
    sc = SCHEMES[scheme]
    sym = 200.0
    gap = 58.0
    w = WORDMARK_W
    body = symbol_svg(sym, (w - sym) / 2, 0, sc.main, sc.accent) + wordmark_block(sc, 0, sym + gap)
    return Art(body, w, sym + gap + CAP + DESC_GAP + DESC_CAP)


def lockup_wordmark(scheme="fullcolor") -> Art:
    sc = SCHEMES[scheme]
    return Art(wordmark_block(sc, 0, 0), WORDMARK_W, CAP + DESC_GAP + DESC_CAP)


def lockup_symbol(scheme="fullcolor", size=200.0) -> Art:
    sc = SCHEMES[scheme]
    return Art(symbol_svg(size, 0, 0, sc.main, sc.accent), size, size)


def app_icon(size=1024.0, rounded=True, bg=NAVY, main=WHITE, accent=ORANGE, scale=0.70, micro=False) -> Art:
    r = size * 0.2237 if rounded else 0
    bgp = path_d(rrect(0, 0, size, size, r, k=0.64)) if rounded else f"M0 0H{n(size)}V{n(size)}H0Z"
    s = size * scale
    off = (size - s) / 2
    kw = dict(gap=0.17, inner=0.52, fillet=0.08) if micro else {}
    body = f'<path fill="{bg}" d="{bgp}"/>' + symbol_svg(s, off, off, main, accent, **kw)
    return Art(body, size, size)


def write(path: str, content: str):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as fh:
        fh.write(content)
    return full
