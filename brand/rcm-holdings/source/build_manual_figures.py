"""Diagrams used inside the brand manual (construction, clear space, misuse)."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import rcm_brand as b  # noqa: E402
from rcm_brand import n  # noqa: E402

FONT = "'Aktiv Grotesk', Inter, 'Helvetica Neue', Arial, sans-serif"
GUIDE = "#9DA5B0"


def svg(w, h, body, title, defs=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n(w)} {n(h)}" width="{n(w)}" height="{n(h)}" role="img" aria-label="{title}">'
            f'<title>{title}</title>' + (f"<defs>{defs}</defs>" if defs else "") + body + "</svg>\n")


def label(x, y, text, size=13, fill=b.GRAPHITE, anchor="middle", weight=600, ls=1.5):
    return (f'<text x="{n(x)}" y="{n(y)}" fill="{fill}" font-family="{FONT}" font-size="{size}" font-weight="{weight}" '
            f'letter-spacing="{ls}" text-anchor="{anchor}">{text}</text>')


def construction():
    W = H = 640
    c = W / 2
    S = 440
    R = S / 2
    r = R * b.SYM_INNER
    g = R * b.SYM_GAP / 2
    parts = [f'<rect width="{W}" height="{H}" fill="#FFFFFF"/>']
    # grid
    step = R / 5
    grid = []
    k = -6
    while k <= 6:
        grid.append(f"M{n(c + k * step)} 20V{H - 20} M20 {n(c + k * step)}H{W - 20}")
        k += 1
    parts.append(f'<path d="{" ".join(grid)}" stroke="#EEF0F2" stroke-width="1"/>')
    parts.append(f'<circle cx="{c}" cy="{c}" r="{n(R)}" fill="none" stroke="{GUIDE}" stroke-dasharray="4 5"/>')
    parts.append(b.symbol_svg(S, c - R, c - R, b.NAVY, b.ORANGE).replace('<g class="rcm-symbol">', '<g class="rcm-symbol" opacity=".92">'))
    parts.append(f'<path d="M{c} {c - R}L{c + R} {c}L{c} {c + R}L{c - R} {c}Z" fill="none" stroke="{b.ORANGE}" stroke-width="1.5" stroke-dasharray="6 5"/>')
    parts.append(f'<path d="M{c} {n(c - r)}L{n(c + r)} {c}L{c} {n(c + r)}L{n(c - r)} {c}Z" fill="none" stroke="{b.ORANGE}" stroke-width="1.5" stroke-dasharray="6 5"/>')
    parts.append(f'<path d="M{c} 30V{H - 30} M30 {c}H{W - 30}" stroke="{b.ORANGE}" stroke-width="1"/>')
    # dimension: outer half diagonal
    y0 = c + R + 34
    parts.append(f'<path d="M{c} {n(y0)}H{n(c + R)} M{c} {n(y0 - 7)}v14 M{n(c + R)} {n(y0 - 7)}v14" stroke="{b.GRAPHITE}" stroke-width="1.2"/>')
    parts.append(label(c + R / 2, y0 - 10, "1.00"))
    # inner half diagonal
    y1 = c - R - 30
    parts.append(f'<path d="M{c} {n(y1)}H{n(c + r)} M{c} {n(y1 - 7)}v14 M{n(c + r)} {n(y1 - 7)}v14" stroke="{b.GRAPHITE}" stroke-width="1.2"/>')
    parts.append(label(c + r / 2, y1 - 10, "0.56"))
    # channel
    parts.append(f'<path d="M{n(c - R - 40)} {n(c - g)}h24 M{n(c - R - 40)} {n(c + g)}h24" stroke="{b.GRAPHITE}" stroke-width="1.2"/>')
    parts.append(label(c - R - 48, c + 5, "0.13", anchor="end"))
    parts.append(label(c + R * 0.62, c - R * 0.70, "45°", 14, b.ORANGE))
    return svg(W, H, "".join(parts), "Symbol construction")


def clearspace():
    art = b.lockup_horizontal("fullcolor")
    X = b.CAP
    pad = X
    m = 70
    W = art.w + 2 * pad + 2 * m
    H = art.h + 2 * pad + 2 * m
    ox, oy = m + pad, m + pad
    parts = [f'<rect width="{n(W)}" height="{n(H)}" fill="#FFFFFF"/>',
             f'<rect x="{n(m)}" y="{n(m)}" width="{n(art.w + 2 * pad)}" height="{n(art.h + 2 * pad)}" fill="#FFF3EE" stroke="{b.ORANGE}" stroke-width="2" stroke-dasharray="10 8"/>',
             f'<rect x="{n(ox)}" y="{n(oy)}" width="{n(art.w)}" height="{n(art.h)}" fill="#FFFFFF" stroke="{GUIDE}" stroke-width="1.5"/>',
             f'<g transform="translate({n(ox)} {n(oy)})">{art.body}</g>']
    # X markers
    for (x, y) in [(m, m), (ox + art.w, m), (m, oy + art.h), (ox + art.w, oy + art.h)]:
        parts.append(f'<rect x="{n(x)}" y="{n(y)}" width="{n(X)}" height="{n(X)}" fill="{b.ORANGE}" fill-opacity=".14"/>')
        parts.append(label(x + X / 2, y + X / 2 + 14, "X", 40, b.ORANGE, weight=700, ls=0))
    # X definition on R
    rx = ox + b.SYMBOL_SIZE + b.SYMBOL_GAP
    ry = oy + (b.SYMBOL_SIZE - (b.CAP + b.DESC_GAP + b.DESC_CAP) - 3)
    parts.append(f'<path d="M{n(rx - 22)} {n(ry)}V{n(ry + X)} M{n(rx - 30)} {n(ry)}h16 M{n(rx - 30)} {n(ry + X)}h16" stroke="{b.ORANGE}" stroke-width="2.5"/>')
    parts.append(label(rx - 36, ry + X / 2 + 9, "X", 26, b.ORANGE, anchor="end", weight=700, ls=0))
    return svg(W, H, "".join(parts), "Logo clear space")


# ----------------------------------------------------------------- misuse
def misuse(kind):
    W, H = 900, 420
    art = b.lockup_horizontal("fullcolor")
    s = 600 / art.w
    lw, lh = art.w * s, art.h * s
    x, y = (W - lw) / 2, (H - lh) / 2
    cx, cy = W / 2, H / 2
    bg = '<rect width="900" height="420" fill="#FFFFFF"/>'
    defs = ""
    g = f'<g transform="translate({n(x)} {n(y)}) scale({s:.5f})">{art.body}</g>'
    if kind == "stretch":
        g = f'<g transform="translate({cx} {cy}) scale(1.38 .72) translate({-cx} {-cy})">{g}</g>'
    elif kind == "rotate":
        g = f'<g transform="rotate(-14 {cx} {cy})">{g}</g>'
    elif kind == "recolor":
        g = (g.replace(b.NAVY, "#1E7F4F").replace(b.ORANGE, "#F2C200").replace(b.GRAPHITE_75, "#7A3EA0"))
    elif kind == "accent":
        sym = b.symbol_paths(b.SYMBOL_SIZE)
        new_sym = (f'<g class="rcm-symbol"><path fill="{b.ORANGE}" d="{sym["tl"]}"/><path fill="{b.NAVY}" d="{sym["tr"]}"/>'
                   f'<path fill="{b.NAVY}" d="{sym["bl"]}"/><path fill="{b.NAVY}" d="{sym["br"]}"/></g>')
        start = art.body.index('<g class="rcm-symbol">')
        end = art.body.index("</g>", start) + 4
        body = art.body[:start] + new_sym + art.body[end:]
        g = f'<g transform="translate({n(x)} {n(y)}) scale({s:.5f})">{body}</g>'
    elif kind == "effects":
        defs = ('<filter id="ds" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="10" dy="14" stdDeviation="7" flood-color="#000" flood-opacity=".45"/></filter>'
                '<linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A7BB8"/><stop offset="1" stop-color="#0B1D3A"/></linearGradient>')
        g = f'<g filter="url(#ds)">{g.replace(b.NAVY, "url(#gr)")}</g>'
    elif kind == "rearrange":
        sym = b.symbol_svg(b.SYMBOL_SIZE, b.WORDMARK_W + b.SYMBOL_GAP, 0, b.NAVY, b.ORANGE)
        word = b.wordmark_block(b.SCHEMES["fullcolor"], 0, b.SYMBOL_SIZE - (b.CAP + b.DESC_GAP + b.DESC_CAP) - 3)
        g = f'<g transform="translate({n(x)} {n(y)}) scale({s:.5f})">{word}{sym}</g>'
    elif kind == "retype":
        sym = b.symbol_svg(b.SYMBOL_SIZE, 0, 0, b.NAVY, b.ORANGE)
        g = (f'<g transform="translate({n(x)} {n(y)}) scale({s:.5f})">{sym}'
             f'<text x="246" y="120" font-family="Georgia, \'Times New Roman\', serif" font-size="132" font-style="italic" fill="{b.NAVY}">Rcm</text>'
             f'<text x="250" y="186" font-family="Georgia, serif" font-size="44" fill="{b.GRAPHITE_75}">Holdings</text></g>')
    elif kind == "contrast":
        bg = f'<rect width="900" height="420" fill="{b.GRAPHITE}"/>'
    return svg(W, H, bg + g, f"Logo misuse — {kind}", defs)


MISUSE = ["stretch", "rotate", "recolor", "accent", "effects", "rearrange", "retype", "contrast"]


def main():
    b.write("manual/img/symbol-construction.svg", construction())
    b.write("manual/img/clearspace.svg", clearspace())
    for k in MISUSE:
        b.write(f"manual/img/misuse-{k}.svg", misuse(k))
    print("manual figures written")


if __name__ == "__main__":
    main()
