import { foreground, mutedForeground, primaryForeground, typography } from '@/constants/theme';
import { hapticImpact } from '@/utils/haptics';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { Card } from './Card';

type ListCardProps = {
  title: string;
  subtitle?: string;
  /** Extra lines or content below title (e.g. date, meta) */
  meta?: string | string[];
  badge?: { text: string; backgroundColor?: string; textColor?: string };
  onPress?: () => void;
  children?: React.ReactNode;
};

export function ListCard({ title, subtitle, meta, badge, onPress, children }: ListCardProps) {
  const metaLines = Array.isArray(meta) ? meta : meta ? [meta] : [];
  const content = (
    <View style={styles.row}>
      <View style={styles.main}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.meta}>{subtitle}</Text> : null}
        {metaLines.map((line, i) => (
          <Text key={i} style={styles.meta}>{line}</Text>
        ))}
        {children}
      </View>
      {badge ? (
        <View style={[styles.badge, badge.backgroundColor ? { backgroundColor: badge.backgroundColor } : undefined]}>
          <Text style={[styles.badgeText, badge.textColor ? { color: badge.textColor } : undefined]}>{badge.text}</Text>
        </View>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={() => {
          hapticImpact();
          onPress();
        }}
      >
        <Card>{content}</Card>
      </AnimatedPressable>
    );
  }
  return <Card>{content}</Card>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  main: { flex: 1 },
  title: { ...typography.title, color: foreground, marginBottom: 8 },
  meta: { fontSize: 13, color: mutedForeground, marginBottom: 6 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: mutedForeground,
  },
  badgeText: { color: primaryForeground, fontSize: 12, fontWeight: '500' },
  pressed: { opacity: 0.8 },
});
