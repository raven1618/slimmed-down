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

## FOR2b · puerto en Ormuz — REPLACES FOR2 (client, Nov 13: no fires in the video)
Ref: `FOR2b_puerto_REF_21x9.png` (client n04 "Crecientes tensiones en Oriente Medio presionan al alza los precios del petróleo"). Wing F2_L2 photo also changed from smoke (n06) to the strait (n07).

### Frame (GPT Image 2.6 · 21:9 · 4K · High)
Turn the attached reference into a photorealistic 21:9 news-camera frame of a busy port terminal on the Strait of Hormuz.
COMPOSITION (locked): keep the reference exactly — the large ship moored at the quay on the left third under the tall orange gantry cranes, the long container yard and smaller orange cranes along the waterfront through the centre, the bare rocky mountain rising on the right, calm blue-green sea in the foreground with a green channel buoy. Extend contextually into the grey: more mountain ridge, quay and yard on the right, sky above, more sea below and on the left. No zoom, crop or reframe.
SCENE: late-afternoon sun from the left, clear crisp air (no haze, no fog), real port scale (gantry cranes 70 m, ship 300 m), containers in muted mixed colours, a few small tugs at the quay. No smoke, no fire.
LENS & LOOK: 400 mm telephoto news camera from a boat, compressed perspective, crisp detail, documentary colour.
FIXES: no ship names, no container logos or lettering, no flags, no text of any kind.

### Seedance 2.5 (@image1 首帧 · 21:9 · 6 s)
@image1（首帧）。单镜头，6秒，21:9 新闻长焦画面，构图与首帧完全一致。
0-6秒：400mm长焦，从船上拍摄，轻微随浪起伏的手持感，镜头极缓慢向右平移并略微推近（总共约4%）。左侧码头上的橙色岸桥缓慢移动，吊具吊起一个集装箱缓缓上升；一艘小型拖船从画面左下方低速驶入，留下细白尾浪；海面波光闪烁，航道浮标随浪轻摆。
动作约80%速度（轻微慢动作），摄影机真实速度。真实比例：岸桥约70米，船长约300米。
风格：真实新闻纪实，午后清澈阳光，空气通透，无雾无霾，无烟无火。无文字、无标志、无船名、无集装箱字母、无旗帜、无音乐。

## FOR2c · flota en el estrecho — REPLACES FOR2/FOR2b (client pick, Nov 13: n07 "Las exportaciones de petróleo de Oriente Medio superan los niveles anteriores…")
Wing F2_L2 photo → n04 (port).

### Frame (GPT Image 2.6 · 21:9 · 4K · High · upload FOR2c_estrecho_REF_21x9.png only)
Turn the attached reference into a photorealistic 21:9 elevated news-camera frame of the Strait of Hormuz.
COMPOSITION (locked): keep the reference exactly — high vantage point looking out over the open strait, the pale rocky coastline along the horizon in the upper part of the frame, dozens of small cargo vessels and wooden dhows scattered across the dark-blue water, two larger dhows in the near foreground at lower centre. Extend the sea, the scattered vessels, the coastline and the sky contextually into all grey areas. No zoom, crop or reframe.
SCENE: late-afternoon light, deep blue sea with fine ripples and glints, a couple of fast boats leaving thin white wakes, realistic vessel scale (dhows 20–30 m). Clear air: the coastline is visible and crisp — no haze, no fog.
LENS & LOOK: 200 mm telephoto from a clifftop, slightly compressed, crisp detail, documentary colour.
FIXES: no vessel names, flags, logos or text of any kind.

### Seedance 2.5 (@image1 首帧 · 21:9 · 6 s)
@image1（首帧）。单镜头，6秒，21:9 新闻长焦画面，从海岸高处俯瞰，构图与首帧完全一致。
0-6秒：200mm长焦，三脚架上极缓慢向右平移并略微推近（总共约4%），稳定无抖动。海面上分散的小货船和木制单桅帆船随浪轻轻起伏，几艘缓慢前行；两艘快艇在中景拉出细长白色尾浪；前景两艘较大的帆船缓缓转向；海面波光闪烁。
动作约80%速度（轻微慢动作），摄影机真实速度。真实比例：帆船20–30米。
风格：真实新闻纪实，午后清澈阳光，海岸线清晰，空气通透，无雾无霾，无烟无火。无文字、无标志、无船名、无旗帜、无音乐。

## FOR2d · oil tanker — REPLACES the sailboats (client, Nov 16: "que sean barcazas en vez de veleros / o plataforma de petróleo"; user: oil tanker)
### Frame (GPT Image 2.6 · 21:9 · 4K · High · optional style ref: the approved placa 1 Hormuz frame)
Photorealistic 21:9 news-camera frame of a large loaded crude-oil tanker (VLCC) cruising through the Strait of Hormuz, seen side-on from a press boat about 400 m away.
COMPOSITION: the tanker's long dark-red and black hull runs horizontally across the middle of the frame, waterline at about 65% of the frame height; the white accommodation block and funnel on the left third, the long flat deck with pipelines and manifolds through the centre, the bow with a white bow wave on the right third. Arid ochre mountains low on the horizon behind, open deep-blue sea in the lower third, sky in the upper quarter. The whole ship fits inside the frame with sea on both sides.
SCENE: late-afternoon low sun from the left, warm light on the superstructure, clear crisp air (no haze, no fog), calm sea with fine ripples and glints, real scale (tanker 330 m long, 60 m wide), a small escort tug far behind on the left. Same colour grade as the Hormuz scene: warm ochre land, deep blue water, blue sky with thin cirrus.
LENS & LOOK: 300 mm telephoto broadcast camera, compressed perspective, crisp steel and rust detail, documentary colour.
FIXES: no ship name, no hull lettering or numbers, no flags, no funnel logo, no smoke, no fire, no text of any kind.

### Seedance 2.5 (@image1 首帧 · 21:9 · 6 s)
@image1（首帧）。单镜头，6秒，21:9 新闻长焦画面，构图与首帧完全一致，油轮始终完整在画面中。
摄影机：300mm长焦，从并行的新闻船上拍摄，全程轻微、平滑的手持感，随海浪极轻微起伏；镜头以与油轮相同的速度极缓慢向右平移跟随（油轮在画面中的位置基本不变），同时略微推近（总共约3%）。
0-6秒：满载的油轮从左向右平稳航行，船首劈开白色浪花，船侧拉出长长的白色尾流；远处左侧一艘护航拖船缓缓跟随；前景深蓝色海浪自然翻动并向后流过，浪尖阳光闪烁；背景赭色山脉缓慢后移，显示出前进速度。
动作约80%速度（轻微慢动作），摄影机真实速度。真实比例：油轮330米。
风格：真实新闻纪实，午后低角度暖阳，空气清澈通透，无雾无霾，无烟无火，色彩与霍尔木兹场景一致。无文字、无船名、无标志、无旗帜、无音乐。

## FOR2e · offshore oil platform — alternative to the tanker (user, Nov 16)
### Frame (GPT Image 2.6 · 21:9 · 4K · High · optional style ref: the approved placa 1 Hormuz frame)
Photorealistic 21:9 news-camera frame of a large offshore oil production platform in the Persian Gulf near the Strait of Hormuz, seen from a press boat about 600 m away.
COMPOSITION: the platform stands on the left third of the frame: four thick steel legs rising from the sea, a multi-deck topside with process modules, pipe racks, a tall drilling derrick, a helideck with its circular marking (no letters) and a lattice crane boom. The main deck sits in the vertical middle of the frame, the waterline at about 65% of the frame height. On the right third, a small supply vessel holds position near the platform and a second, distant platform sits on the horizon. Open deep-blue sea across the lower third, thin ochre coastline low on the horizon, sky in the upper quarter. The whole platform fits inside the frame.
SCENE: late-afternoon low sun from the left, warm light on the yellow and white steel, long shadows across the decks, clear crisp air (no haze, no fog), calm sea with fine ripples and glints, white surf around the legs. Real scale: topside about 80 m wide, derrick 50 m high. Same colour grade as the Hormuz scene: warm ochre land, deep blue water, blue sky with thin cirrus.
LENS & LOOK: 300 mm telephoto broadcast camera, compressed perspective, crisp steel detail, documentary colour.
FIXES: the flare boom is unlit — no flame, no smoke, no fire; no company names, no logos, no lettering on the helideck, no flags, no text of any kind.

### Seedance 2.5 (@image1 首帧 · 21:9 · 6 s)
@image1（首帧）。单镜头，6秒，21:9 新闻长焦画面，构图与首帧完全一致，海上石油平台始终完整在画面左三分之一。
摄影机：300mm长焦，从新闻船上拍摄，全程轻微、平滑的手持感，随海浪极轻微起伏；镜头极缓慢向右平移并略微推近（总共约4%），平台始终完整在画面中。
0-6秒：海浪拍打平台桩腿，激起白色浪花；平台上的吊车吊臂缓慢转动，吊起一个货箱；右侧的补给船随浪轻轻起伏，船尾螺旋桨搅起白色水流；一只海鸟从平台前方缓缓飞过；海面波光闪烁，远处的第二座平台静止在地平线上。
动作约80%速度（轻微慢动作），摄影机真实速度。真实比例：平台上部约80米宽，井架约50米高。
风格：真实新闻纪实，午后低角度暖阳，空气清澈通透，无雾无霾。火炬臂不点燃：无火焰、无烟、无火。色彩与霍尔木兹场景一致。无文字、无标志、无公司名、无旗帜、无音乐。

### FOR2e · Seedance v2: drone fly-by (user, Nov 17)
@image1（首帧）。单镜头，6秒，21:9，新闻无人机航拍，从首帧构图开始。
摄影机：无人机以真实速度平稳飞行，从首帧位置出发，沿平台右侧做一段缓慢的弧形环绕飞越（约绕平台25度），同时缓缓前进并略微下降高度（约10米），机身轻微倾斜（约5度）后回正；运动流畅连续、不停顿、不急推、不旋转过快。平台始终完整在画面中，从画面左三分之一逐渐移到画面左侧中间偏左位置，结束时平台仍在左半边。
0-6秒：随着无人机移动，平台的桩腿、甲板层次和井架产生明显的视差，前景海面向后流动；海浪拍打桩腿激起白色浪花；平台吊车吊臂缓慢转动吊起一个货箱；右侧补给船随浪起伏，船尾搅起白色水流；远处第二座平台和海岸线缓慢移动。
动作约80%速度（轻微慢动作），摄影机真实速度。真实比例：平台上部约80米宽，井架约50米高。
风格：真实新闻航拍纪实，午后低角度暖阳，空气清澈通透，无雾无霾。火炬臂不点燃：无火焰、无烟、无火。色彩与霍尔木兹场景一致。无文字、无标志、无公司名、无旗帜、无音乐。
