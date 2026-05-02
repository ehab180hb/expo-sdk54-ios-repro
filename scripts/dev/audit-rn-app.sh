#!/usr/bin/env bash
# audit-rn-app.sh — score any RN/Expo project against the powerhouse model
#
# Plan 4 T4.5.E. The "doctor" command. Runs a battery of checks
# encoding the gaps from the original audit ("Verdict: is the Todo
# app a model?") and the deliverables that closed them (Plans 1-4).
#
# Each check is INDEPENDENT and prints its own ✓/✗/⚠. Final score
# is a percentage of ✓ over total checks. Exit 0 if score ≥ THRESHOLD
# (default 90), exit 1 otherwise.
#
# USAGE:
#   scripts/dev/audit-rn-app.sh                # default threshold 90
#   scripts/dev/audit-rn-app.sh --threshold 95
#   scripts/dev/audit-rn-app.sh --json         # machine-readable
#
# Designed to be DROPPED INTO ANY RN/Expo repo (Phase 5 powerhouse
# template will copy this script verbatim).

set -eo pipefail

cd "$(dirname "$0")/../.."

threshold=90
output=text
for arg in "$@"; do
  case "$arg" in
    --json) output=json ;;
    --threshold) shift; threshold=$1 ;;
    --threshold=*) threshold="${arg#*=}" ;;
    -h|--help) sed -n '2,/^$/p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
  esac
done

declare -a results
pass=0
fail=0
warn=0
check() {
  local name="$1"
  local status="$2"  # PASS / FAIL / WARN
  local detail="${3:-}"
  results+=("${status}|${name}|${detail}")
  case "$status" in
    PASS) pass=$((pass + 1)) ;;
    FAIL) fail=$((fail + 1)) ;;
    WARN) warn=$((warn + 1)) ;;
  esac
}

# 1. TypeScript strict flags
if [ -f tsconfig.json ]; then
  if grep -q '"strict":\s*true' tsconfig.json && \
     grep -q '"noUncheckedIndexedAccess":\s*true' tsconfig.json; then
    check "TS strict + noUncheckedIndexedAccess" PASS
  else
    check "TS strict + noUncheckedIndexedAccess" FAIL "tsconfig.json missing one of: strict, noUncheckedIndexedAccess"
  fi
else
  check "tsconfig.json present" FAIL "tsconfig.json missing"
fi

# 2. ESLint config
if [ -f eslint.config.js ] || [ -f .eslintrc.json ] || [ -f .eslintrc.js ]; then
  check "ESLint config" PASS
else
  check "ESLint config" FAIL "no eslint config found"
fi

# 3. Prettier config
if [ -f .prettierrc.json ] || [ -f .prettierrc ] || grep -q '"prettier"' package.json 2>/dev/null; then
  check "Prettier config" PASS
else
  check "Prettier config" WARN "no prettier config found"
fi

# 4. Lefthook config + installed hooks
if [ -f lefthook.yml ] && [ -f .git/hooks/pre-commit ] \
   && grep -q lefthook .git/hooks/pre-commit 2>/dev/null; then
  check "Lefthook installed" PASS
elif [ -f lefthook.yml ]; then
  check "Lefthook installed" WARN "lefthook.yml present but hooks not installed (run npx lefthook install)"
else
  check "Lefthook installed" FAIL "lefthook.yml missing"
fi

# 5. Lefthook gates: format, typecheck, tests, eslint, ci-masks, maestro-lint
for gate in format typecheck tests eslint ci-masks maestro-lint; do
  if [ -f lefthook.yml ] && grep -qE "^[[:space:]]*${gate}:" lefthook.yml; then
    check "Lefthook gate: ${gate}" PASS
  else
    check "Lefthook gate: ${gate}" FAIL "missing in lefthook.yml"
  fi
done

# 6. Lefthook pre-push gates: coverage, expo-doctor, actionlint, npm-audit
for gate in coverage expo-doctor actionlint npm-audit; do
  if [ -f lefthook.yml ] && grep -qE "^[[:space:]]*${gate}:" lefthook.yml; then
    check "Pre-push gate: ${gate}" PASS
  else
    check "Pre-push gate: ${gate}" FAIL "missing in lefthook.yml"
  fi
done

# 7. Coverage thresholds set + non-trivial
if [ -f jest.config.js ]; then
  thr=$(grep -oE 'lines:\s*[0-9]+' jest.config.js | head -1 | grep -oE '[0-9]+' || echo 0)
  if [ "${thr:-0}" -ge 80 ]; then
    check "Coverage threshold ≥80% (lines)" PASS "current: ${thr}"
  elif [ "${thr:-0}" -gt 0 ]; then
    check "Coverage threshold ≥80% (lines)" WARN "current: ${thr}; target 80"
  else
    check "Coverage threshold ≥80% (lines)" FAIL "no threshold detected"
  fi
fi

# 8. ErrorBoundary present in src/
if grep -rq "ErrorBoundary" src/ 2>/dev/null; then
  check "ErrorBoundary in src/" PASS
else
  check "ErrorBoundary in src/" FAIL "no ErrorBoundary found"
fi

# 9. Privacy manifest declared
if grep -q "privacyManifests" app.json 2>/dev/null \
   || [ -f ios/PrivacyInfo.xcprivacy ]; then
  check "iOS privacy manifest" PASS
else
  check "iOS privacy manifest" FAIL "neither app.json privacyManifests nor ios/PrivacyInfo.xcprivacy"
fi

# 10. Deep-link handler if scheme set
scheme=$(node -p "(require('./app.json').expo||{}).scheme || ''" 2>/dev/null || echo '')
if [ -n "$scheme" ] && [ "$scheme" != "undefined" ]; then
  if grep -rq "Linking" src/ App.tsx 2>/dev/null; then
    check "Deep-link handler (scheme=$scheme)" PASS
  else
    check "Deep-link handler (scheme=$scheme)" FAIL "scheme declared but no Linking.* import in src/ or App.tsx"
  fi
else
  check "Deep-link handler" PASS "no scheme declared (skip)"
fi

# 11. testID inventory script + lint scripts present
for s in inventory-testids.sh dump-hierarchy.sh lint-ci-masks.sh maestro-flow-lint.sh; do
  if [ -x "scripts/dev/${s}" ]; then
    check "scripts/dev/${s}" PASS
  else
    check "scripts/dev/${s}" FAIL "missing or not executable"
  fi
done

# 12. Cloud explorer wired
if [ -f .github/workflows/explorer.yml ]; then
  check "Cloud explorer workflow" PASS
else
  check "Cloud explorer workflow" FAIL ".github/workflows/explorer.yml missing"
fi

# 13. Cached iOS build workflow
if [ -f .github/workflows/ios-build-cached.yml ]; then
  check "Cached iOS build workflow" PASS
else
  check "Cached iOS build workflow" FAIL ".github/workflows/ios-build-cached.yml missing"
fi

# 14. JS-only fast path
if [ -f .github/workflows/js-only-fast.yml ]; then
  check "JS-only fast path workflow" PASS
else
  check "JS-only fast path workflow" FAIL ".github/workflows/js-only-fast.yml missing"
fi

# 15. Dependabot / Renovate config
if [ -f .github/dependabot.yml ] || [ -f renovate.json ]; then
  check "Dependency automation config" PASS
else
  check "Dependency automation config" FAIL "neither .github/dependabot.yml nor renovate.json"
fi

# 16. Post-mortem template
if [ -f docs/POST_MORTEMS/TEMPLATE.md ]; then
  check "Post-mortem template" PASS
else
  check "Post-mortem template" WARN "docs/POST_MORTEMS/TEMPLATE.md missing"
fi

# 17. Property-based tests
if find __tests__ -name '*.props.test.*' 2>/dev/null | grep -q .; then
  check "Property-based tests (fast-check)" PASS
else
  check "Property-based tests (fast-check)" WARN "no *.props.test.* files"
fi

# 18. Visual regression snapshots
if find __tests__/snapshots -name '*.test.*' 2>/dev/null | grep -q .; then
  check "Visual regression snapshots" PASS
else
  check "Visual regression snapshots" WARN "__tests__/snapshots/ missing or empty"
fi

# 19. Persistence contract test
if find __tests__ -name '*persistence-contract*' 2>/dev/null | grep -q .; then
  check "Persistence contract test" PASS
else
  check "Persistence contract test" WARN "no persistence-contract test found"
fi

# 20. testID inventory snapshot test
if find __tests__/inventory -name '*testid-snapshot*' 2>/dev/null | grep -q .; then
  check "testID inventory snapshot test" PASS
else
  check "testID inventory snapshot test" WARN "no testID inventory snapshot test"
fi

# Compute score
total=$((pass + fail + warn))
score=0
if [ "$total" -gt 0 ]; then
  score=$(( (pass * 100) / total ))
fi

# Render
if [ "$output" = "json" ]; then
  printf '{\n  "score": %d,\n  "pass": %d,\n  "fail": %d,\n  "warn": %d,\n  "total": %d,\n  "results": [\n' \
    "$score" "$pass" "$fail" "$warn" "$total"
  for i in "${!results[@]}"; do
    IFS='|' read -r status name detail <<< "${results[$i]}"
    sep=','
    [ "$i" = "$((${#results[@]} - 1))" ] && sep=''
    printf '    {"status": "%s", "name": "%s", "detail": "%s"}%s\n' "$status" "$name" "$detail" "$sep"
  done
  printf '  ]\n}\n'
else
  echo "Powerhouse audit — $(pwd | sed 's#.*/##')"
  echo
  for r in "${results[@]}"; do
    IFS='|' read -r status name detail <<< "$r"
    case "$status" in
      PASS) icon='✓' ;;
      FAIL) icon='✗' ;;
      WARN) icon='⚠' ;;
    esac
    if [ -n "$detail" ]; then
      printf '  %s %s — %s\n' "$icon" "$name" "$detail"
    else
      printf '  %s %s\n' "$icon" "$name"
    fi
  done
  echo
  printf "  Score: %d%%  (%d ✓ / %d ✗ / %d ⚠ of %d)\n" "$score" "$pass" "$fail" "$warn" "$total"
  printf "  Threshold: %d%%\n" "$threshold"
fi

if [ "$score" -ge "$threshold" ]; then
  exit 0
fi
exit 1
