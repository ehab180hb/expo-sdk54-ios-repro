/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // jest-expo's default transformIgnorePatterns excludes most RN packages
  // from transformation; we add ours that ship untranspiled ESM.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?|react-clone-referenced-element|@react-navigation|@unimodules|unimodules|sentry-expo|native-base|react-native-svg|react-native-unistyles|react-native-reanimated|react-native-worklets|react-native-gesture-handler|react-native-edge-to-edge|react-native-nitro-modules|@react-native-async-storage/async-storage))',
  ],
  setupFiles: ['<rootDir>/jest.setup.ts'],
  setupFilesAfterEach: ['@testing-library/react-native/extend-expect'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/__tests__/**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/index.ts',
    '!src/theme/unistyles.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
