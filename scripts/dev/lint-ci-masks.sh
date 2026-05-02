#!/usr/bin/env bash
# lint-ci-masks.sh — flag CI masking anti-patterns in workflow YAML
#
# WHY THIS EXISTS:
# We caught the masking anti-pattern TWICE in this repo:
#  - xcodebuild via `tee | grep ... || true` (PIPESTATUS reset)
#  - maestro-e2e via `maestro test ... || true` (3 of 4 flows failing
#    silently while the workflow reported green)
# The pattern is recognisable. This linter catches the third instance
# at pre-push time, before it ships.
#
# USAGE:
#   scripts/dev/lint-ci-masks.sh                                    # lint all
#   scripts/dev/lint-ci-masks.sh .github/workflows/foo.yml          # specific
#
# To opt-out a single line, add `# advisory:` comment on the same
# line or the line above.
#
# Exit codes: 0 — clean (or only allowlisted matches), 1 — masking found.
#
# IMPLEMENTATION NOTE: this script uses awk for a single pass per file
# rather than per-line subshells. On Windows git-bash the subshell
# pattern was 50× slower (49s vs <1s on the same input). Awk handles
# the entire flow in a single process per file.

set -eo pipefail

cd "$(dirname "$0")/../.."

case "${1:-}" in
  -h|--help)
    sed -n '2,/^$/p' "$0" | sed 's/^# \{0,1\}//'
    exit 0 ;;
esac

if [ "$#" -gt 0 ]; then
  files=("$@")
else
  mapfile -t files < <(find .github/workflows -type f \( -name '*.yml' -o -name '*.yaml' \) 2>/dev/null)
fi

if [ "${#files[@]}" -eq 0 ]; then
  echo "::warning::no workflow files to lint" >&2
  exit 0
fi

# Awk script. State: track previous line for "advisory:" pre-comment;
# skip pure-comment lines; emit "::error file=...,line=...::msg" for
# any unallowlisted match.
awk_script='
function is_allowlisted(s,    pat) {
  # Pure cleanups (failure-tolerant by design)
  if (s ~ /(^|[^A-Za-z])(mkdir|rm |rm -|pkill|kill -|kill \$|wait |wait "\$|restore --staged)[^|]*\|\|[[:space:]]*true/) return 1
  # Sim helpers
  if (s ~ /simctl boot[^|]*\|\|[[:space:]]*true/) return 1
  if (s ~ /simctl[[:space:]]+(io[^|]*screenshot|list)[^|]*\|\|[[:space:]]*true/) return 1
  # File ops
  if (s ~ /(^|[^A-Za-z])(cp|cp -r)[^|]*\|\|[[:space:]]*true/) return 1
  # Verification (already enforced above)
  if (s ~ /codesign --verify[^|]*\|\|[[:space:]]*true/) return 1
  # Pure display commands (RC is intentionally ignored)
  if (s ~ /(^|[^A-Za-z])(--version|--help|wc|ls -|cat |echo )[^|]*\|\|[[:space:]]*true/) return 1
  # `... | tail -N || true` and `... | head ... || true` are display
  if (s ~ /\|[[:space:]]*(tail|head)[[:space:]]+-?[A-Za-z0-9]*[[:space:]]*\|\|[[:space:]]*true/) return 1
  return 0
}

{
  # Strip leading whitespace for inspection
  stripped = $0
  sub(/^[[:space:]]+/, "", stripped)

  # Skip pure-comment lines
  if (stripped ~ /^#/) { prev = $0; next }

  # advisory: same-line or previous-line directive
  is_adv = ($0 ~ /# advisory:/ || prev ~ /# advisory:/)

  # Pattern 1: literal `|| true` on a non-cleanup command
  if ($0 ~ /\|\|[[:space:]]*true/ && !is_adv && !is_allowlisted($0)) {
    printf "::error file=%s,line=%d::masking %c%s%c on non-cleanup command. Capture RC explicitly. Add %c# advisory:%c to bypass.\n", FILENAME, FNR, 39, "|| true", 39, 39, 39
    printf "    > %s\n", $0
    violations++
  }

  # Pattern 2: tee ... | grep ... || true (PIPESTATUS reset)
  if ($0 ~ /tee[[:space:]].*\|.*grep.*\|\|[[:space:]]*true/ && !is_adv) {
    printf "::error file=%s,line=%d::tee | grep ... || true resets PIPESTATUS — pipefail signal lost. Use two-step: %ctee LOG%c then separate %cgrep ... LOG || true%c.\n", FILENAME, FNR, 39, 39, 39, 39
    printf "    > %s\n", $0
    violations++
  }

  # Pattern 3: explicit test/build commands followed by || true
  # (anchored to a space so xcodebuild.log filename does not trigger)
  if ($0 ~ /(^|[[:space:];&|])(maestro test |jest |xcodebuild |gradle |npm test|pytest |cargo test|go test).*\|\|[[:space:]]*true/ && !is_adv) {
    printf "::error file=%s,line=%d::test/build command masked with %c|| true%c. Capture exit code, surface artifacts, then fail.\n", FILENAME, FNR, 39, 39
    printf "    > %s\n", $0
    violations++
  }

  prev = $0
}

END {
  exit (violations > 0) ? 1 : 0
}
'

# One awk invocation across ALL files. `FNR` resets per file and
# `FILENAME` updates, so error messages still reference the correct
# file:line. This is critical on Windows git-bash where each fork
# is ~2s of overhead — one awk vs. six is the difference between
# 1s and 12s.
if ! awk "$awk_script" "${files[@]}"; then
  echo
  echo "::error::masking violation(s) found across ${#files[@]} workflow file(s)."
  echo "    Reference: docs/EXPLORER.md (the 'Hurdles already paved' table)."
  echo "    To allowlist: add '# advisory:' on the same line or the line above."
  exit 1
fi

echo "✓ workflow files clean of masking patterns (${#files[@]} scanned)"
exit 0
