#!/usr/bin/env bash
# Builds a unit end to end: Blender scene + light layers, then web optimisation.
#   pipeline/build_unit.sh pipeline/blender/specs/demo-unit-villa-morra.json [extra build_unit.py args]
# Needs: python with `pip install bpy==5.3.0 numpy` (set PYTHON=/path/to/python), node + npm install.
set -euo pipefail
spec="$1"; shift || true
id=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['id'])" "$spec")
out="public/home/$id"
PYTHON="${PYTHON:-python3}"
NODE_USE_ENV_PROXY=1 node scripts/fetch-polyhaven.mjs "$spec"
"$PYTHON" pipeline/blender/build_unit.py --spec "$spec" --out "$out" "$@"
node scripts/optimize-glb.mjs "$out/unit.glb"
node scripts/optimize-lightmaps.mjs "$out"
echo "unit ready → $out (open #/hogar?unit=$id)"
