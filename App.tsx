// IMPORTANT: side-effect imports must come first and in this exact order.
// gesture-handler must be imported before any view that uses gestures.
// unistyles MUST be imported before any component that calls
// StyleSheet.create with the theme arg.
import 'react-native-gesture-handler';
import '@/theme/unistyles';

import { useEffect } from 'react';
import { Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { parseLink } from '@/lib/linking';
import { markLaunch } from '@/lib/perf';
import { HomeScreen } from '@/screens/HomeScreen';
import { useTodoStore } from '@/store/todoStore';

// Plan 4 T4.3.E: capture launch time as early as possible.
markLaunch();

// Apply a deep-link route to the app state. Deliberately minimal —
// no destructive actions; see src/lib/linking.ts for the route map.
function applyLink(url: string) {
  const route = parseLink(url);
  switch (route.kind) {
    case 'filter':
      useTodoStore.getState().setFilter(route.filter);
      return;
    case 'add':
      // Future: surface the prefill via a transient draft slice +
      // focus the input. For now the route is recognised but not
      // wired to the input ref (out of scope for T4.2.C).
      return;
    case 'home':
    case 'unknown':
      return;
  }
}

export default function App() {
  useEffect(() => {
    // Cold-launch deep link
    Linking.getInitialURL().then((url) => {
      if (url) applyLink(url);
    });
    // Warm-link while running
    const sub = Linking.addEventListener('url', ({ url }) => applyLink(url));
    return () => sub.remove();
  }, []);

  return (
    <ErrorBoundary scope="root">
      <SafeAreaProvider>
        <ErrorBoundary scope="screen:home">
          <HomeScreen />
        </ErrorBoundary>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
