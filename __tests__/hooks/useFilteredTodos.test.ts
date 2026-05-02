import { filterTodos } from '@/hooks/useFilteredTodos';
import type { Todo } from '@/types/todo';

const makeTodo = (overrides: Partial<Todo>): Todo => ({
  id: 'id-' + Math.random(),
  text: 'todo',
  completed: false,
  createdAt: 0,
  ...overrides,
});

describe('filterTodos', () => {
  const todos = [
    makeTodo({ id: '1', completed: false }),
    makeTodo({ id: '2', completed: true }),
    makeTodo({ id: '3', completed: false }),
  ];

  it('returns all todos when filter is "all"', () => {
    expect(filterTodos(todos, 'all')).toHaveLength(3);
  });

  it('returns only incomplete when filter is "active"', () => {
    const result = filterTodos(todos, 'active');
    expect(result.map((t) => t.id)).toEqual(['1', '3']);
  });

  it('returns only completed when filter is "completed"', () => {
    const result = filterTodos(todos, 'completed');
    expect(result.map((t) => t.id)).toEqual(['2']);
  });

  it('handles empty input', () => {
    expect(filterTodos([], 'all')).toEqual([]);
    expect(filterTodos([], 'active')).toEqual([]);
    expect(filterTodos([], 'completed')).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const original = [...todos];
    filterTodos(todos, 'active');
    expect(todos).toEqual(original);
  });
});
