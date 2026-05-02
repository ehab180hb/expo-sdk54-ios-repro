/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // jest-expo's default transformIgnorePatterns excludes most RN packages
  // from transformation; we add ours that ship untranspiled ESM.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?|react-clone-referenced-element|@react-navigation|@unimodules|unimodules|sentry-expo|native-base|react-native-svg|react-native-unistyles|react-native-reanimated|react-native-worklets|react-native-gesture-handler|react-native-edge-to-edge|react-native-nitro-modules|@react-native-async-storage/async-storage))',
  ],
  setupFiles: ['<rootDir>/jest.setup.ts'],
  // @testing-library/react-native v13+ ships matchers as part of the
  // library — no explicit extend-expect call needed. (Older versions
  // required setupFilesAfterEach, which isn't a real Jest option anyway.)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/__tests__/**/*.test.{ts,tsx}'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/index.ts', '!src/theme/unistyles.ts'],
  coverageThreshold: {
    // Ratchet (Plan 4 T4.2.G): floor only moves UP. Plan target was
    // 80/85/85/80; landed Phase 2 puts us at 86.2 / 100 / 97.24 / 97.14
    // (br/fn/lines/stmt). The 6 previously-zero components (Header,
    // EmptyState, FilterTabs, TodoList, HomeScreen, persistence.ts) +
    // ErrorBoundary all have dedicated tests now.
    //
    // Buffer of ~1-2% under current to absorb natural fluctuation; if
    // a new test pushes coverage higher, RAISE these thresholds in
    // the same PR to lock the gain.
    global: {
      branches: 85,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
};
