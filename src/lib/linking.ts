/**
 * Deep-link routing — Plan 4 T4.2.C.
 *
 * The app declares `scheme: 'exposdk54todo'` in app.json. Tapping a
 * link with that scheme launches (or foregrounds) the app and fires
 * an `url` event. We parse the URL into a deliberate route shape
 * and hand it to the store / UI layer to apply.
 *
 * Routes supported:
 *   exposdk54todo://                    → no-op (just open the app)
 *   exposdk54todo://filter/{name}       → set the filter
 *   exposdk54todo://add?text=...        → enqueue a draft text
 *
 * Each route's effect is intentionally MINIMAL — deep links should
 * not implicitly do destructive things (no `delete`, no `clear`).
 * Adding a destructive route would require a confirmation step.
 */

import type { TodoFilter } from '@/types/todo';

export type LinkRoute =
  | { kind: 'home' }
  | { kind: 'filter'; filter: TodoFilter }
  | { kind: 'add'; text: string }
  | { kind: 'unknown'; url: string };

const VALID_FILTERS: ReadonlySet<TodoFilter> = new Set(['all', 'active', 'completed']);

/**
 * Parse a deep-link URL into a route. Always returns a route — never
 * throws — so callers don't need defensive try/catch in event handlers.
 */
export function parseLink(url: string): LinkRoute {
  // Be lenient: handle URLs with or without trailing slash, with or
  // without explicit "://" form.
  const match = /^[a-z][a-z0-9+.-]*:\/\/([^?#]*)(?:\?([^#]*))?(?:#.*)?$/i.exec(url);
  if (!match) {
    return { kind: 'unknown', url };
  }
  const path = (match[1] ?? '').replace(/\/+$/, '');
  const query = match[2] ?? '';

  if (path === '') {
    return { kind: 'home' };
  }

  // /filter/<name>
  const filterMatch = /^filter\/(.+)$/.exec(path);
  if (filterMatch) {
    const name = filterMatch[1] as TodoFilter;
    if (VALID_FILTERS.has(name)) {
      return { kind: 'filter', filter: name };
    }
    return { kind: 'unknown', url };
  }

  // /add  with `?text=...`
  if (path === 'add') {
    const params = new URLSearchParams(query);
    const text = params.get('text') ?? '';
    return { kind: 'add', text };
  }

  return { kind: 'unknown', url };
}
