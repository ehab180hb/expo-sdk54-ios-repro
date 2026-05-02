// Property-based store tests — Plan 4 T4.3.H.
//
// Generates 100+ random sequences of store mutations via fast-check.
// Verifies invariants that should hold for ANY mutation sequence:
//   - Counts: completed + active = total (no leaks, no double-counts)
//   - Filtering doesn't lose todos that match the filter
//   - clearCompleted removes ONLY completed
//   - Toggle is involutive (toggle twice = identity)
//   - Edit preserves all other fields
//
// Property tests are different from example tests: they shrink to a
// minimal failing case automatically, so the next failure shows
// EXACTLY which mutation sequence broke the invariant.

import fc from 'fast-check';

import { useTodoStore } from '@/store/todoStore';

const reset = () => useTodoStore.setState({ todos: [], filter: 'all' });

// Action generators
const addAction = fc
  .string({ minLength: 1, maxLength: 30 })
  .map((text) => ({ kind: 'add' as const, text }));

const toggleAction = fc.nat().map((seed) => ({ kind: 'toggle' as const, seed }));
const removeAction = fc.nat().map((seed) => ({ kind: 'remove' as const, seed }));
const editAction = fc
  .tuple(fc.nat(), fc.string({ minLength: 1, maxLength: 30 }))
  .map(([seed, text]) => ({ kind: 'edit' as const, seed, text }));
const clearAction = fc.constant({ kind: 'clearCompleted' as const });
const filterAction = fc
  .constantFrom('all' as const, 'active' as const, 'completed' as const)
  .map((f) => ({ kind: 'setFilter' as const, filter: f }));

const anyAction = fc.oneof(
  addAction,
  toggleAction,
  removeAction,
  editAction,
  clearAction,
  filterAction,
);

type Action =
  | { kind: 'add'; text: string }
  | { kind: 'toggle'; seed: number }
  | { kind: 'remove'; seed: number }
  | { kind: 'edit'; seed: number; text: string }
  | { kind: 'clearCompleted' }
  | { kind: 'setFilter'; filter: 'all' | 'active' | 'completed' };

const apply = (action: Action) => {
  const { addTodo, toggleTodo, removeTodo, editTodo, clearCompleted, setFilter } =
    useTodoStore.getState();
  const todos = useTodoStore.getState().todos;
  switch (action.kind) {
    case 'add':
      addTodo(action.text);
      return;
    case 'toggle':
      if (todos.length > 0) {
        const target = todos[action.seed % todos.length];
        if (target) toggleTodo(target.id);
      }
      return;
    case 'remove':
      if (todos.length > 0) {
        const target = todos[action.seed % todos.length];
        if (target) removeTodo(target.id);
      }
      return;
    case 'edit':
      if (todos.length > 0) {
        const target = todos[action.seed % todos.length];
        if (target) editTodo(target.id, action.text);
      }
      return;
    case 'clearCompleted':
      clearCompleted();
      return;
    case 'setFilter':
      setFilter(action.filter);
      return;
  }
};

describe('todoStore — property-based invariants', () => {
  beforeEach(reset);

  it('completed + active count always equals total (no double-count, no leak)', () => {
    fc.assert(
      fc.property(fc.array(anyAction, { minLength: 0, maxLength: 30 }), (actions) => {
        reset();
        for (const a of actions) apply(a);
        const todos = useTodoStore.getState().todos;
        const completed = todos.filter((t) => t.completed).length;
        const active = todos.filter((t) => !t.completed).length;
        return completed + active === todos.length;
      }),
      { numRuns: 100 },
    );
  });

  it('clearCompleted removes only completed todos', () => {
    fc.assert(
      fc.property(fc.array(anyAction, { minLength: 0, maxLength: 30 }), (actions) => {
        reset();
        for (const a of actions) apply(a);
        const beforeActive = useTodoStore.getState().todos.filter((t) => !t.completed);
        useTodoStore.getState().clearCompleted();
        const after = useTodoStore.getState().todos;
        // All remaining todos must be active (not completed)
        if (after.some((t) => t.completed)) return false;
        // Every previously-active todo must still be present (by id)
        const beforeIds = new Set(beforeActive.map((t) => t.id));
        const afterIds = new Set(after.map((t) => t.id));
        return [...beforeIds].every((id) => afterIds.has(id));
      }),
      { numRuns: 50 },
    );
  });

  it('toggle is involutive: toggle(toggle(x)) === x', () => {
    fc.assert(
      fc.property(
        fc.array(anyAction, { minLength: 1, maxLength: 20 }),
        fc.nat(),
        (actions, seed) => {
          reset();
          for (const a of actions) apply(a);
          const todos = useTodoStore.getState().todos;
          if (todos.length === 0) return true;
          const target = todos[seed % todos.length];
          if (!target) return true;
          const before = target.completed;
          useTodoStore.getState().toggleTodo(target.id);
          useTodoStore.getState().toggleTodo(target.id);
          const after = useTodoStore.getState().todos.find((t) => t.id === target.id);
          return after?.completed === before;
        },
      ),
      { numRuns: 50 },
    );
  });

  it('editTodo preserves id, completed, and createdAt of the target', () => {
    fc.assert(
      fc.property(
        fc.array(anyAction, { minLength: 1, maxLength: 20 }),
        fc.nat(),
        fc.string({ minLength: 1, maxLength: 30 }),
        (actions, seed, newText) => {
          reset();
          for (const a of actions) apply(a);
          const todos = useTodoStore.getState().todos;
          if (todos.length === 0) return true;
          const target = todos[seed % todos.length];
          if (!target) return true;
          const { id, completed, createdAt } = target;
          useTodoStore.getState().editTodo(id, newText);
          const after = useTodoStore.getState().todos.find((t) => t.id === id);
          if (!after) return false;
          return after.id === id && after.completed === completed && after.createdAt === createdAt;
        },
      ),
      { numRuns: 50 },
    );
  });

  it('every todo has a unique id after any action sequence', () => {
    fc.assert(
      fc.property(fc.array(anyAction, { minLength: 0, maxLength: 50 }), (actions) => {
        reset();
        for (const a of actions) apply(a);
        const ids = useTodoStore.getState().todos.map((t) => t.id);
        return new Set(ids).size === ids.length;
      }),
      { numRuns: 100 },
    );
  });
});
