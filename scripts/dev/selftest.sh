#!/usr/bin/env bash
# selftest.sh — runs the full local quality gate, fastest layer first.
# Bails on the first failure so you don't wait through expensive layers
# when a cheap one already failed.
#
# Order:
#   1. Prettier --check  (~1s)
#   2. TypeScript        (~3s)
#   3. Jest              (~3s)
#   4. Coverage          (~5s)
#
# To run E2E in addition, append:
#   bash scripts/dev/selftest.sh && maestro test e2e/flows/

set -euo pipefail

cd "$(dirname "$0")/../.."

echo "==> [1/4] format check"
npm run format:check

echo "==> [2/4] typecheck"
npm run typecheck

echo "==> [3/4] tests"
npm test -- --silent

echo "==> [4/4] coverage thresholds"
npm run test:coverage -- --silent

echo ""
echo "✓ all local checks passed in ${SECONDS}s"
