"""Sphere loop (client, Nov 25): the end of the opening, neon player with the ball at the chest -> kick -> the ball
grows into the KV ball (+ logo), then the KV ball's seams turn the panels back to the stadium. Seamless.
One idea for the loop point: the KV ball flips panel by panel back into the stadium (same seam reveal as the opening)."""
import sys
SC = sys.argv[1] if len(sys.argv) > 1 else "1"; MODE = sys.argv[2] if len(sys.argv) > 2 else "video"
sys.argv = ["x", SC]
sys.path.insert(0, "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/tools")
import numpy as np, subprocess, cv2
import sphere_render as SR
T0, T1, TR = 54.4, 59.6, 0.8           # _render timeline: loop body [T0, T1), then TR s of seam reveal back into T0-TR..T0
DUR = (T1 - T0) + TR; N = int(round(DUR * SR.FPS))
def frame(i):
    t = i / SR.FPS
    if t < T1 - T0: return SR._render(T0 + t)
    u = t - (T1 - T0)
    return SR.reveal(SR._render(T1 + u), SR._render(T0 - TR + u), u, 0.0, TR)
if __name__ == "__main__":
    out = SR.OUT
    if MODE == "stills":
        for tt in [0, 1.0, 2.0, 3.0, 4.0, 5.0, 5.4, 5.7, 5.95]:
            eq = np.clip(frame(int(tt * SR.FPS)), 0, 255).astype(np.uint8)
            fv = np.hstack([SR.front_view(eq, 400), SR.front_view(eq, 400, back=True)])
            cv2.putText(fv, f"{tt:.2f}", (8, 28), 0, 0.9, (255, 255, 0), 2); cv2.imwrite(out + f"frames/loop_{tt:05.2f}.jpg", cv2.cvtColor(fv, cv2.COLOR_RGB2BGR))
        f0 = frame(0).astype(float); fl = frame(N - 1).astype(float); f1 = frame(1).astype(float)
        print("seam", round(np.abs(f0 - fl).mean(), 3), "step", round(np.abs(f1 - f0).mean(), 3)); sys.exit()
    tag = f"{SR.EW}x{SR.EH}"
    pe = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{SR.EW}x{SR.EH}", "-r", str(SR.FPS), "-i", "-",
                           "-c:v", "prores_ks", "-profile:v", "3", "-pix_fmt", "yuv422p10le", out + f"Esfera_loop_equirect_{tag}.mov"], stdin=subprocess.PIPE)
    VW = 1080
    pv = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{VW}x{VW // 2}", "-r", str(SR.FPS), "-i", "-",
                           "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", out + "Esfera_loop_vista_frente_dorso.mp4"], stdin=subprocess.PIPE)
    for i in range(N):
        eq = np.clip(frame(i), 0, 255).astype(np.uint8); pe.stdin.write(eq.tobytes())
        pv.stdin.write(np.hstack([SR.front_view(eq, VW // 2), SR.front_view(eq, VW // 2, back=True)]).astype(np.uint8).tobytes())
    for p in (pe, pv): p.stdin.close(); p.wait()
    print("done", N)
