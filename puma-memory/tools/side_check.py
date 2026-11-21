import sys; ts = [float(x) for x in sys.argv[1].split(",")]; out = sys.argv[2]; sys.argv = ["sphere_render.py", "0.5"]
sys.path.insert(0, "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/tools")
import numpy as np, cv2, sphere_render as SR
row = []
for t in ts:
    eq = np.clip(SR.render(t), 0, 255).astype(np.uint8); side = np.roll(eq, -SR.EW // 4, axis=1)     # look at the side join (lon 90)
    v = SR.front_view(side.astype(np.float32), 360).astype(np.uint8); cv2.putText(v, f"{t}s side", (8, 24), 0, 0.7, (255, 255, 0), 2); row.append(v)
cv2.imwrite(out, cv2.cvtColor(np.hstack(row), cv2.COLOR_RGB2BGR)); print("ok")
