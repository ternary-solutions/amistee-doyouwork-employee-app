import {
  background,
  border,
  destructive,
  foreground,
  muted,
  mutedForeground,
  primary,
  primaryForeground,
  radius,
  spacing,
  success,
} from '@/constants/theme';
import { timeOffRequestsService } from '@/services/requests/timeOffs';
import { getErrorMessage } from '@/utils/errorMessage';
import type { TimeOffRequest } from '@/types/requests/timeOffs';
import { format } from 'date-fns';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { FormModal } from '@/components/ui/FormModal';
import { ListCard } from '@/components/ui/ListCard';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/EmptyState';

const TYPES: Array<'Vacation' | 'Sick' | 'Personal'> = ['Vacation', 'Sick', 'Personal'];
const STATUS_COLORS: Record<string, string> = {
  Pending: mutedForeground,
  Approved: success,
  Denied: destructive,
};

type Filter = 'open' | 'closed';

export default function TimeOffScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('open');
  const [modalOpen, setModalOpen] = useState(false);
  const [entityType, setEntityType] = useState<'Vacation' | 'Sick' | 'Personal'>('Vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const startDateObj = startDate ? new Date(startDate + 'T12:00:00') : new Date();
  const endDateObj = endDate ? new Date(endDate + 'T12:00:00') : new Date();

  const filteredRequests = requests.filter((r) =>
    filter === 'open' ? r.status === 'Pending' : r.status === 'Approved' || r.status === 'Denied'
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await timeOffRequestsService.list(1, 50);
      setRequests(res?.items ?? []);
    } catch (error) {
      console.error('Failed to load time off requests', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to load time off requests. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!startDate.trim() || !endDate.trim()) return;
    try {
      setSubmitting(true);
      await timeOffRequestsService.create({ entity_type: entityType, start_date: startDate, end_date: endDate });
      setModalOpen(false);
      setStartDate('');
      setEndDate('');
      load();
    } catch (error) {
      console.error('Create time off failed', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to submit time off request. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && requests.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.scroll, { backgroundColor: background }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.xl + insets.bottom }]}
      >
        <SegmentedControl
          options={[{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }]}
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
        />

        {requests.length === 0 ? (
          <EmptyState message="No time off requests yet." />
        ) : filteredRequests.length === 0 ? (
          <EmptyState message={`No ${filter === 'open' ? 'open' : 'closed'} time off requests.`} />
        ) : (
          filteredRequests.map((item) => (
            <View key={item.id} style={styles.cardWrap}>
              <ListCard
                title={item.entity_type}
                meta={[
                  `${new Date(item.start_date).toLocaleDateString()} – ${new Date(item.end_date).toLocaleDateString()}`,
                  `${item.time_off_days} day(s)`,
                ]}
                badge={{ text: item.status, backgroundColor: STATUS_COLORS[item.status] ?? '#94a3b8' }}
              />
            </View>
          ))
        )}
      </ScrollView>
      <FormModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New time off request"
        submitLabel="Submit"
        submitting={submitting}
        onSubmit={handleCreate}
      >
        <Text style={styles.label}>Type</Text>
        <View style={styles.picker}>
          {TYPES.map((t) => (
            <Pressable key={t} style={[styles.pickerOption, entityType === t && styles.pickerOptionActive]} onPress={() => setEntityType(t)}>
              <Text style={[styles.pickerOptionText, entityType === t && styles.pickerOptionTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Start date</Text>
        <Pressable style={styles.dateBtn} onPress={() => setShowStartPicker(true)}>
          <Text style={styles.dateBtnText}>{startDate || 'Select start date'}</Text>
        </Pressable>
        {showStartPicker && (
          <DateTimePicker
            value={startDateObj}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => {
              setShowStartPicker(Platform.OS === 'android');
              if (date) setStartDate(format(date, 'yyyy-MM-dd'));
            }}
          />
        )}
        <Text style={styles.label}>End date</Text>
        <Pressable style={styles.dateBtn} onPress={() => setShowEndPicker(true)}>
          <Text style={styles.dateBtnText}>{endDate || 'Select end date'}</Text>
        </Pressable>
        {showEndPicker && (
          <DateTimePicker
            value={endDateObj}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => {
              setShowEndPicker(Platform.OS === 'android');
              if (date) setEndDate(format(date, 'yyyy-MM-dd'));
            }}
          />
        )}
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl },
  list: { padding: spacing.base, paddingBottom: spacing.xl },
  cardWrap: { marginBottom: spacing.md },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6, color: foreground },
  dateBtn: { borderWidth: 1, borderColor: border, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.base },
  dateBtnText: { fontSize: 16, color: foreground },
  input: { borderWidth: 1, borderColor: border, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.base, fontSize: 16 },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  pickerOption: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: muted },
  pickerOptionActive: { backgroundColor: primary },
  pickerOptionText: { fontSize: 14, color: foreground },
  pickerOptionTextActive: { color: primaryForeground },
});
