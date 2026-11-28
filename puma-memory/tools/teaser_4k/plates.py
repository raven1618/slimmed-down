"""Light plates read frame by frame on demand (same pixels as loading the whole clip, a fraction of the memory).
Needed for the 4K masters: the plates at 3840x708 no longer fit in memory all at once."""
import subprocess, numpy as np, cv2
class Plate:
    def __init__(self, path, w, h, vf=None, post=None, n=None):
        self.path, self.w, self.h, self.vf, self.post = path, w, h, vf, post
        self.n = n if n is not None else int(subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip())
        if vf: self.rw, self.rh = w, h
        else:
            wh = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip().split(",")
            self.rw, self.rh = int(wh[0]), int(wh[1])
        self.p = None; self.cur = 0; self.cache = {}
    def __len__(self): return self.n
    @property
    def shape(self): return (self.n, self.h, self.w, 3)
    def _open(self):
        if self.p: self.p.kill(); self.p.wait()
        cmd = ["ffmpeg", "-loglevel", "error", "-i", self.path] + (["-vf", self.vf] if self.vf else []) + ["-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
        self.p = subprocess.Popen(cmd, stdout=subprocess.PIPE); self.cur = 0
    def _raw(self):
        b = self.p.stdout.read(self.rw * self.rh * 3); self.cur += 1
        return np.frombuffer(b, np.uint8).reshape(self.rh, self.rw, 3)
    def __getitem__(self, i):
        i = int(i)
        if i < 0: i += self.n
        if i in self.cache: return self.cache[i]
        if self.p is None or i < self.cur: self._open()
        while self.cur < i: self._raw()
        fr = self.post(self._raw())
        if len(self.cache) > 8: self.cache.pop(next(iter(self.cache)))
        self.cache[i] = fr; return fr
