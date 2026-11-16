#!/usr/bin/env bash
# process_capture.sh: phone walkthrough or drone orbit → Gaussian splat for the web viewer (#/captura).
#
#   pipeline/splat/process_capture.sh <video-or-image-folder> <output-dir> [fps]
#
# Steps
#   1. frames:   ffmpeg pulls sharp frames (default 3 fps, 1600 px wide)
#   2. poses:    COLMAP features + sequential matching (video) → sparse model
#                (uses GLOMAP's global mapper when installed: much faster than COLMAP's)
#   3. training: gsplat's simple_trainer (30k steps) → point_cloud.ply
#   4. output:   <output-dir>/splat.ply, drop it into #/captura
#
# Requirements: an NVIDIA GPU (CUDA), ffmpeg, colmap (and optionally glomap), python 3.10+,
# git. Rent a GPU box (e.g. one RTX 4090 / A10) for ~30-60 min per interior.
#
# STATUS: untested in the build environment (no GPU there). Treat it as the reference recipe
# for Phase 0's capture test; expect to adjust flags to your camera and footage.
set -euo pipefail

src="${1:?video file or image folder}"
out="${2:?output directory}"
fps="${3:-3}"
work="$out/work"
mkdir -p "$work/images"

need() { command -v "$1" >/dev/null || { echo "missing: $1"; exit 1; }; }
need ffmpeg; need colmap; need python3; need git

# 1. frames ------------------------------------------------------------------
if [ -d "$src" ]; then
  echo "[1/4] using images from $src"
  cp "$src"/* "$work/images/"
else
  echo "[1/4] extracting frames at ${fps} fps"
  # mpdecimate drops near-duplicate frames (camera standing still)
  ffmpeg -loglevel error -i "$src" -vf "fps=${fps},mpdecimate,scale=1600:-2" -vsync vfr -q:v 2 "$work/images/f_%05d.jpg"
fi
n=$(ls "$work/images" | wc -l)
echo "      $n frames"
[ "$n" -ge 60 ] || echo "      warning: under 60 frames; interiors usually need 150-400"

# 2. camera poses -------------------------------------------------------------
echo "[2/4] camera poses (COLMAP)"
db="$work/database.db"
rm -f "$db"
colmap feature_extractor --database_path "$db" --image_path "$work/images" \
  --ImageReader.single_camera 1 --ImageReader.camera_model OPENCV \
  --SiftExtraction.use_gpu 1
if [ -d "$src" ]; then
  colmap exhaustive_matcher --database_path "$db" --SiftMatching.use_gpu 1
else
  colmap sequential_matcher --database_path "$db" --SequentialMatching.overlap 20 --SiftMatching.use_gpu 1
fi
mkdir -p "$work/sparse"
if command -v glomap >/dev/null; then
  glomap mapper --database_path "$db" --image_path "$work/images" --output_path "$work/sparse"
else
  colmap mapper --database_path "$db" --image_path "$work/images" --output_path "$work/sparse"
fi
# gsplat expects undistorted pinhole images in <data>/images and the model in <data>/sparse/0
colmap image_undistorter --image_path "$work/images" --input_path "$work/sparse/0" \
  --output_path "$work/undistorted" --output_type COLMAP
mkdir -p "$work/undistorted/sparse/0"
mv "$work/undistorted/sparse/"*.bin "$work/undistorted/sparse/0/" 2>/dev/null || true

# 3. training -----------------------------------------------------------------
echo "[3/4] training the splat (gsplat)"
if [ ! -d "$work/gsplat" ]; then
  git clone --depth 1 https://github.com/nerfstudio-project/gsplat.git "$work/gsplat"
  python3 -m pip install -q gsplat
  python3 -m pip install -q -r "$work/gsplat/examples/requirements.txt"
fi
python3 "$work/gsplat/examples/simple_trainer.py" default \
  --data_dir "$work/undistorted" --data_factor 1 \
  --result_dir "$work/result" --max_steps 30000 --save_ply \
  --disable_viewer

# 4. output -------------------------------------------------------------------
ply=$(ls -t "$work/result/ply/"*.ply 2>/dev/null | head -1 || true)
[ -n "$ply" ] || { echo "no .ply produced: check $work/result"; exit 1; }
cp "$ply" "$out/splat.ply"
echo "[4/4] done → $out/splat.ply ($(du -h "$out/splat.ply" | cut -f1))"
echo "      open the app at #/captura and drop the file in, or host it and use #/captura?src=<url>"
echo "      next: compress to .spz (or .rad with level of detail) for phones: see docs/CAPTURE.md"
