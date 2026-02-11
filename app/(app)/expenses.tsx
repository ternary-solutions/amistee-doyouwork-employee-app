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
import { expensesService } from '@/services/expenses';
import type { Expense } from '@/types/expenses';
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

const STATUS_COLORS: Record<string, string> = {
  Pending: mutedForeground,
  Approved: primary,
  Denied: destructive,
  Reimbursed: success,
};

type Filter = 'open' | 'closed';

function isOpen(e: Expense) {
  return e.status === 'Pending';
}
function isClosed(e: Expense) {
  return e.status === 'Reimbursed' || e.status === 'Denied' || e.status === 'Approved';
}

export default function ExpensesScreen() {
  const insets = useSafeAreaInsets();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('open');
  const [modalOpen, setModalOpen] = useState(false);
  const [typeId, setTypeId] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredExpenses = expenses.filter((e) =>
    filter === 'open' ? isOpen(e) : isClosed(e)
  );
  const totalPending = expenses
    .filter((e) => e.status !== 'Reimbursed')
    .reduce((sum, e) => sum + Number(e.amount ?? 0), 0);
  const totalPaid = expenses
    .filter((e) => e.status === 'Reimbursed')
    .reduce((sum, e) => sum + Number(e.amount ?? 0), 0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, typesRes] = await Promise.all([
        expensesService.list(1, 50),
        expensesService.listTypes(),
      ]);
      setExpenses(listRes?.items ?? []);
      setTypes(typesRes?.map((t) => ({ id: t.id, name: t.name })) ?? []);
    } catch (error) {
      console.error('Failed to load expenses', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!typeId || !date || !amount.trim() || !details.trim()) return;
    try {
      setSubmitting(true);
      await expensesService.create({
        expense_type_id: typeId,
        expense_date: date,
        amount: Number(amount) || amount,
        details: details,
      });
      setModalOpen(false);
      setTypeId('');
      setDate('');
      setAmount('');
      setDetails('');
      load();
    } catch (error) {
      console.error('Create expense failed', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && expenses.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <Pressable style={styles.createBtn} onPress={() => setModalOpen(true)} accessibilityLabel="New expense" accessibilityRole="button">
          <Text style={styles.createBtnText}>New expense</Text>
        </Pressable>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.xl + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Submit and track your work-related expenses</Text>

        {expenses.length > 0 && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Pending</Text>
              <Text style={styles.summaryValue}>
                ${totalPending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Paid</Text>
              <Text style={styles.summaryValue}>
                ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        )}

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

        {expenses.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No expenses yet.</Text>
          </View>
        ) : filteredExpenses.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No {filter === 'open' ? 'open' : 'closed'} expenses.
            </Text>
          </View>
        ) : (
          filteredExpenses.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardMain}>
                  <Text style={styles.cardTitle}>{item.expense_type?.name ?? 'Expense'}</Text>
                  <Text style={styles.meta}>
                    {new Date(item.expense_date).toLocaleDateString()} · ${item.amount}
                  </Text>
                  {item.details ? <Text style={styles.details} numberOfLines={2}>{item.details}</Text> : null}
                </View>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] ?? mutedForeground }]}>
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
            <Text style={styles.modalTitle}>New expense</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Type</Text>
              <View style={styles.picker}>
                {types.map((t) => (
                  <Pressable
                    key={t.id}
                    style={[styles.pickerOption, typeId === t.id && styles.pickerOptionActive]}
                    onPress={() => setTypeId(t.id)}
                  >
                    <Text style={[styles.pickerOptionText, typeId === t.id && styles.pickerOptionTextActive]}>{t.name}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="2025-02-15" />
              <Text style={styles.label}>Amount</Text>
              <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="0" keyboardType="decimal-pad" />
              <Text style={styles.label}>Details</Text>
              <TextInput style={[styles.input, styles.textArea]} value={details} onChangeText={setDetails} placeholder="Description" multiline />
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setModalOpen(false)} accessibilityLabel="Cancel" accessibilityRole="button">
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleCreate} disabled={submitting} accessibilityLabel={submitting ? 'Submitting' : 'Submit expense'} accessibilityRole="button">
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
  scrollContent: { paddingHorizontal: spacing.base },
  subtitle: { fontSize: 14, color: mutedForeground, marginBottom: spacing.base },
  summaryRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.base },
  summaryCard: {
    flex: 1,
    backgroundColor: card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: border,
  },
  summaryLabel: { fontSize: 12, fontWeight: '500', color: mutedForeground, marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '600', color: foreground },
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
