"""Client Nov 27: pre-show = 1-minute seamless loop of the pulsing pentagon (black sphere), Pulso intro track under it.
60 pulses in 60.03 s; every 3rd pulse (bigger) lands on the track's heartbeat hit (hits every 3.0014 s)."""
import sys, math, time
SC = sys.argv[1] if len(sys.argv) > 1 else "0.5"; MODE = sys.argv[2] if len(sys.argv) > 2 else "video"
sys.argv = ["x", SC]; sys.path.insert(0, "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/tools")
import numpy as np, subprocess, cv2
import sphere_render as SR
NF = 1801; LOOP = NF / SR.FPS; PD = LOOP / 60; LEAD = 0.30; XF = 0.5
def pulse(u, tt):
    k = (u + LEAD) / PD; n = int(math.floor(k)) % 60; ph = k % 1
    amp = 0.55 if n % 3 == 0 else 0.35
    s = 0.18 + amp * math.sin(math.pi * min(ph / 0.8, 1)) ** 0.7; inten = 0.5 + 0.9 * math.sin(math.pi * min(ph / 0.8, 1))
    return SR.pulse_layer(tt, s, inten, true_back=True)
def frame(i):
    u = i / SR.FPS; fr = pulse(u, u)
    if u > LOOP - XF:                                   # strands' own animation: blend into the loop start's state
        w = SR.ease((u - (LOOP - XF)) / XF); fr = fr * (1 - w) + pulse(u, u - LOOP) * w
    return fr
if __name__ == "__main__":
    out = SR.OUT
    if MODE == "test":
        t0 = time.time(); a = frame(0); print("sec/frame", round(time.time() - t0, 2))
        f0 = np.clip(frame(0), 0, 255); fl = np.clip(frame(NF - 1), 0, 255); f1 = np.clip(frame(1), 0, 255)
        print("seam", round(np.abs(f0 - fl).mean(), 3), "step", round(np.abs(f1 - f0).mean(), 3)); sys.exit()
    tag = f"{SR.EW}x{SR.EH}"
    pe = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", tag, "-r", str(SR.FPS), "-i", "-",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-pix_fmt", "yuv420p", out + f"Esfera_preshow_loop_equirect_{tag}.mp4"], stdin=subprocess.PIPE)
    VW = 1080
    pv = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{VW}x{VW // 2}", "-r", str(SR.FPS), "-i", "-",
                           "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", out + "Esfera_preshow_loop_vista_frente_dorso.mp4"], stdin=subprocess.PIPE)
    for i in range(NF):
        eq = np.clip(frame(i), 0, 255).astype(np.uint8); pe.stdin.write(eq.tobytes())
        pv.stdin.write(np.hstack([SR.front_view(eq, VW // 2), SR.front_view(eq, VW // 2, back=True)]).astype(np.uint8).tobytes())
        if i % 300 == 0: print("frame", i, flush=True)
    for p in (pe, pv): p.stdin.close(); p.wait()
    print("done", NF)
