import sys, json, numpy as np
sys.argv=['x']; import sphere_render as R
meta=json.load(open(R.MGD+'meta.json'))
# union of puma over its whole gallop cycle (worst case)
pm=np.zeros((R.EH,R.EW),bool)
for fi in range(len(R.PUMA)):
    z=np.zeros((R.EH,R.EW,3),np.float32); z=R.puma_put(z,fi/30); pm|=z.max(-1)>20
keys=sys.argv[1:] or ['somos','global','40','cal','py','km','entrega','destino','calidad','juntos']
for k in ['somos','global','40','cal','py','km','entrega','destino','calidad','juntos']:
    m=meta[k]; tt=m['land']-m['start']+0.6
    z=np.zeros((R.EH,R.EW,3),np.float32); L=R.mg(k,tt)
    if L is None: print(k,'none'); continue
    L=L.copy(); L[...,:3]=255; z=R.disc_put(z,L); tm=z.max(-1)>60
    gaps=[]
    for c in np.where(tm.any(0)&pm.any(0))[0]:
        tb=np.where(tm[:,c])[0].max(); pt=np.where(pm[:,c])[0].min(); gaps.append(pt-tb)
    print(f"{k:8s} min gap px (of {R.EH}): {min(gaps) if gaps else 'no overlap cols'}")
