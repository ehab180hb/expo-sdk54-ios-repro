/**
 * Perf markers — Plan 4 T4.3.E (foundation).
 *
 * Lightweight launch-timing instrumentation. The real perf-budget
 * gate (CI workflow that fails on >2s p95) requires a custom
 * Maestro action to capture timing across launches; that's deferred
 * to a future iteration. THIS module is the source-side scaffolding
 * so the markers exist when the gate gets wired.
 *
 * Markers:
 *   markLaunch()     — set as early as possible (App.tsx top)
 *   markFirstPaint() — set when the first interactive element renders
 *
 * Read via global.__PERF__ in tests / from a future sim hook.
 *
 * Usage in App.tsx:
 *   import { markLaunch } from '@/lib/perf';
 *   markLaunch();   // top-level, before any component
 *
 * Usage in HomeScreen post-hydration:
 *   useEffect(() => { markFirstPaint(); }, []);
 */

declare global {
  /* eslint-disable no-var */
  var __PERF__: {
    launch?: number;
    firstPaint?: number;
  };
  /* eslint-enable no-var */
}

if (!globalThis.__PERF__) {
  globalThis.__PERF__ = {};
}

export function markLaunch() {
  if (globalThis.__PERF__.launch == null) {
    globalThis.__PERF__.launch = Date.now();
  }
}

export function markFirstPaint() {
  if (globalThis.__PERF__.firstPaint == null) {
    globalThis.__PERF__.firstPaint = Date.now();
  }
}

export function getPerf(): { launch?: number; firstPaint?: number; launchToFirstPaintMs?: number } {
  const p = globalThis.__PERF__;
  let launchToFirstPaintMs: number | undefined;
  if (p.launch != null && p.firstPaint != null) {
    launchToFirstPaintMs = p.firstPaint - p.launch;
  }
  return {
    launch: p.launch,
    firstPaint: p.firstPaint,
    launchToFirstPaintMs,
  };
}

/**
 * Reset (test-only). Used to isolate test cases that exercise
 * the markers themselves.
 */
export function __resetPerf() {
  globalThis.__PERF__ = {};
}
