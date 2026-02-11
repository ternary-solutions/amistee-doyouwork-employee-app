import {
  accent,
  accentForeground,
  primary,
  primaryForeground,
  border,
  radius,
  spacing,
  mutedForeground,
} from '@/constants/theme';
import { hapticImpact } from '@/utils/haptics';
import { StyleSheet, Text, type PressableProps } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';

type ButtonVariant = 'primary' | 'accent' | 'outline' | 'ghost';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  children: string | React.ReactNode;
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  /** Pill-shaped (rounded-full) button */
  pill?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  pill,
  style,
  ...rest
}: ButtonProps) {
  const isText = typeof children === 'string';
  const handlePressIn = () => hapticImpact();

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      style={[
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        variant === 'primary' && styles.primary,
        variant === 'accent' && styles.accent,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        pill && styles.pill,
        style,
      ]}
      {...rest}
    >
      {isText ? (
        <Text
          style={[
            styles.text,
            size === 'sm' && styles.textSm,
            variant === 'primary' && styles.textPrimary,
            variant === 'accent' && styles.textAccent,
            variant === 'outline' && styles.textOutline,
            variant === 'ghost' && styles.textGhost,
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.base,
  },
  sm: {
    paddingVertical: 8,
    paddingHorizontal: spacing.base,
    minHeight: 32,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },
  primary: {
    backgroundColor: primary,
  },
  accent: {
    backgroundColor: accent,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pill: {
    borderRadius: radius.full,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 14,
  },
  textPrimary: {
    color: primaryForeground,
  },
  textAccent: {
    color: accentForeground,
  },
  textOutline: {
    color: mutedForeground,
  },
  textGhost: {
    color: mutedForeground,
  },
});

export const buttonStyles = {
  primary: { bg: primary, text: primaryForeground },
  accent: { bg: accent, text: accentForeground },
  outline: { border, text: mutedForeground },
};
