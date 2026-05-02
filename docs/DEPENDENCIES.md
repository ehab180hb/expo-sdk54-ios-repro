# Dependency policy

This project pins Expo SDK 54 (`expo: ~54.0.34`) and React Native
0.81.5. Most dependencies follow Expo's matrix; six are deliberately
held off-matrix and listed in `expo.install.exclude` in
`package.json`. Each is explained below.

The lefthook `pre-push` `expo-doctor` gate is **blocking** (Plan 4
T4.1.C) — drift outside the explicit allowlist fails the push. This
prevents silent regressions like the iter-#13 yoga incompatibility
that wasted ~16 CI minutes before being caught.

## Allowlisted off-matrix packages

| Package                                     | Installed  | Matrix wants | Why pinned off                                                                                                                                                                                                                                                           |
| ------------------------------------------- | ---------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `expo-build-properties`                     | `^55.0.13` | `~1.0.10`    | Forward-tracking; needed for the newer `ios.deploymentTarget` shape. Verified compatible with SDK 54 build pipeline.                                                                                                                                                     |
| `expo-haptics`                              | `^55.0.14` | `~15.0.8`    | Forward-tracking; aligned with the rest of the 55.x family. No breaking-change observed against SDK 54.                                                                                                                                                                  |
| `expo-secure-store`                         | `^55.0.13` | `~15.0.8`    | Same — forward-tracking.                                                                                                                                                                                                                                                 |
| `expo-web-browser`                          | `^55.0.14` | `~15.0.11`   | Same — forward-tracking.                                                                                                                                                                                                                                                 |
| `@react-native-async-storage/async-storage` | `2.1.0`    | `2.2.0`      | Held at 2.1.0; no observed regression. Low-priority bump on next dep sweep.                                                                                                                                                                                              |
| `react-native-safe-area-context`            | `~5.4.0`   | `~5.6.0`     | **Critical**: this is the version that fixed RN 0.81's yoga incompatibility (commit 74f43bf, post-mortem in `docs/POST_MORTEMS/`). **DO NOT bump** without re-validating against the iOS sim build — the pre-bump version (5.0.0) caused 16 wasted CI minutes per cycle. |

## Re-evaluation rules

When upgrading any of these:

1. Read the package's CHANGELOG for breaking changes
2. Bump in a dedicated PR (don't combine with feature work)
3. Trigger `ios-build-cached.yml` and `maestro-e2e.yml` and verify
   green
4. If a regression appears, revert and update this doc with the
   evidence

## Adding a new exclusion

Edit `package.json` `expo.install.exclude` AND this table. The
pre-push gate fails open without a corresponding entry — the
intent is to make every off-matrix decision deliberate and
auditable.
