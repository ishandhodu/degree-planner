# PRD: Degree Planner

Derived from `PROPOSAL.md`, corrected by Ishan. Source of truth for what "done" means for the Mini Project 2 deliverable due Thursday 10/22.

## Summary

A tool for Babson students who still have core requirements left to complete. It remembers which requirements are done, how many semesters remain (with study-abroad and gap semesters flagged), and which of four scheduling philosophies the student wants, then works out a semester-by-semester plan for the rest.

## Goals

- Turn "what's left" (which Workday shows) into "when should each thing happen" (which it doesn't).
- Respect real scheduling constraints: a requirement only offered in fall can't be assigned to a spring semester.
- Avoid overloading any one semester, under whichever difficulty philosophy the student picks.
- Make the trade-off between scheduling philosophies visible and comparable, not just one fixed opinion.

## Non-goals (out of scope for this deliverable)

- Pulling live data from the course-rating portal — the difficulty ratings are hardcoded into the JS file as a snapshot, not fetched live (needs a server/API, which is out of scope for this project).
- Prerequisite chains between core requirements (e.g., requirement B can't be taken before requirement A). Out of scope for this version; flagged as a known gap below.
- Concentration/elective planning. This tool only covers core requirements.
- Accounting for credit load/hours, only difficulty.

## Data model

**Fixed data (array of objects in the JS file):**

```js
const CORE_REQUIREMENTS = [
  { id, name, difficulty, offered }, // offered: "fall" | "spring" | "both"
  ...
];
```

Difficulty is 1–5 (one decimal place, matching the real portal data — e.g. 4.7), from the course-rating portal.

**State (JS variables, saved to `localStorage`):**

- `doneIds`: array of requirement IDs the student has checked — taken or currently taking, either way excluded from scheduling. (Originally a three-state status distinguishing "in progress" from "completed"; simplified to a single checkbox per the required-question commit below — a three-way control tested as more confusing than useful for a 20-item list.)
- `currentYearIndex` / `currentTerm`: the student's current class year (0 = Freshman … 3 = Senior) and term (`"fall"` | `"spring"`), used to compute every semester label going forward.
- `futureSemesterCount`: how many semesters remain **after** the current one.
- `flags`: per-future-semester array of `"normal"` | `"abroad"` | `"gap"`.
- `selectedModel`: one of `"A"`, `"B"`, `"C"`, `"D"`.
- `plan`: the generated output — which requirement is assigned to which future semester, and any requirement that couldn't be placed.

**The current semester is shown, not scheduled.** The plan always opens with a line naming the current semester and noting that planning starts the semester after it — but it no longer lists specific in-progress courses there, since a single checkbox can't distinguish "taken last year" from "taking this very term." Only requirements with `doneIds` excluded are handed to `generatePlan`, and only into the semesters after the current one.

## Scheduling logic

One function, `generatePlan(requirements, semesters, model)`, used for all four models — only the difficulty-cap config passed in changes:

| Model | Normal semester cap | Abroad-semester cap | Final-semester cap |
|---|---|---|---|
| A — Spread evenly | 6 | 6 | 6 |
| B — Ramp up | 4 (first half of remaining semesters) → 8 (second half) | 4 | 8 |
| C — Ramp down | 8 (first half) → 4 (second half) | 4 | 4 |
| D — Protect specific semesters | 7 | 3 | 3 |

Max 2 core requirements assigned per semester regardless of model, so there's still room for electives and major courses.

**Assignment order:** before assigning, sort unassigned requirements by how many of the remaining semesters they could even go in (fewest valid semesters first — a fall-only requirement with one fall semester left is more urgent than a both-semesters requirement). Ties break by difficulty, highest first, so the hardest of equally-constrained requirements gets placed while there's still room.

For each semester in order, fill it with requirements from the sorted list that (a) are offered in that semester's type, and (b) keep the semester's running difficulty total at or under its cap, until either the cap or the 2-course max is hit.

Anything left unassigned after all semesters are filled is flagged in the output as "couldn't be scheduled as configured."

## Semester labels

Every semester — current and future — is labeled by class year + term (e.g. "Sophomore Spring"), computed forward from `currentYearIndex`/`currentTerm`. Past Senior year, the label falls back to "Year 5", "Year 6", etc. rather than breaking.

## Interface: landing page + one-question-at-a-time wizard

The tool is three screens, not one scrolling form:

1. **Landing page** — what the tool does, a sample ledger row for a preview, and a "Build my plan" button.
2. **Wizard** — one question per screen, with a progress bar, Back/Next, autofocus, and Enter-to-continue: the requirement checklist, current year/term, how many semesters remain, a single page listing every remaining semester with a 3-way Normal/Abroad/Gap toggle (tested as one screen per semester first — see required-question commit below — but that was changed back to one page after user testing showed it created more clicks than clarity for someone with several semesters left), the model choice (four descriptive cards, not a bare dropdown, so the trade-offs are visible before picking), and a final "Ready to build your plan?" confirmation.
3. **Plan screen** — reached only via "Generate my plan", separate from the wizard.

## States

- **Empty:** Landing page, before "Build my plan" is clicked.
- **Invalid input:** Triggered by: future-semester count that's negative, blank, or not a whole number; or every requirement already checked (nothing left to schedule). Message appears inline directly under the field, and the wizard won't advance past it until it's fixed.
- **In use:** The wizard steps themselves, each holding its own state until "Generate my plan" is clicked.
- **Plan generated:** The current semester is named first (no item list, no cap — see above), then each future semester with its flag, assigned requirements, and a running difficulty total against its cap, animated filling in. A "Couldn't be scheduled" section lists anything left over.
- **After a reset:** "Start over" clears all state back to defaults and returns to the landing page, without a page reload.

**Default model suggestion (rule-based, not live AI):** if the student flags any semester as study-abroad, default the model choice to D; otherwise default to A. The student can always pick a different card.

## Functional requirements

- State held in JS (`doneIds`, current year/term, `futureSemesterCount`, `flags`, `selectedModel`, `plan`), read and changed by more than one interaction.
- Output worked out from that state (the generated plan, per-semester difficulty totals, unscheduled flags) — not an echo of input.
- At least three kinds of interaction: checkboxes (requirement list), number input + dropdowns (setup), toggle buttons (per-semester flags), radio cards (model), and buttons (Next/Back, Generate, Reset).
- Page updates itself on every change — no `alert()`.
- Invalid input shown inline, tool keeps working.
- Reset returns to Empty state without reloading the page.
- Plain HTML/CSS/JS only — no frameworks, no CDN.
- No server, no outside API — all data is the hardcoded `CORE_REQUIREMENTS` array plus what the student enters.
- Semantic HTML, readable on a phone.
- Deployed on GitHub Pages.

## Success criteria

- A generated plan always respects each requirement's offered-semester constraint — never assigns a fall-only requirement to a spring slot.
- Switching models recalculates the plan under the new caps without a page reload.
- Every state (empty, invalid input, in use, after reset) looks and behaves the way this document describes.
- No console errors during normal use.

## Later (not built in this deliverable)

1. Pull difficulty ratings live from the course-rating portal instead of a hardcoded snapshot — needs a server/API, out of scope here.
2. Prerequisite ordering between core requirements.
3. Factor in credit load, not just difficulty.
4. The greedy assignment isn't globally optimal — it fills semesters in order and never revisits an earlier choice, so a different combination could occasionally schedule one more item than it does. Acceptable for this project's size; an exhaustive/backtracking search was considered and rejected as overkill.
