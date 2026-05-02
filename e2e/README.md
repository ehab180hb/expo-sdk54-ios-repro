# Maestro E2E flows

End-to-end UI tests written as YAML flows for [Maestro](https://maestro.mobile.dev/).

## Why E2E exists alongside unit tests

| Layer                                     | What it catches                                                                                                              | Cost per run  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Jest unit tests (`__tests__/`)            | Logic bugs in store/hooks/utils, prop wiring                                                                                 | ~3s           |
| Component tests (`__tests__/components/`) | Render regressions, event handling                                                                                           | ~5s           |
| **Maestro E2E (this dir)**                | **Integration bugs across layers, gesture-handler quirks, AsyncStorage round-tripping, real-runtime native module behavior** | ~30s per flow |

E2E doesn't replace unit tests — it covers the gaps unit tests can't see (real
gestures, real persistence, real navigation between renders). Keep E2E focused
on user-visible flows; don't replicate unit test coverage here.

## Running locally

Prerequisites:

- macOS with Xcode + Maestro installed (`brew install maestro`)
- A booted iOS simulator
- The app already installed on the simulator (`npm run ios:release` once)

```bash
# All flows
maestro test e2e/flows/

# Single flow
maestro test e2e/flows/add-todo.yaml

# Watch mode (re-runs flow on file change)
maestro test --watch e2e/flows/add-todo.yaml
```

## Flow naming convention

`<verb-noun>.yaml` — one user goal per flow. Don't chain unrelated goals.

Each flow starts from a known state (`clearState` on the app id) so they're
order-independent.

## Selectors

We use `testID` props on every interactive element (see `src/components/*.tsx`)
and reference them via `id:` in flows. Avoid `text:` selectors except for
read-only assertions — they break on copy changes.
