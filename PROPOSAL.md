# Proposal: Degree Planner

## What I am building

A core-requirement scheduling planner for Babson students that recommends which semester to take each remaining required course in, based on course difficulty and how many semesters are left.

## Who it is for

Babson students who still have core requirements left to plan out — underclassmen especially. Not myself: I'm a senior and have already planned out my remaining semesters, so I'm not a fitting user for this tool. It solves the problem of Workday showing what's completed but not giving a clear picture of what's left, how to space it out, or why one semester is a better fit than another for a given requirement.

## What it remembers

- The list of core requirements still needed: name, difficulty rating (1-5, pulled from the course-rating portal data), and which semester(s) it's offered in (fall-only, spring-only, or both).
- Which of those requirements the student has already marked as completed.
- The student's remaining semesters: how many are left, and whether any are flagged as a study-abroad semester or a gap semester.
- Which of the four scheduling models (A/B/C/D) is currently selected.
- The generated plan: which course is assigned to which semester, and any requirement that couldn't be scheduled.

## Where the data lives

The core requirement list (name, difficulty, offered semesters) is fixed data I write once, so it lives as an array of objects in the JavaScript file. The student's semester setup, selected model, and completed-requirements list are state the user creates while the page is open, held in JavaScript variables, saved to `localStorage` so the generated plan survives a refresh.

## What each action changes

- **Mark a requirement as completed:** it's removed from the remaining-requirements list, and the plan recalculates without it.
- **Set remaining semesters / flag a semester as study-abroad or gap:** updates the list of semesters the remaining requirements get distributed across, and the plan recalculates.
- **Choose a scheduling model (A/B/C/D):** changes the difficulty-cap rule applied per semester, and the plan recalculates under the new caps.
- **Generate plan:** runs the scheduling logic against the current state and produces a semester-by-semester assignment, flagging any requirement that doesn't fit.
- **Reset:** clears all selections back to the empty state.

## Features

1. Mark off which core requirements are already completed.
2. Set remaining semesters, flagging study-abroad and/or gap semesters.
3. Choose among four scheduling models: spread evenly, protect specific semesters (study-abroad/final), ramp up, ramp down.
4. Get a generated semester-by-semester plan with a difficulty total per semester.
5. See a flag for any requirement that couldn't be fit into the remaining semesters as configured.

## What I do not know yet

How to avoid writing the same scheduling algorithm four times over for the four models. They're all the same core logic (assign requirements to semesters within a difficulty budget) with different caps, so there should be a way to write it once and just change the numbers that go in, but I don't yet know what that looks like in JavaScript.
