import sys; sys.argv = ["sphere_render.py", "1"]
sys.path.insert(0, "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/tools")
import numpy as np, cv2, sphere_render as SR
d, cent, top, Q = SR.ball_field(SR.roty(0.0))
fr = SR.green_fill(cent, Q) * 0.45 + SR.neon(d, SR.SW, 1.2, Q=Q, t=0)
eq = np.clip(fr, 0, 255).astype(np.uint8)
v = SR.front_view(eq, 1600)
cv2.imwrite(sys.argv[0] if False else "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/qc/kv_ball_ref.png", cv2.cvtColor(np.clip(v,0,255).astype(np.uint8), cv2.COLOR_RGB2BGR)); print("ok")
