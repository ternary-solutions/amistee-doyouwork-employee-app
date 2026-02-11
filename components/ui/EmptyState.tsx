import { mutedForeground, spacing, typography } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

type EmptyStateProps = {
  message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  text: {
    fontSize: 15,
    color: mutedForeground,
    ...typography.body,
  },
});
