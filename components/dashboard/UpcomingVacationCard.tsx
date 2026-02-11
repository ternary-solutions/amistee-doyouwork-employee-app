import { Card } from '@/components/ui/Card';
import {
    foreground,
    mutedForeground,
    spacing,
    statusBadge,
    typography,
} from '@/constants/theme';
import { timeOffRequestsService } from '@/services/requests/timeOffs';
import type { TimeOffRequest } from '@/types/requests/timeOffs';
import { format, startOfDay } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export function UpcomingVacationCard() {
  const [items, setItems] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await timeOffRequestsService.list(1, 50);
      const all = res.items || [];
      const today = startOfDay(new Date());
      const todayOrUpcoming = all.filter(
        (item) => startOfDay(new Date(item.end_date)).getTime() >= today.getTime()
      );
      setItems(todayOrUpcoming);
    } catch (e) {
      console.error('[UpcomingVacationCard]', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Card>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={mutedForeground} />
          <Text style={styles.muted}>Loading vacation info...</Text>
        </View>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <Text style={styles.muted}>No upcoming vacation.</Text>
      </Card>
    );
  }

  const first = items[0];
  const startDate = new Date(first.start_date);
  const endDate = new Date(first.end_date);
  const statusStyle = (statusBadge as Record<string, { bg: string; text: string }>)[first.status] ?? { bg: '#f1f5f9', text: mutedForeground };

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.label}>Upcoming Vacation</Text>
        <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.badgeText, { color: statusStyle.text }]}>
            {first.status}
          </Text>
        </View>
      </View>
      <Text style={styles.dates}>
        {format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')}
      </Text>
      <Text style={styles.body}>
        You are scheduled to be off for {first.entity_type} (Paid Time Off).
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.label,
    color: mutedForeground,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dates: {
    fontSize: 14,
    fontWeight: '600',
    color: foreground,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: mutedForeground,
  },
  muted: {
    fontSize: 14,
    color: mutedForeground,
  },
});
