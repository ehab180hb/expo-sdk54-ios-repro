# Explorer — drive the cloud-iOS sim like a human

You don't have a Mac. You have GitHub Actions. You want to walk through
the app — type something in a field, see what happens, swipe a row, see
the result. Like `maestro studio` would let you do, except remote.

This doc describes the loop. It's wired in `.github/workflows/explorer.yml`
and `scripts/dev/explore.sh`.

## The loop

```
┌──────────────────────────────────────────────────────────┐
│ 1. write a Maestro flow describing the next move(s)      │
│ 2. trigger explorer.yml with that flow                   │
│ 3. wait ~5 min                                           │
│ 4. download the artifact                                 │
│ 5. read the screenshots / hierarchy — see what happened  │
│ 6. write the next flow; repeat                           │
└──────────────────────────────────────────────────────────┘
```

Each iteration costs ~5 min wall-clock and $0 (free public-repo macOS
minutes). The cached `.app` is reused — no `xcodebuild` runs.

## TL;DR — one command

```bash
echo 'appId: io.example.expoSdk54Todo
---
- launchApp
- tapOn:
    id: "add-todo-input"
- inputText: "hello explorer"
- tapOn:
    id: "add-todo-submit"' | scripts/dev/explore.sh -
```

When it returns, look in `_explorer-runs/<run_id>/` for screenshots,
video, hierarchy, and logs.

## What's in the artifact bundle

| File                   | Purpose                                              |
| ---------------------- | ---------------------------------------------------- |
| `input-flow.yaml`      | Exactly what you sent — for reproducibility          |
| `screenshot-*.png`     | One per Maestro step (numbered)                      |
| `commands-*.json`      | Per-step UI hierarchy + command details              |
| `maestro.log`          | Full Maestro log (timing, retries, errors)           |
| `report.xml`           | JUnit-format pass/fail report                        |
| `screen.mov`           | Full simctl screen recording (h.264)                 |
| `final-screenshot.png` | Post-run state (useful when the flow failed partway) |

The `commands-*.json` is the gold — it has the entire UI tree as
Maestro saw it. AI agents can parse it to decide the next move
without guessing pixel coordinates.

## How it works under the hood

1. The cached `.app` (seeded by `ios-build-cached.yml`) is restored
   keyed on NATIVE config only — `package-lock.json + app.json + babel.config.js`
2. Current JS is bundled via `expo export:embed` (~20s)
3. The new `main.jsbundle` is dropped into the cached `.app`
4. The `.app` is re-codesigned (`codesign --force --sign - --deep`)
5. iPhone simulator boots; app installs
6. Background `simctl io recordVideo` starts capturing the screen
7. Maestro runs the flow with `--test-output-dir` + `--debug-output`
   pointing at the same directory (consolidates all artifacts)
8. Recording is stopped with SIGINT (so the .mov finalizes properly)
9. A final screenshot is captured (helpful for partial-failure
   debugging — failed assertions can leave the screen in a useful state)
10. Everything in `artifacts/` is uploaded as `explorer-<run_id>`

The whole step takes ~5 min on a warm cache: ~30s sim boot + ~20s
bundle + ~10s install + 1-3 min for the flow itself.

## When you can't use this

- **No cached `.app`**: the workflow fails fast. Run `ios-build-cached.yml`
  first (or push a commit that triggers it) to seed the cache.
- **Native config changed**: editing `app.json`, `package-lock.json`, or
  `babel.config.js` invalidates the `.app` cache. Same fix — run the
  full build first.
- **You need real-time interaction**: this is artifact-based. For true
  interactive control, use a service like Browserstack/Sauce Labs. This
  workflow trades latency for free.

## Authoring tips

### Use testIDs you already have

The Todo app exposes:

| testID             | What                            |
| ------------------ | ------------------------------- |
| `empty-state`      | The "Nothing to do" placeholder |
| `add-todo-input`   | The text input                  |
| `add-todo-submit`  | The "Add" button                |
| `todo-list`        | The FlatList container          |
| `todo-text-{id}`   | Individual todo row text        |
| `filter-all`       | "All" filter tab                |
| `filter-active`    | "Active" filter tab             |
| `filter-completed` | "Completed" filter tab          |
| `clear-completed`  | "Clear completed" footer button |

`grep -r 'testID' src/components/` to find more.

### Read the hierarchy when stuck

If `tapOn: "Add"` doesn't find the element, look at the most recent
`commands-*.json`. It has the full UI tree, including text, accessibility
labels, and bounds. You'll see exactly what Maestro sees.

### Don't rely on coordinates

Maestro can `tapOn:` with `point: 100, 200`, but the cached sim runs at
3x scale and screen sizes vary. Always prefer `id:` or `text:`.

### Failure is informative

A failed flow still uploads the artifact. The screenshot at the failure
step often reveals the issue (e.g. a modal you didn't expect, an
animation mid-transition, text that's slightly different from what you
asserted).

## What the AI loop looks like

Here's the actual pattern an autonomous agent would run:

```
loop:
  flow = generate_next_maestro_steps(based_on=last_screenshots)
  artifact_dir = explore.sh - <<< $flow
  screenshots = artifact_dir/screenshot-*.png
  hierarchies = artifact_dir/commands-*.json

  if all_assertions_passed and goal_reached:
    return success(artifact_dir)
  if maestro_log_shows_unrecoverable_error:
    return failure(artifact_dir)

  # Otherwise: agent reads the screenshots + hierarchy, decides what
  # to try next, generates a new flow. Each iteration paves a bit
  # more of the path.
```

This is exploratory testing without humans — the agent discovers the
app's behavior by interacting with it, not by reading docs.

## See also

- [`ITERATION_LOOP.md`](ITERATION_LOOP.md) — the 8-layer iteration toolkit
- [`.github/workflows/explorer.yml`](../.github/workflows/explorer.yml) — the workflow
- [`scripts/dev/explore.sh`](../scripts/dev/explore.sh) — the wrapper script
- Maestro docs: https://docs.maestro.dev/
