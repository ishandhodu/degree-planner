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
| Band-light | `#EEF3EB` | Hovered course row on the plan timeline |
| Brick-tint | `#F4E7E1` | Hovered row in the "couldn't be scheduled" list |
| Muted | `#55625B` | Secondary/metadata text (credits, counts, hints) |
| Ghost-seg | `#9BB0A2` | A scheduled course's bar segment while previewing an unplaced course against it |

## Type

- **A system serif** (`Source Serif 4, Source Serif Pro, Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif`) — headings, instructions, body prose. This is the tool explaining itself to you. The first two names aren't installed on most systems and aren't loaded from anywhere; they're just the preferred fallback order if a reader happens to have them, before it settles on the original system stack.
- **A system monospace** (`ui-monospace, SF Mono, Cascadia Code, Consolas, Menlo, monospace`) — anything that's a number or needs to line up like a ledger: difficulty points, semester budgets ("5 / 7"), requirement codes. Tabular figures throughout so columns of numbers actually align.

Originally Spectral/IBM Plex Mono from Google Fonts; switched to native system font stacks since the brief for this project bans loading anything from a CDN, which a Google Fonts `<link>` arguably counts as. No visible request to an outside host anywhere in the page now.

Two typefaces, each doing one job — never mixed within the same line of text.

## Layout

Single column, left-aligned, max width ~640px for the landing screen. Hairline (1px, `--ink`) rules separate items there — no cards, no shadows, no border-radius in the landing ledger sample.

```
Fall 2026 ───────────────────────────── 5 / 7
[███████████░░░░░░░░]
  · ORG-200  Org Behavior        diff 3
  · QTM-110  Quant Methods       diff 2
──────────────────────────────────────────
```

**Two deliberate exceptions to "no cards":**

1. **The wizard** is its own narrower column (~480px), bordered as one panel. A flat scrolling page read as bland and not "a professional tool's sign-up flow"; a bounded step panel with a progress bar above it, one question at a time, reads as guided rather than as a form dumped on the page.
2. **The plan screen** (below) also moved to cards. A vertical stack of hairline-ruled semesters worked for ~5 semesters but read as a long, undifferentiated scroll once a student had 8–9 remaining — nothing signaled "this is a timeline," just a list. The plan is now a horizontal, full-bleed row of one card per semester strung along a thin spine line, read left to right like an actual planner. Each card keeps a hard, un-blurred offset shadow on hover (`6px 6px 0 var(--ink)`, forest or brick on the current/unplaced variants) rather than a soft UI-kit shadow at rest — it reads as a card lifting off flat paper, not as a floating panel, so the ledger's "flat paper + ink" feel carries over even though the layout changed. The landing hero sample stays flat and card-free; only the plan screen itself made this trade.

## States

- **Landing:** headline, one paragraph of explanation, a static sample ledger row (same visual language as the real plan, non-interactive), and a "Build my plan" button.
- **Wizard, empty/in progress:** one question per screen inside the bordered panel, with a progress bar (`Step N of M`) above it. Step content fades/slides in on each change (~250ms, skipped under `prefers-reduced-motion`).
- **Invalid input:** a line of brick-red (`#A1402C`) system-mono text appears directly under the offending field (e.g., under the remaining-semesters input: "Enter 0 or more remaining semesters"). The field itself gets a brick-red border. The wizard won't advance until it's fixed.
- **Plan generated:** a header (title, counts — semesters planned / courses placed / couldn't fit — and two scroll buttons), then a horizontal, snap-scrolling row of semester cards strung along a thin spine with a marker dot per semester (filled + ringed forest for the current one, dashed for a gap semester, a brick diamond for the trailing "unplaced" card). Each card shows the term, its `used / cap` budget bar (forest/mustard/brick by fill, one segment per course), and up to four course slots — unused ones read `(elective)`, or `—` on the current semester, which never schedules anything. Cards load in left-to-right with a brief rise-and-fade, replayable from the footer. Hovering a course row isolates it (dims the others, highlights its bar segment); hovering an unplaced course in the trailing card previews it against every semester's bar and budget at once, in brick if it would go over the cap. A "Couldn't be scheduled" card, same card treatment, in brick, is that trailing card — present only if something didn't fit.
- **After reset:** returns to the landing screen exactly as a first visit — no transition needed, since "Start over" is a deliberate full return, not a partial change.

## Motion

All skipped under `prefers-reduced-motion`:

1. Each wizard step fades and slides in slightly (~250ms) when it appears, so moving through the questions feels like progressing, not like the page just changing.
2. When the plan renders, cards animate in left to right (rise + fade, ~650ms each, staggered ~130ms apart) and the spine line draws itself behind them, so the timeline visibly builds rather than appearing all at once. A "Replay" button in the footer reruns this same sequence on demand.
3. Each card lifts on hover (an un-blurred offset shadow, ~280ms) — the only hover transition on otherwise static content, there specifically to make the cards read as physical objects on the ledger.
4. Previewing an unplaced course over a semester's budget bar animates the bar's ghost segment in (~350ms) rather than snapping, so the "would this fit" question reads as a live comparison.

## Accessibility

- Text contrast: ink (`#1F2E27`) on paper (`#FDFCF7`) and band (`#E3EDE0`) both clear AA for body text.
- Every interactive element (checkbox, input, toggle button, radio card, button) gets a visible focus outline in forest green, not just a browser default. Each wizard step autofocuses its first field, and pressing Enter in a field advances to the next question, for a keyboard-first flow.
- Budget-bar color is never the only signal — the "x / y" number is always shown alongside the bar, so color-blind users aren't relying on forest/mustard/brick alone.
