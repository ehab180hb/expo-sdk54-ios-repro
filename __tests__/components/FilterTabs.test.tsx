import { fireEvent, render, screen } from '@testing-library/react-native';

import { FilterTabs } from '@/components/FilterTabs';
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

describe('<FilterTabs />', () => {
  it('renders all three filter tabs', () => {
    render(<FilterTabs />);
    expect(screen.getByTestId('filter-all')).toBeTruthy();
    expect(screen.getByTestId('filter-active')).toBeTruthy();
    expect(screen.getByTestId('filter-completed')).toBeTruthy();
  });

  it('marks the active filter selected via accessibilityState', () => {
    useTodoStore.setState({ filter: 'completed' });
    render(<FilterTabs />);
    expect(screen.getByTestId('filter-completed').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByTestId('filter-all').props.accessibilityState).toEqual({
      selected: false,
    });
  });

  it('updates the store when a filter tab is pressed', () => {
    render(<FilterTabs />);
    fireEvent.press(screen.getByTestId('filter-active'));
    expect(useTodoStore.getState().filter).toBe('active');
  });

  it('disables clear-completed when there are no completed todos', () => {
    useTodoStore.setState({ todos: [todo({ completed: false })] });
    render(<FilterTabs />);
    expect(screen.getByTestId('clear-completed').props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
  });

  it('enables clear-completed when at least one todo is completed', () => {
    useTodoStore.setState({ todos: [todo({ completed: true })] });
    render(<FilterTabs />);
    const button = screen.getByTestId('clear-completed');
    // accessibilityState may be unset (undefined disabled) when enabled
    const disabled = button.props.accessibilityState?.disabled ?? false;
    expect(disabled).toBe(false);
  });

  it('clearCompleted action removes completed todos when pressed', () => {
    const completed = todo({ completed: true });
    const active = todo({ completed: false });
    useTodoStore.setState({ todos: [completed, active] });
    render(<FilterTabs />);
    fireEvent.press(screen.getByTestId('clear-completed'));
    const remaining = useTodoStore.getState().todos;
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.completed).toBe(false);
  });
});
