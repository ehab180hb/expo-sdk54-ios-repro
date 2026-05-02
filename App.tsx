// IMPORTANT: side-effect imports must come first and in this exact order.
// gesture-handler must be imported before any view that uses gestures.
// unistyles MUST be imported before any component that calls
// StyleSheet.create with the theme arg.
import 'react-native-gesture-handler';
import '@/theme/unistyles';

import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HomeScreen } from '@/screens/HomeScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <HomeScreen />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
