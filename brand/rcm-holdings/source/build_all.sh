#!/usr/bin/env bash
# Rebuild the complete RCM Holdings brand kit from source.
# Requirements: python3 with fonttools + skia-pathops, the Inter font family,
# Node.js with Playwright (Chromium), ImageMagick (for favicon.ico).
set -euo pipefail
cd "$(dirname "$0")/.."

python3 source/build_logos.py
python3 source/build_assets.py
python3 source/build_templates.py
python3 source/build_manual_figures.py

node source/render.cjs png
convert logos/png/rcm-favicon@16w.png logos/png/rcm-favicon@32w.png logos/png/rcm-favicon@48w.png logos/app-icon/favicon.ico

node source/render.cjs shot templates/digital/rcm-email-signature.html '#signature table' templates/png/rcm-email-signature.png 2
node source/render.cjs shot templates/documents/rcm-commercial-invoice.html .sheet templates/png/rcm-commercial-invoice.png 1.5
node source/render.cjs htmlpdf templates/documents/rcm-commercial-invoice.html templates/documents/rcm-commercial-invoice.pdf

node source/render.cjs pdf
node source/render.cjs pages manual/previews 1
echo "Brand kit rebuilt."
