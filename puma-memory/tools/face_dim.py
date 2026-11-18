"""Client (Nov 18, Andrés Silva + Cepede): darken and blur foreground (close-up) faces of AI players.
YuNet face detection on the strip view; only faces taller than `min_h` of the strip are treated; soft elliptical mask,
temporally smoothed (EMA) so it never flickers. Usage: v = FD.apply(slide_id, v, cfg) with v float32 RGB (H, W, 3)."""
import cv2, numpy as np
R = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/"
_det = None; _state = {}
def _detector(w, h):
    global _det
    if _det is None: _det = cv2.FaceDetectorYN.create(R + "models/yunet/yunet.onnx", "", (w, h), 0.55, 0.3, 50)
    _det.setInputSize((w, h)); return _det
def mask_for(v, min_h=0.22, pad=0.45):
    H, W = v.shape[:2]; img = np.clip(v, 0, 255).astype(np.uint8)[:, :, ::-1]
    _, faces = _detector(W, H).detect(np.ascontiguousarray(img))
    m = np.zeros((H, W), np.float32)
    if faces is not None:
        for f in faces:
            x, y, w, h = f[:4]
            if h < min_h * H: continue
            cx, cy = x + w / 2, y + h / 2
            cv2.ellipse(m, (int(cx), int(cy)), (int(w * (0.5 + pad)), int(h * (0.55 + pad))), 0, 0, 360, 1.0, -1)
    return cv2.GaussianBlur(m, (0, 0), max(8, H * 0.07))   # wide feather: no visible edge
def apply(key, v, cfg):
    m = mask_for(v, cfg.get("min_h", 0.22))
    prev = _state.get(key)
    if prev is not None and prev.shape == m.shape: m = np.maximum(m, prev * 0.82)   # hold/fade so it never pops
    _state[key] = m
    if m.max() < 0.02: return v
    H = v.shape[0]
    blur = cv2.GaussianBlur(v, (0, 0), H * cfg.get("blur", 0.018))
    dark = blur * cfg.get("dark", 0.45)
    a = (np.clip(m * 1.9, 0, 1) ** 1.3)[..., None] * cfg.get("amount", 0.9)   # soft falloff, never 100%
    return v * (1 - a) + dark * a
