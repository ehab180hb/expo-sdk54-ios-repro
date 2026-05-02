import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';

// Suppress the noisy stderr trace React emits when a child throws —
// the boundary is doing its job; we don't need the alarm in test logs.
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
});

const Bomb = ({ message }: { message: string }) => {
  throw new Error(message);
};

describe('<ErrorBoundary />', () => {
  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <Text testID="ok">healthy</Text>
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('ok')).toHaveTextContent('healthy');
  });

  it('renders the fallback UI when a child throws', () => {
    render(
      <ErrorBoundary scope="test">
        <Bomb message="boom" />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('error-boundary')).toBeTruthy();
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('test')).toBeTruthy();
    expect(screen.getByTestId('error-boundary-retry')).toBeTruthy();
  });

  it('reset clears the error and lets children render again', () => {
    let shouldThrow = true;
    const Toggle = () => {
      if (shouldThrow) throw new Error('oops');
      return <Text testID="recovered">ok</Text>;
    };
    render(
      <ErrorBoundary scope="recovery">
        <Toggle />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('error-boundary')).toBeTruthy();
    shouldThrow = false;
    fireEvent.press(screen.getByTestId('error-boundary-retry'));
    expect(screen.queryByTestId('error-boundary')).toBeNull();
    expect(screen.getByTestId('recovered')).toBeTruthy();
  });

  it('honours a custom fallback render prop', () => {
    render(
      <ErrorBoundary
        scope="custom"
        fallback={(err, reset) => (
          <Text testID="custom-fallback" onPress={reset}>
            custom: {err.message}
          </Text>
        )}
      >
        <Bomb message="nope" />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('custom-fallback')).toHaveTextContent('custom: nope');
  });
});
