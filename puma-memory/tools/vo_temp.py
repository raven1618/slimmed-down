import sys, wave, json, inspect
from piper import PiperVoice
model, out = sys.argv[1], sys.argv[2]
lines = {"L1": "Los grandes resultados...", "L2": "no empiezan en la cancha.", "L3": "Empiezan...", "L4": "en la mente.",
         "L5": "Con líderes...", "L6": "que inspiran.", "L7": "Y entienden que ninguna victoria se consigue solo.", "L8": "Con ustedes...", "L9": "Andrés Silva."}
v = PiperVoice.load(model)
try:
    from piper import SynthesisConfig; cfg = SynthesisConfig(length_scale=1.12, noise_scale=0.6, noise_w_scale=0.7)
except Exception: cfg = None
durs = {}
for k, txt in lines.items():
    with wave.open(f"{out}/{k}.wav", "wb") as w:
        if hasattr(v, "synthesize_wav"): v.synthesize_wav(txt, w, syn_config=cfg) if cfg else v.synthesize_wav(txt, w)
        else: v.synthesize(txt, w)
    with wave.open(f"{out}/{k}.wav") as r: durs[k] = round(r.getnframes() / r.getframerate(), 2); sr = r.getframerate()
json.dump(dict(durations=durs, sr=sr, lines=lines), open(f"{out}/vo_lines.json", "w"), ensure_ascii=False, indent=1); print(durs, sr)
