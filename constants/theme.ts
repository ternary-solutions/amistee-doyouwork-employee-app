/**
 * Design tokens aligned with the Ionic app (index.css).
 * Use these for consistent styling across the RN app.
 */

import { Platform } from 'react-native';

// --- Semantic colors (light theme, Ionic HSL mapping) ---
// Primary: hsl(214, 96%, 29%)
export const primary = '#0b4a91';
export const primaryForeground = '#ffffff';
// Accent (teal): hsl(173, 80%, 40%)
export const accent = '#14a085';
export const accentForeground = '#ffffff';
// Background / surface
export const background = '#fafafa';
export const foreground = '#0f172a';
export const card = '#ffffff';
export const cardForeground = '#0f172a';
// Muted
export const muted = '#e2e8f0';
export const mutedForeground = '#64748b';
// Border / input
export const border = '#cbd5e1';
export const input = '#e2e8f0';
export const ring = '#3b82f6';
// Status
export const destructive = '#ef4444';
export const destructiveForeground = '#ffffff';
/** Light background for destructive actions (e.g. logout button) */
export const destructiveMuted = '#fee2e2';
export const success = '#16a34a';
export const successForeground = '#ffffff';
export const warning = '#eab308';
export const warningForeground = '#ffffff';

/** Primary gradient bottom (darker blue for hero) */
export const primaryDark = '#0a3d75';

/** Status badge backgrounds and text (e.g. Pending, Approved, Denied) */
export const statusPendingBg = '#fef3c7';
export const statusPendingText = '#92400e';
export const statusApprovedBg = '#dcfce7';
export const statusApprovedText = '#166534';
export const statusDeniedBg = '#fee2e2';
export const statusDeniedText = '#991b1b';
export const statusReimbursedBg = '#dcfce7';
export const statusReimbursedText = '#166534';
export const statusBadge = {
  Pending: { bg: statusPendingBg, text: statusPendingText },
  Approved: { bg: statusApprovedBg, text: statusApprovedText },
  Denied: { bg: statusDeniedBg, text: statusDeniedText },
  Reimbursed: { bg: statusReimbursedBg, text: statusReimbursedText },
} as const;

/** All semantic colors in one object for StyleSheet */
export const semanticColors = {
  primary,
  primaryForeground,
  accent,
  accentForeground,
  background,
  foreground,
  card,
  cardForeground,
  muted,
  mutedForeground,
  border,
  input,
  ring,
  destructive,
  destructiveForeground,
  destructiveMuted,
  success,
  successForeground,
  warning,
  warningForeground,
  primaryDark,
} as const;

// --- Spacing (matches Ionic Tailwind usage) ---
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
} as const;

// --- Radius (0.75rem = 12) ---
export const radius = {
  sm: 8,
  base: 12,
  lg: 16,
  full: 9999,
} as const;

// --- Typography ---
export const typography = {
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  bodySm: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  muted: {
    fontSize: 14,
    color: mutedForeground,
  },
  label: {
    fontSize: 12,
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    color: mutedForeground,
  },
  heroDay: {
    fontSize: 36,
    fontWeight: '700' as const,
  },
  heroDate: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
  },
} as const;

// --- Legacy (keep for existing usage) ---
const tintColorLight = primary;
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: foreground,
    background,
    tint: tintColorLight,
    icon: mutedForeground,
    tabIconDefault: mutedForeground,
    tabIconSelected: tintColorLight,
    ...semanticColors,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

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
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
