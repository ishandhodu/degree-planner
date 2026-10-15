# How this tool is built

- Plain HTML, CSS, and one JS file (`js/main.js`). GitHub Pages serves the
  repo files as they are — no frameworks, no build step, no CDN script or
  stylesheet, no server, no backend.
- No outside API calls, ever — not for course data, not for a live AI
  recommendation. The "AI recommends a model" behavior in `PRD.md` is a
  plain JS rule (abroad flagged → default Model D, else Model A), not a
  live model call. If a request needs a server, a database, or an outside
  API to work, stop, tell me, and add it to `PRD.md`'s Later section
  instead of building it.
- `CORE_REQUIREMENTS` is a hardcoded array of objects in `js/main.js` — not
  a separate `.json` or `.csv` file, and not fetched from anywhere.
- One scheduling function, `generatePlan(requirements, semesters, model)`,
  used by all four models. The four models are config objects (difficulty
  caps) passed into that one function — never four copies of the
  algorithm. If a change to the logic would mean editing it in four
  places, stop and fold it back into the shared function first.
- One shared stylesheet (`css/styles.css`). No inline `<style>` blocks, no
  second stylesheet.
- No `alert()` boxes anywhere. Invalid input and "couldn't be scheduled"
  both render inline, per the states in `PRD.md`/`DESIGN.md`.
- Follow `DESIGN.md`'s tokens exactly — the palette, the two typefaces and
  their roles, hairline rules instead of cards/shadows/border-radius. Don't
  introduce a new color or a rounded corner because it's the easy default.
- State (`completedIds`, `semesters`, `selectedModel`, `plan`) persists to
  `localStorage` under one key, `degree-planner-state`. Don't scatter state
  across multiple keys.
- File and folder names: lowercase, no spaces.
- Commit as you go — one commit per working piece (one interaction, one
  state, one model), not one commit holding the finished tool.
