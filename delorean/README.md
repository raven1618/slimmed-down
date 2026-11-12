# De Lorean (work in progress)

An AI crew for marketing, content, sales, community, bookkeeping, legal prep and business advice, wrapped in an interactive 3D world.

**Status:** early plumbing only. The world concept, visual style and brand are still being defined, so the station names, crew names and metaphors in `shared/stations.ts` are placeholders.

What exists so far:
- `shared/schema.ts`: the Brand Core (business context every crew reads) and the shape of crew output (deliverables, review flags, hand-offs to other crews).
- `server/`: an API that runs a crew mission through Claude with structured output, plus a demo mode that works without an API key.
- No 3D client yet.
