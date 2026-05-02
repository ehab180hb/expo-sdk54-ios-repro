# Platform: iOS-only by intent

This project is **iOS-only by deliberate decision** (Plan 4 Phase 6,
Path B). Android is out of scope and the Expo configuration reflects
that. This document records the rationale so a future contributor
doesn't accidentally invest in dual-platform tooling.

## Why iOS-only

1. **The user maintains Android tooling separately**. The mondid
   suite of repos (backends, frontends, packages) covers Android
   work; this repo is the iOS-focused playground for fast-iteration
   experiments and powerhouse template development.
2. **`expo-sdk54-ios-repro` started as an iOS build-debug repro**,
   then grew into a TodoMVC + iteration toolkit. Android was never
   in scope; the absence of `android/` block in `app.json` and
   `expo prebuild --platform android` runs is by design, not
   oversight.
3. **The Cloud Explorer / Maestro / cache-surgery investments** are
   all iOS-shaped (xcodebuild, xcrun simctl, .app bundles). The
   Android equivalents (gradle, adb, .apk) would be a parallel
   track, not a quick add.

## What that means concretely

- `app.json` declares `ios` only — no `android` block.
- No `react-native-edge-to-edge` (the package was scaffolded but
  never imported; removed in Plan 4 Phase 6).
- No `android` GitHub Actions matrix; all CI workflows target
  `macos-15` runners.
- `e2e/flows/` use iOS bundle IDs; Maestro flows haven't been
  validated on Android.
- The `scheme` in `app.json` (`exposdk54todo`) is set up for iOS
  Universal Links pattern; an Android equivalent would require
  AndroidManifest.xml `<intent-filter>` configuration.

## If you DO want to enable Android later (Path A)

The path is documented even though we're not taking it:

1. Add `android` block to `app.json`:
   ```json
   "android": {
     "package": "io.example.exposdk54todo",
     "edgeToEdgeEnabled": true
   }
   ```
2. Reinstall `react-native-edge-to-edge` and import it once at
   `App.tsx` to enable status-bar passthrough.
3. Run `npx expo prebuild --platform android` (locally — no CI
   workflow exists).
4. Add `e2e/android/flows/` mirroring iOS flows but with the
   Android package ID.
5. Add a `.github/workflows/android-build-cached.yml` mirroring
   the iOS workflow shape (gradle assembleRelease + adb install
   instead of xcodebuild + simctl install).
6. Update `scripts/dev/inventory-testids.sh` rules to include
   Android-specific gotchas (testID → resource-id mapping; some
   testIDs are absorbed by accessibilityRole on Android too,
   though the rules are slightly different).

Estimated effort: ~1.5 days of focused work to bring Android to
parity with the iOS toolchain, plus ongoing maintenance of two
platforms instead of one.

## Out of scope (for both Path A and Path B)

- iPad-specific layouts (the `app.json` declares `supportsTablet:
true` but no breakpoint testing is currently wired)
- watchOS, tvOS, visionOS targets
- Web (no `react-native-web` integration)
- Push notifications (would need APNS keys and a server)

If a future plan changes this, update this doc as part of that
plan's Phase 1.
