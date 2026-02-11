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
import { spiffsService } from '@/services/spiffs';
import type { Spiff } from '@/types/spiffs';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_COLORS: Record<string, string> = {
  Pending: mutedForeground,
  Approved: primary,
  Denied: destructive,
  Paid: success,
};

export default function SpiffsScreen() {
  const insets = useSafeAreaInsets();
  const [spiffs, setSpiffs] = useState<Spiff[]>([]);
  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [typeId, setTypeId] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, typesRes] = await Promise.all([
        spiffsService.list(1, 50),
        spiffsService.listTypes(),
      ]);
      setSpiffs(listRes?.items ?? []);
      setTypes(typesRes?.map((t) => ({ id: t.id, name: t.name })) ?? []);
    } catch (error) {
      console.error('Failed to load spiffs', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!typeId || !date || !amount.trim()) return;
    try {
      setSubmitting(true);
      await spiffsService.create({
        spiff_type_id: typeId,
        spiff_date: date,
        amount: Number(amount) || amount,
        details: details.trim() || undefined,
      });
      setModalOpen(false);
      setTypeId('');
      setDate('');
      setAmount('');
      setDetails('');
      load();
    } catch (error) {
      console.error('Create spiff failed', error);
    } finally {
      setSubmitting(false);
    }
  };

  const totalPaid = spiffs.filter((s) => s.status === 'Paid' && s.amount).reduce((sum, s) => sum + Number(s.amount), 0);

  if (loading && spiffs.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Spiffs</Text>
        <Pressable style={styles.createBtn} onPress={() => setModalOpen(true)}>
          <Text style={styles.createBtnText}>New spiff</Text>
        </Pressable>
      </View>
      {totalPaid > 0 && (
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total earned (Paid)</Text>
          <Text style={styles.totalAmount}>${totalPaid.toFixed(2)}</Text>
        </View>
      )}
      {spiffs.length === 0 ? (
        <View style={[styles.empty, { paddingBottom: insets.bottom }]}>
          <Text style={styles.emptyText}>No spiffs yet.</Text>
        </View>
      ) : (
        <FlatList
          data={spiffs}
          keyExtractor={(s) => s.id}
          contentContainerStyle={[styles.list, { paddingBottom: spacing.xl + insets.bottom }]}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardMain}>
                  <Text style={styles.cardTitle}>{item.spiff_type?.name ?? 'Spiff'}</Text>
                  <Text style={styles.meta}>
                    {new Date(item.spiff_date).toLocaleDateString()} · ${item.amount}
                  </Text>
                  {item.details ? <Text style={styles.details} numberOfLines={2}>{item.details}</Text> : null}
                </View>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] ?? mutedForeground }]}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New spiff</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Type</Text>
              <View style={styles.picker}>
                {types.map((t) => (
                  <Pressable key={t.id} style={[styles.pickerOption, typeId === t.id && styles.pickerOptionActive]} onPress={() => setTypeId(t.id)}>
                    <Text style={[styles.pickerOptionText, typeId === t.id && styles.pickerOptionTextActive]}>{t.name}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="2025-02-15" />
              <Text style={styles.label}>Amount</Text>
              <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="0" keyboardType="decimal-pad" />
              <Text style={styles.label}>Details (optional)</Text>
              <TextInput style={[styles.input, styles.textArea]} value={details} onChangeText={setDetails} placeholder="Details" multiline />
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleCreate} disabled={submitting}>
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
  totalCard: { marginHorizontal: spacing.base, marginBottom: spacing.base, padding: spacing.base, backgroundColor: '#f0fdf4', borderRadius: radius.base },
  totalLabel: { fontSize: 13, color: mutedForeground },
  totalAmount: { fontSize: 22, fontWeight: '700', color: success },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  emptyText: { fontSize: 15, color: mutedForeground },
  list: { padding: spacing.base, paddingBottom: spacing.xl },
  card: { backgroundColor: card, borderRadius: radius.base, padding: spacing.base, marginBottom: spacing.md, borderWidth: 1, borderColor: border },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardMain: { flex: 1 },
  cardTitle: { ...typography.title, color: foreground, marginBottom: 4 },
  meta: { fontSize: 13, color: mutedForeground, marginBottom: 2 },
  details: { fontSize: 13, color: mutedForeground, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm },
  badgeText: { color: primaryForeground, fontSize: 12, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, maxHeight: '80%' },
  modalTitle: { ...typography.sectionTitle, marginBottom: spacing.base },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6, color: foreground },
  input: { borderWidth: 1, borderColor: border, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.base, fontSize: 16 },
  textArea: { minHeight: 60 },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  pickerOption: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: muted },
  pickerOptionActive: { backgroundColor: primary },
  pickerOptionText: { fontSize: 14, color: foreground },
  pickerOptionTextActive: { color: primaryForeground },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.base },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: border },
  cancelBtnText: { fontSize: 16, fontWeight: '500', color: foreground },
  submitBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: radius.sm, backgroundColor: primary },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: primaryForeground, fontSize: 16, fontWeight: '600' },
});
