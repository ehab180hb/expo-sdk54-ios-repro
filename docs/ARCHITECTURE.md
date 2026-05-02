# Architecture

Small app, deliberate boundaries. The point is to demonstrate "what real
production-shaped code looks like at a small scale" — not to over-architect.

## Layers

```
        ┌──────────────────────────────┐
        │       App.tsx (root)         │  ← side-effect imports (gesture-handler, unistyles)
        │       ↓ HomeScreen           │
        ├──────────────────────────────┤
        │   src/screens/HomeScreen     │  ← layout + gating on hydration
        ├──────────────────────────────┤
        │   src/components/*           │  ← presentational + accessibility surface
        ├──────────────────────────────┤
        │   src/hooks/useFilteredTodos │  ← derived state from store
        ├──────────────────────────────┤
        │   src/store/todoStore        │  ← single source of truth (zustand)
        │   src/store/persistence      │  ← StateStorage adapter
        ├──────────────────────────────┤
        │   AsyncStorage (native)      │  ← only mutated by zustand persist
        └──────────────────────────────┘
```

### Imports flow downward only

`screens/` imports `components/`, `components/` imports `store/` and `hooks/`,
`hooks/` imports `store/`, `store/` imports `persistence/`. Nothing imports
upward. No circular imports.

### Side effects live in two places

1. **`App.tsx`** — the gesture-handler import and the unistyles config import.
   Both must run before any component renders. Putting them in App.tsx (and
   nowhere else) makes the load order explicit.
2. **`src/store/todoStore.ts`** — `persist` middleware reads/writes
   AsyncStorage on every state change. The store is the only file in the
   app that hits storage.

Components, hooks, screens, utils, types — all pure.

## State management: zustand

Why zustand and not Redux Toolkit / Context+useReducer / Jotai:

| Option | Why rejected |
|---|---|
| Redux Toolkit | Boilerplate-heavy for an app with 5 actions. RTK shines at scale; this isn't scale. |
| Context + useReducer | No persistence story. Re-render storms on context changes. |
| Jotai / Recoil | Overkill atomic state model for a flat list of todos. |
| **zustand** | 2KB, built-in `persist` middleware, hooks API matches RN ergonomics, zero ceremony |

Selectors are encouraged: `useTodoStore((s) => s.todos)` triggers re-render
only when `todos` changes, not on every other field's mutation.

## Persistence

zustand's `persist` middleware writes the store to AsyncStorage on every
state change (debounced internally) and reads it back on app boot. The
`useHasHydrated` hook gates the first render so users don't briefly see
an empty list before their saved todos arrive.

`partialize: (state) => ({ todos: state.todos, filter: state.filter })`
restricts what we persist — actions don't need persisting (they're
re-bound on every load), and any future ephemeral UI state (e.g. an
"is editing" flag) won't leak into AsyncStorage.

The storage key is versioned: `todo-store-v1`. When the schema changes
incompatibly, bump to `v2` and add a migration in the persist config.

## Theming: react-native-unistyles 3

Why unistyles and not StyleSheet / Tamagui / NativeWind:

| Option | Why rejected |
|---|---|
| Plain RN StyleSheet | No theme awareness — every component would need props for colors |
| Tamagui | 100s of KB and complex setup for what we need |
| NativeWind | Tailwind syntax, but adds a class-name compiler we don't want |
| **unistyles** | Theme as first-class arg to `StyleSheet.create`, dark/light auto-switch, runtime-cheap |

`src/theme/tokens.ts` defines `lightTheme` / `darkTheme` as const objects.
`src/theme/unistyles.ts` registers them via `StyleSheet.configure(...)`.
Every component then writes:

```tsx
const styles = StyleSheet.create((theme) => ({
  button: { backgroundColor: theme.colors.accent }
}));
```

…and gets re-themed automatically when the OS appearance changes
(`adaptiveThemes: true`).

## Animations + gestures

We use:

- **react-native-gesture-handler** for swipe-to-delete on `TodoItem`
- **react-native-reanimated v4 + react-native-worklets** for any
  worklet-driven animations (currently none, but the babel plugin is
  configured so adding one is trivial)
- **expo-haptics** for tactile feedback on toggle/delete

These are exactly the deps that bit us during the recovery debug session;
keeping them in active use ensures any future regression is caught here
before it lands in a production app.

## Testing strategy (see also `TESTING.md`)

Three layers, each catches a different bug class:

1. **Jest unit tests** — pure functions, store logic, hook outputs. Fast.
2. **testing-library/react-native component tests** — render + interaction
   on a single component. Mocks for native modules in `jest.setup.ts`.
3. **Maestro E2E** — multi-component flows on a real simulator. Catches
   gesture/persistence/native-module quirks unit tests can't see.

Coverage thresholds in `jest.config.js` enforce 80%/70% on the JS side;
E2E flows are required to pass on every PR via the workflow.

## What's deliberately NOT here

- **Navigation**: single-screen app. When a second screen is needed, add
  expo-router; don't roll your own.
- **API client**: no backend. When one's needed, add a `src/api/` layer
  with a `fetch` wrapper + react-query. Don't put fetch calls in components.
- **Auth**: out of scope for a TodoMVC.
- **Internationalization**: copy is hardcoded English. When localizing,
  add `src/i18n/` and use `expo-localization`.
- **Error boundaries**: none yet. RN's default red-screen is fine in dev;
  for prod, add a top-level boundary in App.tsx.

Each absence is a deliberate yagni — adding any of these now would add
mass without learning.
