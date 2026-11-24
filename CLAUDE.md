# Puma Energy · Convención de Operadores 2026 — READ BEFORE ANY TASK

This file loads automatically in every session. It is binding. The client (Puma Energy via HighBTL, contact Benjamín Rosa; script by BRICK) reviews every frame and sends detailed corrections; this work is a pitch for more work. The bar is **ultra polished, professional, meticulous**. "Good enough" is a failure.

## 1. Mandatory protocol — every task, no exceptions
1. **Look it up before acting.** Before touching any part of the project, read:
   - `puma-memory/docs/19_ESTANDARES_y_REGISTRO_CLIENTE.md` (standards + every client request with status);
   - the topic doc for the part you touch (sphere: `puma-memory/docs/17_Esfera_metodologia.md`; teasers: `09_METODOLOGIA_teasers.md`, `10_SESSION_LESSONS_user_rules.md`);
   - the knowledge graph: `puma-memory/graphify-out/GRAPH_REPORT.md`, and query it for the part you touch: `cd puma-memory && $(dirname $(cat graphify-out/.graphify_python))/graphify query "<topic>" --budget 2000`. If docs changed since the last build, rebuild first (`/graphify puma-memory --update`). If that interpreter no longer exists (new container), run `pip install graphifyy` and use `graphify query` directly.
2. **Restate the exact request** (the client's own words where they exist) and check it against the register. Do exactly what was asked, where it was asked: no more, no less, no reinterpretation. If the register says something different from what you are about to do, stop and ask.
3. **Do the whole request.** Every item the user listed. Before replying, re-read the user's message and tick each item. If something is not done, say so in the first lines — never bury it at the end.
4. **QC before showing anything** (section 3). Never present work you haven't checked.
5. **Record it.** When a new client request, user rule or rejected approach appears, add it to the register in doc 19 in the same turn, commit, and rebuild the graph at the end of the session.

## 2. Honesty rules
- Never say "done", "checked" or "taken care of" unless it was actually done and verified, with the evidence (frame, measurement, check).
- If you skipped, missed or misread something, say so plainly and first. No excuses, no padding.
- Never claim a detail changed without comparing it directly against the reference.

## 3. Quality gates (sphere and teasers)
- Check every frame at 100%, on the sphere (front, back, side joins with `tools/side_check.py`), and in motion (a short clip) before showing.
- Compare generated details directly against the client reference (ball design, logo cat, truck, colours #7FFF00).
- Effects must serve one clear idea. No stacking overlays to "add polish": if a transition can't be described in one sentence, it isn't ready. Prefer a clean match cut or a generated continuous shot over code-built gimmicks.
- Light never touches the text. Text and numbers are static, never morphed. Never change faces.
- No third-party brands EXCEPT vehicle-manufacturer badges on trucks and ships (user: stop flagging those).

## 4. Working rules
- **Credits:** state the Higgsfield cost before spending; no upscales until the animation is approved.
- **Prompts:** always written with the skills (`image-prompt-helper`; `seedance-multishot-prompter`, Chinese + English). **Always paste the full prompts in the chat**, never only in a file.
- **Files for the user:** send them with SendUserFile; never make the user hunt for paths.
- Renders one at a time. Commit + push only to branch `claude/gifted-shannon-c1nwsj`.
- Answers: short, one recommendation, no surveys.
