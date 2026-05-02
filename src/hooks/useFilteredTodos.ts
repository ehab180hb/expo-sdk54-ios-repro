/**
 * Selector hook: returns the todos that match the current filter.
 *
 * Lives outside the store because filtering is a derived view, not
 * stored state. Re-derives on every render — fine for the small
 * todo list sizes; if a user accumulates 10k todos, swap to
 * `useShallow` selectors or memoize.
 */
import { useTodoStore } from '@/store/todoStore';
import type { Todo, TodoFilter } from '@/types/todo';

export function filterTodos(todos: Todo[], filter: TodoFilter): Todo[] {
  switch (filter) {
    case 'active':
      return todos.filter((t) => !t.completed);
    case 'completed':
      return todos.filter((t) => t.completed);
    case 'all':
    default:
      return todos;
  }
}

export function useFilteredTodos(): Todo[] {
  const todos = useTodoStore((s) => s.todos);
  const filter = useTodoStore((s) => s.filter);
  return filterTodos(todos, filter);
}

export function useTodoCounts(): { total: number; active: number; completed: number } {
  const todos = useTodoStore((s) => s.todos);
  const completed = todos.filter((t) => t.completed).length;
  return {
    total: todos.length,
    active: todos.length - completed,
    completed,
  };
}
