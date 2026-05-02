import { Component, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

// ErrorBoundary — Plan 4 T4.2.B.
//
// React's only built-in mechanism for catching render-tree errors.
// Wrapped at root (App.tsx) AND per-screen (HomeScreen) so a crash
// in one screen doesn't take down the whole app.
//
// In dev: shows the error message + stack for fast diagnosis.
// In prod: shows a recovery UI with a "try again" reset.
//
// Production crash reporting (Sentry/Bugsnag) plugs into the
// `componentDidCatch` hook below — out of scope for this commit
// but documented as the integration point.

interface Props {
  children: ReactNode;
  /** Optional label distinguishing nested boundaries in logs. */
  scope?: string;
  /** Optional custom fallback. Default = the recovery UI below. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: { componentStack?: string }) {
    // In dev, log to console. In prod, this is the integration point
    // for Sentry / Bugsnag / Crashlytics — call a registered reporter.
    if (__DEV__) {
      console.error(
        `[ErrorBoundary${this.props.scope ? `:${this.props.scope}` : ''}]`,
        error,
        info.componentStack,
      );
    }
    // Future: call a global reporter. Kept out for now to avoid
    // pulling in a reporter SDK before deciding on one.
  }

  reset = () => {
    this.setState({ error: null });
  };

  override render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <View style={styles.container} testID="error-boundary">
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.scope}>{this.props.scope ?? 'app'}</Text>
          {__DEV__ ? (
            <ScrollView style={styles.devBox}>
              <Text style={styles.devText} accessibilityLabel="Error details">
                {this.state.error.message}
                {this.state.error.stack ? `\n\n${this.state.error.stack}` : ''}
              </Text>
            </ScrollView>
          ) : (
            <Text style={styles.body}>
              The screen hit an unexpected error. Tap below to try again.
            </Text>
          )}
          <Pressable
            style={styles.button}
            onPress={this.reset}
            accessibilityRole="button"
            accessibilityLabel="Retry"
            testID="error-boundary-retry"
          >
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    padding: theme.spacing.xxl,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: theme.colors.background,
    gap: theme.spacing.md,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  scope: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  body: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  devBox: {
    maxHeight: 240,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
  },
  devText: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    fontFamily: 'Menlo',
  },
  button: {
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  buttonText: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textOnAccent,
  },
}));
