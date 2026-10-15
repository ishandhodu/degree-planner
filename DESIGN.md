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

- **A system serif** (`Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif`) — headings, instructions, body prose. This is the tool explaining itself to you.
- **A system monospace** (`ui-monospace, SF Mono, Cascadia Code, Consolas, Menlo, monospace`) — anything that's a number or needs to line up like a ledger: difficulty points, semester budgets ("5 / 7"), requirement codes. Tabular figures throughout so columns of numbers actually align.

Originally Spectral/IBM Plex Mono from Google Fonts; switched to native system font stacks since the brief for this project bans loading anything from a CDN, which a Google Fonts `<link>` arguably counts as. No visible request to an outside host anywhere in the page now.

Two typefaces, each doing one job — never mixed within the same line of text.

## Layout

Single column, left-aligned, max width ~640px for the landing and plan screens. Hairline (1px, `--ink`) rules separate semesters — no cards, no shadows, no border-radius anywhere in the ledger itself. The ruling does the work a card border would, but it reads as a ledger, not a UI kit.

```
Fall 2026 ───────────────────────────── 5 / 7
[███████████░░░░░░░░]
  · ORG-200  Org Behavior        diff 3
  · QTM-110  Quant Methods       diff 2
──────────────────────────────────────────
```

**The wizard is its own narrower column (~480px), bordered as one panel** — a deliberate exception to "no cards." User testing on the first version (one flat scrolling page) found it read as bland and not "a professional tool's sign-up flow"; a bounded step panel with a progress bar above it, one question at a time, reads as guided rather than as a form dumped on the page. The ledger itself (landing hero sample, final plan) keeps the flatter, card-free treatment.

## States

- **Landing:** headline, one paragraph of explanation, a static sample ledger row (same visual language as the real plan, non-interactive), and a "Build my plan" button.
- **Wizard, empty/in progress:** one question per screen inside the bordered panel, with a progress bar (`Step N of M`) above it. Step content fades/slides in on each change (~250ms, skipped under `prefers-reduced-motion`).
- **Invalid input:** a line of brick-red (`#A1402C`) system-mono text appears directly under the offending field (e.g., under the remaining-semesters input: "Enter 0 or more remaining semesters"). The field itself gets a brick-red border. The wizard won't advance until it's fixed.
- **Plan generated:** the ledger — current semester named first (no item list, no bar, since it isn't scheduled), then each future semester as a hairline-ruled band with its label, any flag, a budget bar (forest/mustard/brick depending on fill), and its assigned requirements in mono. A "Couldn't be scheduled" section, same ruling style, in brick, appears below only if something didn't fit.
- **After reset:** returns to the landing screen exactly as a first visit — no transition needed, since "Start over" is a deliberate full return, not a partial change.

## Motion

Two deliberate moments, both skipped under `prefers-reduced-motion`:

1. When "Generate my plan" runs, each budget bar fills from 0 to its computed width in a single ~400ms pass (CSS transition on `width`), staggered slightly semester-to-semester so the ledger visibly "fills in."
2. Each wizard step fades and slides in slightly (~250ms) when it appears, so moving through the questions feels like progressing, not like the page just changing.

Nothing else animates — no hover transitions on static content, no decorative fade-ins.

## Accessibility

- Text contrast: ink (`#1F2E27`) on paper (`#FDFCF7`) and band (`#E3EDE0`) both clear AA for body text.
- Every interactive element (checkbox, input, toggle button, radio card, button) gets a visible focus outline in forest green, not just a browser default. Each wizard step autofocuses its first field, and pressing Enter in a field advances to the next question, for a keyboard-first flow.
- Budget-bar color is never the only signal — the "x / y" number is always shown alongside the bar, so color-blind users aren't relying on forest/mustard/brick alone.
