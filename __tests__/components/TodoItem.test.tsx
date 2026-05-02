import { fireEvent, render, screen } from '@testing-library/react-native';

import { TodoItem } from '@/components/TodoItem';
import { useTodoStore } from '@/store/todoStore';
import type { Todo } from '@/types/todo';

const baseTodo: Todo = {
  id: 'todo-1',
  text: 'walk the dog',
  completed: false,
  createdAt: Date.now(),
};

beforeEach(() => {
  useTodoStore.setState({ todos: [baseTodo], filter: 'all' });
});

describe('<TodoItem />', () => {
  it('renders the text', () => {
    render(<TodoItem todo={baseTodo} />);
    expect(screen.getByTestId('todo-text-todo-1')).toHaveTextContent('walk the dog');
  });

  it('shows the checkbox unchecked by default', () => {
    render(<TodoItem todo={baseTodo} />);
    const item = screen.getByTestId('todo-item-todo-1');
    expect(item.props.accessibilityState).toEqual({ checked: false });
  });

  it('toggles completed on press', () => {
    render(<TodoItem todo={baseTodo} />);
    fireEvent.press(screen.getByTestId('todo-item-todo-1'));
    expect(useTodoStore.getState().todos[0]?.completed).toBe(true);
  });

  it('reflects completed state via accessibilityState', () => {
    const completed: Todo = { ...baseTodo, completed: true };
    render(<TodoItem todo={completed} />);
    const item = screen.getByTestId('todo-item-todo-1');
    expect(item.props.accessibilityState).toEqual({ checked: true });
  });

  it('exposes a labeled delete button via swipe action', () => {
    render(<TodoItem todo={baseTodo} />);
    expect(screen.getByTestId('todo-delete-todo-1')).toBeTruthy();
  });

  it('removes the todo when delete is pressed', () => {
    render(<TodoItem todo={baseTodo} />);
    fireEvent.press(screen.getByTestId('todo-delete-todo-1'));
    expect(useTodoStore.getState().todos).toHaveLength(0);
  });
});
