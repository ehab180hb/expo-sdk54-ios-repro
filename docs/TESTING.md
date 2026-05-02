# Testing

Three layers, each chosen to catch a different bug class at the lowest cost.

## Layer 1: Jest unit tests

Files: `__tests__/utils/*.test.ts`, `__tests__/store/*.test.ts`,
`__tests__/hooks/*.test.ts`.

Pure functions and store actions. No React, no native modules.

```bash
npm test                  # runs once
npm run test:watch        # re-runs on file change (use this while coding)
npm run test:coverage     # generates HTML report at coverage/lcov-report/
```

**What lives here:** UUID generation, store action correctness (add / toggle /
remove / edit / clearCompleted / setFilter), filter selector correctness,
edge cases (empty input, whitespace, unknown ids).

**What does NOT live here:** anything requiring a rendered tree, anything
requiring AsyncStorage round-tripping in a real way (the in-memory mock
in `jest.setup.ts` is sufficient; real AsyncStorage is exercised by E2E).

## Layer 2: testing-library/react-native component tests

Files: `__tests__/components/*.test.tsx`.

Render a single component, fire events, assert on the rendered tree
and on the store state mutations the events trigger.

```bash
npm test -- TodoItem      # run a single component's tests
```

**What lives here:** prop wiring (does `TodoItem` show `todo.text`?),
event handling (does pressing the row toggle the store?), accessibility
state (is `accessibilityState.checked` correct?), conditional rendering
(does a disabled button get the `disabled` prop?).

**What does NOT live here:** gestures (gesture-handler stubs out to a
plain View in tests), animations (reanimated mock returns immediately),
real AsyncStorage I/O. Move those concerns to E2E.

### Native module mocks

`jest.setup.ts` mocks the native modules that don't exist in the test
runtime:

| Module                                      | Why mocked    | Mock behavior                                   |
| ------------------------------------------- | ------------- | ----------------------------------------------- |
| `expo-haptics`                              | Native bridge | All methods return `Promise.resolve(undefined)` |
| `@react-native-async-storage/async-storage` | Native bridge | In-memory `Map`-backed implementation           |
| `react-native-unistyles`                    | Native bridge | Pass-through to RN's StyleSheet                 |
| `react-native-gesture-handler`              | Native bridge | All wrappers render as plain `View`             |
| `react-native-reanimated`                   | Native bridge | Library's official `mock`                       |

If you add a new native module, add its mock here. Otherwise tests fail
at import time with "TurboModuleRegistry.getEnforcing(...) ... is null".

## Layer 3: Maestro E2E flows

Files: `e2e/flows/*.yaml`.

Real user flows on a real iOS simulator with the real app installed.

```bash
# Prereq: brew install maestro; build the app once via `npm run ios:release`
maestro test e2e/flows/                        # all flows
maestro test e2e/flows/add-todo.yaml           # one flow
maestro test --watch e2e/flows/add-todo.yaml   # watch mode
```

**What lives here:** flows that span multiple components, gestures
(swipe-to-delete), persistence round-tripping (kill-and-restart in
`persistence.yaml`), filter tab interactions changing the visible list.

**What does NOT live here:** anything a unit test can catch — E2E is the
slowest layer (30s+ per flow on local sim, 5+ min in CI), keep it focused
on integration, not coverage.

### Selectors: `id:` over `text:`

Every interactive element in `src/components/*.tsx` has a `testID` prop.
Maestro flows reference these via `id: "..."` (stable across copy
changes) instead of `text: "..."` (breaks when copy changes).

The exceptions are intentional read-only assertions like
`assertVisible: "1 item left"` where the text IS the user-facing
contract being verified.

### Flow conventions

- Start every flow with `clearState` so flows are order-independent.
- One user goal per flow file.
- Filename is `<verb>-<noun>.yaml` (`add-todo`, `complete-todo`, ...).
- Don't chain unrelated assertions — write a separate flow.

## Running CI locally (act)

The unit-tests workflow runs on Linux and works under
[`act`](https://github.com/nektos/act):

```bash
act -j test --container-architecture linux/amd64
```

The iOS build workflow requires macOS and can NOT run under act. Use a
local `npm run ios` for the same coverage (it builds the same way, just
on your machine instead of the runner).

## Coverage policy

`jest.config.js` enforces:

- 80% lines / statements / functions
- 70% branches

CI fails if any threshold drops below those. Adjust thresholds when
adding a class of code that's reasonably exempt (e.g., theme tokens are
in `coveragePathIgnorePatterns`).

## When to add tests

| Trigger                                                   | Test type                                                                                                  |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| New action in `todoStore.ts`                              | Unit (`__tests__/store/`)                                                                                  |
| New component                                             | Component (`__tests__/components/`)                                                                        |
| New cross-component flow / gesture / persistence behavior | E2E (`e2e/flows/`)                                                                                         |
| Bug fix                                                   | Whichever layer would have caught it — and that's the test that should fail BEFORE your fix and pass AFTER |
