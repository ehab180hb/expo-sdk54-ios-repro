#!/usr/bin/env bash
# selftest = run the same gates as the pre-push git hook.
#
# Single source of truth: lefthook.yml. This script is a thin wrapper
# so `bash scripts/dev/selftest.sh` and `git push` exercise identical
# checks (no drift between local script and what blocks pushes).
#
# Stages (defined in lefthook.yml under pre-push):
#   1. coverage (npm run test:coverage)
#   2. expo-doctor (assets + version-matrix validation)
#   3. actionlint (workflow YAML lint)
#
# Exits non-zero on the first failure.

set -euo pipefail
cd "$(dirname "$0")/../.."
exec npx lefthook run pre-push
