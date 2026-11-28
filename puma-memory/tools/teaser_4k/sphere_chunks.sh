S=/tmp/claude-0/-home-user-slimmed-down/53c99130-536b-5075-8d31-c2afdb1cd256/scratchpad; C=$S/puma-kb/production/esfera/chunks; mkdir -p $C; cd $S/tools
N=2352; : > $C/list.txt
for a in $(seq 0 400 $((N-1))); do b=$((a+400)); [ $b -gt $N ] && b=$N; f=$C/c_$(printf %04d $a).mp4
  ffprobe -v error $f >/dev/null 2>&1 || $S/venv/bin/python sphere_chunk.py $a $b $f || { echo "FAIL $a"; exit 1; }
  echo "file '$f'" >> $C/list.txt; done
ffmpeg -v error -y -f concat -safe 0 -i $C/list.txt -c copy $S/puma-kb/production/esfera/Esfera_apertura_v22_equirect_2688x1296.mp4 && echo CONCAT_OK
