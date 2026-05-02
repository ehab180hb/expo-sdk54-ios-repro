#!/usr/bin/env bash
# maestro-flow-lint.sh — flag known anti-patterns in Maestro flows
#
# WHY THIS EXISTS:
# Building tour.yaml took 8 explorer iterations. Three of those would
# have been caught by static lint of the YAML itself (no sim required):
#  - id+text combined selector (run 25256670364)
#  - inputText not followed by hideKeyboard (run 25257379093)
#  - dynamic ${output.X} reference without runFlow defining X
#
# Wired into lefthook pre-commit on glob `e2e/flows/*.yaml`.
#
# USAGE:
#   scripts/dev/maestro-flow-lint.sh                       # lint all flows
#   scripts/dev/maestro-flow-lint.sh e2e/flows/foo.yaml    # specific
#
# Exit codes: 0 — clean (or only warnings), 1 — error-level finding.
#
# IMPLEMENTATION: single awk pass per file. Maestro YAML is line-
# oriented enough that we don't need a full YAML parser for these
# specific checks.

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
  mapfile -t files < <(find e2e/flows -type f \( -name '*.yml' -o -name '*.yaml' \) 2>/dev/null)
fi

if [ "${#files[@]}" -eq 0 ]; then
  echo "::warning::no Maestro flow files to lint" >&2
  exit 0
fi

# Awk script. Maestro selectors look like:
#   - tapOn:
#       id: 'foo-'
#       text: 'bar'
# We track:
#   - whether we're inside a tapOn / assertVisible / scrollUntilVisible
#     block (selector context starts after `- tapOn:` indented map)
#   - whether `id:` and `text:` both appeared in the same selector
#   - whether the previous executed step was `inputText` and the next
#     was a non-hideKeyboard tap on something likely to be occluded
awk_script='
function err(msg,    f, l) {
  printf "::error file=%s,line=%d::%s\n", FILENAME, FNR, msg
  printf "    > %s\n", $0
  errors++
}
function warn(msg) {
  printf "::warning file=%s,line=%d::%s\n", FILENAME, FNR, msg
  printf "    > %s\n", $0
  warnings++
}

# State machine to track selector context
function reset_selector() {
  in_selector = 0
  selector_indent = -1
  has_id = 0
  has_text = 0
  selector_start_line = 0
}

BEGIN { reset_selector() }

{
  # Per-file state reset
  if (FNR == 1) {
    last_step = ""
    reset_selector()
  }

  # Compute leading whitespace
  match($0, /^[[:space:]]*/)
  cur_indent = RLENGTH

  # Strip leading whitespace for inspection
  trimmed = $0
  sub(/^[[:space:]]+/, "", trimmed)

  # Skip blank/comment lines but preserve state
  if (trimmed ~ /^$/ || trimmed ~ /^#/) next

  # Did we leave the selector context? (dedent or new step starts)
  if (in_selector && cur_indent <= selector_indent) {
    if (has_id && has_text) {
      # Print the warning at the selector start line — re-emit a
      # synthesized error
      printf "::error file=%s,line=%d::combined `id` + `text` selectors require ONE element matching BOTH. testID often lives on a parent <Pressable> while the visible text lives on a child <Text> — they do NOT collapse.\n", FILENAME, selector_start_line
      printf "    > (selector starting at line %d)\n", selector_start_line
      errors++
    }
    reset_selector()
  }

  # Detect start of a tapOn/assertVisible/scrollUntilVisible block
  # with a NESTED selector (multi-line form).
  if (trimmed ~ /^- (tapOn|assertVisible|assertNotVisible|scrollUntilVisible|extendedWaitUntil|tapOnElement):[[:space:]]*$/) {
    reset_selector()
    in_selector = 1
    selector_indent = cur_indent
    selector_start_line = FNR
    last_step = trimmed
    next
  }

  # Inline single-criteria tapOn (e.g. `- tapOn: "buy milk"`) — capture
  # but no need to track id+text duo.
  if (trimmed ~ /^- (tapOn|assertVisible|assertNotVisible):[[:space:]]/) {
    last_step = trimmed
    reset_selector()
    next
  }

  # Selector body: track id / text presence
  if (in_selector && cur_indent > selector_indent) {
    if (trimmed ~ /^id:/) has_id = 1
    if (trimmed ~ /^text:/) has_text = 1
  }

  # Detect inputText
  if (trimmed ~ /^- inputText:/) {
    last_step = "inputText"
    pending_inputText = 1
    inputText_line = FNR
    next
  }

  # Detect explicit keyboard-dismissal commands
  if (trimmed ~ /^- hideKeyboard/ || trimmed ~ /^- pressKey:[[:space:]]*Back/) {
    pending_inputText = 0
    last_step = trimmed
    next
  }

  # Any new `- foo:` step that ISNT hideKeyboard, after an inputText
  # without an intervening keyboard-dismiss, is a potential occlusion
  # warning. We only warn for taps targeting bottom-of-screen elements
  # by id-pattern (filter-, clear-, tab-, footer-) — generic taps are
  # too noisy.
  if (pending_inputText && trimmed ~ /^- (tapOn|assertVisible)/) {
    # Is this referencing a known occlusion-risk testID?
    if ($0 ~ /(filter-|clear-completed|footer-|tab-bar|bottom-)/) {
      printf "::warning file=%s,line=%d::potential keyboard occlusion: previous step (line %d) was `inputText` and this step targets a bottom-of-screen element (`filter-`, `clear-`, etc.). Insert `- hideKeyboard` between them.\n", FILENAME, FNR, inputText_line
      printf "    > %s\n", $0
      warnings++
      pending_inputText = 0
    }
  }

  # Detect ${output.X} references — Maestro template literals
  if (trimmed ~ /\$\{output\.[A-Za-z]/) {
    # Was there a prior `runFlow` defining outputs? Cheap check: did
    # we see `runFlow:` in any previous line of this file?
    if (!seen_runFlow) {
      printf "::error file=%s,line=%d::`${output.*}` reference but no `- runFlow` step seen earlier in this flow — Maestro will fail to expand.\n", FILENAME, FNR
      printf "    > %s\n", $0
      errors++
    }
  }

  if (trimmed ~ /^- runFlow:/) {
    seen_runFlow = 1
  }
}

END {
  exit (errors > 0) ? 1 : 0
}
'

if ! awk "$awk_script" "${files[@]}"; then
  echo
  echo "::error::Maestro flow lint failed — see findings above."
  echo "    Reference: ~/.claude/skills/maestro-rn-flow-author/SKILL.md"
  exit 1
fi

echo "✓ Maestro flows clean (${#files[@]} scanned)"
exit 0
