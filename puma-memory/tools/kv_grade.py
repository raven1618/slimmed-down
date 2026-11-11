"""Shared helpers: KV-green grade for the Seedance light plates, and the symmetric ball."""
import numpy as np
_A = np.array([0, 60, 120, 175, 235, 255], np.float32)
_C = np.array([[0, 0, 0], [0, 62, 28], [0, 138, 62], [30, 210, 100], [137, 240, 168], [225, 255, 232]], np.float32)
LUT = np.stack([np.interp(np.arange(256), _A, _C[:, c]) for c in range(3)], 1).astype(np.uint8)   # value -> KV green ramp
def kv_grade(a):
    """a: uint8 (..., 3) RGB light plate on black -> same plate in the KV greens (hue/saturation from the key visual)"""
    return LUT[a.max(-1)]
def mirror_right(a, cx):
    """make a frame (or stack) left/right symmetric by mirroring its right half onto the left"""
    out = a.copy(); w = a.shape[-2]; r = out[..., cx:, :]; n = min(cx, r.shape[-2])
    out[..., cx - n:cx, :] = r[..., :n, :][..., ::-1, :]; return out
