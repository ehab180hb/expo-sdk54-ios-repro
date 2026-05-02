/**
 * Design tokens — the single source of truth for color, spacing, type,
 * and radius scales. All component styles reference these via the
 * unistyles theme; nothing in components should hardcode hex values
 * or pixel values.
 *
 * Dark theme is implemented; the system color scheme drives the
 * adaptiveThemes selection in `unistyles.ts`.
 */

const palette = {
  // Greys — used for text, dividers, surfaces
  grey0: '#FFFFFF',
  grey50: '#F7F7F8',
  grey100: '#EAEAEC',
  grey200: '#D2D3D6',
  grey400: '#9395A0',
  grey700: '#3D3F47',
  grey800: '#26282E',
  grey900: '#16181C',
  grey1000: '#0B0C0F',
  // Brand accent — used for primary action + completed-checkmark fill
  brand500: '#5B5BF0',
  brand400: '#7A7AF5',
  brand200: '#C5C5FA',
  // Semantic
  danger500: '#E1395B',
  success500: '#27B26B',
};

export const lightTheme = {
  colors: {
    background: palette.grey50,
    surface: palette.grey0,
    surfaceMuted: palette.grey100,
    border: palette.grey200,
    textPrimary: palette.grey900,
    textSecondary: palette.grey400,
    textOnAccent: palette.grey0,
    accent: palette.brand500,
    accentMuted: palette.brand200,
    danger: palette.danger500,
    success: palette.success500,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radii: {
    sm: 6,
    md: 10,
    lg: 14,
    pill: 999,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 38 },
    h2: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28 },
    body: { fontSize: 17, fontWeight: '400' as const, lineHeight: 22 },
    bodyStrong: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
    caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 16 },
  },
} as const;

export const darkTheme = {
  ...lightTheme,
  colors: {
    background: palette.grey1000,
    surface: palette.grey900,
    surfaceMuted: palette.grey800,
    border: palette.grey700,
    textPrimary: palette.grey0,
    textSecondary: palette.grey400,
    textOnAccent: palette.grey0,
    accent: palette.brand400,
    accentMuted: palette.grey700,
    danger: palette.danger500,
    success: palette.success500,
  },
} as const;

export type AppTheme = typeof lightTheme;
