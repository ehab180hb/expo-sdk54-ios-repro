/**
 * Unistyles 3.x theme registration.
 *
 * Must be imported BEFORE any component that calls
 * `StyleSheet.create({ ...withTheme... })`. App.tsx imports this
 * module at the top to guarantee that ordering.
 */
import { StyleSheet } from 'react-native-unistyles';

import { darkTheme, lightTheme, type AppTheme } from './tokens';

const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

const breakpoints = {
  xs: 0,
  sm: 360,
  md: 768,
  lg: 1024,
} as const;

// Module augmentation so StyleSheet.create's theme arg is typed.
type AppBreakpoints = typeof breakpoints;
declare module 'react-native-unistyles' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesThemes {
    light: AppTheme;
    dark: AppTheme;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

// When adaptiveThemes is true, unistyles picks the theme from the
// system color scheme automatically — `initialTheme` is mutually
// exclusive with this and would cause a type error if both are set.
StyleSheet.configure({
  themes,
  breakpoints,
  settings: {
    adaptiveThemes: true,
  },
});
