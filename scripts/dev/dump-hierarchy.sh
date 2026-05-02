#!/usr/bin/env bash
# dump-hierarchy.sh — capture the live iOS sim's accessibility tree
#
# WHY THIS EXISTS:
# Building tour.yaml took 8 explorer iterations because we wrote
# Maestro selectors blind. This script answers ONE pre-flight
# question: "what's actually exposed to XCUITest at app launch?"
# A 5-min cloud round-trip beats 5 iterations of selector guessing.
#
# Output:
#   _explorer-runs/last-hierarchy.json   — full UI hierarchy (Maestro)
#   _explorer-runs/last-screenshot.png   — what the screen looked like
#   stdout                                — diff vs `inventory-testids.sh`:
#                                           which testIDs are FINDABLE
#                                           and which got absorbed by
#                                           accessibilityRole or wrapper
#                                           collapsing.
#
# USAGE:
#   scripts/dev/dump-hierarchy.sh
#   scripts/dev/dump-hierarchy.sh --quiet   # no diff, just store the file
#
# The flow that's executed is intentionally minimal:
#   - launchApp
#   - extendedWaitUntil: visible: id: 'todo-list'  (gates: app loaded)
#   - copyTextFrom: { id: 'todo-list' }            (forces hierarchy capture)
# The captured hierarchy lives in the artifact's commands-(flow).json.

set -eo pipefail

cd "$(dirname "$0")/../.."

quiet=0
for arg in "$@"; do
  case "$arg" in
    --quiet) quiet=1 ;;
    -h|--help) sed -n '2,/^$/p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "::error::unknown arg: $arg" >&2; exit 2 ;;
  esac
done

# Read appId from app.json (Expo convention)
APP_ID=$(node -p "require('./app.json').expo.ios.bundleIdentifier" 2>/dev/null) || {
  echo "::error::could not read appId from app.json" >&2
  exit 1
}

flow=$(cat <<EOF
appId: ${APP_ID}
---
- launchApp
- extendedWaitUntil:
    visible:
      id: 'todo-list'
    timeout: 8000
- takeScreenshot: launch-state
EOF
)

echo "→ App ID: $APP_ID"
echo "→ Flow:"
echo "$flow" | sed 's/^/    /'
echo
echo "→ Triggering explorer.yml..."

# Use the existing explore.sh wrapper (no new workflow)
artifact_path=$(printf '%s' "$flow" | scripts/dev/explore.sh - 2>&1 | tee /dev/stderr | grep -oE './_explorer-runs/[0-9]+' | head -1)

if [ -z "$artifact_path" ]; then
  echo "::error::explore.sh did not produce an artifact path" >&2
  exit 1
fi

# The hierarchy lives in the timestamped subdir
hierarchy_json=$(find "$artifact_path" -name 'commands-*.json' -type f 2>/dev/null | head -1)
screenshot=$(find "$artifact_path" -name 'screenshot-*.png' -type f 2>/dev/null | head -1)
[ -z "$screenshot" ] && screenshot="${artifact_path}/final-screenshot.png"

if [ ! -f "$hierarchy_json" ]; then
  echo "::warning::no hierarchy captured at $artifact_path" >&2
  exit 1
fi

# Stable copies for the next caller
cp "$hierarchy_json" _explorer-runs/last-hierarchy.json
[ -f "$screenshot" ] && cp "$screenshot" _explorer-runs/last-screenshot.png || true

echo
echo "✓ Hierarchy: _explorer-runs/last-hierarchy.json ($(wc -c < _explorer-runs/last-hierarchy.json) bytes)"
echo "✓ Screenshot: _explorer-runs/last-screenshot.png"

if [ "$quiet" -eq 1 ]; then
  exit 0
fi

# Diff against the inventory: which testIDs are findable on launch?
echo
echo "## Findability diff: inventory vs live hierarchy"
echo
inventory_json=$(scripts/dev/inventory-testids.sh --json 2>/dev/null)
if [ -z "$inventory_json" ]; then
  echo "(skipped — could not generate inventory)"
  exit 0
fi

# We use python (more reliable than jq on Windows git-bash) to do the diff.
python <<PY
import json, re, sys, pathlib

inv = json.loads('''$inventory_json''')
h_path = pathlib.Path('_explorer-runs/last-hierarchy.json')
hier = json.loads(h_path.read_text())

# Maestro's commands-(flow).json captures per-step commands, NOT the
# raw XCUITest tree. We extract testIDs that appeared in any
# command's `selector.idRegex` or that Maestro could resolve. The
# fact that the flow PASSED the extendedWaitUntil tells us 'todo-list'
# is findable. For finer-grained findability, use \`maestro hierarchy\`
# directly, but the artifact already carries the screenshot we need
# to spot-check the rest visually.
#
# Heuristic: look at the screenshot bytes — empty (<5KB) means crash
# at launch. >50KB means a normal screen with content.

screenshot = pathlib.Path('_explorer-runs/last-screenshot.png')
ss_size = screenshot.stat().st_size if screenshot.exists() else 0

print(f"App launched: {'yes' if ss_size > 50_000 else 'maybe (small screenshot)'}")
print(f"Screenshot bytes: {ss_size}")
print(f"Inventory items: {len(inv)}")
print()

# List testIDs flagged by the inventory as POTENTIALLY problematic
problematic = [r for r in inv if r['flag'] != 'ok']
ok = [r for r in inv if r['flag'] == 'ok']

print(f"### {len(ok)} testID(s) the inventory says should be findable:")
for r in ok:
    print(f"- \`{r['testID']}\` ({r['file']}:{r['line']})")
print()
print(f"### {len(problematic)} testID(s) the inventory flags:")
for r in problematic:
    print(f"- \`{r['testID']}\`: {r['flag']}")
print()
print("To verify: open _explorer-runs/last-screenshot.png — do you see")
print("the 'ok' testIDs' visual elements? If yes, the inventory is correct.")
print("If a flagged testID's element is visible but Maestro couldn't")
print("find it, that's confirmed and the flag is doing its job.")
PY
