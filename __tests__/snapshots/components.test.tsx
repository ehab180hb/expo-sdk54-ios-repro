// Visual regression via jest snapshots — Plan 4 T4.3.A.
//
// Captures the rendered tree of each pure component. Catches:
//   - theme token drift (color/spacing/font shifts)
//   - copy edits
//   - structural changes (wrapping/unwrapping a View, etc.)
//
// To accept a deliberate change: re-run with `npx jest -u
// __tests__/snapshots/`. Reviewers see the diff in the PR.
//
// We snapshot ONLY pure-rendering components. Components driven
// by zustand state (TodoList, FilterTabs, Header) get exercised
// in their dedicated test files; snapshotting them here would
// duplicate state setup.

import { render } from '@testing-library/react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { EmptyState } from '@/components/EmptyState';
import { useTodoStore } from '@/store/todoStore';

describe('Component snapshots', () => {
  it('<EmptyState /> with filter=all', () => {
    useTodoStore.setState({ filter: 'all', todos: [] });
    const tree = render(<EmptyState />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('<EmptyState /> with filter=active', () => {
    useTodoStore.setState({ filter: 'active', todos: [] });
    const tree = render(<EmptyState />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('<EmptyState /> with filter=completed', () => {
    useTodoStore.setState({ filter: 'completed', todos: [] });
    const tree = render(<EmptyState />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('<ErrorBoundary /> renders children when no error', () => {
    const tree = render(
      <ErrorBoundary>
        <></>
      </ErrorBoundary>,
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
