import { scheduleService } from '@/services/schedules';
import type { MyScheduleResponse } from '@/types/schedules';
import { format, addDays, subDays } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function DashboardScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<MyScheduleResponse[]>([]);
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await scheduleService.getMySchedule(dateStr);
      setSchedules(
        res.filter(
          (s) => s && s.vehicle !== undefined
        )
      );
    } catch (error) {
      console.error('Failed to load schedules', error);
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const dayButtons = [-2, -1, 0, 1, 2].map((delta) => {
    const d = delta === 0 ? selectedDate : delta < 0 ? subDays(selectedDate, -delta) : addDays(selectedDate, delta);
    const isSelected = format(d, 'yyyy-MM-dd') === dateStr;
    return { date: d, isSelected };
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>My Dashboard</Text>
      <Text style={styles.dateLabel}>{format(selectedDate, 'EEEE, MMMM d')}</Text>

      <View style={styles.dayRow}>
        {dayButtons.map(({ date, isSelected }) => (
          <Pressable
            key={date.toISOString()}
            style={[styles.dayBtn, isSelected && styles.dayBtnSelected]}
            onPress={() => setSelectedDate(date)}
          >
            <Text style={[styles.dayBtnText, isSelected && styles.dayBtnTextSelected]}>
              {format(date, 'EEE')}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Schedule</Text>
      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : schedules.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.emptyText}>
            No schedule for {format(selectedDate, 'MMMM d, yyyy')}.
          </Text>
        </View>
      ) : (
        schedules
          .filter((s) => s.vehicle)
          .map((schedule) => (
            <View key={schedule.id || `schedule-${schedule.vehicle?.id}-${dateStr}`} style={styles.card}>
              <Text style={styles.vehicleName}>
                {schedule.vehicle?.vehicle_name || 'Unknown Vehicle'}
              </Text>
              {schedule.assigned_employees.map((member) => (
                <View key={member.id} style={styles.memberRow}>
                  <Text style={styles.memberName}>
                    {[member.first_name, member.last_name].filter(Boolean).join(' ')}
                  </Text>
                </View>
              ))}
              {schedule.notes ? (
                <Text style={styles.notes}>{schedule.notes}</Text>
              ) : null}
            </View>
          ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  dateLabel: { fontSize: 16, color: '#64748b', marginBottom: 16 },
  dayRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  dayBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  dayBtnSelected: { backgroundColor: '#0b4a91' },
  dayBtnText: { fontSize: 14, fontWeight: '500', color: '#64748b' },
  dayBtnTextSelected: { color: '#fff' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  loader: { marginVertical: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  vehicleName: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  memberRow: { paddingVertical: 6, paddingHorizontal: 8, backgroundColor: '#f8fafc', borderRadius: 8, marginBottom: 4 },
  memberName: { fontSize: 14, fontWeight: '500' },
  notes: { fontSize: 13, color: '#64748b', marginTop: 8 },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center' },
});
