#!/usr/bin/env bash
# dev.sh — open all the fast feedback loops at once.
#
# Spawns Jest watch + Expo Metro + a tail of the sim log in three
# parallel processes (using `tmux` if available, falling back to
# `&` + `wait`). Use this as your daily driver while developing.
#
# Layers running:
#   1. Jest watch — re-runs unit/component tests on every save (~1-3s)
#   3. Expo Metro — pushes JS hot reload to the running sim (~500ms)
#   ?. Sim log tail — surfaces RCTLog / NSLog output as it happens
#
# Usage: bash scripts/dev/dev.sh

set -euo pipefail

if command -v tmux >/dev/null 2>&1; then
  SESSION="expo-todo-dev"
  tmux kill-session -t "$SESSION" 2>/dev/null || true
  tmux new-session -d -s "$SESSION" -n editor "npm run test:watch"
  tmux split-window -h -t "$SESSION:editor" "npx expo start"
  tmux split-window -v -t "$SESSION:editor.1" "xcrun simctl spawn booted log stream --predicate 'process == \"exposdk54todo\"'"
  tmux select-pane -t "$SESSION:editor.0"
  tmux attach -t "$SESSION"
else
  echo "tmux not found; spawning in background. Ctrl+C will kill all."
  npm run test:watch &
  TEST_PID=$!
  npx expo start &
  METRO_PID=$!
  trap "kill $TEST_PID $METRO_PID 2>/dev/null || true" EXIT
  wait
fi
