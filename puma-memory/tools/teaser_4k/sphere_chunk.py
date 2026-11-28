"""Full-res sphere render in chunks (a single full-res run outgrows the session memory limit at ~800 frames)."""
import sys
i0, i1, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
sys.argv = ["x", "1"]
sys.path.insert(0, "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/tools")
import numpy as np, subprocess
import sphere_render as SR
p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{SR.EW}x{SR.EH}", "-r", str(SR.FPS), "-i", "-",
                      "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
for i in range(i0, i1):
    p.stdin.write(np.clip(SR.render(i / SR.FPS), 0, 255).astype(np.uint8).tobytes())
p.stdin.close(); p.wait(); print("chunk", i0, i1, "done", flush=True)
