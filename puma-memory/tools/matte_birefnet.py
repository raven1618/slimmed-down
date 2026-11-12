"""High-quality person matte with BiRefNet-portrait (ONNX, CPU). matte(rgb uint8 HxWx3) -> float alpha HxW."""
import numpy as np, cv2, onnxruntime as ort
_P = "/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad/models/birefnet/lite.onnx"
_S = None
def _sess():
    global _S
    if _S is None: so = ort.SessionOptions(); so.enable_cpu_mem_arena = False; so.intra_op_num_threads = 4; so.log_severity_level = 3; _S = ort.InferenceSession(_P, so, providers=["CPUExecutionProvider"])
    return _S
def _run(rgb):
    s = _sess(); i = s.get_inputs()[0]; x = cv2.resize(rgb, (1024, 1024), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    x = ((x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]).transpose(2, 0, 1)[None]
    x = x.astype(np.float16 if "float16" in i.type else np.float32)
    y = s.run(None, {i.name: x})[-1].astype(np.float32); return 1 / (1 + np.exp(-y[0, 0]))
def matte(rgb, refine=True):
    H, W = rgb.shape[:2]; a = cv2.resize(_run(rgb), (W, H), interpolation=cv2.INTER_LINEAR)
    if not refine: return a
    ys, xs = np.where(a > 0.3)                                   # second pass on a square crop around the person: finer edge
    if len(xs) < 50: return a
    cx, cy = (xs.min() + xs.max()) // 2, (ys.min() + ys.max()) // 2; h = int(max(xs.max() - xs.min(), ys.max() - ys.min()) * 0.55) + 30
    x0, x1, y0, y1 = max(0, cx - h), min(W, cx + h), max(0, cy - h), min(H, cy + h)
    out = np.zeros((H, W), np.float32); out[y0:y1, x0:x1] = cv2.resize(_run(np.ascontiguousarray(rgb[y0:y1, x0:x1])), (x1 - x0, y1 - y0), interpolation=cv2.INTER_LINEAR)
    return out
