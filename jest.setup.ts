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
//
// CRITICAL: components call `StyleSheet.create((theme) => ({...}))`
// (function form) — but RN core's StyleSheet.create only accepts an
// object. We invoke the function with a stub theme that satisfies the
// shape used in `src/theme/tokens.ts`.
jest.mock('react-native-unistyles', () => {
  const RN = jest.requireActual('react-native');
  // Stub theme — minimal shape covering what every component reads.
  // If a component reads a new token, add it here.
  const stubTheme = {
    colors: {
      background: '#fff',
      surface: '#fff',
      surfaceMuted: '#eee',
      border: '#ddd',
      textPrimary: '#000',
      textSecondary: '#666',
      textOnAccent: '#fff',
      accent: '#5b5bf0',
      accentMuted: '#c5c5fa',
      danger: '#e1395b',
      success: '#27b26b',
    },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
    radii: { sm: 6, md: 10, lg: 14, pill: 999 },
    typography: {
      h1: { fontSize: 32, fontWeight: '700', lineHeight: 38 },
      h2: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
      body: { fontSize: 17, fontWeight: '400', lineHeight: 22 },
      bodyStrong: { fontSize: 17, fontWeight: '600', lineHeight: 22 },
      caption: { fontSize: 13, fontWeight: '500', lineHeight: 16 },
    },
  };
  return {
    StyleSheet: {
      ...RN.StyleSheet,
      // Handle BOTH the function form (unistyles) and the plain-object
      // form (RN core) — the function form is what our components use.
      create: (input: unknown) => {
        const styles =
          typeof input === 'function' ? (input as (t: unknown) => unknown)(stubTheme) : input;
        return RN.StyleSheet.create(styles);
      },
      configure: jest.fn(),
    },
    UnistylesRuntime: {
      themeName: 'light',
      colorScheme: 'light',
      setTheme: jest.fn(),
    },
  };
});

// react-native-gesture-handler: stub out gesture primitives. Swipeable
// must invoke `renderRightActions` inline so tests can find the
// testIDs of swipe-revealed buttons (e.g., the Delete action).
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const RN = require('react-native');
  const View = RN.View;
  const Swipeable = ({
    children,
    renderRightActions,
    renderLeftActions,
  }: {
    children: React.ReactNode;
    renderRightActions?: () => React.ReactNode;
    renderLeftActions?: () => React.ReactNode;
  }) => {
    return React.createElement(
      View,
      null,
      children,
      renderLeftActions ? renderLeftActions() : null,
      renderRightActions ? renderRightActions() : null,
    );
  };
  return {
    Swipeable,
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
