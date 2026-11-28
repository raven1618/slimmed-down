#!/bin/bash
# 4K masters, one render at a time (rule): sphere opening (chunks, already running) -> pre-show loop -> 6 teasers (not Carolina)
S=/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad; M=/home/user/slimmed-down/review_nov28/masters_4k; P=$S/puma-kb/production; cd $S
while pgrep -f "sphere_chunks.sh|sphere_chunk.py" >/dev/null; do sleep 20; done
E=$P/esfera/Esfera_apertura_v22_equirect_2688x1296.mp4
if ffprobe -v error $E >/dev/null 2>&1; then
  ffmpeg -nostdin -v error -y -i $E -i sphere_audio/v3/Esfera_mezcla_v3.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -shortest $M/Esfera_apertura_2688x1296.mp4 && echo "SPHERE_OK" || echo "SPHERE_MUX_FAIL"
else echo "SPHERE_RENDER_FAIL"; fi
venv/bin/python tools/sphere_preshow.py 1 > qc/preshow_full.log 2>&1 &&   ffmpeg -nostdin -v error -y -i $P/esfera/Esfera_preshow_loop_equirect_2688x1296.mp4 -i sphere_audio/v3/Pulso_loop_60s.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -shortest $M/Esfera_preshow_loop_60s_2688x1296.mp4 && echo "PRESHOW_OK" || echo "PRESHOW_FAIL"
t(){ SB_K=2 venv/bin/python tools/$2 tools/$3.json > qc/k2_$1.log 2>&1 &&   ffmpeg -nostdin -v error -y -i $P/$4/_clean_noaudio_3840x708.mp4 -i $P/$4/_mix_pro.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -shortest $M/$1_3840x708.mp4 && rm -f $P/$4/_clean_noaudio_3840x708.mp4 && echo "OK $1" || echo "FAIL $1"; }
t Andres_Silva storyboard_v21.py cfg_v21_andres andres_silva_v21
t Andres_Cepede storyboard_v24.py cfg_cepede andres_cepede_v1
t Daniel_Formento storyboard_v25.py cfg_formento daniel_formento_v1
t Wally_Castro storyboard_v24.py cfg_wally wally_castro_v1
t Manuel_Ferreira storyboard_v26.py cfg_manuel manuel_ferreira_v1
t Roque_Gatito storyboard_v26.py cfg_roque_haedo roque_haedo_v1
echo QUEUE_DONE
