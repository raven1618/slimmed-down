"""Reference elements for photographic mockups generated in Higgsfield
(or any image model that accepts reference images).

Image models read logos most reliably from flat artwork on a solid
background, so every element here is opaque, generously padded and
drawn from the master geometry. Output: mockups/higgsfield/elements/."""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import rcm_brand as b  # noqa: E402
from rcm_brand import n  # noqa: E402
from mockup_fleet import place_art, tanker  # noqa: E402

FONT = "'Aktiv Grotesk', Inter, 'Helvetica Neue', Arial, sans-serif"
OUT = "mockups/higgsfield/elements"
jobs = []


def svg(w, h, body, title, x0=0, y0=0):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{n(x0)} {n(y0)} {n(w)} {n(h)}" width="{n(w)}" height="{n(h)}" '
            f'role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n')


def emit(name, content, width):
    rel = f"{OUT}/svg/{name}.svg"
    b.write(rel, content)
    jobs.append({"svg": rel, "png": f"{OUT}/{name}.png", "width": width})


def t(x, y, text, size, fill="#FFFFFF", weight=700, ls=0.0, anchor="start", op=1.0):
    return (f'<text x="{n(x)}" y="{n(y)}" fill="{fill}" fill-opacity="{n(op)}" font-family="{FONT}" font-size="{n(size)}" '
            f'font-weight="{weight}" letter-spacing="{n(ls)}" text-anchor="{anchor}">{text}</text>')


# ---------------------------------------------------------------- logos
def logo_on(scheme, bg, kind="horizontal"):
    art = b.lockup_symbol(scheme, 600) if kind == "symbol" else b.lockup_horizontal(scheme)
    pad = art.h * (0.45 if kind == "horizontal" else 0.3)
    return art.svg(title=f"RCM Holdings {kind} logo, {scheme}", pad=pad, bg=bg)


# ---------------------------------------------------------------- 40 ft container (cm units)
def container_side(colour="navy"):
    W, H = 1219, 259
    base = b.NAVY if colour == "navy" else b.ORANGE
    light = "#1C335C" if colour == "navy" else "#FF6A2B"
    dark = "#06112A" if colour == "navy" else "#D93C00"
    p = [f'<rect width="{W}" height="{H}" fill="{base}"/>']
    x = 18.0
    while x < W - 26:
        p.append(f'<rect x="{n(x)}" y="9" width="9" height="234" fill="{light}" fill-opacity=".55"/>')
        p.append(f'<rect x="{n(x + 13.9)}" y="9" width="9" height="234" fill="{dark}" fill-opacity=".45"/>')
        x += 27.8
    p.append(f'<rect width="{W}" height="9" fill="{dark}"/><rect y="243" width="{W}" height="16" fill="{dark}"/>')
    p.append(f'<rect width="15" height="{H}" fill="{dark}"/><rect x="{W - 15}" width="15" height="{H}" fill="{dark}"/>')
    for cx, cy in ((0, 0), (W - 18, 0), (0, H - 13), (W - 18, H - 13)):
        p.append(f'<rect x="{cx}" y="{cy}" width="18" height="13" fill="{b.GRAPHITE}"/>')
    scheme = "reverse" if colour == "navy" else "white"
    logo, lw, lh = place_art(b.lockup_horizontal(scheme), 0, 0, height=112)
    p.append(logo.replace("translate(0 0)", f"translate({n((W - lw) / 2)} {n((H - lh) / 2)})"))
    p.append(t(W - 34, 34, "RCMU 204118 4", 13, ls=1.2, anchor="end"))
    p.append(t(W - 34, 50, "45G1", 10, ls=1.2, anchor="end", weight=600))
    p.append(t(34, 228, "MAX GROSS 30,480 KG · TARE 3,750 KG", 7.5, ls=.8, weight=600, op=.85))
    pad = 30
    body = f'<rect x="{-pad}" y="{-pad}" width="{W + 2 * pad}" height="{H + 2 * pad}" fill="#FFFFFF"/>' + "".join(p)
    return svg(W + 2 * pad, H + 2 * pad, body, f"RCM Holdings 40 ft container, long side ({colour})", -pad, -pad)


def container_doors():
    W, H = 244, 259
    p = [f'<rect width="{W}" height="{H}" fill="{b.NAVY}"/>']
    for x in range(14, W - 14, 9):
        p.append(f'<rect x="{x}" y="14" width="4" height="231" fill="#1C335C" fill-opacity=".5"/>')
    p.append(f'<rect width="{W}" height="12" fill="#06112A"/><rect y="245" width="{W}" height="14" fill="#06112A"/>')
    p.append(f'<rect width="12" height="{H}" fill="#06112A"/><rect x="{W - 12}" width="12" height="{H}" fill="#06112A"/>')
    p.append(f'<rect x="121" y="12" width="2" height="233" fill="#06112A"/>')
    for bx in (24, 98, 146, 220):
        p.append(f'<rect x="{bx - 2}" y="16" width="4" height="227" fill="#B9BDC3"/>'
                 f'<rect x="{bx - 5}" y="18" width="10" height="8" fill="#8A9099"/><rect x="{bx - 5}" y="233" width="10" height="8" fill="#8A9099"/>'
                 f'<rect x="{bx - 2}" y="150" width="20" height="5" rx="2" fill="#B9BDC3"/>')
    logo, lw, lh = place_art(b.lockup_horizontal("reverse"), 0, 0, width=58)
    p.append(logo.replace("translate(0 0)", f"translate({n(61 - lw / 2)} 40)"))
    p.append(t(183, 48, "RCMU 204118 4", 8.6, ls=.4, anchor="middle"))
    p.append(t(183, 61, "45G1", 8, ls=.6, anchor="middle", weight=600))
    pad = 24
    body = f'<rect x="{-pad}" y="{-pad}" width="{W + 2 * pad}" height="{H + 2 * pad}" fill="#FFFFFF"/>' + "".join(p)
    return svg(W + 2 * pad, H + 2 * pad, body, "RCM Holdings 40 ft container, door end", -pad, -pad)


# ---------------------------------------------------------------- 53 ft trailer side (cm units)
def trailer_side(lang="en"):
    W, H = 1615, 290
    lines = (["GLOBAL TRADE.", "INTELLIGENTLY", "CONNECTED."] if lang == "en"
             else ["COMERCIO GLOBAL.", "CONECTADO CON", "INTELIGENCIA."])
    p = [f'<rect width="{W}" height="{H}" rx="4" fill="{b.NAVY}"/>',
         f'<polygon points="1190,{H - 10} {W},40 {W},{H - 10}" fill="#FFFFFF" fill-opacity=".05"/>',
         f'<line x1="1080" y1="{H - 10}" x2="{W}" y2="-8" stroke="{b.ORANGE}" stroke-width="6"/>',
         f'<rect y="{H - 10}" width="{W}" height="10" fill="{b.GRAPHITE}"/>',
         f'<rect x="{W - 4}" width="4" height="{H}" fill="#06112A"/>']
    logo, lw, lh = place_art(b.lockup_horizontal("reverse"), 0, 0, height=124)
    p.append(logo.replace("translate(0 0)", f"translate(90 {n((H - 10 - lh) / 2)})"))
    sep = 90 + lw + 56
    p.append(f'<rect x="{n(sep)}" y="88" width="2" height="104" fill="#FFFFFF" fill-opacity=".3"/>')
    for i, line in enumerate(lines):
        p.append(t(sep + 40, 118 + i * 34, line, 25, weight=600, ls=5))
    p.append(t(sep + 40, 236, "RCMHOLDINGS.COM", 14, b.STONE, 600, ls=3.5))
    pad = 30
    body = f'<rect x="{-pad}" y="{-pad}" width="{W + 2 * pad}" height="{H + 2 * pad}" fill="#FFFFFF"/>' + "".join(p)
    return svg(W + 2 * pad, H + 2 * pad, body, "RCM Holdings 53 ft trailer, side livery", -pad, -pad)


def tanker_livery():
    x0, y0, w, h = -50, -480, 1500, 560
    body = f'<rect x="{x0}" y="{y0}" width="{w}" height="{h}" fill="#FFFFFF"/>' + tanker("e")
    return svg(w, h, body, "RCM Holdings product tanker livery, starboard elevation", x0, y0)


def main():
    emit("rcm-el-01-logo-fullcolor-on-white", logo_on("fullcolor", b.WHITE), 2400)
    emit("rcm-el-02-logo-reverse-on-navy", logo_on("reverse", b.NAVY), 2400)
    emit("rcm-el-03-symbol-fullcolor-on-white", logo_on("fullcolor", b.WHITE, "symbol"), 1024)
    emit("rcm-el-04-tanker-livery", tanker_livery(), 3000)
    emit("rcm-el-05-container-side-navy", container_side("navy"), 2400)
    emit("rcm-el-06-container-side-orange", container_side("orange"), 2400)
    emit("rcm-el-07-container-doors", container_doors(), 1000)
    emit("rcm-el-08-trailer-side", trailer_side("en"), 2400)
    emit("rcm-el-08-trailer-side-es", trailer_side("es"), 2400)
    os.makedirs(os.path.join(b.ROOT, "source", "build"), exist_ok=True)
    with open(os.path.join(b.ROOT, "source", "build", "png-jobs-higgsfield.json"), "w") as fh:
        json.dump(jobs, fh, indent=1)
    print(f"higgsfield elements written; {len(jobs)} png jobs queued")


if __name__ == "__main__":
    main()
