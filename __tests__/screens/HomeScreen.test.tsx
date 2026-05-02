import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HomeScreen } from '@/screens/HomeScreen';
import { useTodoStore } from '@/store/todoStore';

// Test-stable metrics so SafeAreaProvider renders children immediately
// (the real provider waits on a native layout pass before painting).
const TEST_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderHome = () =>
  render(
    <SafeAreaProvider initialMetrics={TEST_METRICS}>
      <HomeScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  useTodoStore.setState({ todos: [], filter: 'all' });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('<HomeScreen />', () => {
  it('renders the hydration spinner while persistence is rehydrating', () => {
    jest.spyOn(useTodoStore.persist, 'hasHydrated').mockReturnValue(false);
    renderHome();
    expect(screen.getByTestId('hydrating')).toBeTruthy();
    // None of the main UI should render yet
    expect(screen.queryByTestId('todo-header')).toBeNull();
    expect(screen.queryByTestId('add-todo-input')).toBeNull();
  });

  it('renders the full app surface after hydration completes', () => {
    jest.spyOn(useTodoStore.persist, 'hasHydrated').mockReturnValue(true);
    renderHome();
    expect(screen.queryByTestId('hydrating')).toBeNull();
    expect(screen.getByTestId('todo-header')).toBeTruthy();
    expect(screen.getByTestId('add-todo-input')).toBeTruthy();
    expect(screen.getByTestId('filter-tabs')).toBeTruthy();
  });

  it('renders the empty state when hydrated but no todos exist', () => {
    jest.spyOn(useTodoStore.persist, 'hasHydrated').mockReturnValue(true);
    renderHome();
    expect(screen.getByTestId('empty-state')).toBeTruthy();
  });
});
