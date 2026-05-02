#!/usr/bin/env bash
# watch.sh — sub-second feedback for typecheck/lint/test on save
#
# Plan 4 T4.4.A. Wraps `watchexec` (Go binary, fast file watcher;
# the Windows-friendly choice over chokidar/nodemon — the agent's
# bash on Windows takes ~2s per node startup, defeating the point).
#
# Watches src/ + __tests__/ and on every change, runs the lefthook
# pre-commit gates against ONLY the changed file (or its related
# tests). Total round-trip: <1s on a small diff.
#
# USAGE:
#   scripts/dev/watch.sh              # all gates
#   scripts/dev/watch.sh tsc          # typecheck only
#   scripts/dev/watch.sh test         # related-tests only
#   scripts/dev/watch.sh lint         # eslint only
#
# REQUIRES: watchexec — install via `cargo install watchexec-cli`
# OR `npm install -g @watchexec/cli` OR fall back to `npx watchexec`.

set -eo pipefail

cd "$(dirname "$0")/../.."

if ! command -v watchexec >/dev/null 2>&1; then
  cat >&2 <<EOF
::error::watchexec not installed.

Install one of:
  cargo install watchexec-cli            (fastest, native binary)
  brew install watchexec                  (macOS)
  npm install -g @watchexec/cli           (cross-platform, slower)

Falling back to a polling loop is NOT recommended on Windows
git-bash — fork cost is ~2s per cycle, defeating the purpose.
EOF
  exit 1
fi

mode="${1:-all}"

case "$mode" in
  tsc|typecheck)
    cmd='npx tsc --noEmit --incremental'
    ;;
  test|tests)
    cmd='npx jest --findRelatedTests --bail --passWithNoTests $WATCHEXEC_WRITTEN_PATH'
    ;;
  lint|eslint)
    cmd='npx eslint --cache --cache-location node_modules/.cache/eslint/ $WATCHEXEC_WRITTEN_PATH'
    ;;
  all)
    cmd='npx prettier --write $WATCHEXEC_WRITTEN_PATH && npx tsc --noEmit --incremental && npx eslint --cache --cache-location node_modules/.cache/eslint/ $WATCHEXEC_WRITTEN_PATH && npx jest --findRelatedTests --bail --passWithNoTests $WATCHEXEC_WRITTEN_PATH'
    ;;
  -h|--help)
    sed -n '2,/^$/p' "$0" | sed 's/^# \{0,1\}//'
    exit 0
    ;;
  *)
    echo "::error::unknown mode: $mode (use tsc / test / lint / all)" >&2
    exit 2
    ;;
esac

echo "→ watch mode: $mode"
echo "→ watching: src/ __tests__/ App.tsx index.ts"
echo "→ on change: $cmd"
echo

watchexec \
  --no-process-group \
  --watch src \
  --watch __tests__ \
  --watch App.tsx \
  --watch index.ts \
  --exts ts,tsx \
  --ignore '**/__snapshots__/**' \
  --ignore '**/.cache/**' \
  -- bash -c "$cmd"
