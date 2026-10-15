# Degree Planner

A tool for Babson students who still have core requirements left to complete. Workday shows what's done; this doesn't show what's left or when to take it — so it recommends a semester-by-semester plan for your remaining core requirements, balanced against how difficult each one is (from a course-rating portal built separately), under one of four scheduling philosophies you pick.

**Live site:** https://ishandhodu.github.io/degree-planner/

Built from `PROPOSAL.md` → `PRD.md` → `DESIGN.md` → `AGENTS.md`, as a landing page plus a one-question-at-a-time wizard, ending in a generated plan on its own screen.

## How to use it

1. From the landing page, click **Build my plan**.
2. Check off any core requirement you've already taken or are currently taking.
3. Enter your current year and term, and how many semesters you have left after this one.
4. On the semester list, flag any semester that's unusual — study abroad or a gap semester — with a quick three-way toggle. Leave the rest as Normal.
5. Pick a scheduling model from the four description cards (each explains what it actually does before you choose).
6. Click **Generate my plan** to see your semester-by-semester plan, including anything that couldn't be scheduled given your setup.
7. **Start over** on the plan screen resets everything and returns to the landing page.

Nothing leaves your browser — all data is hardcoded into `js/main.js` or typed in by you, saved to `localStorage` so it survives a refresh.

## The required question

**Pick one piece of AI output you did not accept as-is. What did it give you, what did you change, and how did you know it needed changing? Point at the commit.**

Commit [`456a733`](https://github.com/ishandhodu/degree-planner/commit/456a733) built the semester-flagging step as one screen per semester — asking "Fall 2026 — anything unusual?" individually, over and over, as part of the one-question-at-a-time wizard. It looked reasonable: it followed "ask one thing at a time" literally, and I accepted it without testing it against a realistic case.

I only caught the problem by actually clicking through the wizard with 6+ semesters entered — at that point it was obviously too many screens for something this minor, each one requiring a full Back/Next round trip just to leave a semester on its default "Normal" setting. The fix, in commit [`dc2aa4f`](https://github.com/ishandhodu/degree-planner/commit/dc2aa4f): combined every semester back onto a single page, each with a compact three-button toggle (Normal/Abroad/Gap) instead of a dropdown, so the whole list is scannable and a semester can be flagged in one click instead of a dropdown-then-select-then-Next sequence repeated per semester.

## Notes

- Difficulty ratings are one decimal place (e.g. 4.7), not whole 1–5 integers as originally planned in `PROPOSAL.md` — the real course-rating portal data came back with decimals, so the tool kept that precision instead of rounding it away.
- The requirement checklist was originally a three-state control (not started / in progress / completed) so the current semester's plan could show specific in-progress courses. User testing showed the three-way choice was more confusing than useful for a 20-item list, so it's now a single checkbox (taken/taking vs. not) — the trade-off is the current-semester line in the plan is now just a label, not a specific course list.
- The "AI recommends a model" behavior is a plain JavaScript rule (study-abroad flagged → suggest Model D, otherwise Model A), not a live model call — the assignment requires no outside API calls, so there's no real AI involved in that suggestion.
