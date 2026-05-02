#!/usr/bin/env bash
# bundle-composition.sh — Plan 4 T4.3.C
#
# Bundles the JS via `expo export:embed` and prints the top-N
# modules contributing to size. The output is what bundle-size.yml
# posts as a PR comment.
#
# USAGE:
#   scripts/dev/bundle-composition.sh                    # human output
#   scripts/dev/bundle-composition.sh --json             # machine-readable
#   scripts/dev/bundle-composition.sh --top 30           # top N (default 20)
#   scripts/dev/bundle-composition.sh --baseline a.bundle  # diff vs a.bundle
#
# Output:
#   - Total bundle size (bytes + human-readable)
#   - Top-N modules by approximate size (parsed from bundle source-map
#     when available; falls back to grep-based source attribution)
#   - Optional delta vs. a baseline bundle file

set -eo pipefail

cd "$(dirname "$0")/../.."

format=text
top=20
baseline=""
for arg in "$@"; do
  case "$arg" in
    --json) format=json ;;
    --top=*) top="${arg#*=}" ;;
    --baseline=*) baseline="${arg#*=}" ;;
    -h|--help) sed -n '2,/^$/p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
  esac
done

OUTDIR="${BUNDLE_OUT_DIR:-bundle-out}"
mkdir -p "$OUTDIR/assets"

# Skip rebuild if the bundle already exists and is newer than every
# source file under src/. Otherwise build fresh.
need_rebuild=true
if [ -f "$OUTDIR/main.jsbundle" ]; then
  newest_src=$(find src App.tsx index.ts -type f \( -name '*.ts' -o -name '*.tsx' \) -newer "$OUTDIR/main.jsbundle" 2>/dev/null | head -1)
  if [ -z "$newest_src" ]; then
    need_rebuild=false
  fi
fi

if [ "$need_rebuild" = "true" ]; then
  echo "→ bundling JS via expo export:embed..." >&2
  npx expo export:embed \
    --entry-file index.ts \
    --platform ios \
    --dev false \
    --reset-cache \
    --bundle-output "$OUTDIR/main.jsbundle" \
    --assets-dest "$OUTDIR/assets" \
    --sourcemap-output "$OUTDIR/main.jsbundle.map" \
    --config-cmd "$(which node) $(npm root)/react-native/cli.js config" \
    >&2 2>&1
fi

BYTES=$(stat -c%s "$OUTDIR/main.jsbundle" 2>/dev/null || stat -f%z "$OUTDIR/main.jsbundle")
HUMAN=$(numfmt --to=iec-i --suffix=B "$BYTES" 2>/dev/null || echo "${BYTES}B")

# Approximate per-module size via the source-map. Parse the .map
# file's `sources` array and `sourcesContent` lengths.
TOP_MODULES=$(python <<PY
import json, os, sys
mp = "$OUTDIR/main.jsbundle.map"
if not os.path.exists(mp):
    print("(source map not generated — top modules unavailable)")
    sys.exit(0)
m = json.load(open(mp))
sources = m.get('sources') or []
contents = m.get('sourcesContent') or []
sizes = []
for i, src in enumerate(sources):
    if i < len(contents) and contents[i]:
        sizes.append((len(contents[i]), src))
sizes.sort(reverse=True)
top_n = $top
print(f"Top {min(top_n, len(sizes))} modules by source size (approximate):")
for size, src in sizes[:top_n]:
    # Trim node_modules/foo/bar to just foo for readability
    short = src
    if 'node_modules/' in short:
        parts = short.split('node_modules/', 1)[1].split('/', 2)
        if parts[0].startswith('@'):
            short = '/'.join(parts[:2])
        else:
            short = parts[0]
    print(f"  {size:>10,d}  {short}")
PY
)

if [ -n "$baseline" ] && [ -f "$baseline" ]; then
  BASE_BYTES=$(stat -c%s "$baseline" 2>/dev/null || stat -f%z "$baseline")
  DELTA=$((BYTES - BASE_BYTES))
  if [ "$BASE_BYTES" -gt 0 ]; then
    PCT=$(awk "BEGIN { printf \"%.2f\", ($DELTA / $BASE_BYTES) * 100 }")
  else
    PCT="n/a"
  fi
  DELTA_HUMAN=$(numfmt --to=iec-i --suffix=B --format='%+f' "$DELTA" 2>/dev/null || echo "${DELTA}B")
fi

if [ "$format" = "json" ]; then
  python <<PY
import json
out = {
  "bytes": $BYTES,
  "human": "$HUMAN",
  "top_modules": """$TOP_MODULES""",
}
PY
  printf '{\n  "bytes": %d,\n  "human": "%s"' "$BYTES" "$HUMAN"
  if [ -n "$baseline" ]; then
    printf ',\n  "baseline_bytes": %d,\n  "delta_bytes": %d,\n  "delta_pct": %s' \
      "$BASE_BYTES" "$DELTA" "$PCT"
  fi
  printf '\n}\n'
else
  echo "📦 main.jsbundle: $HUMAN ($BYTES bytes)"
  if [ -n "$baseline" ]; then
    echo "   vs baseline:    ${DELTA_HUMAN} (${PCT}%)"
  fi
  echo
  echo "$TOP_MODULES"
fi
