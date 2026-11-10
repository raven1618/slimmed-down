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

for sfx in "" "-es"; do
  node source/render.cjs shot "templates/digital/rcm-email-signature$sfx.html" '#signature table' "templates/png/rcm-email-signature$sfx.png" 2
  node source/render.cjs shot "templates/documents/rcm-commercial-invoice$sfx.html" .sheet "templates/png/rcm-commercial-invoice$sfx.png" 1.5
  node source/render.cjs htmlpdf "templates/documents/rcm-commercial-invoice$sfx.html" "templates/documents/rcm-commercial-invoice$sfx.pdf"
done

node source/render.cjs pdf en
node source/render.cjs pdf es
node source/render.cjs pages manual/previews 1 en
node source/render.cjs pages manual/previews-es 1 es
echo "Brand kit rebuilt."
