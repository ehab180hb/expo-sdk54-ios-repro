# scripts/dev — fast-iteration helpers

Companion scripts for the iteration loop documented in
[`docs/ITERATION_LOOP.md`](../../docs/ITERATION_LOOP.md).

| Script | What it does | Cycle time |
|---|---|---|
| `dev.sh` | Spawn Jest watch + Metro + sim log tail in tmux panes | continuous |
| `swap-jsbundle.sh` | Bundle JS only, inject into existing .app, re-install on sim | ~60s |
| `selftest.sh` | Run all local quality gates (format/types/tests/coverage), bail on first fail | ~12s |

## Usage examples

```bash
# Daily driver: open three terminals' worth of fast feedback in one tmux
bash scripts/dev/dev.sh

# After a JS-only change, re-test on sim without rebuilding the .app
bash scripts/dev/swap-jsbundle.sh

# Pre-commit gate
bash scripts/dev/selftest.sh
```

## Why these aren't `package.json` scripts

`package.json` scripts are good for things callers can pipe through
`npm run` (CI workflows, npm-script docs). These are interactive,
multi-process, or invoke `xcrun` — they belong in a `scripts/` dir
where they can use full bash without npm-script string-quoting.

## Adding a new helper

1. Drop a new `scripts/dev/<name>.sh` with `#!/usr/bin/env bash` + `set -euo pipefail`
2. Add a row to the table above
3. Document the cycle time it targets and the layer (from
   `docs/ITERATION_LOOP.md`) it serves
