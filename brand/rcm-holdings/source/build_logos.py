"""Generate every logo SVG in /logos from the master geometry."""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import rcm_brand as b  # noqa: E402

SCHEME_LABEL = {
    "fullcolor": "Full colour",
    "reverse": "Reverse (on Navy)",
    "navy": "One colour Navy",
    "white": "One colour White",
    "black": "One colour Black",
}

png_jobs = []  # consumed by render.cjs


def emit(rel, art: b.Art, title, png_widths=(), bg=None):
    b.write(rel, art.svg(title=title, bg=bg))
    for w in png_widths:
        base = os.path.splitext(os.path.basename(rel))[0]
        png_jobs.append({"svg": rel, "png": f"logos/png/{base}@{w}w.png", "width": w})


def main():
    for scheme, label in SCHEME_LABEL.items():
        widths = (600, 1200, 2400) if scheme in ("fullcolor", "reverse") else (1200,)
        emit(f"logos/horizontal/rcm-logo-horizontal-{scheme}.svg",
             b.lockup_horizontal(scheme), f"RCM Holdings logo — horizontal, {label}", widths)
        emit(f"logos/horizontal-tagline/rcm-logo-tagline-{scheme}.svg",
             b.lockup_horizontal(scheme, tagline=True), f"RCM Holdings logo with tagline — {label}", widths)
        emit(f"logos/stacked/rcm-logo-stacked-{scheme}.svg",
             b.lockup_stacked(scheme), f"RCM Holdings logo — stacked, {label}", widths)
        emit(f"logos/wordmark/rcm-wordmark-{scheme}.svg",
             b.lockup_wordmark(scheme), f"RCM Holdings wordmark — {label}", (1200,))
        emit(f"logos/symbol/rcm-symbol-{scheme}.svg",
             b.lockup_symbol(scheme), f"RCM Holdings symbol — {label}", (256, 512, 1024))

    # Compact icon (app / social / favicon)
    emit("logos/app-icon/rcm-app-icon.svg", b.app_icon(), "RCM Holdings app icon", (180, 512, 1024))
    emit("logos/app-icon/rcm-app-icon-square.svg", b.app_icon(rounded=False),
         "RCM Holdings app icon — full bleed (for platforms that apply their own mask)", (512, 1024))
    emit("logos/app-icon/rcm-app-icon-light.svg",
         b.app_icon(bg=b.WHITE, main=b.NAVY, accent=b.ORANGE),
         "RCM Holdings app icon — light", (512,))
    emit("logos/app-icon/rcm-favicon.svg",
         b.app_icon(size=64, scale=0.80, micro=True), "RCM Holdings favicon", (16, 32, 48, 64))

    os.makedirs(os.path.join(b.ROOT, "source", "build"), exist_ok=True)
    with open(os.path.join(b.ROOT, "source", "build", "png-jobs-logos.json"), "w") as fh:
        json.dump(png_jobs, fh, indent=1)
    print(f"logos written; {len(png_jobs)} png jobs queued")


if __name__ == "__main__":
    main()
