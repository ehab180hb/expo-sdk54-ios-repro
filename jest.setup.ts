// Jest globals are set up automatically by jest-expo preset; this file
// holds custom mocks for native modules that don't exist in the JSDOM
// test environment.
//
// IMPORTANT: babel-plugin-jest-hoist rejects ANY identifier the static
// analyzer can't trivially prove is in-scope. Closure captures across
// nested functions break this — every helper var must be declared
// INSIDE the same function that uses it.

// expo-haptics: native module, no-op in tests
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// AsyncStorage: in-memory mock (the official mock requires the native
// module to be linked, which doesn't happen in unit tests).
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  return {
    __esModule: true,
    default: {
      setItem: jest.fn((k, v) => {
        store.set(k, v);
        return Promise.resolve();
      }),
      getItem: jest.fn((k) => Promise.resolve(store.get(k) ?? null)),
      removeItem: jest.fn((k) => {
        store.delete(k);
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        store.clear();
        return Promise.resolve();
      }),
      getAllKeys: jest.fn(() => Promise.resolve(Array.from(store.keys()))),
      multiGet: jest.fn((keys) => Promise.resolve(keys.map((k) => [k, store.get(k) ?? null]))),
    },
  };
});

// react-native-unistyles: bypass the native bridge in tests; expose a
// minimal API surface that matches what the components import.
//
// Components call StyleSheet.create((theme) => ({...})) (function form)
// — but RN core's StyleSheet.create only accepts an object. The mock's
// `create` invokes the function with a stub theme before delegating.
// Theme is defined INSIDE the create function so the babel-jest-hoist
// validator sees no closure captures.
jest.mock('react-native-unistyles', () => {
  return {
    StyleSheet: {
      ...require('react-native').StyleSheet,
      create: function (input) {
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
        const styles = typeof input === 'function' ? input(stubTheme) : input;
        return require('react-native').StyleSheet.create(styles);
      },
      configure: jest.fn(),
    },
    UnistylesRuntime: { themeName: 'light', colorScheme: 'light', setTheme: jest.fn() },
  };
});

// react-native-gesture-handler: stub gestures. Swipeable must invoke
// renderRightActions inline so tests can find testIDs of swipe-revealed
// buttons (e.g., the Delete action). Each component does its own
// require() at call time — no closure captures.
jest.mock('react-native-gesture-handler', () => ({
  Swipeable: function (props) {
    return require('react').createElement(
      require('react-native').View,
      null,
      props.children,
      props.renderLeftActions ? props.renderLeftActions() : null,
      props.renderRightActions ? props.renderRightActions() : null,
    );
  },
  GestureHandlerRootView: function (props) {
    return require('react').createElement(require('react-native').View, props, props.children);
  },
  GestureDetector: function (props) {
    return require('react').createElement(require('react-native').View, props, props.children);
  },
  Gesture: { Pan: () => ({ onUpdate: jest.fn(), onEnd: jest.fn() }) },
}));

// react-native-reanimated: official mock from the library
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// silence the "useNativeDriver" warning that fires during `Animated`
jest.spyOn(global.console, 'warn').mockImplementation((msg) => {
  if (typeof msg === 'string' && msg.includes('useNativeDriver')) return;
});
