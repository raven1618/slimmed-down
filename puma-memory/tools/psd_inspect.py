import sys
from psd_tools import PSDImage
psd = PSDImage.open(sys.argv[1]); out = sys.argv[2]
print("size", psd.size, "color", psd.color_mode)
def walk(layers, depth=0):
    for l in layers:
        print("  "*depth + f"- [{l.kind}] '{l.name}' vis={l.visible} bbox={l.bbox} blend={l.blend_mode.name if hasattr(l.blend_mode,'name') else l.blend_mode} op={l.opacity}")
        if l.is_group(): walk(l, depth+1)
walk(psd)
psd.composite().convert("RGB").save(f"{out}/kv_composite.png")
