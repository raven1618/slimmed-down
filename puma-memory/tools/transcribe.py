import sys, time, wave
import numpy as np
from faster_whisper import WhisperModel
model_name, out = sys.argv[1], sys.argv[2]; files = sys.argv[3:]
t0 = time.time(); m = WhisperModel(model_name, device="cpu", compute_type="int8", cpu_threads=4, download_root=sys.argv[2] + "/../../../../models")
print("model loaded", round(time.time() - t0, 1), "s", flush=True)
for f in files:
    t1 = time.time()
    w = wave.open(f); audio = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768.0
    segs, info = m.transcribe(audio, language="es", beam_size=5, vad_filter=True, vad_parameters=dict(min_silence_duration_ms=400),
                              initial_prompt="Revisión del video de Puma Energy para la Convención de Operadores. Andrés Silva. Resultados, cancha, mente, líderes, victoria, pantalla, troquel, placa.")
    name = f.rsplit("/", 1)[-1].replace(".wav", "")
    with open(f"{out}/transcript_{name}.txt", "w") as fh:
        for s in segs:
            line = f"[{int(s.start // 60):02d}:{s.start % 60:05.2f} -> {int(s.end // 60):02d}:{s.end % 60:05.2f}] {s.text.strip()}"
            fh.write(line + "\n"); print(line, flush=True)
    print(f"== {name} done in {round(time.time() - t1, 1)} s", flush=True)
