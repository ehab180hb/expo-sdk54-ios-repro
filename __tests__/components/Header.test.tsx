import { render, screen } from '@testing-library/react-native';

import { Header } from '@/components/Header';
import { useTodoStore } from '@/store/todoStore';
import type { Todo } from '@/types/todo';

const todo = (overrides: Partial<Todo> = {}): Todo => ({
  id: `t-${Math.random()}`,
  text: 'sample',
  completed: false,
  createdAt: Date.now(),
  ...overrides,
});

beforeEach(() => {
  useTodoStore.setState({ todos: [], filter: 'all' });
});

describe('<Header />', () => {
  it('shows "All clear" when no active todos exist', () => {
    render(<Header />);
    expect(screen.getByTestId('todo-header-count')).toHaveTextContent('All clear');
  });

  it('shows "1 item left" (singular) for one active todo', () => {
    useTodoStore.setState({ todos: [todo({ completed: false })], filter: 'all' });
    render(<Header />);
    expect(screen.getByTestId('todo-header-count')).toHaveTextContent('1 item left');
  });

  it('shows "N items left" (plural) for multiple active todos', () => {
    useTodoStore.setState({
      todos: [todo({ completed: false }), todo({ completed: false }), todo({ completed: false })],
      filter: 'all',
    });
    render(<Header />);
    expect(screen.getByTestId('todo-header-count')).toHaveTextContent('3 items left');
  });

  it('counts only ACTIVE (non-completed) todos', () => {
    useTodoStore.setState({
      todos: [todo({ completed: false }), todo({ completed: true }), todo({ completed: true })],
      filter: 'all',
    });
    render(<Header />);
    expect(screen.getByTestId('todo-header-count')).toHaveTextContent('1 item left');
  });

  it('renders the static title', () => {
    render(<Header />);
    expect(screen.getByText('Todos')).toBeTruthy();
  });
});
