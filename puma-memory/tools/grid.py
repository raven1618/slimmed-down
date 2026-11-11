import sys
from PIL import Image, ImageDraw
ims=[]
for p in sys.argv[2:]:
    im = Image.open(p).convert("RGB"); im = im.resize((960, round(960*im.height/im.width)))
    im = im.crop((0,0,960,540)) if im.height>=540 else im
    d = ImageDraw.Draw(im)
    for i in range(1,10):
        x = i*96; y = i*54
        d.line([(x,0),(x,540)], fill=(255,255,0), width=1); d.line([(0,y),(960,y)], fill=(255,255,0), width=1)
        d.text((x+2,2), f".{i}", fill=(255,255,0)); d.text((2,y+2), f".{i}", fill=(255,255,0))
    ims.append(im)
W=Image.new("RGB",(1920,1080))
for k,im in enumerate(ims): W.paste(im, ((k%2)*960, (k//2)*540))
W.save(sys.argv[1])
