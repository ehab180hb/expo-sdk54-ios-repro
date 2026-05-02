# Post-mortem: <one-line title>

> **Date**: YYYY-MM-DD
> **Duration**: ~Xh wall-clock, N CI iterations, ~$Y CI minutes
> **Type**: feature build / debug journey / migration / outage
> **Outcome**: green / mostly-fixed / abandoned / new-tooling

A post-mortem here is a forcing function: each major debug journey
gets ~30 minutes of writing time so the next person (often
future-you) doesn't pay the same iterations again. Anything that
shows up here AND repeats in another journey is a candidate for a
permanent skill / script / workflow change.

Cross-link to `docs/ITERATION_LOOP.md` Layer 0 when the lessons
become encoded as gates.

## Summary

One paragraph: what was the work, how long did it take, what
fraction of that time would have been zero if the right tooling
existed. Keep it concrete (numbers, not "long").

## Timeline

| #   | Run ID | Failure mode              | Wall-clock | Was it preventable? |
| --- | ------ | ------------------------- | ---------- | ------------------- |
| 1   | XXXXXX | <single-line description> | Nm         | locally / no        |
| 2   | XXXXXX |                           |            |                     |
| 3   | XXXXXX |                           |            |                     |

Use real run-IDs (`gh run list --limit 20`) so anyone can pull the
artifact and see the screenshots / logs themselves.

## Root-cause clusters

Group the failures by underlying root cause, not by step that
failed. The point is to find which 1-2 systemic issues caused the
most iterations, NOT to enumerate every symptom.

### Cluster A — <name> (X failures)

Brief description. What was the underlying gap (knowledge,
tooling, gate, signal)?

### Cluster B — <name> (Y failures)

...

## Deliverables produced

What did the journey ship that prevents the recurrence?

| Deliverable                 | Status  | Prevents which cluster |
| --------------------------- | ------- | ---------------------- |
| `<file path or skill name>` | shipped | A                      |
| `<file path>`               | drafted | B                      |

## Deliverables deferred

Things you noticed but didn't do. Forces an honest record of what's
not yet fixed:

- **<thing>**: why deferred (out of scope / risky / blocked on X).
  Track in next plan.

## What I'd tell my past self

One or two sentences. The thing past-you would have wanted to know
on iteration 1. This is the most useful section to grep when
starting a similar journey — it's the cliff-notes of the lesson.

## Cross-references

- `docs/ITERATION_LOOP.md` (any new layers added)
- `~/.claude/skills/<skill>/SKILL.md` (any new skills produced)
- `~/.claude/plans/<plan>.md` (the plan that drove this work)
- Related post-mortems (cite by file)
