import sys
from PIL import Image
from psd_tools import PSDImage
src, out = sys.argv[1], sys.argv[2]
def render(keep):
    psd = PSDImage.open(src)
    for l in psd:  # top-level
        l.visible = l.name in keep and (keep[l.name] is None or True)
    return psd.composite(force=True)
# top-level names: 'Fondo'(pixel), 'Fondo'(group), 'Halos', 'Grafismos numeros', 'logo'
psd = PSDImage.open(src)
names = [(i, l.name, l.kind) for i, l in enumerate(psd)]
print(names)
def only(idxs, bg_black=False):
    p = PSDImage.open(src)
    for i, l in enumerate(p):
        l.visible = i in idxs
    im = p.composite(force=True)
    return im
bg = only({0,1}).convert("RGB"); bg.save(f"{out}/kv_bg.png")
full = only({0,1,2,3,4}).convert("RGB"); full.save(f"{out}/kv_full.png")
bgbeams = only({0,1,2}).convert("RGB"); bgbeams.save(f"{out}/kv_bg_beams.png")
nums = only({0,1,3}).convert("RGB")
# beams-only as difference over background (additive light layer)
import numpy as np
a = np.asarray(bgbeams, dtype=np.int16) - np.asarray(bg, dtype=np.int16)
Image.fromarray(np.clip(a,0,255).astype("uint8")).save(f"{out}/kv_beams_add.png")
# logo with alpha
p = PSDImage.open(src)
logo = [l for l in p if l.name == 'logo'][0]
lim = logo.composite(); print("logo bbox", logo.bbox, lim.mode, lim.size); lim.save(f"{out}/kv_logo_rgba.png")
