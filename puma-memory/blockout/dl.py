import sys, subprocess, os, concurrent.futures as cf
url, total, seg = sys.argv[1], 427524100, 8_000_000
rng = [(a, min(a + seg, total) - 1) for a in range(0, total, seg)]
def get(i):
    a, b = rng[i]; f = f"seg_{i:03d}"
    for _ in range(8):
        subprocess.run(["curl", "-s", "--max-time", "60", "--speed-limit", "200000", "--speed-time", "8", "-r", f"{a}-{b}", "-o", f, url])
        if os.path.exists(f) and os.path.getsize(f) == b - a + 1: return True
    return False
with cf.ThreadPoolExecutor(12) as ex: ok = list(ex.map(get, range(len(rng))))
print("segments ok:", sum(ok), "/", len(rng))
with open("bpy-5.3.0-cp313-cp313-manylinux_2_28_x86_64.whl", "wb") as o:
    for i in range(len(rng)): o.write(open(f"seg_{i:03d}", "rb").read())
