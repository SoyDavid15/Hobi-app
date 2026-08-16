/**
 * Colors: White background, solid Café and Blue, no gradients, rounded borders.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1F1F1F',
    background: '#FFFFFF',
    backgroundElement: '#F7F6F3',
    backgroundSelected: '#EAE6E1',
    textSecondary: '#6B655E',
    primary: '#1D4ED8', // Solid Blue
    accent: '#6F4E37',  // Solid Café
  },
  dark: {
    text: '#1F1F1F',
    background: '#FFFFFF',
    backgroundElement: '#F7F6F3',
    backgroundSelected: '#EAE6E1',
    textSecondary: '#6B655E',
    primary: '#1D4ED8', // Solid Blue
    accent: '#6F4E37',  // Solid Café
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BorderRadius = {
  small: 12,
  medium: 20,
  large: 28,
  full: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
