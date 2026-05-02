# expo-sdk54-todo

A small TodoMVC-style app built with **Expo SDK 54 + React Native 0.81**, deliberately exercising the dependency stack that bit us during the recovery debug session: react-native-unistyles, react-native-nitro-modules, react-native-reanimated, react-native-worklets, react-native-gesture-handler, react-native-edge-to-edge.

This repo doubles as:

1. **A working real-world app** — TodoMVC scope, AsyncStorage persistence, swipe-to-delete, haptic feedback, dark mode, accessible.
2. **A test harness** — every iOS / Expo / RN gotcha we've found is encoded in either the workflow YAML, `babel.config.js`, the `index.ts` boilerplate, the `tsconfig.json`, or the `package.json` pinned versions.

> **History.** The repo started as a single-file `<Text>HELLO mondid-min</Text>` minimal repro for verifying the dep stack works on iOS. The original throwaway-scaffolding workflow is preserved as `test-min-repro.yml` for dep-stack regression tests; the rest of the repo is now a real app on top of that proven baseline.

## Quick start

```bash
git clone https://github.com/ehab180hb/expo-sdk54-ios-repro.git
cd expo-sdk54-ios-repro
npm install --legacy-peer-deps      # --legacy-peer-deps required for SDK 54 stack
npm run typecheck                    # 1s — TS strict
npm test                             # 3s — Jest unit + component tests
npm run ios                          # 12-15min cold, 90s warm — Expo CLI + sim
```

For the **full debug iteration loop** (including hot-reload, near-zero-debug-time tactics), see [`docs/ITERATION_LOOP.md`](docs/ITERATION_LOOP.md).

## What's in here

```
expo-sdk54-ios-repro/
├── App.tsx                         # root — imports gesture-handler + unistyles config
├── index.ts                        # registerRootComponent boilerplate (REQUIRED for SDK 54)
├── package.json                    # pinned versions: expo~54.0.34, react@19.1.0, rn@0.81.5
├── babel.config.js                 # react-native-worklets/plugin (LAST in plugin list)
├── app.json                        # bundle id, scheme, plugin list
├── tsconfig.json                   # strict, @/* path alias
├── jest.config.js                  # jest-expo preset + AsyncStorage mock
│
├── src/
│   ├── types/      todo.ts                       # Todo, TodoFilter
│   ├── utils/      id.ts                         # UUID v4 generator
│   ├── theme/      tokens.ts, unistyles.ts       # design tokens, StyleSheet.configure
│   ├── store/      todoStore.ts, persistence.ts  # zustand + AsyncStorage
│   ├── hooks/      useFilteredTodos.ts           # selector + counts
│   ├── components/ Header, AddTodoInput, TodoItem, TodoList, FilterTabs, EmptyState
│   └── screens/    HomeScreen.tsx
│
├── __tests__/                      # Jest — 1:1 mirror of src/
├── e2e/flows/                      # Maestro YAML flows (add, complete, delete, persistence)
├── docs/                           # ARCHITECTURE, TESTING, ITERATION_LOOP
└── .github/workflows/
    ├── unit-tests.yml              # Linux runner, ~30s, runs on every push
    ├── ios-build-cached.yml        # macOS runner with caches, ~3-5min warm
    ├── maestro-e2e.yml             # downstream of ios-build, replays YAML flows
    └── test-min-repro.yml          # original throwaway dep-stack regression test (kept)
```

## Iteration philosophy

Speed of feedback should match the speed of the bug class:

| Bug class | Test layer | Cycle time |
|---|---|---|
| Logic in store / hooks / utils | Jest unit (`__tests__/`) | **3 sec** |
| Component rendering / events | testing-library (`__tests__/components/`) | **5 sec** |
| Cross-component integration, gestures, persistence | Maestro E2E (`e2e/flows/`) | **30 sec local** |
| Native module behavior, build config | iOS sim build (`ios-build-cached.yml`) | **3 min warm CI** |
| Dep-stack compatibility (SDK upgrade) | `test-min-repro.yml` (scaffolds from scratch) | **15 min cold CI** |

Always start at the cheapest layer that can possibly catch the bug. See [`docs/ITERATION_LOOP.md`](docs/ITERATION_LOOP.md) for the detailed workflow.

## Workflows

| Workflow | Triggers | What it asserts | Where artifacts go |
|---|---|---|---|
| `unit-tests.yml` | Every push + PR | TS compiles, Prettier passes, Jest+coverage thresholds met | `coverage/` artifact |
| `ios-build-cached.yml` | Push to `master` (src changes) + manual | A real `.app` builds, codesigns, installs, launches, captures screenshot | `ios-build-cached` artifact |
| `maestro-e2e.yml` | After successful `ios-build-cached` | Add/complete/delete/persistence flows pass | `maestro-e2e` artifact (videos + report) |
| `test-min-repro.yml` | Manual only | Whole stack still works from scratch (scaffolds new app each time) | `ios-min-repro` artifact |

## Lessons baked into this repo

Every quirk listed in `~/.claude/projects/C--code/memory/ios_rn_build_debug.md` is encoded somewhere here. Notable ones:

- `index.ts` exists with `registerRootComponent` boilerplate (SDK 54 template no longer ships it)
- `babel.config.js` has `react-native-worklets/plugin` last
- `package.json` pins `expo~54.0.34`, `react@19.1.0`, `react-native@0.81.5`
- All workflows use `CODE_SIGN_IDENTITY="-"` + `CODE_SIGNING_ALLOWED=YES` (NOT `=NO`) so the Embed Pods Frameworks phase actually runs
- `xcodebuild` invocations hardcode the scheme (auto-detect picks the wrong one)
- Builds happen under `/Users/runner/work/...` paths, not `/tmp` (symlink trap)
- Every workflow has a post-build `find ... -name "*.app"` sanity check

## License

MIT — this is a learning artifact, fork freely.
