import numpy as np, subprocess
from scipy.io import wavfile
def load(p):
    raw=subprocess.run(["ffmpeg","-v","error","-i",p,"-ac","2","-ar","48000","-f","f32le","-"],capture_output=True).stdout
    return np.frombuffer(raw,np.float32).reshape(-1,2).copy()
v=load("vo_esfera/esfera.wav"); m=load("sphere_audio/Esfera_soundtrack_draft.wav")
N=int(78.4*48000); v=np.pad(v,((0,max(0,N-len(v))),(0,0)))[:N]; m=np.pad(m,((0,max(0,N-len(m))),(0,0)))[:N]
db=lambda x:10**(x/20)
hop=960; r=np.sqrt(np.mean(v[:N//hop*hop].reshape(-1,hop,2)**2,axis=(1,2)))
act=(20*np.log10(r+1e-9)>-45).astype(float)
g=act.copy()
for i in range(len(g)):
    if act[i]==0 and act[i:i+20].any() and act[max(0,i-20):i].any(): g[i]=1
env=np.zeros_like(g); a=1-np.exp(-1/(0.15*50)); rl=1-np.exp(-1/(0.6*50))
for i in range(1,len(g)): env[i]=env[i-1]+(a if g[i]>env[i-1] else rl)*(g[i]-env[i-1])
env=np.interp(np.arange(N)/hop,np.arange(len(env)),env)
out=m*(db(-7)*db(-3*env))[:,None]+v      # bed -7 dB; subtle -3 dB duck under the voice
pk=np.abs(out).max(); out*=db(-1)/pk
print("gain dB",round(20*np.log10(db(-1)/pk),2))
wavfile.write("sphere_audio/v2/Esfera_mix_VO_draft.wav",48000,(out*2147483647).astype(np.int32))
