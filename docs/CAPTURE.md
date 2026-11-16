# Capture guide (Phase 0, test 2)

Goal: find out how good a Gaussian splat of a real Asunción apartment and building looks
on a mid-range phone. The processing recipe is `pipeline/splat/process_capture.sh`.
The viewer is `#/captura`: drop a `.ply`, `.spz`, `.splat`, `.ksplat` or `.rad` file in.

## Interior (phone or 360 camera)

- **Prepare the unit.** Tidy, staged, all lights on, nobody inside. Close mirror doors if you can.
- **Lock exposure and focus** (on iPhone: long-press on a mid-grey wall, then slide to
  about -0.3 EV). Bright windows blow out otherwise.
- **4K, 30 fps, main lens (1×)**, no stabilisation tricks or zoom.
- **Walk slowly** (half normal speed) in loops through each room at three heights: chest,
  above the head pointing slightly down, and waist pointing slightly up.
- **Corners and doorways twice.** Film through doorways in both directions so rooms connect.
- 3–6 minutes for a 2-bedroom apartment. More overlap beats more minutes.

What splats struggle with: plain white walls without texture, mirrors and glass (ghost
rooms), people or pets moving, and windows much brighter than the room.

## Exterior (drone)

- **Automated orbits**: 2–3 circles around the building (DJI "POI/Orbit" or waypoint
  missions) at different heights and gimbal angles (−15°, −30°, −45°).
- **Close façade passes** for the floors that are for sale.
- 200–400 photos (interval shooting) or 4K video at 3 fps extraction.
- **The view from each floor**: hover at the real height and orientation of each sold floor
  and shoot a 360° panorama. This becomes the "real view from your unit" in the app.
- Check local rules for urban drone flights (DINAC in Paraguay) before flying.

## Processing

```bash
pipeline/splat/process_capture.sh apartment.mp4 captures/villa-morra-12b
```

Needs a CUDA GPU (rent one by the hour), `ffmpeg`, `colmap` (optionally `glomap`) and Python.
Roughly 30–60 minutes per interior. The result, `splat.ply`, opens directly in `#/captura`.

For phones, compress before hosting: `.spz` (Niantic's open format, ~10× smaller than `.ply`)
or Spark's `.rad` (streams with level of detail). The script has not been run in the build
environment (no GPU there), so expect to tune it to your footage.

## What to look at

1. Sharpness on walls, floors and furniture at 1–2 m distance.
2. Floaters (fog) near windows and on white walls.
3. Frame rate on a mid-range Android and an iPhone, and file size.
4. Whether the drone splat of the building plus its surroundings feels "real" from 100–300 m.
