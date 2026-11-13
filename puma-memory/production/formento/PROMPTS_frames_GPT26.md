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

### FOR4 · estación Puma  (ref v2: deck frame cropped above the placa text, no hole; grey = extend)
Turn the attached reference into a photorealistic 21:9 frame of a clean, modern Puma Energy service station.
COMPOSITION (locked): keep the reference exactly — fuel pumps at the far left, the smiling attendant in the left third (waist-up, head in the upper middle of the frame) holding a small grey handheld card-payment terminal, the canopy with ceiling lights and the red-green Puma sign in the centre background, the white car on the right with the driver's hand holding the blue nozzle in the filler. Extend contextually into the grey: canopy roof and sky above; the attendant's legs, the pump island and the clean forecourt floor below; more of the car on the right and pumps on the left. No zoom or reframe of the existing content.
SCENE: young attendant in the Puma uniform (green cap, red polo with green sleeves and collar, dark work trousers), bright clean forecourt, green trees, blue sky; calm, ordered, clear.
LENS & LOOK: 35 mm, bright natural daylight, crisp commercial realism, natural skin.
FIXES: remove the green light streaks; the attendant holds only the payment terminal (no nozzle in his hand); 5 fingers per hand on their own arms; Puma Energy brand only, no other brands, no text, no lettering on the nozzle.

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

### FOR4 (v3: attendant motion, matches ref v2)
@image1（首帧）。单镜头，6秒，21:9，构图与首帧完全一致，服务员始终在画面左三分之一，头部保持在画面垂直中上部。
0-6秒：35mm，摄影机极缓慢向前推轨（约0.3米/秒），保持水平，不跟随人物。
0-2秒：左侧Puma服务员手持小型刷卡机，抬头看向右侧车主，露出自然真诚的笑容。
2-4秒：他朝车辆方向迈出一小步，左手把刷卡机稍稍向前递出，右手抬起做一个轻松的问候手势（挥手）。
4-6秒：他停下，轻轻点头，身体放松；同时右侧车主的手按下蓝色加油枪扳机，油枪轻微震动。背景树叶轻摆，前场干净明亮。
人物动作约80%速度（轻微慢动作，流畅自然），摄影机真实速度。动作幅度小，人物不离开左三分之一区域。手部：每只手5根手指，属于正确的手臂；服务员手中只有刷卡机，没有加油枪。制服、帽子、Puma标志保持不变。
风格：明亮自然日光，干净清晰的商业写实，无雾无霾。只出现Puma Energy品牌，无其他文字、标志、无音乐。

## CLOSE · Daniel Formento walk-in (Seedance 2.5 · @image1 = END frame · 21:9 · 7 s · 1080p → Topaz)
End frame: `Formento_ENDFRAME_GREEN_21x9_3840x1648.png` (client photo IMG_0397, BiRefNet cut onto #00B140; the Tommy Hilfiger buckle lettering and the stool are removed).

@image1（尾帧）。单镜头，7秒，21:9，纯色绿幕背景（#00B140），摄影机完全固定，不推不摇，构图以尾帧为准。
0-2秒：画面中央远处（距离镜头约4米），男子背对镜头站立，全身可见，黑色西装外套、白色衬衫、深蓝色牛仔裤、黑色皮鞋，深色短发两侧略灰。
2-3.5秒：他自然地转身面向镜头，表情沉稳自信。
3.5-6秒：他从容地向镜头走近几步，步伐稳健优雅，身体逐渐变大，最终停在尾帧的位置和大小（大腿中部以下出画）。
6-7秒：他停下，双臂自然交叉于胸前，左手腕的黑色智能手表露出，微微侧身，嘴角露出浅浅的微笑，与尾帧姿势完全一致并保持静止。
人物动作约80%速度（轻微慢动作，流畅自然）。面部、发型、胡须、服装与尾帧完全一致，同一个人。手部：每只手5根手指，属于正确的手臂。
背景：始终是均匀平整的纯绿色，无地面线、无阴影、无反光、无绿色溢色到人物身上，无任何道具或椅子。
风格：真实照片质感，柔和均匀的影棚正面光。无文字、无标志、皮带扣无字母、无音乐。
