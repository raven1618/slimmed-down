# Outer Heaven: standing rules

Investor pitch for Cerro Kavaju, Paraguay: glamping cabins at an old quarry and a private community (Finca 2663).
A static site (three.js, no build step) plus a Blender pipeline in `render/`. The owner reviews it on an iPhone, in
the Claude app; most investors will see it on a phone too. Read this whole file before any change. These rules exist
because each was asked for more than once: do not make the owner repeat them.

## The quality bar (every change, every view)

1. **Photoreal wherever an investor looks.** No toy geometry, flat untextured boxes, "lollipop" trees or stair-stepped
   edges. If something cannot reach that bar yet, do not show it close up; say so, and list it under Open below.
2. **One source of truth.** One version of each thing. The new buildings exist only in `js/cabin.js`, the homestead
   only in `js/site/hill.js` (`homesteadModels`): free roam draws them and `render/export_models.cjs` exports them
   for the Blender tour. Never add a parallel version (no second
   design viewer, no second 360° menu, no separate demo build).
3. **Light like the renders.** One sky and one sun everywhere, set once in `render/look.json` (late morning, as in the
   owner's photos): the renders, the bake, the tree photos, and through `data/walk/world.json` the hill and free
   roam. Never washed out (no cream or white haze, no clipped sky), never murky. Glow and grain stay subtle.
4. **Phone first.** Check at iPhone size, not only desktop: `npm run phone` (390×664 CSS px, 2×). Antialiasing on
   (4× MSAA), effects at 2× pixels; slow devices step down on their own. No view may show the edges of the 4 km model.
5. **Controls: the view follows your finger, in every view.** Drag right = look right, drag up = look up (hill,
   tour, free roam). Never airplane-inverted. Responsive on touch, and a flick glides to a stop.
6. **Investor-facing means real.** Default to photoreal renders (Cycles) over anything stylised. Do not propose
   flyby or walkthrough videos: the owner makes those with AI video tools from reference images.

## Before saying "done"

- `npm run phone` and `npm test` pass, and you have **looked at** `tests/shots/phone-*.png` against the bar above.
- Commit, push to the working branch, and publish the artifact (`ff336862-f808-4229-b8cc-2dbb79c7bdcd`).
- Say plainly what you did not check or could not fix. Do not call something fixed that you have not seen.

## Privacy (the repository is public)

- Never publish owners' names or passport numbers from title plans.
- Never commit or publish the drone photo that shows the family on the porch.
- The parcel registry numbers and survey are in the repository; the owner knows.

## Open (not at the bar yet)

- **Hill close-ups, closer than about 50 m:** the ground is the 1 m satellite image and turns soft; the homestead's
  buildings are simple shapes (now in photographed brick, clay tile, plaster and wood). Done already: the hill's trees
  and palms are photographed tree models (`render/impostors.py ... aerial`, `data/hill/`), not round canopies.
- **The homestead's pond on the hill:** muddy water in its dug hole, as in the photos, but from above its rim reads
  too clean, like a bowl. The tour's renders show it right. (The site photo shows no water there to use instead.)
- **Palms in free roam:** its tree photographs have no palm row yet, so the homestead's palms show as broadleaf trees.

## Where things are

`README.md` (views, links, how it is built), `render/README.md` (the Blender pipeline: tour, free roam, private
side). For the code itself, use the graph below before reading files.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. When the answer is under a Markdown heading, `graphify section "<heading>"` prints that section's text, so the .md need not be opened. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
