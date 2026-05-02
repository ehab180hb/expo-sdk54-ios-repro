#!/usr/bin/env bash
# explore.sh — drive the cloud-iOS sim like a human via Maestro
#
# Usage:
#   scripts/dev/explore.sh path/to/flow.yaml
#   scripts/dev/explore.sh -                   # read flow from stdin
#   echo "appId: io.example.expoSdk54Todo
#   ---
#   - launchApp" | scripts/dev/explore.sh -
#
# What you get:
#   _explorer-runs/<run_id>/
#     ├── input-flow.yaml      ← what you sent (for reproducibility)
#     ├── screenshot-*.png     ← per-step screenshots from Maestro
#     ├── commands-*.json      ← per-step UI hierarchy + command details
#     ├── maestro.log          ← full Maestro log
#     ├── report.xml           ← JUnit report
#     ├── screen.mov           ← full simctl screen recording
#     └── final-screenshot.png ← post-run state
#
# The first run after a native-config change must wait for ios-build-cached.yml
# to populate the .app cache (~18 min). Subsequent explore.sh calls are ~5 min.

set -euo pipefail

cd "$(dirname "$0")/../.."

if [ "$#" -ne 1 ]; then
  cat >&2 <<EOF
Usage: $0 <flow.yaml> | -
  flow.yaml   Path to a Maestro flow file
  -           Read flow from stdin

Example: $0 e2e/flows/add-todo.yaml
EOF
  exit 1
fi

if [ "$1" = "-" ]; then
  FLOW=$(cat)
else
  [ -f "$1" ] || { echo "::error::flow file not found: $1" >&2; exit 1; }
  FLOW=$(cat "$1")
fi

# Sanity-check the flow has the required header
if ! grep -q "^appId:" <<<"$FLOW"; then
  echo "::warning::Flow missing 'appId:' header — Maestro will likely fail" >&2
fi

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

echo "→ Triggering explorer.yml on $REPO..."
gh workflow run explorer.yml --field flow="$FLOW" --field record_video=true

# workflow_dispatch is async; wait for the run to register
sleep 6

# Find the most recent explorer run (it should be ours, since we just triggered)
RUN_ID=$(gh run list --workflow=explorer.yml --limit 1 --json databaseId,status \
  --jq '.[0] | select(.status != "completed") | .databaseId')

if [ -z "$RUN_ID" ]; then
  echo "::error::Couldn't find the run we just triggered. Check 'gh run list --workflow=explorer.yml'." >&2
  exit 1
fi

echo "→ Run ID: $RUN_ID"
echo "→ URL:    https://github.com/$REPO/actions/runs/$RUN_ID"
echo "→ Watching..."

if ! gh run watch "$RUN_ID" --exit-status; then
  # Workflow non-zero exit — that's expected when Maestro flow itself
  # fails (e.g. assertion didn't match). The artifact still has value.
  echo "::warning::Workflow exited non-zero — downloading artifacts anyway"
fi

ARTIFACT_DIR="./_explorer-runs/$RUN_ID"
mkdir -p "$ARTIFACT_DIR"
gh run download "$RUN_ID" --name "explorer-$RUN_ID" --dir "$ARTIFACT_DIR" 2>&1 \
  || { echo "::error::Failed to download artifacts" >&2; exit 1; }

echo ""
echo "✓ Artifacts in: $ARTIFACT_DIR"
echo ""
echo "Contents:"
ls -1 "$ARTIFACT_DIR" | head -30

# Surface the JUnit summary if present
if [ -f "$ARTIFACT_DIR/report.xml" ]; then
  echo ""
  echo "--- report.xml summary ---"
  grep -oE '(failures|errors|tests|time)="[^"]*"' "$ARTIFACT_DIR/report.xml" | head -10 || true
fi

# Open the final screenshot on Windows/Mac/Linux desktops
if [ -f "$ARTIFACT_DIR/final-screenshot.png" ]; then
  echo ""
  echo "→ Final screenshot: $ARTIFACT_DIR/final-screenshot.png"
fi
