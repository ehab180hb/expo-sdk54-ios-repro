# Iteration loop — toward near-zero-second debug time

The single biggest predictor of debug velocity is *cycle time of the
cheapest test that can catch the bug*. A 2-minute xcodebuild is
appropriate for testing native module integration; running it for a
typo in store logic is malpractice.

This doc describes a 7-layer iteration toolkit, ordered by speed. Each
layer is wired in this repo. Pick the cheapest one that can catch the
bug class you're hunting.

## TL;DR — the speed table

| Layer | Cycle time | Catches | Tool | When to use |
|---|---|---|---|---|
| **0. Type check** | ~1s | Type errors, missing imports, wrong shape | `tsc --noEmit` (editor) | Continuously, in editor |
| **1. Jest watch (logic)** | **~1-3s** | Logic bugs in store / hooks / utils | `npm run test:watch` | Every store/util/hook change |
| **2. Component tests** | ~3-5s | Render bugs, prop wiring, event handling | testing-library/react-native (Jest) | Every component change |
| **3. Metro hot reload** | ~500ms (after first build) | Visual bugs, layout, runtime UI behavior | `npm run ios` then save files | UI iteration once app is running |
| **4. Maestro local watch** | ~10-30s per flow | Gestures, persistence, cross-component flows | `maestro test --watch e2e/flows/foo.yaml` | E2E flow iteration |
| **5. Cached CI sim build** | ~3-5min warm, 12min cold | Native module integration, build config | `ios-build-cached.yml` workflow | When local Mac unavailable, native side change |
| **6. Bundle-only fast path** | ~60-90s | JS-only changes against a cached `.app` | `js-only-fast.yml` workflow (proposed) | JS change after a successful build |

## Layer 0: TypeScript in your editor (continuous)

VS Code with the TypeScript extension shows errors as you type. The
`@/*` path alias is configured in `tsconfig.json` so import paths
stay short.

`tsconfig.json` strict flags catch ~30% of bugs at edit time:
- `strict: true`
- `noUncheckedIndexedAccess: true` (forces `array[i]` to be `T | undefined`)
- `noImplicitOverride: true`

Rule of thumb: **never wait for tests to find a type error**.

## Layer 1: Jest watch — logic (1-3 seconds)

```bash
npm run test:watch
```

Jest watch only re-runs tests affected by your last edit. A typical
change to `src/store/todoStore.ts` runs ~5 tests in ~1.5s.

**Use this for:** anything in `src/store/`, `src/hooks/`, `src/utils/`.

**Don't use this for:** the visual layout of a component or the look of
an animation — those need a real RN runtime.

## Layer 2: Component tests (3-5 seconds)

```bash
npm test -- TodoItem
```

`@testing-library/react-native` renders the component, lets you fire
synthetic events, and asserts on the rendered tree. Native modules are
mocked (see `jest.setup.ts`).

**Use this for:** prop wiring, event handlers, conditional rendering,
accessibility props.

**Don't use this for:** real gestures (gesture-handler is mocked to
plain `View`), real animations (reanimated is mocked), AsyncStorage
round-tripping (in-memory mock).

## Layer 3: Metro hot reload (~500ms after first build)

```bash
npm run ios          # cold ~12min, warm ~90s
# then save any file in src/ — Metro pushes new bundle automatically
```

Once the app is built and running on the sim, Metro watches the file
system and pushes new JS to the running app on every save. The native
side is untouched; only the JS module that changed plus its dependents
are re-bundled.

If hot reload breaks (it occasionally does after deeper edits), press
`R` in the Metro terminal to force a full reload.

**Use this for:** every visual / runtime behavior you can see on screen.

**Don't use this for:** native config changes (Info.plist, Podfile,
babel.config.js) — those need a rebuild.

## Layer 4: Maestro local watch (10-30 seconds per flow)

```bash
maestro test --watch e2e/flows/add-todo.yaml
```

Re-runs the flow against the running sim every time you edit the YAML.
The app stays installed; only the flow re-executes.

**Use this for:** writing or fixing an E2E flow.

## Layer 5: Cached CI sim build (3-5 min warm)

The `ios-build-cached.yml` workflow uses `actions/cache@v4` for:
- `node_modules` (npm cache)
- `ios/Pods`
- `ios/derived` (Xcode DerivedData)
- `~/Library/Caches/CocoaPods`

Cache key is hashed from `package-lock.json` + `app.json` + `src/**`.
A cache hit on the first three reduces a 12-minute cold build to a
3-minute incremental.

**Use this for:** PR validation, no-Mac developer machines, sanity
checks before merging.

## Layer 6: Bundle-only fast path (60-90s) — proposed

For JS-only iteration in CI without rebuilding the entire `.app`:

```yaml
# .github/workflows/js-only-fast.yml
on:
  workflow_dispatch:
  pull_request:
    paths: ['src/**', 'App.tsx', 'index.ts']  # only JS changes

steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
  - run: npm install --legacy-peer-deps

  # Restore .app from a previous successful build
  - uses: actions/cache@v4
    id: app-cache
    with:
      path: pre-built.app
      # Hash on package-lock + native source ONLY (NOT JS source)
      key: pre-built-app-${{ hashFiles('package-lock.json', 'app.json', 'babel.config.js') }}

  - if: steps.app-cache.outputs.cache-hit == 'true'
    run: |
      # 1. Bundle ONLY the new JS (~30s)
      npx expo export:embed \
        --entry-file index.ts \
        --platform ios \
        --dev false \
        --bundle-output main.jsbundle \
        --assets-dest assets/

      # 2. Inject into the cached .app
      cp main.jsbundle pre-built.app/main.jsbundle
      cp -r assets/* pre-built.app/

      # 3. Re-sign + install (codesign needs to redo because contents changed)
      /usr/bin/codesign --force --sign - --deep pre-built.app

      # 4. Boot sim, install, launch (~30s)
      DEVICE=$(xcrun simctl list devices available | grep -m1 "iPhone 1[5-9] Pro" \
               | grep -oE "\([A-F0-9-]{36}\)" | tr -d '()')
      xcrun simctl boot "$DEVICE" || true
      xcrun simctl bootstatus "$DEVICE" -b
      xcrun simctl install "$DEVICE" pre-built.app
      xcrun simctl launch "$DEVICE" io.example.expoSdk54Todo

      # 5. Run Maestro flows (~30s for the smoke flow)
      maestro test e2e/flows/add-todo.yaml

  - if: steps.app-cache.outputs.cache-hit != 'true'
    run: |
      # Cache miss → fall back to full build path
      echo "::warning::No cached .app — falling back to full build"
      # ... invoke the full ios-build-cached workflow
```

This collapses a 4-minute warm build + Maestro to a ~90-second
"swap JS only" pass. The cached `.app` is treated as a stable shell;
only the JS bundle iterates.

**See `scripts/dev/swap-jsbundle.sh` for the local-Mac equivalent.**

## Layer 7: Self-hosted runner (~30s warm)

When a personal Mac mini is registered as a GitHub Actions self-hosted
runner, all caches persist on local SSD between runs. A warm `xcodebuild`
hits a populated DerivedData and finishes in <30s.

Cost: $0/run. Setup: ~20 minutes per machine. See [GitHub docs on
self-hosted runners](https://docs.github.com/en/actions/hosting-your-own-runners).

This isn't wired in this repo (no Mac mini in scope), but the workflows
are designed to be runner-agnostic — they work on `runs-on: macos-15`
and `runs-on: self-hosted` with no other change.

## The decision tree

```
Did the bug touch native code (Pod, Info.plist, native module)?
├─ Yes → Layer 5 (cached CI build) or full local rebuild
└─ No → Did it touch the React component tree?
        ├─ Yes → Layer 3 (Metro hot reload) — instant feedback
        └─ No → Layer 1 or 2 (Jest) — instant feedback

Need cross-component / gesture / persistence verification?
└─ Layer 4 (Maestro) — local first, CI as backup

Pre-merge regression check?
└─ Layers 1+2+5 in CI run automatically on PR
```

## Cost summary (for a typical 50-PR week)

Assuming each PR runs unit-tests + ios-build-cached + maestro-e2e:

| Layer | Per-PR cost | Per-PR time | 50 PR/week cost |
|---|---|---|---|
| Unit tests (Linux) | $0 (free unlimited public) | 30s | $0 |
| iOS build cached | $0 (free public) | 4min warm | $0 |
| Maestro E2E | $0 (free public) | 6min | $0 |
| Self-hosted | $0 (one-time HW) | 30s | $0 |

Public repos benefit from GitHub's unlimited free macOS minutes. Total
weekly CI cost: $0. Total developer wall-clock per PR: under 5 minutes
of automated checks, mostly running in parallel.

## See also

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — why the codebase is shaped this way
- [`TESTING.md`](TESTING.md) — what tests live where and why
- [`DOCKER.md`](DOCKER.md) — Docker / devcontainer setup for hermetic Linux iteration
- The skills at user-level: `ios-rn-build-debug`, `expo-sdk54-rn081-setup`,
  `ios-build-failure-methodology`
