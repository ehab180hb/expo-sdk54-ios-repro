/**
 * Store unit tests — exercise actions through the public hook surface.
 * Each test resets state via the persist middleware's hydration to
 * avoid leakage. We don't test AsyncStorage round-tripping here; that's
 * covered by the persistence integration test (deferred until needed).
 */
import { act } from '@testing-library/react-native';

import { useTodoStore } from '@/store/todoStore';

beforeEach(() => {
  useTodoStore.setState({ todos: [], filter: 'all' });
});

describe('todoStore', () => {
  describe('addTodo', () => {
    it('prepends a new todo with text trimmed', () => {
      act(() => useTodoStore.getState().addTodo('  buy milk  '));
      const todos = useTodoStore.getState().todos;
      expect(todos).toHaveLength(1);
      expect(todos[0]?.text).toBe('buy milk');
      expect(todos[0]?.completed).toBe(false);
      expect(todos[0]?.id).toBeTruthy();
      expect(todos[0]?.createdAt).toBeGreaterThan(0);
    });

    it('puts new todos at the top', () => {
      act(() => {
        useTodoStore.getState().addTodo('first');
        useTodoStore.getState().addTodo('second');
      });
      const texts = useTodoStore.getState().todos.map((t) => t.text);
      expect(texts).toEqual(['second', 'first']);
    });

    it('ignores empty / whitespace-only input', () => {
      act(() => {
        useTodoStore.getState().addTodo('');
        useTodoStore.getState().addTodo('   ');
        useTodoStore.getState().addTodo('\t\n');
      });
      expect(useTodoStore.getState().todos).toHaveLength(0);
    });
  });

  describe('toggleTodo', () => {
    it('flips the completed flag', () => {
      act(() => useTodoStore.getState().addTodo('todo'));
      const id = useTodoStore.getState().todos[0]!.id;

      act(() => useTodoStore.getState().toggleTodo(id));
      expect(useTodoStore.getState().todos[0]?.completed).toBe(true);

      act(() => useTodoStore.getState().toggleTodo(id));
      expect(useTodoStore.getState().todos[0]?.completed).toBe(false);
    });

    it('is a no-op for unknown ids', () => {
      act(() => useTodoStore.getState().addTodo('todo'));
      act(() => useTodoStore.getState().toggleTodo('nonexistent-id'));
      expect(useTodoStore.getState().todos[0]?.completed).toBe(false);
    });
  });

  describe('removeTodo', () => {
    it('removes the matching todo', () => {
      act(() => {
        useTodoStore.getState().addTodo('a');
        useTodoStore.getState().addTodo('b');
      });
      const targetId = useTodoStore.getState().todos[0]!.id;
      act(() => useTodoStore.getState().removeTodo(targetId));
      const remaining = useTodoStore.getState().todos.map((t) => t.text);
      expect(remaining).toEqual(['a']);
    });
  });

  describe('editTodo', () => {
    it('updates text with trim, leaves other fields alone', () => {
      act(() => useTodoStore.getState().addTodo('old'));
      const before = useTodoStore.getState().todos[0]!;

      act(() => useTodoStore.getState().editTodo(before.id, '  new text  '));
      const after = useTodoStore.getState().todos[0]!;

      expect(after.text).toBe('new text');
      expect(after.id).toBe(before.id);
      expect(after.createdAt).toBe(before.createdAt);
      expect(after.completed).toBe(before.completed);
    });

    it('rejects empty edits (no-op)', () => {
      act(() => useTodoStore.getState().addTodo('old'));
      const id = useTodoStore.getState().todos[0]!.id;
      act(() => useTodoStore.getState().editTodo(id, '   '));
      expect(useTodoStore.getState().todos[0]?.text).toBe('old');
    });
  });

  describe('clearCompleted', () => {
    it('removes only completed todos', () => {
      act(() => {
        useTodoStore.getState().addTodo('keep me');
        useTodoStore.getState().addTodo('delete me');
      });
      const completedId = useTodoStore.getState().todos[0]!.id; // "delete me" is on top
      act(() => useTodoStore.getState().toggleTodo(completedId));
      act(() => useTodoStore.getState().clearCompleted());

      const texts = useTodoStore.getState().todos.map((t) => t.text);
      expect(texts).toEqual(['keep me']);
    });
  });

  describe('setFilter', () => {
    it.each(['all', 'active', 'completed'] as const)('sets filter to %s', (f) => {
      act(() => useTodoStore.getState().setFilter(f));
      expect(useTodoStore.getState().filter).toBe(f);
    });
  });
});
