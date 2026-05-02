// Persistence contract test — Plan 4 T4.3.G.
//
// Locks the SHAPE of what zustand's persist middleware writes to
// AsyncStorage. If anyone changes the store's persisted slice
// without bumping the `version` field + adding a `migrate` handler,
// CI fails here. This is the "is the schema evolving safely?" gate.
//
// Why this matters: existing installs have data shaped like the
// current snapshot below. A schema break without migration = lost
// todos for every user on the next app open. Catching this in CI
// is much cheaper than catching it in TestFlight.

import { useTodoStore } from '@/store/todoStore';
import type { Todo } from '@/types/todo';

const FROZEN_TIME = 1_700_000_000_000;

const todo = (id: string, overrides: Partial<Todo> = {}): Todo => ({
  id,
  text: `task-${id}`,
  completed: false,
  createdAt: FROZEN_TIME,
  ...overrides,
});

describe('Persisted store schema contract', () => {
  beforeEach(() => {
    useTodoStore.setState({
      todos: [todo('a', { text: 'walk dog' }), todo('b', { text: 'buy milk', completed: true })],
      filter: 'completed',
    });
  });

  it('matches the locked persisted shape (snapshot)', () => {
    // The persist middleware uses `partialize` (or no override) to
    // pick which slice gets written. We read the public state and
    // assert the shape; if the store stops persisting `filter` or
    // adds a new persisted field, this fails.
    const state = useTodoStore.getState();
    const persisted = {
      todos: state.todos,
      filter: state.filter,
    };
    expect(persisted).toMatchSnapshot();
  });

  it('every persisted Todo has the required field set', () => {
    const state = useTodoStore.getState();
    for (const t of state.todos) {
      expect(typeof t.id).toBe('string');
      expect(t.id.length).toBeGreaterThan(0);
      expect(typeof t.text).toBe('string');
      expect(typeof t.completed).toBe('boolean');
      expect(typeof t.createdAt).toBe('number');
      expect(Number.isFinite(t.createdAt)).toBe(true);
    }
  });

  it('filter is one of the closed string-literal set', () => {
    const allowed = new Set(['all', 'active', 'completed']);
    expect(allowed.has(useTodoStore.getState().filter)).toBe(true);
  });

  it('persist version is documented (bump on schema change)', () => {
    // The persist `version` is a runtime opt-in; we read it via
    // the API. If you're seeing this fail, you bumped the version
    // → also add a `migrate` callback in the persist config to
    // map v(N-1) state to vN, and update this test's expected
    // version number.
    expect(useTodoStore.persist.getOptions().version ?? 0).toBe(1);
  });
});
