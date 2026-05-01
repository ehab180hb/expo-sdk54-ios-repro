# expo-sdk54-ios-repro

A scratch repo for validating iOS-build / dep-stack theories on free
GitHub Actions macOS runners (public repo = unlimited minutes).

The real production app this is decoupled from lives elsewhere. This
repo only ever contains a minimal Expo SDK 54 reproduction harness
generated at workflow time — no app source, no secrets.

## Workflows

### `ios-min-repro.yml`

Fully autonomous. Builds a fresh `mondid-min` Expo SDK 54 app at job
time with the same suspect React Native dep stack as the real app
(unistyles, nitro-modules, reanimated@4, worklets, edge-to-edge,
gesture-handler, normalize-colors), then:

1. `npx create-expo-app` + pin Expo/React/RN versions
2. `npm install` the suspect deps + write `babel.config.js` with the
   worklets plugin
3. Write a minimal `App.tsx` that imports the deps in the same order
   as the real app, configures Unistyles, and renders
   `<Text>HELLO mondid-min</Text>`
4. `expo prebuild --platform ios` + `pod install`
5. `xcodebuild -configuration Release -destination
   'generic/platform=iOS Simulator'` — Release config so the JS bundle
   is embedded; `-destination` so xcodebuild actually links the .app
   instead of stopping at the placeholder destination
6. `codesign --force --sign - --deep` (Xcode 16 simctl install rejects
   unsigned .app with `NSInternalInconsistencyException`)
7. `xcrun simctl install` + boot iPhone 1x Pro sim
8. `simctl spawn log stream` (broad predicate covering SpringBoard +
   CoreSimulator messages, not just our own NSLogs) +
   `simctl launch --console-pty`
9. Capture full log stream + launch console + a screenshot
10. Generate `VERDICT.txt` classifying the result as one of `BOOTED` /
    `CRASH_SAME` / `CRASH_DIFFERENT` / `UNKNOWN`
11. Upload everything as a workflow artifact

### How to read a result

```
gh run download <run-id> --name ios-min-repro
cat VERDICT.txt
```

The interesting decision tree:

| Verdict | Meaning |
|---|---|
| `BOOTED` | Dep stack is fine. Production crash is in app-specific code. |
| `CRASH_SAME` | Same TypeError as the real app. One of the suspect deps is the culprit; bisect dep versions. |
| `CRASH_DIFFERENT` | Repro crashes, but with a different stack — investigate. |
| `UNKNOWN` | Neither HELLO nor a clear crash signature. Inspect screenshot + logs by hand. |
