# Design Direction: Degree Planner

Written before the tool is styled. The core component is tried out in `design-trials/trial-1.html` before this document; build from this, not from scratch.

## Concept

A degree-audit ledger. Workday shows what's done; this tool shows what's left and whether it fits. Each semester is a ledger line that has to balance against a difficulty budget, shown as a fill bar, not just a number — the budget is the actual subject of the tool, so it should be the thing you see first, not a number buried in a table.

## Palette

| Token | Hex | Use |
|---|---|---|
| Paper | `#FDFCF7` | Page background |
| Band | `#E3EDE0` | Budget-bar track, alternating row tint |
| Ink | `#1F2E27` | Text, rules |
| Forest | `#3D6B52` | Budget bar at normal fill, headings accents, primary buttons |
| Mustard | `#B98B2A` | Budget bar at/near its cap |
| Brick | `#A1402C` | Budget bar over cap, "couldn't be scheduled" flags, invalid-input messages |

## Type

- **Spectral** (serif) — headings, instructions, body prose. This is the tool explaining itself to you.
- **IBM Plex Mono** (monospace) — anything that's a number or needs to line up like a ledger: difficulty points, semester budgets ("5 / 7"), requirement codes. Tabular figures throughout so columns of numbers actually align.

Two typefaces, each doing one job — never mixed within the same line of text.

## Layout

Single column, left-aligned, max width ~640px. Hairline (1px, `--ink`) rules separate semesters — no cards, no shadows, no border-radius anywhere. The ruling does the work a card border would, but it reads as a ledger, not a UI kit.

```
Fall 2026 ───────────────────────────── 5 / 7
[███████████░░░░░░░░]
  · ORG-200  Org Behavior        diff 3
  · QTM-110  Quant Methods       diff 2
──────────────────────────────────────────
```

The requirement checklist (mark-completed) and the setup form (remaining semesters, abroad/gap flags, model dropdown) sit above the plan as their own ledger sections, same ruling style, before any plan is generated.

## States

- **Empty:** the checklist and setup form are visible and interactive; the plan area shows one line of Spectral prose: "Mark what you've completed and set up your remaining semesters, then generate your plan." No bars, no ledger rows yet — there's nothing to balance yet.
- **Invalid input:** a line of brick-red (`#A1402C`) Plex Mono text appears directly under the offending field (e.g., under the remaining-semesters input: "Enter at least 1 remaining semester"). The field itself gets a brick-red bottom border. Nothing else on the page changes; the rest of the form stays exactly as it was.
- **In use:** the semester ledger from the trial — each semester a hairline-ruled band with its label, any flag, a budget bar (forest/mustard/brick depending on fill), and its assigned requirements in Plex Mono. A "Couldn't be scheduled" section, same ruling style, in brick, appears below the ledger only if something didn't fit.
- **After reset:** everything returns to the Empty state's exact appearance — no transition needed, since Reset is a deliberate full return, not a partial change.

## Motion

One deliberate moment: when "Generate Plan" runs, each budget bar fills from 0 to its computed width in a single ~400ms pass (CSS transition on `width`), staggered slightly semester-to-semester (fall first, then the next, etc.) so the ledger visibly "fills in." Nothing else animates — no hover transitions on rows, no fade-ins on load. Respects `prefers-reduced-motion` (bars jump straight to final width, no transition).

## Accessibility

- Text contrast: ink (`#1F2E27`) on paper (`#FDFCF7`) and band (`#E3EDE0`) both clear AA for body text.
- Every interactive element (checkbox, input, dropdown, button) gets a visible focus outline in forest green, not just a browser default.
- Budget-bar color is never the only signal — the "x / y" number is always shown alongside the bar, so color-blind users aren't relying on forest/mustard/brick alone.
