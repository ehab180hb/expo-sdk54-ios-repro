#!/usr/bin/env bash
# swap-jsbundle.sh — local-Mac equivalent of the js-only-fast.yml CI
# workflow. Bundles the current JS, replaces main.jsbundle inside an
# already-built .app, re-codesigns, re-installs.
#
# Use case: you've previously run `npm run ios:release` (or pulled the
# .app from a CI run). For pure JS changes since then, this script
# re-installs in ~30-60 seconds without invoking xcodebuild.
#
# Usage:
#   bash scripts/dev/swap-jsbundle.sh /path/to/your.app
#
# If no path is given, attempts to locate the most recent build under
# ios/derived/Build/Products/Release-iphonesimulator/.

set -euo pipefail

APP="${1:-}"
if [ -z "$APP" ]; then
  APP="$(find ios/derived -name "*.app" -type d -maxdepth 8 2>/dev/null | head -1 || true)"
fi
if [ -z "$APP" ] || [ ! -d "$APP" ]; then
  echo "Usage: bash scripts/dev/swap-jsbundle.sh <path-to-.app>" >&2
  echo "(Or run 'npm run ios:release' first to produce one under ios/derived/.)" >&2
  exit 1
fi

echo "==> swapping jsbundle in: $APP"

# Bundle JS only — ~30s
echo "==> bundling JS"
mkdir -p .bundle-out/assets
npx expo export:embed \
  --entry-file index.ts \
  --platform ios \
  --dev false \
  --bundle-output .bundle-out/main.jsbundle \
  --assets-dest .bundle-out/assets

[ -f .bundle-out/main.jsbundle ] || { echo "::error::no bundle produced"; exit 1; }

# Inject into the existing .app
echo "==> injecting bundle"
cp .bundle-out/main.jsbundle "$APP/main.jsbundle"
if [ -d .bundle-out/assets ]; then
  cp -R .bundle-out/assets/. "$APP/" 2>/dev/null || true
fi

# Re-codesign — codesign hashes file contents, so changing main.jsbundle
# invalidates the existing signature. simctl install on Xcode 16+ requires
# valid signature.
echo "==> re-codesigning"
/usr/bin/codesign --force --sign - --deep "$APP"
/usr/bin/codesign --verify --verbose=2 "$APP"

# Find a booted sim and reinstall
DEVICE=$(xcrun simctl list devices booted | grep -oE "\([A-F0-9-]{36}\)" | head -1 | tr -d '()' || true)
if [ -z "$DEVICE" ]; then
  echo "==> no booted sim — booting iPhone 16 Pro"
  DEVICE=$(xcrun simctl list devices available | grep -m1 "iPhone 1[5-9] Pro" \
           | grep -oE "\([A-F0-9-]{36}\)" | tr -d '()')
  xcrun simctl boot "$DEVICE"
  xcrun simctl bootstatus "$DEVICE" -b
fi

BUNDLE_ID=$(plutil -extract CFBundleIdentifier raw "$APP/Info.plist")
echo "==> installing $BUNDLE_ID on $DEVICE"
xcrun simctl install "$DEVICE" "$APP"
xcrun simctl launch "$DEVICE" "$BUNDLE_ID"

echo "==> done. Total elapsed: ${SECONDS}s"
