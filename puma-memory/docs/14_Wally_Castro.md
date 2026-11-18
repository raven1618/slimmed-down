# Wally Castro · SPEECH IA · "La IA juega en tu equipo · Herramientas simples de IA para tu día a día"
**Source:** deck slides 17–18 plus 5 deck frames (`wally/deck/`).
- **Client:** "YA ESTAMOS OK CON ESTOS TEXTOS, SOLO SACARÍA LO REFERENCIAL A EESS DE PUMA", so no Puma service stations in any frame.

**Placas (deck order):**
1. ¿CÓMO JUGAMOS / LO QUE VIENE?
2. LA IA YA ESTÁ / CAMBIANDO / LA INDUSTRIA
3. MÁS DATOS / MÁS CAPACIDAD / MÁS VELOCIDAD
4. DEMANDA / LOGÍSTICA / PRECIOS / EXPERIENCIA

**Format:** the standard full-strip teaser (one clip per placa, like Andrés/Cepede/Carolina).

**Frames (GPT 2.6, Nov 18):**
- W1 city + green data path · 0ff1ee0f
- W2 refinery AI hologram scan · 4b84fd6f
- W3 data-centre corridor · 0e75106e
- W4 highway tankers + AI logistics overlay · 9d3133c7

**Close:** cut from deck card image41 (only 1080 px tall, and the card crops his left arm, so the end frame has a straight edge on the right). Needs an arm-completion edit, or the real photo the client promised.

## Seedance 2.5 (@image1 首帧 · 21:9 · 5 s · 480p → Topaz 4K)
**W1:** @image1（首帧）。单镜头，5秒，21:9 无人机航拍，构图与首帧一致，天际线与绿色光路保持在画面垂直中部。无人机以真实速度沿着发光大道缓慢向前飞行并略微下降，霓虹绿色数据光流沿大道向远方奔流，光点在高楼之间的绿色网络线上传递，定位图钉轻轻脉动；天空晚霞渐深，城市灯光逐渐亮起。动作流畅，摄影机真实速度。电影感，空气清澈。无标志、无广告牌、无可读文字、无加油站、无音乐。

**W2:** @image1（首帧）。单镜头，5秒，21:9，构图与首帧一致，炼油厂与全息图保持在画面垂直中部。摄影机以真实速度缓慢横移并略微推近；绿色全息线框沿着塔和管道由下而上扫描，数据点依次亮起，悬浮的绿色图表和分析网格实时更新、曲线生长；前景工程师在平板上操作。动作约80%速度。蓝调时刻，清晰细节。无火焰、无烟、无火；无标志、无公司名、无可读文字、无音乐。

**W3:** @image1（首帧）。单镜头，5秒，21:9，对称构图与首帧一致，消失点始终位于画面中央。摄影机以真实速度沿服务器走廊中轴线平稳快速向前推进（飞越感），两侧机柜的绿色指示灯连续闪烁并向后流过，天花板线槽上的绿色光粒子加速流向远处消失点，地面反光随之流动。动作流畅连续，摄影机真实速度。冷暗色调配霓虹绿，超清晰。无标志、无品牌、无文字、无音乐。

**W4:** @image1（首帧）。单镜头，5秒，21:9，构图与首帧一致，公路、油罐车与全息图保持在画面垂直中部。摄影机以真实速度与车队同向缓慢横移跟随；白色油罐车沿弯道平稳行驶，绿色全息路线随卡车延伸，地图图钉依次亮起，需求曲线与价格图表实时生长更新；夕阳光线在车身上流动。动作约80%速度，摄影机真实速度。空气清澈。油罐车无标志无文字，无加油站，无可读文字或数字，无音乐。

## Nov 18 · frames and animations
- **User feedback:**
  - The first W2 (holograms everywhere) "looks like AI slop" and was not framed for the screen.
  - W2 is now a realistic photo with the engineer centred and a realistic AR layer (anchored outlines plus small numeric tags). Job 6e904750.
  - W4 got the same AR treatment (62dc233a). In the edit, zoom 1.3 so the 3 trucks land one per panel.
- **Seedance (dynamic camera, user: "don't make them so stale"):**
  - W1 3cc85c8e
  - W2 8de53e9c
  - W3 a662b408
  - W4 384522bf (drone fly-by)
- **Upscales only after the user approves the animations.**
- **Lockups:** `text_layout_wally.py`. Card: WALLY CASTRO · LA IA JUEGA EN TU EQUIPO.
- **Nov 18:** the user approved the 4 animations.
  - Topaz: W1 a9e8b24b, W2 86d27ec5, W3 dacf9521, W4 88a25519 → `wally/clips_4k`.
  - W4 is a fly-by, so there's no static 1.3 zoom.
  - Close is a static placeholder keyed from the deck card. The real photo and walk-in are still pending.
- Nov 18: Wally v3: W2 340deac4 (static AR values) → Topaz 8d3c7037; W4 118d3b35 (Seedance built it backwards) → Topaz debc3ca7 → reversed locally.
