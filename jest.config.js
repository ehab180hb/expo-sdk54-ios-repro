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
    // Ratchet policy: thresholds set to current actual + 0% (anti-regression).
    // When new tests land that push coverage higher, bump these so the
    // floor only ever moves up. See docs/TESTING.md for the policy detail.
    // Components currently uncovered: Header, EmptyState, FilterTabs,
    // TodoList, HomeScreen — fine to add as iteration continues.
    global: {
      branches: 50,
      functions: 55,
      lines: 55,
      statements: 50,
    },
  },
};
