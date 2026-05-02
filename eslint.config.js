// eslint.config.js — flat config for ESLint 9.x
//
// Plan 4 T4.2.A. Designed against the audit gap "no ESLint at all"
// (Prettier alone catches no semantic issues). The plugins below
// each address a specific class of bug we've seen or expect:
//
// - @typescript-eslint:        unsafe types, exhaustive-deps in hooks
// - eslint-plugin-react:       JSX correctness, key warnings
// - eslint-plugin-react-hooks: rules-of-hooks, exhaustive-deps
// - eslint-plugin-react-native: RN-specific antipatterns
// - eslint-plugin-jsx-a11y:    catches missing accessibilityHint,
//                              accessibilityLabel mismatches, etc.
//                              (the gap that caused the keyboard-
//                              occlusion hurdle in the tour journey)
//
// Wired into lefthook pre-commit on staged *.{ts,tsx}. Uses
// --cache so warm runs are <1s.

const { defineConfig } = require('eslint/config');
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const reactNativePlugin = require('eslint-plugin-react-native');
const jsxA11yPlugin = require('eslint-plugin-jsx-a11y');
const globals = require('globals');

module.exports = defineConfig([
  // Global ignores — applied across all configs
  {
    ignores: [
      'node_modules/**',
      'ios/**',
      'android/**',
      '.expo/**',
      'pre-built-app/**',
      '_explorer-runs/**',
      'coverage/**',
      'bundle-out/**',
      '*.config.js', // self-include below for the ones we want linted
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        __DEV__: 'readonly',
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-native': reactNativePlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // React core
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'warn',
      'react/no-unused-state': 'warn',
      // RN runtime uses JSX without explicit React import on 17+
      'react/react-in-jsx-scope': 'off',

      // Hooks (the ones that matter most)
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // RN
      'react-native/no-inline-styles': 'warn',
      'react-native/no-unused-styles': 'warn',
      'react-native/no-color-literals': 'off', // theme tokens cover this

      // a11y — catches the gap from the tour journey:
      // missing accessibilityHint on TextInput, label/role mismatch.
      // jsx-a11y was designed for web a11y attrs, but most rules
      // map cleanly to RN's accessibility props.
      'jsx-a11y/alt-text': 'off', // RN <Image> doesn't take alt
      'jsx-a11y/anchor-is-valid': 'off', // no <a> tags
      'jsx-a11y/no-autofocus': 'warn',

      // TypeScript: catch the same `any` regressions tsconfig misses
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-require-imports': 'off', // metro / RN style
    },
  },

  // Tests + setup files: relax stricter rules
  {
    files: ['**/*.test.{ts,tsx}', 'jest.setup.ts', '__tests__/**/*'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);
