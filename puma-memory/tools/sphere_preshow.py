"""Client Nov 27: pre-show = 1-minute seamless loop of the pulsing pentagon (black sphere), Pulso intro track under it.
60 pulses in 60.03 s; every 3rd pulse (bigger) lands on the track's heartbeat hit (hits every 3.0014 s)."""
import sys, math, time
SC = sys.argv[1] if len(sys.argv) > 1 else "0.5"; MODE = sys.argv[2] if len(sys.argv) > 2 else "video"
sys.argv = ["x", SC]; sys.path.insert(0, "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/tools")
import numpy as np, subprocess, cv2
import sphere_render as SR
NF = 1801; LOOP = NF / SR.FPS; PD = LOOP / 60; T0 = 0.4; NP = 59; FO = 0.2
# Plays BEFORE the opening and hands off to it: like the opening, it starts with 0.4 s of black and the first pulse at 0.4 s,
# and it ends in black, so loop->loop and loop->opening are the same cut. Big pulse (every 3rd) peaks on the track's hit.
def frame(i):
    u = i / SR.FPS; k = (u - T0) / PD
    if k < 0: return np.zeros((SR.EH, SR.EW, 3), np.float32)
    n = int(math.floor(k)); ph = k % 1
    if n >= NP:                                          # last slot: the dim pentagon fades to black, then black to the end
        f = 1 - SR.ease(((u - T0 - NP * PD)) / FO)
        return SR.pulse_layer(u, 0.18, 0.5, true_back=True) * f if f > 0 else np.zeros((SR.EH, SR.EW, 3), np.float32)
    amp = 0.55 if n % 3 == 0 else 0.35
    s = 0.18 + amp * math.sin(math.pi * min(ph / 0.8, 1)) ** 0.7; inten = 0.5 + 0.9 * math.sin(math.pi * min(ph / 0.8, 1))
    return SR.pulse_layer(u, s, inten, true_back=True)
if __name__ == "__main__":
    out = SR.OUT
    if MODE == "test":
        t0 = time.time(); a = frame(0); print("sec/frame", round(time.time() - t0, 2))
        print("first/last frame max", frame(0).max(), frame(NF - 1).max(), "black from", next(i for i in range(NF - 60, NF) if frame(i).max() == 0) / SR.FPS); sys.exit()
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
