import { render, screen } from '@testing-library/react-native';

import { TodoList } from '@/components/TodoList';
import { useTodoStore } from '@/store/todoStore';
import type { Todo } from '@/types/todo';

const todo = (id: string, overrides: Partial<Todo> = {}): Todo => ({
  id,
  text: `task ${id}`,
  completed: false,
  createdAt: Date.now(),
  ...overrides,
});

beforeEach(() => {
  useTodoStore.setState({ todos: [], filter: 'all' });
});

describe('<TodoList />', () => {
  it('renders <EmptyState /> when no todos match the filter', () => {
    render(<TodoList />);
    expect(screen.getByTestId('empty-state')).toBeTruthy();
    expect(screen.queryByTestId('todo-list')).toBeNull();
  });

  it('renders the FlatList with the testID once todos exist', () => {
    useTodoStore.setState({
      todos: [todo('a'), todo('b')],
      filter: 'all',
    });
    render(<TodoList />);
    expect(screen.getByTestId('todo-list')).toBeTruthy();
    expect(screen.queryByTestId('empty-state')).toBeNull();
  });

  it('renders each todo in the active filter set', () => {
    useTodoStore.setState({
      todos: [
        todo('a', { completed: false, text: 'walk dog' }),
        todo('b', { completed: true, text: 'buy milk' }),
      ],
      filter: 'active',
    });
    render(<TodoList />);
    // Active filter shows only the uncompleted one
    expect(screen.getByTestId('todo-text-a')).toHaveTextContent('walk dog');
    expect(screen.queryByTestId('todo-text-b')).toBeNull();
  });

  it('falls back to EmptyState when filter excludes everything', () => {
    useTodoStore.setState({
      todos: [todo('a', { completed: false })],
      filter: 'completed',
    });
    render(<TodoList />);
    expect(screen.getByTestId('empty-state')).toBeTruthy();
  });
});
