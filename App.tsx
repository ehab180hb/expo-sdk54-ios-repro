// IMPORTANT: side-effect imports must come first and in this exact order.
// gesture-handler must be imported before any view that uses gestures.
// unistyles MUST be imported before any component that calls
// StyleSheet.create with the theme arg.
import 'react-native-gesture-handler';
import '@/theme/unistyles';

import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HomeScreen } from '@/screens/HomeScreen';

export default function App() {
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
