"""Corporate application templates: stationery, digital, presentation,
environmental. Text is kept live (editable) in templates; logos are
outlined artwork from the master geometry.

Every template is generated in English and Spanish (files suffixed -es).
All names, phone numbers and addresses are placeholders."""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import rcm_brand as b  # noqa: E402
from rcm_brand import n  # noqa: E402
from build_assets import Globe, globe_layer, graphic_speed  # noqa: E402

FONT = "'Aktiv Grotesk', Inter, 'Helvetica Neue', Arial, sans-serif"
png_jobs = []

CONTACT = {
    "name": "John Anderson",
    "tel": "+1 212 555 0100",
    "mob": "+1 917 555 0198",
    "email": "j.anderson@rcmholdings.com",
    "web": "rcmholdings.com",
    "addr1": "123 Harbor Boulevard, Suite 400",
}

TXT = {
    "en": dict(
        title="Global Trade Director",
        addr2="New York, NY 10004 · USA",
        date="10 November 2026",
        recipient=["Ms. Maria Lopez", "Director of Procurement", "Northwind Industrial Supply", "Rotterdam, Netherlands"],
        re="RE: ANNUAL FREIGHT &amp; CUSTOMS SERVICES AGREEMENT",
        salutation="Dear Ms. Lopez,",
        para=[
            "Thank you for the opportunity to support Northwind’s growing trans-Atlantic program. Enclosed you",
            "will find our proposal for consolidated ocean and air freight, together with customs brokerage at",
            "origin and destination, managed through a single point of contact.",
            "",
            "Our team has designed the program around three priorities you identified: predictable transit",
            "times, full visibility of every shipment, and a compliance process that removes surprises at the",
            "border. Each lane is supported by dedicated specialists and our digital control tower.",
            "",
            "We look forward to discussing the proposal with you and your team.",
        ],
        closing="Sincerely,",
        footer="GLOBAL FREIGHT FORWARDING &amp; CUSTOMS BROKERAGE",
        banner=["GLOBAL TRADE.", "INTELLIGENTLY", "CONNECTED."],
        post=["MOVING", "TRADE FORWARD."],
        post_sub="Freight forwarding &amp; customs brokerage across 18 countries.",
        cover_eyebrow="COMPANY OVERVIEW · 2026",
        cover_title=["A Strategic Partner", "in Global Commerce."],
        cover_sub=["Freight forwarding and customs brokerage that connects",
                   "markets, simplifies complexity and drives trade forward."],
        section="SECTION",
        divider_title=["Our Global", "Network"],
        content_eyebrow="02 · OUR GLOBAL NETWORK",
        content_title=["One partner from origin", "to final destination."],
        content_para=["We coordinate ocean, air and road freight with customs",
                      "brokerage in a single, accountable workflow — so every",
                      "shipment moves with clear ownership and full visibility."],
        stats=[("57", ["Active", "trade lanes"]), ("98.2%", ["On-time", "delivery"]),
               ("6.4 h", ["Average", "customs clearance"])],
        chart="TRANSIT PERFORMANCE · LAST 12 WEEKS",
        slide_footer="RCM HOLDINGS · COMPANY OVERVIEW 2026",
        dim_centre="1550 mm to centre (AFF)",
        sign_title="RECEPTION WALL — FRONT ELEVATION · SCALE 1:25 @ A3",
        sign_note="Dimensional letters: 20 mm aluminium, powder-coated Navy (RAL 5011) and Orange Red (RAL 2004, match to PANTONE 1655 C), 25 mm stand-off.",
        titles=dict(card_front="RCM Holdings business card — front", card_back="RCM Holdings business card — back",
                    letterhead="RCM Holdings letterhead", envelope="RCM Holdings #10 envelope",
                    banner="RCM Holdings LinkedIn banner", post="RCM Holdings social post template",
                    cover="RCM Holdings presentation — cover slide", divider="RCM Holdings presentation — section divider",
                    content="RCM Holdings presentation — content slide", folder="RCM Holdings presentation folder — front cover",
                    signage="RCM Holdings reception signage elevation"),
    ),
    "es": dict(
        title="Director de Comercio Global",
        addr2="New York, NY 10004 · EE. UU.",
        date="10 de noviembre de 2026",
        recipient=["Sra. María López", "Directora de Compras", "Northwind Industrial Supply", "Róterdam, Países Bajos"],
        re="REF.: CONTRATO ANUAL DE SERVICIOS DE CARGA Y ADUANAS",
        salutation="Estimada Sra. López:",
        para=[
            "Le agradecemos la oportunidad de apoyar el creciente programa transatlántico de Northwind.",
            "Adjunto encontrará nuestra propuesta de carga marítima y aérea consolidada, junto con el",
            "agenciamiento aduanero en origen y destino, gestionado a través de un único punto de contacto.",
            "",
            "Nuestro equipo diseñó el programa en torno a las tres prioridades que usted identificó: tiempos",
            "de tránsito predecibles, visibilidad total de cada envío y un proceso de cumplimiento que elimina",
            "las sorpresas en frontera. Cada ruta cuenta con especialistas dedicados y nuestra torre de control.",
            "",
            "Quedamos atentos para conversar sobre la propuesta con usted y su equipo.",
        ],
        closing="Atentamente,",
        footer="CARGA INTERNACIONAL Y AGENCIAMIENTO ADUANERO",
        banner=["COMERCIO GLOBAL.", "CONECTADO CON", "INTELIGENCIA."],
        post=["IMPULSAMOS", "EL COMERCIO."],
        post_sub="Carga internacional y agenciamiento aduanero en 18 países.",
        cover_eyebrow="PRESENTACIÓN CORPORATIVA · 2026",
        cover_title=["Un socio estratégico", "en el comercio global."],
        cover_sub=["Carga internacional y agenciamiento aduanero que conecta",
                   "mercados, simplifica la complejidad e impulsa el comercio."],
        section="SECCIÓN",
        divider_title=["Nuestra red", "global"],
        content_eyebrow="02 · NUESTRA RED GLOBAL",
        content_title=["Un solo socio,", "del origen al destino."],
        content_para=["Coordinamos la carga marítima, aérea y terrestre con el",
                      "agenciamiento aduanero en un solo flujo de trabajo: cada",
                      "envío avanza con un responsable claro y visibilidad total."],
        stats=[("57", ["Rutas", "comerciales", "activas"]), ("98.2%", ["Entregas", "a tiempo"]),
               ("6.4 h", ["Despacho", "aduanero", "promedio"])],
        chart="DESEMPEÑO DE TRÁNSITO · ÚLTIMAS 12 SEMANAS",
        slide_footer="RCM HOLDINGS · PRESENTACIÓN CORPORATIVA 2026",
        dim_centre="1550 mm al centro (sobre NPT)",
        sign_title="MURO DE RECEPCIÓN — ELEVACIÓN FRONTAL · ESCALA 1:25 @ A3",
        sign_note="Letras corpóreas: aluminio de 20 mm con pintura electrostática Azul Marino (RAL 5011) y Rojo Anaranjado (RAL 2004, igualar a PANTONE 1655 C); separadores de 25 mm.",
        titles=dict(card_front="RCM Holdings — tarjeta de presentación, anverso", card_back="RCM Holdings — tarjeta de presentación, reverso",
                    letterhead="RCM Holdings — hoja membretada", envelope="RCM Holdings — sobre #10",
                    banner="RCM Holdings — portada de LinkedIn", post="RCM Holdings — plantilla de publicación social",
                    cover="RCM Holdings — presentación, portada", divider="RCM Holdings — presentación, separador de sección",
                    content="RCM Holdings — presentación, diapositiva de contenido", folder="RCM Holdings — carpeta corporativa, portada",
                    signage="RCM Holdings — elevación de señalética de recepción"),
    ),
}


def place(art: b.Art, x, y, width=None, height=None):
    s = (width / art.w) if width else (height / art.h)
    return f'<g transform="translate({n(x)} {n(y)}) scale({s:.5f})">{art.body}</g>', art.w * s, art.h * s


def t(x, y, text, size, fill=b.GRAPHITE, weight=400, ls=0.0, anchor="start", extra=""):
    a = f' text-anchor="{anchor}"' if anchor != "start" else ""
    l = f' letter-spacing="{n(ls)}"' if ls else ""
    return (f'<text x="{n(x)}" y="{n(y)}" fill="{fill}" font-family="{FONT}" font-size="{n(size)}" '
            f'font-weight="{weight}"{l}{a}{extra}>{text}</text>')


def doc(w, h, body, title, unit="", defs="", lang="en"):
    wa = f"{n(w)}{unit}" if unit != "pt" else f"{n(w)}pt"
    ha = f"{n(h)}{unit}" if unit != "pt" else f"{n(h)}pt"
    if unit == "in":
        wa, ha = f"{n(w / 72)}in", f"{n(h / 72)}in"
    la = ' xml:lang="es"' if lang == "es" else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n(w)} {n(h)}" width="{wa}" height="{ha}" '
            f'role="img" aria-label="{title}"{la}><title>{title}</title>' + (f"<defs>{defs}</defs>" if defs else "")
            + body + "</svg>\n")


def guides(x, y, w, h, safe):
    return (f'<g id="guides" display="none" fill="none" stroke-width=".5">'
            f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" stroke="#00AEEF"/>'
            f'<rect x="{n(x + safe)}" y="{n(y + safe)}" width="{n(w - 2 * safe)}" height="{n(h - 2 * safe)}" stroke="#EC008C" stroke-dasharray="2 2"/></g>')


def job(rel, width):
    png_jobs.append({"svg": rel, "png": rel.replace("templates/", "templates/png/").replace(".svg", ".png"), "width": width})


# ------------------------------------------------------------------ cards
BLEED = 9.0           # 0.125 in
CW, CH = 252.0, 144.0  # 3.5 x 2 in (US business card)


def business_card_front(lang="en"):
    W, H = CW + 2 * BLEED, CH + 2 * BLEED
    logo, lw, lh = place(b.lockup_horizontal("reverse"), 0, 0, width=150)
    x, y = (W - 150) / 2, (H - lh) / 2 - 4
    logo = logo.replace('translate(0 0)', f'translate({n(x)} {n(y)})')
    body = (f'<rect width="{n(W)}" height="{n(H)}" fill="{b.NAVY}"/>'
            f'<polygon points="{n(W * 0.62)},{n(H)} {n(W)},{n(H * 0.46)} {n(W)},{n(H)}" fill="#FFFFFF" fill-opacity=".05"/>'
            f'<line x1="{n(W * 0.55)}" y1="{n(H)}" x2="{n(W)}" y2="{n(H * 0.36)}" stroke="{b.ORANGE}" stroke-width="1.1"/>'
            + logo + guides(BLEED, BLEED, CW, CH, 12))
    return doc(W, H, body, TXT[lang]["titles"]["card_front"], unit="in", lang=lang)


def business_card_back(lang="en", p=CONTACT):
    T = TXT[lang]
    W, H = CW + 2 * BLEED, CH + 2 * BLEED
    L = BLEED + 20
    logo, lw, lh = place(b.lockup_horizontal("fullcolor"), L, BLEED + 20, width=88)
    wm = b.symbol_svg(150, W - 78, 14, "#F1F2F3", "#F1F2F3")
    rows = [("T", p["tel"]), ("M", p["mob"]), ("E", p["email"]), ("W", p["web"])]
    body = [f'<rect width="{n(W)}" height="{n(H)}" fill="#FFFFFF"/>', wm, logo,
            t(L, BLEED + 78, p["name"], 11, b.NAVY, 700),
            t(L, BLEED + 89, T["title"].upper(), 5.4, b.ORANGE, 600, ls=0.9),
            f'<rect x="{n(L)}" y="{n(BLEED + 95)}" width="16" height=".9" fill="{b.ORANGE}"/>']
    for i, (k, v) in enumerate(rows):
        y = BLEED + 104 + i * 8.6
        body.append(t(L, y, k, 6, b.NAVY, 700))
        body.append(t(L + 9, y, v, 6.2, b.GRAPHITE, 400))
    body.append(guides(BLEED, BLEED, CW, CH, 12))
    return doc(W, H, "".join(body), T["titles"]["card_back"], unit="in", lang=lang)


# ------------------------------------------------------------------ letterhead
def letterhead(W, H, name, lang="en", p=CONTACT, sample=True):
    T = TXT[lang]
    M = 54 if W < 600 else 56
    logo, lw, lh = place(b.lockup_horizontal("fullcolor"), M, 46, width=150)
    R = W - M
    body = [f'<rect width="{n(W)}" height="{n(H)}" fill="#FFFFFF"/>', logo]
    for i, line in enumerate([p["addr1"], T["addr2"], f'T {p["tel"]}', p["web"]]):
        body.append(t(R, 54 + i * 10.5, line, 7.2, b.GRAPHITE if i < 3 else b.NAVY, 400 if i < 3 else 600, anchor="end"))
    body.append(f'<rect x="{n(M)}" y="112" width="{n(W - 2 * M)}" height=".6" fill="{b.STONE}"/>')
    body.append(f'<rect x="{n(M)}" y="111.5" width="34" height="1.6" fill="{b.ORANGE}"/>')
    if sample:
        y = 160
        g = ['<g id="sample-content">']
        g.append(t(M, y, T["date"], 9, b.GRAPHITE))
        for i, line in enumerate(T["recipient"]):
            g.append(t(M, y + 32 + i * 13, line, 9, b.NAVY if i == 0 else b.GRAPHITE, 600 if i == 0 else 400))
        g.append(t(M, y + 110, T["re"], 7.5, b.NAVY, 700, ls=1.1))
        g.append(t(M, y + 136, T["salutation"], 9.5, b.GRAPHITE))
        para = T["para"]
        for i, line in enumerate(para):
            if line:
                g.append(t(M, y + 160 + i * 14.5, line, 9.5, b.GRAPHITE))
        yy = y + 160 + len(para) * 14.5 + 22
        g.append(t(M, yy, T["closing"], 9.5, b.GRAPHITE))
        g.append(t(M, yy + 44, p["name"], 9.5, b.NAVY, 700))
        g.append(t(M, yy + 57, T["title"], 8.5, b.GRAPHITE))
        g.append("</g>")
        body += g
    # footer
    fy = H - 46
    body.append(f'<rect x="{n(M)}" y="{n(fy - 14)}" width="{n(W - 2 * M)}" height=".6" fill="{b.STONE}"/>')
    body.append(t(M, fy, f'<tspan font-weight="700" fill="{b.NAVY}">RCM HOLDINGS</tspan>   ·   {T["footer"]}', 6.6, b.GRAPHITE, 500, ls=1.1))
    body.append(t(R - 26, fy, p["web"].upper(), 6.6, b.NAVY, 600, ls=1.1, anchor="end"))
    body.append(f'<polygon points="{n(W - 120)},{n(H)} {n(W)},{n(H - 70)} {n(W)},{n(H)}" fill="{b.NAVY}"/>'
                f'<line x1="{n(W - 150)}" y1="{n(H)}" x2="{n(W)}" y2="{n(H - 88)}" stroke="{b.ORANGE}" stroke-width="1.2"/>')
    return doc(W, H, "".join(body), f"{T['titles']['letterhead']} — {name}", unit="in", lang=lang)


def envelope(lang="en", p=CONTACT):
    T = TXT[lang]
    W, H = 684.0, 297.0  # US #10, 9.5 x 4.125 in
    logo, lw, lh = place(b.lockup_horizontal("fullcolor"), 36, 34, width=120)
    body = [f'<rect width="{W}" height="{H}" fill="#FFFFFF"/>', logo,
            t(36, 34 + lh + 22, p["addr1"], 7.2, b.GRAPHITE), t(36, 34 + lh + 32.5, T["addr2"], 7.2, b.GRAPHITE),
            f'<polygon points="{n(W - 150)},{H} {W},{n(H - 84)} {W},{H}" fill="{b.NAVY}"/>',
            f'<line x1="{n(W - 186)}" y1="{H}" x2="{W}" y2="{n(H - 105)}" stroke="{b.ORANGE}" stroke-width="1.3"/>']
    return doc(W, H, "".join(body), T["titles"]["envelope"], unit="in", lang=lang)


# ------------------------------------------------------------------ digital
def linkedin_banner(lang="en"):
    T = TXT[lang]
    W, H = 1584, 396
    logo, lw, lh = place(b.lockup_horizontal("reverse"), 0, 0, width=520)
    y = (H - lh) / 2
    logo = logo.replace("translate(0 0)", f"translate({n(170)} {n(y)})")
    body = [f'<rect width="{W}" height="{H}" fill="{b.NAVY}"/>',
            f'<polygon points="1060,{H} {W},-40 {W},{H}" fill="#FFFFFF" fill-opacity=".045"/>',
            f'<polygon points="1250,{H} {W},120 {W},{H}" fill="#FFFFFF" fill-opacity=".05"/>',
            f'<line x1="980" y1="{H}" x2="{W}" y2="-60" stroke="{b.ORANGE}" stroke-width="3"/>',
            logo,
            f'<rect x="770" y="128" width="1.5" height="140" fill="#FFFFFF" fill-opacity=".25"/>']
    for i, line in enumerate(T["banner"]):
        body.append(t(812, 172 + i * 34, line, 22, b.WHITE, 600, ls=5))
    return doc(W, H, "".join(body), T["titles"]["banner"], lang=lang)


def social_post(lang="en"):
    T = TXT[lang]
    W = H = 1080
    sp = graphic_speed(W, H, seed=11)
    inner = sp[sp.index("<defs>"):sp.rindex("</svg>")]
    logo, lw, lh = place(b.lockup_horizontal("reverse"), 80, 80, width=300)
    body = [inner, f'<rect width="{W}" height="{H}" fill="{b.NAVY}" fill-opacity=".35"/>', logo,
            t(80, 760, T["post"][0], 92, b.WHITE, 700, ls=-1), t(80, 860, T["post"][1], 92, b.WHITE, 700, ls=-1),
            f'<rect x="80" y="900" width="90" height="6" fill="{b.ORANGE}"/>',
            t(80, 970, T["post_sub"], 28, b.STONE, 400)]
    return doc(W, H, "".join(body), T["titles"]["post"], lang=lang)


# ------------------------------------------------------------------ presentation
def slide_cover(lang="en"):
    T = TXT[lang]
    W, H = 1920, 1080
    g = Globe(1430, 640, 560, lon0=-28, tilt=22)
    logo, lw, lh = place(b.lockup_horizontal("reverse"), 120, 100, width=330)
    defs = (f'<radialGradient id="cg" cx="75%" cy="55%" r="65%"><stop offset="0" stop-color="#17325E"/>'
            f'<stop offset="1" stop-color="{b.NAVY}"/></radialGradient>'
            f'<linearGradient id="fade" x1="0" x2="1"><stop offset=".25" stop-color="{b.NAVY}"/><stop offset=".6" stop-color="{b.NAVY}" stop-opacity="0"/></linearGradient>')
    body = [f'<rect width="{W}" height="{H}" fill="url(#cg)"/>', globe_layer(g, labels=False),
            f'<rect width="{W}" height="{H}" fill="url(#fade)"/>', logo,
            t(120, 520, T["cover_eyebrow"], 22, b.ORANGE, 600, ls=4.5),
            t(120, 620, T["cover_title"][0], 84, b.WHITE, 700, ls=-1.5),
            t(120, 720, T["cover_title"][1], 84, b.WHITE, 700, ls=-1.5),
            f'<rect x="120" y="770" width="96" height="6" fill="{b.ORANGE}"/>',
            t(120, 850, T["cover_sub"][0], 30, b.STONE, 400),
            t(120, 892, T["cover_sub"][1], 30, b.STONE, 400),
            t(120, 1000, "rcmholdings.com", 20, b.STONE, 500, ls=2)]
    return doc(W, H, "".join(body), T["titles"]["cover"], defs=defs, lang=lang)


def slide_divider(lang="en"):
    T = TXT[lang]
    W, H = 1920, 1080
    body = [f'<rect width="{W}" height="{H}" fill="#FFFFFF"/>',
            f'<polygon points="900,{H} {W},80 {W},{H}" fill="{b.NAVY}"/>',
            f'<polygon points="1250,{H} {W},420 {W},{H}" fill="#FFFFFF" fill-opacity=".05"/>',
            f'<line x1="760" y1="{H}" x2="{W}" y2="-40" stroke="{b.ORANGE}" stroke-width="4"/>',
            t(120, 430, "02", 180, b.ORANGE, 700, ls=-4),
            t(126, 520, T["section"], 22, b.GRAPHITE, 600, ls=4.5),
            t(120, 620, T["divider_title"][0], 84, b.NAVY, 700, ls=-1.5),
            t(120, 720, T["divider_title"][1], 84, b.NAVY, 700, ls=-1.5),
            f'<rect x="120" y="770" width="96" height="6" fill="{b.ORANGE}"/>',
            b.symbol_svg(44, 1756, 976, b.WHITE, b.ORANGE)]
    return doc(W, H, "".join(body), T["titles"]["divider"], lang=lang)


def slide_content(lang="en"):
    T = TXT[lang]
    W, H = 1920, 1080
    logo, lw, lh = place(b.lockup_horizontal("fullcolor"), 1620, 1004, width=180)
    body = [f'<rect width="{W}" height="{H}" fill="#FFFFFF"/>',
            t(120, 150, T["content_eyebrow"], 18, b.GRAPHITE, 600, ls=4),
            t(120, 250, T["content_title"][0], 64, b.NAVY, 700, ls=-1),
            t(120, 330, T["content_title"][1], 64, b.NAVY, 700, ls=-1),
            f'<rect x="120" y="372" width="72" height="5" fill="{b.ORANGE}"/>']
    for i, l in enumerate(T["content_para"]):
        body.append(t(120, 460 + i * 44, l, 28, b.GRAPHITE, 400))
    for i, (v, lab) in enumerate(T["stats"]):
        x = 1040 + i * 280
        body.append(f'<rect x="{x}" y="200" width="250" height="330" fill="{b.NAVY if i == 0 else "#F3F4F5"}"/>')
        body.append(t(x + 30, 330, v, 64, b.WHITE if i == 0 else b.NAVY, 700, ls=-1))
        body.append(f'<rect x="{x + 30}" y="360" width="40" height="4" fill="{b.ORANGE}"/>')
        for j, w in enumerate(lab):
            body.append(t(x + 30, 410 + j * 32, w, 24, b.STONE if i == 0 else b.GRAPHITE, 400))
    body.append(f'<rect x="1040" y="580" width="790" height="300" fill="#F3F4F5"/>')
    body.append(t(1070, 640, T["chart"], 16, b.GRAPHITE, 600, ls=3))
    vals = [92, 94, 93, 95, 96, 95, 97, 97, 98, 97, 98, 98.2]
    for i, v in enumerate(vals):
        h = (v - 88) * 18
        body.append(f'<rect x="{1070 + i * 61}" y="{n(850 - h)}" width="40" height="{n(h)}" fill="{b.ORANGE if i == 11 else b.NAVY}"/>')
    body.append(f'<rect x="120" y="980" width="{W - 240}" height="1.5" fill="{b.STONE}"/>')
    body.append(t(120, 1036, T["slide_footer"], 15, b.GRAPHITE, 500, ls=3))
    body.append(t(1500, 1036, "07", 15, b.NAVY, 700, ls=3))
    body.append(logo)
    return doc(W, H, "".join(body), T["titles"]["content"], lang=lang)


# ------------------------------------------------------------------ folder & signage
def folder_cover(lang="en"):
    W, H = 648.0, 864.0  # 9 x 12 in
    logo, lw, lh = place(b.lockup_horizontal("reverse"), 0, 0, width=230)
    logo = logo.replace("translate(0 0)", f"translate({n((W - 230) / 2)} {n(H * 0.70)})")
    body = [f'<rect width="{W}" height="{H}" fill="{b.NAVY}"/>',
            f'<g stroke="#FFFFFF" stroke-opacity=".16" stroke-width=".8"><line x1="{n(W*0.15)}" y1="0" x2="{W}" y2="{n(H*0.62)}"/>'
            f'<line x1="0" y1="{n(H*0.48)}" x2="{n(W*0.72)}" y2="0"/></g>',
            f'<line x1="{n(W*0.62)}" y1="{H}" x2="{W}" y2="{n(H*0.62)}" stroke="{b.ORANGE}" stroke-width="1.4"/>',
            b.symbol_svg(150, W - 140, 110, "#FFFFFF", "#FFFFFF").replace('<g class="rcm-symbol">', '<g class="rcm-symbol" opacity=".07">'),
            logo]
    return doc(W, H, "".join(body), TXT[lang]["titles"]["folder"], unit="in", lang=lang)


def signage_elevation(lang="en"):
    """Reception wall elevation, millimetres."""
    T = TXT[lang]
    W, H = 5200.0, 3400.0
    wall_x, wall_y, wall_w, wall_h = 300.0, 300.0, 4600.0, 2800.0
    logo_w = 2000.0
    art = b.lockup_horizontal("fullcolor")
    logo_h = art.h * logo_w / art.w
    lx = wall_x + (wall_w - logo_w) / 2
    ly = wall_y + wall_h - 1550 - logo_h / 2   # centre at 1550 mm AFF
    logo, _, _ = place(art, lx, ly, width=logo_w)
    shadow, _, _ = place(b.lockup_horizontal("black"), lx + 18, ly + 26, width=logo_w)
    dim = "#4A4F57"

    def dline(x1, y1, x2, y2, label, vertical=False):
        s = (f'<line x1="{n(x1)}" y1="{n(y1)}" x2="{n(x2)}" y2="{n(y2)}" stroke="{dim}" stroke-width="5"/>'
             f'<circle cx="{n(x1)}" cy="{n(y1)}" r="14" fill="{dim}"/><circle cx="{n(x2)}" cy="{n(y2)}" r="14" fill="{dim}"/>')
        if vertical:
            mx, my = x1 - 40, (y1 + y2) / 2
            s += t(mx, my, label, 64, dim, 500, anchor="middle", extra=f' transform="rotate(-90 {n(mx)} {n(my)})"')
        else:
            s += t((x1 + x2) / 2, y1 - 40, label, 64, dim, 500, anchor="middle")
        return s

    floor = wall_y + wall_h
    body = [f'<rect width="{W}" height="{H}" fill="#FFFFFF"/>',
            f'<rect x="{n(wall_x)}" y="{n(wall_y)}" width="{n(wall_w)}" height="{n(wall_h)}" fill="#E4E5E7"/>',
            f'<rect x="{n(wall_x)}" y="{n(floor)}" width="{n(wall_w)}" height="30" fill="{b.GRAPHITE}"/>',
            f'<g opacity=".18">{shadow}</g>', logo,
            dline(lx, ly - 160, lx + logo_w, ly - 160, "2000 mm"),
            dline(lx + logo_w + 260, ly, lx + logo_w + 260, ly + logo_h, f"{round(logo_h)} mm", vertical=True),
            dline(lx - 260, ly + logo_h / 2, lx - 260, floor, T["dim_centre"], vertical=True),
            t(wall_x, H - 90, T["sign_title"], 70, b.NAVY, 700, ls=8),
            t(wall_x, H - 10, T["sign_note"], 54 if lang == "en" else 50, dim, 400)]
    return doc(W, H, "".join(body), T["titles"]["signage"], unit="mm", lang=lang)


def main():
    for lang in ("en", "es"):
        sfx = "" if lang == "en" else "-es"
        items = {
            f"templates/print/rcm-business-card-front{sfx}.svg": (business_card_front(lang), 1050),
            f"templates/print/rcm-business-card-back{sfx}.svg": (business_card_back(lang), 1050),
            f"templates/print/rcm-letterhead-us-letter{sfx}.svg": (letterhead(612, 792, "US Letter" if lang == "en" else "Carta (EE. UU.)", lang), 1275),
            f"templates/print/rcm-letterhead-a4{sfx}.svg": (letterhead(595.28, 841.89, "A4", lang), 1240),
            f"templates/print/rcm-envelope-10{sfx}.svg": (envelope(lang), 1425),
            f"templates/print/rcm-folder-cover{sfx}.svg": (folder_cover(lang), 1200),
            f"templates/digital/rcm-linkedin-banner{sfx}.svg": (linkedin_banner(lang), 1584),
            f"templates/digital/rcm-social-post{sfx}.svg": (social_post(lang), 1080),
            f"templates/presentation/rcm-slide-cover{sfx}.svg": (slide_cover(lang), 1920),
            f"templates/presentation/rcm-slide-divider{sfx}.svg": (slide_divider(lang), 1920),
            f"templates/presentation/rcm-slide-content{sfx}.svg": (slide_content(lang), 1920),
            f"templates/signage/rcm-signage-reception-elevation{sfx}.svg": (signage_elevation(lang), 2400),
        }
        for rel, (svg, w) in items.items():
            b.write(rel, svg)
            job(rel, w)
    with open(os.path.join(b.ROOT, "source", "build", "png-jobs-templates.json"), "w") as fh:
        json.dump(png_jobs, fh, indent=1)
    print(f"templates written; {len(png_jobs)} png jobs queued")


if __name__ == "__main__":
    main()
