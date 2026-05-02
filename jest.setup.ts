// Jest globals are set up automatically by jest-expo preset; this file
// holds custom mocks for native modules that don't exist in the JSDOM
// test environment.

// expo-haptics: native module, no-op in tests
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// AsyncStorage: in-memory mock (the official mock requires the native
// module to be linked, which doesn't happen in unit tests).
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      setItem: jest.fn((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve();
      }),
      getItem: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
      removeItem: jest.fn((key: string) => {
        store.delete(key);
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        store.clear();
        return Promise.resolve();
      }),
      getAllKeys: jest.fn(() => Promise.resolve(Array.from(store.keys()))),
      multiGet: jest.fn((keys: string[]) =>
        Promise.resolve(keys.map((k) => [k, store.get(k) ?? null] as [string, string | null])),
      ),
    },
  };
});

// react-native-unistyles: bypass the native bridge in tests; expose a
// minimal API surface that matches what the components import.
jest.mock('react-native-unistyles', () => {
  const RN = jest.requireActual('react-native');
  return {
    StyleSheet: {
      ...RN.StyleSheet,
      // Components call StyleSheet.create({...}) the same way as RN core,
      // so passing through is sufficient for unit tests.
      configure: jest.fn(),
    },
    UnistylesRuntime: {
      themeName: 'light',
      colorScheme: 'light',
      setTheme: jest.fn(),
    },
  };
});

// react-native-gesture-handler: stub out Swipeable/GestureDetector for
// unit tests (their native side requires the gesture handler root view).
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    Swipeable: View,
    GestureHandlerRootView: View,
    GestureDetector: View,
    Gesture: { Pan: () => ({ onUpdate: jest.fn(), onEnd: jest.fn() }) },
  };
});

// react-native-reanimated: official mock from the library
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// silence the "useNativeDriver" warning that fires during `Animated`
jest.spyOn(global.console, 'warn').mockImplementation((msg: string) => {
  if (typeof msg === 'string' && msg.includes('useNativeDriver')) return;
});
