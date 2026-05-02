# Post-mortem: Cloud iOS Explorer + tour.yaml

> **Date**: 2026-05-02
> **Duration**: ~40 min wall-clock, 8 CI iterations, ~40 CI minutes (free, public repo)
> **Type**: tooling build + debug journey
> **Outcome**: green (run 25257731793) + 7 deliverables shipped

## Summary

Built a parameterized GHA workflow (`.github/workflows/explorer.yml`)
that drives the cloud iOS sim like a human via a Maestro flow input.
Then authored `e2e/flows/tour.yaml` to exercise the full TodoMVC
surface against that workflow. Took **8 explorer iterations** for
the tour to come back green. Each iteration ~5 min cloud round-trip.

~6 of the 8 iterations were knowable upfront if I'd inspected the
iOS accessibility tree before writing the first selector. The
remaining 2 were genuine "see the screen, learn what's there"
discoveries.

## Timeline

| #   | Run ID      | Failure mode                                                                    | Was it preventable?                                       |
| --- | ----------- | ------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | 25256238601 | `assertVisible: "Nothing to do"` — wrong copy (filter=all shows "No todos yet") | Yes — read EmptyState.tsx; copy varies by filter          |
| 2   | 25256407706 | `tapOn: "buy milk"` didn't toggle (Pressable in Swipeable)                      | Yes — testID inventory would flag "inside Swipeable"      |
| 3   | 25256670364 | `id + text` combined selector found 0 elements                                  | Yes — combined selectors require ONE element              |
| 4   | 25256911195 | Even `id` alone found nothing (`accessibilityRole="checkbox"`)                  | Yes — testID inventory would flag "checkbox absorbs id"   |
| 5   | 25257165436 | Maestro driver startup timeout                                                  | Maybe — `MAESTRO_DRIVER_STARTUP_TIMEOUT=180000`           |
| 6   | 25257379093 | Filter tabs occluded by keyboard left up after `inputText`                      | Yes — flow lint would flag inputText without hideKeyboard |
| 7   | 25257533431 | Tap on `<View>` (Header) didn't dismiss keyboard                                | Yes — testID inventory: "View+testID but no onPress"      |
| 8   | 25257731793 | ✓ green                                                                         | n/a                                                       |

## Root-cause clusters

### Cluster A — Blind authoring of selectors (5 of 7 hurdles)

Hurdles 1, 2, 3, 4, 7 all share a single underlying gap: I wrote
Maestro selectors without first inspecting:

- The actual JSX (would have shown filter-state-dependent copy)
- The wrapper context (Swipeable around the Pressable)
- The accessibility role on the Pressable (checkbox absorbs id)

A 30-second `inventory-testids.sh` run would have surfaced 4 of
these flags. A 5-minute `dump-hierarchy.sh` would have shown the
remaining one (Hurdle 7).

### Cluster B — Keyboard occlusion + dismissal (Hurdles 6, 7)

After `inputText`, the soft keyboard stays up unless explicitly
dismissed. iOS only dismisses on tap of a TOUCHABLE element. The
flow first tried tapping a `<View>` (no dismiss), then targeting
filter tabs (occluded by keyboard). Two iterations on the same
underlying issue.

A `maestro-flow-lint.sh` rule for "inputText without hideKeyboard
followed by bottom-of-screen tap" would have flagged this in
under 1 second at pre-commit.

### Cluster C — Driver flake (Hurdle 5)

GHA macos-15 sims occasionally take >60s for the XCTest driver to
come up. Pure environmental flake, but easily fixed with the
`MAESTRO_DRIVER_STARTUP_TIMEOUT=180000` env var. One-time fix once
known.

## Deliverables produced

| Deliverable                                               | Status  | Prevents cluster      |
| --------------------------------------------------------- | ------- | --------------------- |
| `.github/workflows/explorer.yml`                          | shipped | (the platform itself) |
| `scripts/dev/explore.sh`                                  | shipped | (the platform itself) |
| `docs/EXPLORER.md`                                        | shipped | docs                  |
| `~/.claude/skills/cloud-ios-explorer/SKILL.md`            | shipped | future authors        |
| `scripts/dev/inventory-testids.sh` (Plan 3 T1.A)          | shipped | A (4 of 5)            |
| `scripts/dev/dump-hierarchy.sh` (Plan 3 T1.B)             | shipped | A (1 of 5)            |
| `~/.claude/skills/maestro-rn-flow-author/SKILL.md` (T1.C) | shipped | A + B                 |
| `scripts/dev/lint-ci-masks.sh` (T1.D)                     | shipped | unrelated bonus       |
| `scripts/dev/maestro-flow-lint.sh` (Plan 3 T2.A)          | shipped | B                     |
| `~/.claude/skills/ci-masking-detector/` (T2.B)            | shipped | unrelated bonus       |
| `~/.claude/skills/claude-code-windows-quirks/` (T2.C)     | shipped | environmental         |
| `MAESTRO_DRIVER_STARTUP_TIMEOUT=180000` in explorer.yml   | shipped | C                     |

## Deliverables deferred

- **Cache `ios/` whole post-prebuild** (Plan 3 T2.D) — would fix
  the 12-min "warm" build by freezing mtimes for Xcode incremental.
  Risky because it invalidates the existing `pre-built-app-*` cache
  shape used by `js-only-fast.yml` and `explorer.yml`. Defer until
  Tier 1 + 2 deliverables have settled.
- **Persistent simulator session** for sub-minute Maestro
  iterations. Would require a self-hosted runner (no Mac in scope).
  Documented in `docs/ITERATION_LOOP.md` Layer 7.

## What I'd tell my past self

> Run `inventory-testids.sh` and `dump-hierarchy.sh` BEFORE writing
> the first selector. The 5-min cloud round-trip you save by
> "skipping the recon" costs 4× that in iterations. Also: every
> `inputText` step is followed by `hideKeyboard` unless you've
> proved otherwise.

## Cross-references

- `docs/ITERATION_LOOP.md` — Layer 0.5/0.6 lefthook gates that catch
  these patterns at commit/push time
- `docs/EXPLORER.md` — the Hurdles already paved table maps to the
  same run-IDs above
- `~/.claude/plans/atomic-honking-haven.md` — Plan 3 introspection
  that produced the deliverables list
- `~/.claude/skills/maestro-rn-flow-author/SKILL.md` — encodes
  cluster A + B fixes with the same run-IDs cited
