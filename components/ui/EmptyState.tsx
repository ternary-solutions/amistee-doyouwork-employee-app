import { mutedForeground, spacing, typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedFadeIn } from './AnimatedFadeIn';
import { Button } from './Button';

type EmptyStateProps = {
  message: string;
  /** Optional contextual icon name (Ionicons) */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Optional primary CTA button */
  action?: {
    label: string;
    onPress: () => void;
  };
};

export function EmptyState({ message, icon, action }: EmptyStateProps) {
  return (
    <AnimatedFadeIn duration={220}>
      <View style={styles.wrapper}>
      {icon && (
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={48} color={mutedForeground} />
        </View>
      )}
      <Text style={styles.text}>{message}</Text>
      {action && (
        <Button
          variant="primary"
          size="md"
          onPress={action.onPress}
          style={styles.actionBtn}
        >
          {action.label}
        </Button>
      )}
      </View>
    </AnimatedFadeIn>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: spacing.md,
  },
  text: {
    fontSize: 15,
    color: mutedForeground,
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  actionBtn: {
    marginTop: spacing.sm,
  },
});
