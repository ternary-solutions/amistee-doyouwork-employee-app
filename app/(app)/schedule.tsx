import {
  accent,
  background,
  border,
  card,
  foreground,
  muted,
  mutedForeground,
  primary,
  spacing,
  typography,
} from '@/constants/theme';
import { scheduleService } from '@/services/schedules';
import type { MyScheduleResponse } from '@/types/schedules';
import { getMediaUrl } from '@/utils/api';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Card } from '@/components/ui/Card';

export default function ScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedules, setSchedules] = useState<MyScheduleResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const weekStart = useMemo(
    () => startOfWeek(selectedDate, { weekStartsOn: 0 }),
    [selectedDate]
  );
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await scheduleService.getMySchedule(dateStr);
      setSchedules(res.filter((s) => s && s.vehicle !== undefined));
    } catch (error) {
      console.error('[Schedule] Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handlePrevDay = () => setSelectedDate((prev) => addDays(prev, -1));
  const handleNextDay = () => setSelectedDate((prev) => addDays(prev, 1));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>My Schedule</Text>

      {/* Date selector */}
      <View style={styles.dateSelector}>
        <Pressable onPress={handlePrevDay} style={styles.navBtn} accessibilityLabel="Previous day">
          <Text style={styles.navBtnText}>‹</Text>
        </Pressable>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekStrip}
        >
          {weekDays.map((day) => {
            const isActive = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            return (
              <Pressable
                key={day.toISOString()}
                onPress={() => setSelectedDate(day)}
                style={[styles.dayBtn, isActive && styles.dayBtnActive]}
              >
                <Text style={[styles.dayLabel, isActive && styles.dayLabelActive]}>
                  {format(day, 'EEE')}
                </Text>
                <Text style={[styles.dayNum, isActive && styles.dayNumActive]}>
                  {format(day, 'd')}
                </Text>
                {isToday && !isActive && <View style={styles.todayDot} />}
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable onPress={handleNextDay} style={styles.navBtn} accessibilityLabel="Next day">
          <Text style={styles.navBtnText}>›</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      ) : schedules.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>
            No schedule for {format(selectedDate, 'MMMM d, yyyy')}.
          </Text>
        </Card>
      ) : (
        schedules.map((schedule) => (
          <Card
            key={
              schedule.id || `schedule-${schedule.vehicle?.id}-${dateStr}`
            }
            style={styles.scheduleCard}
          >
            <View style={styles.vehicleRow}>
              <View style={styles.vehicleIcon}>
                {schedule.vehicle?.image_url ? (
                  <Image
                    source={{ uri: getMediaUrl(schedule.vehicle.image_url) }}
                    style={styles.vehicleImage}
                  />
                ) : (
                  <Text style={styles.vehicleIconText}>🚗</Text>
                )}
              </View>
              <Text style={styles.vehicleName}>
                {schedule.vehicle?.vehicle_name || 'Unknown Vehicle'}
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Scheduled</Text>
              </View>
            </View>
            <Text style={styles.dateLine}>
              {format(new Date(schedule.date), 'MMMM d, yyyy')}
            </Text>
            {schedule.assigned_employees.length > 0 && (
              <View style={styles.membersBlock}>
                <Text style={styles.membersLabel}>Team</Text>
                {schedule.assigned_employees.map((member) => (
                  <View key={member.id} style={styles.memberRow}>
                    <Text style={styles.memberName}>
                      {[member.first_name, member.last_name]
                        .filter(Boolean)
                        .join(' ')}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            {schedule.notes ? (
              <View style={styles.notesBlock}>
                <Text style={styles.notesText}>{schedule.notes}</Text>
              </View>
            ) : null}
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.base, paddingBottom: spacing.xl },
  title: { ...typography.sectionTitle, color: foreground, marginBottom: spacing.base },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: card,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: border,
  },
  navBtn: { padding: spacing.sm, minWidth: 40, alignItems: 'center' },
  navBtnText: { fontSize: 24, color: foreground, fontWeight: '600' },
  weekStrip: { flexDirection: 'row', gap: spacing.sm, flex: 1 },
  dayBtn: {
    minWidth: 50,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: background,
    borderWidth: 1,
    borderColor: border,
  },
  dayBtnActive: { backgroundColor: primary, borderColor: primary },
  dayLabel: { fontSize: 12, color: mutedForeground },
  dayLabelActive: { color: '#fff' },
  dayNum: { fontSize: 16, fontWeight: '600', color: foreground },
  dayNumActive: { color: '#fff' },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: accent,
    marginTop: 4,
  },
  loaderWrap: { alignItems: 'center', marginVertical: spacing.xl },
  emptyText: {
    fontSize: 14,
    color: mutedForeground,
    textAlign: 'center',
    padding: spacing.lg,
  },
  scheduleCard: { marginBottom: spacing.base },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: muted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  vehicleImage: { width: '100%', height: '100%' },
  vehicleIconText: { fontSize: 22 },
  vehicleName: { flex: 1, fontSize: 18, fontWeight: '600', color: foreground },
  badge: {
    backgroundColor: accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  dateLine: { fontSize: 14, color: mutedForeground, marginBottom: spacing.sm },
  membersBlock: { marginBottom: spacing.sm },
  membersLabel: { ...typography.label, color: mutedForeground, marginBottom: 4 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: muted,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginBottom: 4,
  },
  memberName: { fontSize: 14, fontWeight: '500', color: foreground },
  notesBlock: { marginTop: spacing.sm, backgroundColor: muted, padding: spacing.sm, borderRadius: 8 },
  notesText: { fontSize: 14, color: foreground },
});
