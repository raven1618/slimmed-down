"""Minimal range-request reader for Overture GeoParquet on S3 (public bucket, no SDK needed)."""
import io, re, requests
B = "https://overturemaps-us-west-2.s3.us-west-2.amazonaws.com"
_s = requests.Session()
_s.verify = "/root/.ccr/ca-bundle.crt"


def ls(prefix):
    keys, tok = [], None
    while True:
        u = f"{B}/?list-type=2&prefix={prefix}" + (f"&continuation-token={requests.utils.quote(tok)}" if tok else "")
        x = _s.get(u, timeout=60).text
        keys += [(k, int(sz)) for k, sz in re.findall(r"<Key>([^<]*)</Key>.*?<Size>(\d+)</Size>", x, re.S)]
        m = re.search(r"<NextContinuationToken>([^<]*)</NextContinuationToken>", x)
        if not m:
            return keys
        tok = m.group(1)


class RangeFile(io.RawIOBase):
    def __init__(self, key, size):
        self.url, self.size, self.pos = f"{B}/{key}", size, 0
        self.cache = {}

    def readable(self): return True
    def seekable(self): return True
    def tell(self): return self.pos

    def seek(self, off, whence=0):
        self.pos = off if whence == 0 else self.pos + off if whence == 1 else self.size + off
        return self.pos

    def read(self, n=-1):
        if n is None or n < 0:
            n = self.size - self.pos
        n = min(n, self.size - self.pos)
        if n <= 0:
            return b""
        r = _s.get(self.url, headers={"Range": f"bytes={self.pos}-{self.pos + n - 1}"}, timeout=120)
        r.raise_for_status()
        self.pos += len(r.content)
        return r.content

    def readinto(self, b):
        d = self.read(len(b)); b[:len(d)] = d; return len(d)
