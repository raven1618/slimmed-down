# Graph Report - slimmed-down  (2026-11-24)

## Corpus Check
- 45 files · ~76,079 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .css 1, .geojson 1)

## Summary
- 568 nodes · 1022 edges · 26 communities (21 shown, 5 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `133a7437`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- views.js
- tools.js
- hill.js
- look.js
- trail_video.mjs
- build
- core.js
- ui.js
- build.py
- Outer Heaven · Cerro Kavaju
- steps
- yAt
- relayout
- buildHill
- prep.py
- initLimits
- hexRGB
- private_site.py
- Blender renders
- impostors.py
- ph_fetch.py
- contourMaterial
- buildBuildings
- showStructure
- Outer Heaven: standing rules
- .claude/CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `build()` - 39 edges
2. `build()` - 19 edges
3. `renderNotes()` - 17 edges
4. `say()` - 16 edges
5. `buildHill()` - 14 edges
6. `yAt()` - 13 edges
7. `openTour()` - 13 edges
8. `buildStructures()` - 12 edges
9. `relayout()` - 12 edges
10. `markTab()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `build()` --calls--> `materials()`  [EXTRACTED]
  js/walk.js → js/cabin.js
- `build()` --calls--> `merge()`  [EXTRACTED]
  js/walk.js → js/cabin.js
- `build()` --calls--> `loadLook()`  [EXTRACTED]
  js/walk.js → js/look.js
- `build()` --calls--> `sunLight()`  [EXTRACTED]
  js/walk.js → js/look.js
- `build()` --calls--> `uniforms()`  [EXTRACTED]
  js/walk.js → js/look.js

## Import Cycles
- None detected.

## Communities (26 total, 5 thin omitted)

### Community 0 - "views.js"
Cohesion: 0.05
Nodes (74): adaptResolution(), applyDisplay(), backToTour(), boot(), buildBar(), buildChips(), buildPano(), chooseBase() (+66 more)

### Community 1 - "tools.js"
Cohesion: 0.10
Nodes (46): activePointers, cabinMats(), deleteNote(), downhillBearing(), esc(), finishDrawing(), footprintModel(), initNotes() (+38 more)

### Community 2 - "hill.js"
Cohesion: 0.05
Nodes (34): archWindow(), BASES, baseTex, BLANK, BROWN, BUILDERS, cabinModel(), CREAM (+26 more)

### Community 3 - "look.js"
Cohesion: 0.09
Nodes (33): box(), buildVolume(), CABIN, cabinInterior(), livingInterior(), materials(), merge(), quarryCabin() (+25 more)

### Community 4 - "trail_video.mjs"
Cohesion: 0.05
Nodes (39): description, devDependencies, playwright@1.63.0, name, private, scripts, phone, test (+31 more)

### Community 5 - "build"
Cohesion: 0.16
Nodes (35): build(), actions(), animate(), answer(), beginAttack(), beginFinal(), beginHide(), beginIdle() (+27 more)

### Community 6 - "core.js"
Cohesion: 0.10
Nodes (28): ANISO, canvas(), clamp(), colorize(), courtTex(), ease(), fbm(), FOL (+20 more)

### Community 7 - "ui.js"
Cohesion: 0.09
Nodes (27): bar, closeDrawer(), compass, copyText(), DEFAULT_HINT(), drawer, fillCompact(), flyAround() (+19 more)

### Community 8 - "build.py"
Cohesion: 0.09
Nodes (7): add_attr(), import_model(), pbr(), roof_tops(), scatter_tree(), sock(), web_materials()

### Community 9 - "Outer Heaven · Cerro Kavaju"
Cohesion: 0.11
Nodes (18): Accuracy, Base maps, Check every view, Concept pages notes, Host it for free, How it is built, Light and materials, Links to individual views (+10 more)

### Community 10 - "steps"
Cohesion: 0.12
Nodes (16): jobs, smoke, name, on, pull_request, push, runs-on, steps (+8 more)

### Community 11 - "yAt"
Cohesion: 0.16
Nodes (17): baseY(), bearingRot(), buildStructures(), cutAt(), cutModel(), gravelTex(), groundAt(), hillLabels() (+9 more)

### Community 12 - "relayout"
Cohesion: 0.21
Nodes (12): applyLayers(), clearOfStructures(), curtain(), drawOverlay(), fromUTM(), kindOf(), placeTrees(), refreshCurtains() (+4 more)

### Community 13 - "buildHill"
Cohesion: 0.19
Nodes (14): b64bytes(), baseTexture(), buildHill(), buildRoads(), getJSON(), loadImage(), loadOfficial(), loadSites() (+6 more)

### Community 15 - "initLimits"
Cohesion: 0.20
Nodes (11): deleteLimit(), flatten(), initLimits(), limitById(), loadLocalNames(), localLoad(), localSave(), newLimitId() (+3 more)

### Community 17 - "hexRGB"
Cohesion: 0.33
Nodes (9): contourLabels(), gridCanvas(), hexRGB(), hillshade(), landcoverAt(), rampRGB(), reliefMap(), slopeMap() (+1 more)

### Community 19 - "Blender renders"
Cohesion: 0.25
Nodes (7): Blender renders, Free roam: the private side, Free roam: the quarry cabins, Run it, The hill's trees (seen from the air), The photoreal tour (Explore the site), The shot: quarry cabins

### Community 22 - "contourMaterial"
Cohesion: 0.40
Nodes (5): contourMaterial(), detailTexture(), holeMask(), roundRing(), shoreOf()

### Community 23 - "buildBuildings"
Cohesion: 0.40
Nodes (5): buildBuildings(), buildTrees(), imageryColor(), treeCardsMesh(), treeGeometry()

### Community 24 - "showStructure"
Cohesion: 0.50
Nodes (4): geojsonOf(), ringArea(), showStructure(), toUTM()

### Community 25 - "Outer Heaven: standing rules"
Cohesion: 0.25
Nodes (7): Before saying "done", graphify, Open (not at the bar yet), Outer Heaven: standing rules, Privacy (the repository is public), The quality bar (every change, every view), Where things are

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `windOf()` connect `tools.js` to `core.js`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `build()` (e.g. with `loop()` and `resize()`) actually correct?**
  _`build()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `views.js` be split into smaller, more focused modules?**
  _Cohesion score 0.053613053613053616 - nodes in this community are weakly interconnected._
- **Why does `lendRenderer()` connect `views.js` to `core.js`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `tools.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09574468085106383 - nodes in this community are weakly interconnected._
- **Why does `disposeScene()` connect `core.js` to `views.js`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Should `hill.js` be split into smaller, more focused modules?**
  _Cohesion score 0.051515151515151514 - nodes in this community are weakly interconnected._