# Formento · frames + animation (v2, Nov 13: broadcast layout)

## Screen layout every frame must respect (renderer v25)
- On the LED only rows 408–1031 of the 1440-high frame are seen (the middle 43%).
- The outer ~20% on each side sits under the headline panels (placas 1–3), so it only needs to be continuous background.
- The centre (x 37–63%) carries the placa text. Put background texture there (smoke, cliff, water), not the subject.
- The bottom ~12% of the band (rows 955–1031) sits under the ticker (placas 1–3).
- So the subject goes in the left or right third of the centre zone, in the upper/middle of the band.
- No on-screen text, ticker, logos or channel bugs in the image: the broadcast graphics are added in post.

## GPT Image 2.6 · 21:9 · 4K · High · upload only the matching *_REF_21x9.png

### FOR1 · Ormuz
Turn the attached reference into a photorealistic 21:9 news-camera frame of the Strait of Hormuz.
COMPOSITION (locked): keep the reference exactly — horizon, the row of anchored vessels across the middle (blue-hulled tankers and supply ships, white superstructures, one rust-red crane) sitting in the vertical middle of the frame, the bare rocky ridge behind, open dark-blue water below. Extend the water contextually into the grey band at the bottom. No zoom, crop or reframe.
SCENE: Gulf waters at late afternoon, low hard sun from the left raking the arid ochre cliffs, sharp shadows in the gullies; calm sea with fine ripples and glints; real vessel scale (100–180 m), rust streaks, deck details.
LENS & LOOK: 400 mm telephoto broadcast camera, compressed perspective, heat shimmer only at the waterline, crisp, documentary colour. Clear air, no fog or haze.
FIXES: no ship names, flags, funnel logos or hull lettering; no text of any kind.

### FOR2 · buque atacado  (ref v2 from client n02: whole tanker at sea; logo and lettering greyed out)
Turn the attached reference into a photorealistic 21:9 news-camera frame of an oil tanker hit at sea in the Gulf of Oman.
COMPOSITION (locked): keep the reference exactly — the tanker seen from its stern quarter in the centre, white accommodation block with wide bridge wings, a tall funnel pouring black smoke, white smoke and spray around the superstructure, water cascading down the dark hull, a firefighting tug on the right against the hull spraying, open blue sea in the foreground with the waterline just above the bottom of the photo. Extend the sky, the sea and the horizon contextually into all grey areas. No zoom, crop or reframe of the ship.
SCENE: bright late-morning daylight, deep blue choppy sea, clear sky; black funnel smoke and white firefighting spray are dense and local, the air around them is clear (not fog); real scale (tanker 330 m, tug 30 m).
LENS & LOOK: 300 mm telephoto news camera from a boat, slight compression, crisp detail on steel, rust and spray, documentary colour.
FIXES: no ship names, hull lettering, flags or logos; no captions, no text of any kind.

### FOR3 · Hidrovía
Turn the attached reference into a photorealistic 21:9 aerial news frame of the Paraguay river (Hidrovía).
COMPOSITION (locked): keep the reference — high drone view, the wide brown river curving from the upper right down through the frame, green wetland bank on the left, the barge convoys on the right side of the river. Extend the wetland, river bank, lagoons and sky contextually into the grey margins (left side becomes more wetland and river bank). No zoom or reframe of the existing content.
SCENE: clear late-afternoon light, café-con-leche water with current lines, each convoy = a push-boat tug driving a raft of rectangular barges, small white wakes; lush subtropical green.
LENS & LOOK: drone 24 mm, 120 m altitude, crisp, natural saturated colour, warm sun, long soft shadows. Clear air, no fog or haze.
FIXES: no text, no logos, no vessel names.

### FOR4 · estación Puma
Turn the attached reference into a photorealistic 21:9 frame of a clean, modern Puma Energy service station.
COMPOSITION (locked): attendant at the pumps on the left third, canopy and red-green Puma sign in the centre background, white car on the right third with a hand inserting the blue nozzle into the filler. Extend the forecourt, car, pump island and sky contextually into all grey areas (the grey box is missing scene). No zoom or reframe of the existing content.
SCENE: smiling young attendant in the Puma uniform (green cap, red-and-green polo, dark work trousers with reflective stripes), bright clean forecourt, trees, blue sky; calm and ordered.
LENS & LOOK: 35 mm, bright natural daylight, crisp commercial realism.
FIXES: remove the green light lines and the chalk drawing; 5 fingers per hand on their own arms; Puma Energy brand only, no other brands or text.

## Seedance 2.5 · @image1 = approved frame (首帧) · 21:9 · 6 s · 480p draft → Topaz 3840×1648 30 fps
Universal rules: single shot, no cuts; subject motion about 80% (slight slow motion), camera in real time and never stops; small camera moves only; key action in the middle 43% band, left/right of centre; no fog, no light FX, no text/logos/captions, no music.

### FOR1
@image1（首帧）。单镜头，6秒，21:9 新闻长焦画面，构图与首帧完全一致。
0-6秒：400mm长焦，机位在海岸高处，轻微手持漂浮感，同时极缓慢推近（总共约5%）。锚泊的油轮随海浪轻微起伏；一艘白色小型巡逻艇从画面左侧中部低速驶入，向右划出清晰白色尾浪，停留在画面左三分之一区域；水面细碎反光闪烁，仅在水线处有轻微热浪扭曲。
人物/物体动作约80%速度，摄影机真实速度。真实比例：油轮100–180米，巡逻艇12米。
风格：真实新闻纪实摄影，午后硬光从左侧照亮赭色山崖，空气清澈，无雾无霾，色彩自然。无文字、无标志、无船名、无旗帜、无音乐。

### FOR2
@image1（首帧）。单镜头，6秒，21:9 新闻长焦画面，构图与首帧完全一致，油轮始终完整在画面中。
0-6秒：300mm长焦，从船上拍摄，轻微随浪起伏的手持感，镜头极缓慢推近（总共约4%）。烟囱持续冒出浓黑烟柱向右上方飘散；右侧消防拖船的水炮喷出白色水柱打在船体上，水花飞溅；白色水流沿深色船壳倾泻入海；海面波浪翻动，阳光反光闪烁。
动作约80%速度（轻微慢动作），摄影机真实速度。黑烟和水雾只在局部，周围空气清澈，不是雾。真实比例：油轮330米，拖船30米。
风格：真实新闻纪实，上午明亮日光，海水深蓝，色彩自然。无文字、无船名、无标志、无旗帜、无字幕、无音乐。

### FOR3
@image1（首帧）。单镜头，6秒，21:9 无人机新闻航拍，构图与首帧完全一致。
0-6秒：无人机高度120米，平稳缓慢向前滑行并极轻微下降（总位移很小），不旋转。右侧的驳船队由推船推动沿河缓缓前行，船尾留下细白尾浪；河面水流纹理与阳光反光缓慢移动；左侧湿地草木随微风轻摆。
物体动作约80%速度，摄影机真实速度。真实比例：每节驳船约60米。
风格：真实新闻航拍，午后暖阳，空气清澈，无雾无霾，色彩自然饱和。无文字、无标志、无船名、无音乐。

### FOR4
@image1（首帧）。单镜头，6秒，21:9，构图与首帧完全一致。
0-6秒：35mm，摄影机极缓慢向前推轨（约0.3米/秒），保持水平。左侧Puma服务员微笑着抬头看向车主方向并轻轻点头；右侧手将蓝色加油枪稳稳插入加油口并按下扳机；背景树叶轻摆，前场干净明亮。
人物动作约80%速度，摄影机真实速度。手部：每只手5根手指，属于正确的手臂。
风格：明亮自然日光，干净清晰的商业写实。只出现Puma Energy品牌，无其他文字、标志、无音乐。
