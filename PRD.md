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

Difficulty is 1–5, from the course-rating portal.

**State (JS variables, saved to `localStorage`):**

- `completedIds`: set of requirement IDs the student has checked off.
- `semesters`: a list built from how many semesters remain, each one `{ label, type: "fall" | "spring", flag: "normal" | "abroad" | "final" }`.
- `selectedModel`: one of `"A"`, `"B"`, `"C"`, `"D"`.
- `plan`: the generated output — which requirement is assigned to which semester, and any requirement that couldn't be placed.

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

## States

- **Empty:** First visit. Shows the full core requirement list as checkboxes (none checked), a setup form (number of remaining semesters; per-semester abroad/gap flags; model dropdown, defaulted by rule — see below), and a "Generate Plan" button. The plan area shows placeholder text: "Mark what you've completed and set up your remaining semesters, then generate your plan."
- **Invalid input:** Triggered by: remaining-semesters count that's zero, blank, or not a number; or every requirement already marked completed (nothing left to schedule). Message appears inline directly under the relevant field (e.g., "Enter at least 1 remaining semester"), the Generate button does nothing until it's fixed, and nothing else on the page resets.
- **In use:** After a valid "Generate Plan" click — a semester-by-semester list, each showing its label, flag (if any), assigned requirement(s) with difficulty, and a running difficulty total against its cap. A separate "Couldn't be scheduled" section lists anything left over, if any.
- **After a reset:** "Reset" clears `completedIds`, `semesters`, `selectedModel`, and `plan` back to defaults and returns to the Empty state, without a page reload.

**Default model suggestion (rule-based, not live AI):** if the student flags any semester as study-abroad, default the dropdown to Model D; otherwise default to Model A. The student can always override it from the dropdown.

## Functional requirements

- State held in JS (`completedIds`, `semesters`, `selectedModel`, `plan`), read and changed by more than one interaction.
- Output worked out from that state (the generated plan, per-semester difficulty totals, unscheduled flags) — not an echo of input.
- At least three kinds of interaction: checkboxes (mark completed), a number input + flag checkboxes (semester setup), a dropdown (model selection), and buttons (Generate, Reset).
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
