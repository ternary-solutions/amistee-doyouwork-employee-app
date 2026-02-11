import {
  border,
  card,
  destructive,
  foreground,
  muted,
  mutedForeground,
  primary,
  primaryForeground,
  radius,
  spacing,
  success,
  typography,
} from '@/constants/theme';
import { timeOffRequestsService } from '@/services/requests/timeOffs';
import type { TimeOffRequest } from '@/types/requests/timeOffs';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TYPES: Array<'Vacation' | 'Sick' | 'Personal'> = ['Vacation', 'Sick', 'Personal'];
const STATUS_COLORS: Record<string, string> = {
  Pending: mutedForeground,
  Approved: success,
  Denied: destructive,
};

type Filter = 'open' | 'closed';

export default function TimeOffScreen() {
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('open');
  const [modalOpen, setModalOpen] = useState(false);
  const [entityType, setEntityType] = useState<'Vacation' | 'Sick' | 'Personal'>('Vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      <View style={styles.header}>
        <Text style={styles.title}>Time Off Requests</Text>
        <Pressable style={styles.createBtn} onPress={() => setModalOpen(true)} accessibilityLabel="New time off request" accessibilityRole="button">
          <Text style={styles.createBtnText}>New request</Text>
        </Pressable>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.xl + insets.bottom }]}
      >
        <Text style={styles.subtitle}>Submit and track your time off requests</Text>
        <View style={styles.segmented}>
          <Pressable
            style={[styles.segmentedBtn, filter === 'open' && styles.segmentedBtnActive]}
            onPress={() => setFilter('open')}
          >
            <Text style={[styles.segmentedBtnText, filter === 'open' && styles.segmentedBtnTextActive]}>
              Open
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentedBtn, filter === 'closed' && styles.segmentedBtnActive]}
            onPress={() => setFilter('closed')}
          >
            <Text style={[styles.segmentedBtnText, filter === 'closed' && styles.segmentedBtnTextActive]}>
              Closed
            </Text>
          </Pressable>
        </View>

        {requests.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No time off requests yet.</Text>
          </View>
        ) : filteredRequests.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No {filter === 'open' ? 'open' : 'closed'} time off requests.
            </Text>
          </View>
        ) : (
          filteredRequests.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardMain}>
                  <Text style={styles.cardTitle}>{item.entity_type}</Text>
                  <Text style={styles.meta}>
                    {new Date(item.start_date).toLocaleDateString()} – {new Date(item.end_date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.meta}>{item.time_off_days} day(s)</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] ?? '#94a3b8' }]}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New time off request</Text>
            <Text style={styles.label}>Type</Text>
            <View style={styles.picker}>
              {TYPES.map((t) => (
                <Pressable key={t} style={[styles.pickerOption, entityType === t && styles.pickerOptionActive]} onPress={() => setEntityType(t)}>
                  <Text style={[styles.pickerOptionText, entityType === t && styles.pickerOptionTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Start date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="2025-02-15" />
            <Text style={styles.label}>End date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="2025-02-16" />
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setModalOpen(false)} accessibilityLabel="Cancel" accessibilityRole="button">
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleCreate} disabled={submitting} accessibilityLabel={submitting ? 'Submitting' : 'Submit time off request'} accessibilityRole="button">
                <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: 4 },
  title: { ...typography.sectionTitle, color: foreground },
  createBtn: { backgroundColor: primary, paddingHorizontal: spacing.base, paddingVertical: 10, borderRadius: radius.sm },
  createBtnText: { color: primaryForeground, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl },
  subtitle: { fontSize: 14, color: mutedForeground, marginBottom: spacing.base },
  segmented: { flexDirection: 'row', marginBottom: spacing.base, backgroundColor: muted, borderRadius: radius.sm, padding: 2 },
  segmentedBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.sm - 2 },
  segmentedBtnActive: { backgroundColor: card, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  segmentedBtnText: { fontSize: 14, fontWeight: '500', color: mutedForeground },
  segmentedBtnTextActive: { color: foreground, fontWeight: '600' },
  empty: { paddingVertical: spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 15, color: mutedForeground },
  list: { padding: spacing.base, paddingBottom: spacing.xl },
  card: { backgroundColor: card, borderRadius: radius.base, padding: spacing.base, marginBottom: spacing.md, borderWidth: 1, borderColor: border },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardMain: { flex: 1 },
  cardTitle: { ...typography.title, color: foreground, marginBottom: 4 },
  meta: { fontSize: 13, color: mutedForeground, marginBottom: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm },
  badgeText: { color: primaryForeground, fontSize: 12, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  modalTitle: { ...typography.sectionTitle, marginBottom: spacing.base },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6, color: foreground },
  input: { borderWidth: 1, borderColor: border, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.base, fontSize: 16 },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  pickerOption: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: muted },
  pickerOptionActive: { backgroundColor: primary },
  pickerOptionText: { fontSize: 14, color: foreground },
  pickerOptionTextActive: { color: primaryForeground },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: border },
  cancelBtnText: { fontSize: 16, fontWeight: '500', color: foreground },
  submitBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: radius.sm, backgroundColor: primary },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: primaryForeground, fontSize: 16, fontWeight: '600' },
});
