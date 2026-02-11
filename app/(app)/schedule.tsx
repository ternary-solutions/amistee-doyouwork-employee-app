import { WeekDaySelector } from '@/components/dashboard/WeekDaySelector';
import { Card } from '@/components/ui/Card';
import { SkeletonScheduleCard } from '@/components/ui/Skeleton';
import { scheduleService } from '@/services/schedules';
import type { MyScheduleResponse } from '@/types/schedules';
import { useMainStore } from '@/store/main';
import { getMediaSource } from '@/utils/api';
import { getErrorMessage } from '@/utils/errorMessage';
import {
  accent,
  accentForeground,
  background,
  border,
  foreground,
  muted,
  mutedForeground,
  primary,
  spacing,
  typography,
} from '@/constants/theme';
import { useSetHeaderOptions } from '@/contexts/HeaderOptionsContext';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';

export default function ScheduleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const me = useMainStore((s) => s.me);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<MyScheduleResponse[]>([]);
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  useSetHeaderOptions(
    useMemo(
      () => ({
        title: 'My Schedule',
        subtitle: 'View your assigned schedule by date.',
        showBack: false,
      }),
      [],
    ),
  );

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await scheduleService.getMySchedule(dateStr);
      setSchedules(res.filter((s) => s && s.vehicle !== undefined));
    } catch (error) {
      console.error('Failed to load schedules', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to load schedule. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    if (!me) return;
    loadSchedules();
  }, [me, loadSchedules]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: background }]}
      contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + insets.bottom }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadSchedules} tintColor={primary} />
      }
    >
      <WeekDaySelector selectedDate={selectedDate} onDateChange={setSelectedDate} />

      <Text style={styles.sectionTitle}>My Schedule</Text>
      {loading && schedules.length === 0 ? (
        <View style={styles.skeletonWrap}>
          <SkeletonScheduleCard />
          <SkeletonScheduleCard />
          <SkeletonScheduleCard />
        </View>
      ) : schedules.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>
            No schedule for {format(selectedDate, 'MMMM d, yyyy')}.
          </Text>
        </Card>
      ) : (
        schedules
          .filter((s) => s.vehicle)
          .map((schedule) => (
            <Card
              key={
                schedule.id ||
                `schedule-${schedule.vehicle?.id}-${dateStr}`
              }
              style={styles.scheduleCard}
              accessibilityLabel={`Schedule for ${schedule.vehicle?.vehicle_name || 'Unknown vehicle'}, ${format(selectedDate, 'MMMM d, yyyy')}`}
              accessibilityRole="summary"
            >
              <View style={styles.vehicleRow}>
                <View style={styles.vehicleIcon}>
                  {schedule.vehicle?.image_url ? (
                    <Image
                      source={getMediaSource(schedule.vehicle.image_url)}
                      style={styles.vehicleImage}
                    />
                  ) : (
                    <Text style={styles.vehicleIconText}>🚗</Text>
                  )}
                </View>
                <Text style={styles.vehicleName}>
                  {schedule.vehicle?.vehicle_name || 'Unknown Vehicle'}
                </Text>
              </View>
              <View style={styles.membersBlock}>
                {schedule.assigned_employees.map((member) => (
                  <View key={member.id} style={styles.memberRow}>
                    <View style={styles.memberIcon}>
                      <Text style={styles.memberIconText}>👤</Text>
                    </View>
                    <Text style={styles.memberName}>
                      {[member.first_name, member.last_name]
                        .filter(Boolean)
                        .join(' ')}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.notesBlock}>
                <Text style={styles.notesLabel}>Notes</Text>
                <Text
                  style={[
                    styles.notesText,
                    !schedule.notes && styles.notesPlaceholder,
                  ]}
                >
                  {schedule.notes || 'No notes'}
                </Text>
              </View>
            </Card>
          ))
      )}

      <View style={styles.ctaBtnWrap}>
        <Button
          variant="accent"
          pill
          onPress={() => router.push('/(app)/time-off')}
          accessibilityLabel="Request time off"
          accessibilityRole="button"
        >
          <View style={styles.ctaBtnContent}>
            <Text style={styles.ctaBtnText}>Request Time Off</Text>
            <Ionicons name="add" size={20} color={accentForeground} style={styles.ctaBtnIcon} />
          </View>
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.base },
  sectionTitle: {
    ...typography.sectionTitle,
    color: foreground,
    marginBottom: spacing.lg,
  },
  skeletonWrap: { gap: 0 },
  emptyText: {
    fontSize: 14,
    color: mutedForeground,
    textAlign: 'center',
  },
  scheduleCard: { marginBottom: spacing.base },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  vehicleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: muted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  vehicleImage: { width: '100%', height: '100%' },
  vehicleIconText: { fontSize: 20 },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: foreground,
    flex: 1,
  },
  membersBlock: { gap: spacing.sm, marginBottom: spacing.md },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: muted,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginBottom: 4,
  },
  memberIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberIconText: { fontSize: 14 },
  memberName: {
    fontSize: 14,
    fontWeight: '500',
    color: foreground,
  },
  notesBlock: { marginTop: spacing.sm },
  notesLabel: {
    ...typography.label,
    color: mutedForeground,
    marginBottom: 4,
  },
  notesText: { fontSize: 14, color: foreground },
  notesPlaceholder: { color: mutedForeground, fontStyle: 'italic' },
  ctaBtnWrap: { marginTop: spacing.lg },
  ctaBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: accentForeground,
  },
  ctaBtnIcon: { marginLeft: 2 },
});
