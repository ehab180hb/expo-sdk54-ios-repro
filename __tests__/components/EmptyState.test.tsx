import { render, screen } from '@testing-library/react-native';

import { EmptyState } from '@/components/EmptyState';
import { useTodoStore } from '@/store/todoStore';

// Plan 4 T4.2.E. Specifically prevents the iter-1 hurdle from
// the cloud-iOS tour journey (run 25256238601): the empty-state
// copy varies by filter, and the Maestro tour asserted the wrong
// variant. Each filter's title is locked to a test here so a
// future copy edit can't silently reshape user-visible text.

beforeEach(() => {
  useTodoStore.setState({ todos: [], filter: 'all' });
});

describe('<EmptyState />', () => {
  it('renders the testID for Maestro flows', () => {
    render(<EmptyState />);
    expect(screen.getByTestId('empty-state')).toBeTruthy();
  });

  it('shows "No todos yet" when filter is all', () => {
    useTodoStore.setState({ filter: 'all' });
    render(<EmptyState />);
    expect(screen.getByText('No todos yet')).toBeTruthy();
    expect(screen.getByText(/get started/i)).toBeTruthy();
  });

  it('shows "Nothing to do" when filter is active', () => {
    useTodoStore.setState({ filter: 'active' });
    render(<EmptyState />);
    expect(screen.getByText('Nothing to do')).toBeTruthy();
    expect(screen.getByText(/checked off/i)).toBeTruthy();
  });

  it('shows "No completed todos" when filter is completed', () => {
    useTodoStore.setState({ filter: 'completed' });
    render(<EmptyState />);
    expect(screen.getByText('No completed todos')).toBeTruthy();
    expect(screen.getByText(/check one off/i)).toBeTruthy();
  });
});
