"""Fleet livery artwork used as reference elements for photographic mockups.

The product tanker is drawn as a reusable SVG fragment (side elevation,
starboard side) so image-generation tools receive an exact livery reference."""

import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import rcm_brand as b  # noqa: E402
from rcm_brand import n  # noqa: E402

FONT = "'Aktiv Grotesk', Inter, 'Helvetica Neue', Arial, sans-serif"
HULL_NAVY = b.NAVY
WHITE_PAINT = "#F3F4F5"
DECK = "#3A3F47"


def place_art(art, x, y, width=None, height=None, extra=""):
    s = (width / art.w) if width else (height / art.h)
    return f'<g transform="translate({n(x)} {n(y)}) scale({s:.5f})"{extra}>{art.body}</g>', art.w * s, art.h * s


# ==========================================================================
# PRODUCT TANKER  — side elevation, starboard side, bow to the right.
# Coordinates: waterline at y = 0, stern at x ≈ 0, bow at x ≈ 1400.
# ==========================================================================
SHIP_L = 1400

HULL_PATH = ("M18 -164 Q640 -147 1236 -152 L1240 -180 L1400 -182 "
             "C1397 -120 1383 -40 1367 0 C1373 8 1396 14 1397 27 C1396 41 1372 46 1338 46 "
             "L118 46 C88 46 62 34 50 12 C40 -12 32 -60 18 -164 Z")


def tanker(uid="t"):
    """Return the tanker SVG fragment (waterline y=0)."""
    rnd = random.Random(4)
    p = []
    defs = (
        f'<clipPath id="{uid}hull"><path d="{HULL_PATH}"/></clipPath>'
        f'<linearGradient id="{uid}hg" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="#1B3460"/><stop offset=".18" stop-color="{HULL_NAVY}"/>'
        f'<stop offset="1" stop-color="#081530"/></linearGradient>'
        f'<linearGradient id="{uid}wg" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D9DCE0"/></linearGradient>'
        f'<linearGradient id="{uid}glass" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="#2B4A75"/><stop offset="1" stop-color="#0E1C33"/></linearGradient>'
        f'<linearGradient id="{uid}fun" x1="0" y1="0" x2="1" y2="0">'
        f'<stop offset="0" stop-color="#16294B"/><stop offset=".55" stop-color="{HULL_NAVY}"/><stop offset="1" stop-color="#07122A"/></linearGradient>'
    )
    p.append(f"<defs>{defs}</defs>")

    # ---------------- hull paint scheme (clipped to hull shape)
    hull = [f'<rect x="0" y="-200" width="{SHIP_L + 10}" height="190" fill="url(#{uid}hg)"/>']
    # brand diagonal plane + direction line toward the bow
    hull.append(f'<polygon points="1080,-6 1250,-190 1410,-190 1410,-6" fill="#FFFFFF" fill-opacity=".045"/>')
    hull.append(f'<line x1="1020" y1="-6" x2="1206" y2="-196" stroke="{b.ORANGE}" stroke-width="5"/>')
    # sheer stripe
    hull.append(f'<path d="M30 -150 Q640 -134 1236 -138 L1400 -168" fill="none" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="2"/>')
    # boot-top and antifouling
    hull.append(f'<rect x="0" y="-18" width="{SHIP_L + 10}" height="22" fill="{b.ORANGE}"/>')
    hull.append(f'<rect x="0" y="4" width="{SHIP_L + 10}" height="50" fill="{b.GRAPHITE}"/>')
    hull.append(f'<linearGradient id="{uid}curv" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".35"/>'
                f'<stop offset=".07" stop-color="#000" stop-opacity="0"/><stop offset=".88" stop-color="#000" stop-opacity="0"/>'
                f'<stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>'
                f'<rect x="0" y="-200" width="{SHIP_L + 10}" height="260" fill="url(#{uid}curv)"/>')
    # plating seams
    for x in range(120, 1340, 96):
        hull.append(f'<line x1="{x}" y1="-150" x2="{x}" y2="-18" stroke="#000" stroke-opacity=".10" stroke-width="1"/>')
    hull.append(f'<line x1="40" y1="-86" x2="1370" y2="-86" stroke="#000" stroke-opacity=".08" stroke-width="1"/>')
    p.append(f'<g clip-path="url(#{uid}hull)">{"".join(hull)}</g>')
    p.append(f'<path d="{HULL_PATH}" fill="none" stroke="#050D1E" stroke-opacity=".6" stroke-width="1.2"/>')
    p.append('<path d="M20 -163 Q640 -146 1236 -151 L1240 -179 L1399 -181" fill="none" stroke="#9FB4D8" stroke-opacity=".55" stroke-width="1.6"/>')

    # logo on hull
    logo, lw, lh = place_art(b.lockup_horizontal("reverse"), 410, -132, height=98)
    p.append(logo)
    # vessel name at the bow + draft marks
    p.append(f'<text x="1300" y="-150" text-anchor="middle" fill="#FFFFFF" font-family="{FONT}" font-size="10.5" font-weight="700" letter-spacing="2.2" opacity=".92">RCM PIONEER</text>')
    for i, yy in enumerate(range(-60, 1, 15)):
        p.append(f'<rect x="1352" y="{yy - 5}" width="7" height="2.4" fill="#FFFFFF" fill-opacity=".85"/>')
        p.append(f'<rect x="44" y="{yy - 5}" width="7" height="2.4" fill="#FFFFFF" fill-opacity=".85"/>')
    # hawse pipe + anchor
    p.append('<ellipse cx="1352" cy="-146" rx="9" ry="6" fill="#040B19"/>'
             '<path d="M1352 -140 v18 M1345 -126 q7 9 14 0" stroke="#3A3F47" stroke-width="3" fill="none"/>')

    # ---------------- deck: rails, pipes, catwalk
    rail = [f'<path d="M40 -170 Q640 -153 1236 -158 M1240 -192 L1396 -194" fill="none" stroke="#C9CCD1" stroke-width="1.4"/>']
    for x in range(44, 1236, 18):
        y = -164 + (x - 18) * (12 / 1218)
        rail.append(f'<line x1="{x}" y1="{n(y)}" x2="{x}" y2="{n(y - 8)}" stroke="#C9CCD1" stroke-width=".8"/>')
    for x in range(1246, 1396, 16):
        rail.append(f'<line x1="{x}" y1="-181" x2="{x}" y2="-193" stroke="#C9CCD1" stroke-width=".8"/>')
    p.append("".join(rail))
    p.append(f'<path d="M300 -158 L1236 -160" stroke="{DECK}" stroke-width="4"/><path d="M300 -164 L1236 -166" stroke="#5B616B" stroke-width="2.4"/>')
    p.append(f'<path d="M300 -182 L1240 -184" stroke="#8A9099" stroke-width="2.2"/>')
    for x in range(320, 1240, 46):
        p.append(f'<line x1="{x}" y1="-160" x2="{x}" y2="-183" stroke="#8A9099" stroke-width="1.2"/>')
    # vent masts / P-V valves
    for x in (430, 560, 690, 940, 1070, 1180):
        p.append(f'<line x1="{x}" y1="-160" x2="{x}" y2="-212" stroke="#B9BDC3" stroke-width="2.4"/><rect x="{x - 4}" y="-218" width="8" height="7" fill="#B9BDC3"/>')
    # manifold and hose crane (midship)
    p.append(f'<rect x="776" y="-176" width="70" height="16" fill="{DECK}"/><rect x="782" y="-182" width="58" height="6" fill="#5B616B"/>')
    p.append(f'<path d="M812 -176 V-262 M812 -258 L900 -230" stroke="{b.ORANGE}" stroke-width="5" fill="none" stroke-linecap="round"/>'
             f'<path d="M900 -230 V-196" stroke="#2B2F36" stroke-width="1.2"/><rect x="804" y="-270" width="16" height="10" fill="{b.ORANGE}"/>')
    # forecastle: foremast, windlass
    p.append(f'<path d="M1330 -182 V-262 M1318 -246 H1342" stroke="#D6D9DD" stroke-width="3"/><circle cx="1330" cy="-264" r="3.5" fill="#FFE7B8"/>')
    p.append(f'<rect x="1262" y="-196" width="26" height="14" rx="3" fill="#5B616B"/><rect x="1360" y="-194" width="18" height="12" rx="3" fill="#5B616B"/>')

    # ---------------- aft accommodation block
    acc = []
    acc.append(f'<rect x="58" y="-334" width="70" height="170" fill="url(#{uid}wg)"/><rect x="58" y="-334" width="70" height="170" fill="#000" fill-opacity=".06"/>')
    decks = [(-164, -198, 96, 312), (-198, -232, 100, 306), (-232, -266, 106, 300), (-266, -300, 112, 296), (-300, -332, 118, 292)]
    for (y1, y0, x0, x1) in decks:
        acc.append(f'<rect x="{x0}" y="{y0}" width="{x1 - x0}" height="{y1 - y0}" fill="url(#{uid}wg)"/>')
        acc.append(f'<line x1="{x0}" y1="{y0}" x2="{x1}" y2="{y0}" stroke="#AEB3BA" stroke-width="1.2"/>')
        for wx in range(x0 + 14, x1 - 16, 22):
            acc.append(f'<rect x="{wx}" y="{y0 + 10}" width="12" height="12" rx="1.5" fill="url(#{uid}glass)"/>')
    # bridge with wings
    acc.append(f'<rect x="92" y="-356" width="236" height="24" fill="url(#{uid}wg)"/>')
    acc.append(f'<rect x="96" y="-350" width="228" height="12" fill="url(#{uid}glass)"/>')
    for wx in range(100, 324, 14):
        acc.append(f'<line x1="{wx}" y1="-350" x2="{wx}" y2="-338" stroke="#E9EBEE" stroke-width="1.2"/>')
    acc.append(f'<rect x="88" y="-360" width="244" height="5" fill="#E2E5E8"/>')
    acc.append(f'<rect x="74" y="-336" width="270" height="4" fill="#CDD1D6"/>')
    # radar mast & antennas
    acc.append(f'<path d="M210 -360 V-424 M186 -404 H234 M196 -424 H224" stroke="#D3D6DA" stroke-width="2.6"/>'
               f'<rect x="178" y="-414" width="64" height="5" rx="2" fill="#3A3F47"/><circle cx="210" cy="-428" r="3" fill="{b.ORANGE}"/>')
    acc.append(f'<path d="M150 -360 V-392 M276 -360 V-388" stroke="#D3D6DA" stroke-width="1.6"/>')
    p.append("".join(acc))

    # funnel (raked), with symbol
    p.append(f'<path d="M54 -330 L118 -330 L124 -440 L74 -446 L58 -446 Z" fill="url(#{uid}fun)"/>')
    p.append(f'<path d="M58 -446 L74 -446 L124 -440 L123 -428 L58 -432 Z" fill="#1A1D22"/>')
    p.append(b.symbol_svg(48, 66, -404, b.WHITE, b.ORANGE))
    # free-fall lifeboat on stern ramp
    p.append(f'<g transform="rotate(-12 62 -190)"><path d="M18 -186 Q24 -206 62 -208 L104 -206 Q112 -196 104 -184 L30 -180 Q20 -180 18 -186 Z" fill="{b.ORANGE}"/>'
             f'<path d="M44 -207 Q60 -222 84 -207" fill="{b.ORANGE}"/><rect x="40" y="-200" width="44" height="4" fill="#FFFFFF" fill-opacity=".8"/></g>')
    p.append(f'<path d="M14 -176 L108 -196" stroke="#8A9099" stroke-width="3"/>')

    return "".join(p)
