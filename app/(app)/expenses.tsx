import {
  background,
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
} from '@/constants/theme';
import { expensesService } from '@/services/expenses';
import { getErrorMessage } from '@/utils/errorMessage';
import type { Expense } from '@/types/expenses';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { FormModal } from '@/components/ui/FormModal';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/EmptyState';

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
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('open');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [typeId, setTypeId] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
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
        expensesService.list(1, 50, undefined, expenseTypeFilter || undefined),
        expensesService.listTypes(),
      ]);
      setExpenses(listRes?.items ?? []);
      setTypes(typesRes?.map((t) => ({ id: t.id, name: t.name })) ?? []);
    } catch (error) {
      console.error('Failed to load expenses', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to load expenses. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [expenseTypeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerAction: { label: 'New expense', onPress: () => setModalOpen(true) },
      subtitle: 'Submit and track your work-related expenses',
    });
  }, [navigation]);

  const handleCreate = async () => {
    if (!typeId || !date || !amount.trim() || !details.trim()) return;
    try {
      setSubmitting(true);
      await expensesService.create({
        expense_type_id: typeId,
        expense_date: date,
        amount: Number(amount),
        details: details,
        ...(attachmentUrl.trim() && { attachment_url: attachmentUrl.trim() }),
      });
      setModalOpen(false);
      setTypeId('');
      setDate('');
      setAmount('');
      setDetails('');
      setAttachmentUrl('');
      load();
    } catch (error) {
      console.error('Create expense failed', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to submit expense. Please try again.'));
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
      <ScrollView
        style={[styles.scroll, { backgroundColor: background }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.xl + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
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

        <SegmentedControl
          options={[{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }]}
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
        />
        {types.length > 0 && (
          <View style={styles.typeFilterWrap}>
            <Text style={styles.typeFilterLabel}>Filter by type</Text>
            <View style={styles.typeFilterRow}>
              <Pressable
                style={[styles.typeFilterBtn, !expenseTypeFilter && styles.typeFilterBtnActive]}
                onPress={() => setExpenseTypeFilter('')}
              >
                <Text style={[styles.typeFilterBtnText, !expenseTypeFilter && styles.typeFilterBtnTextActive]}>All</Text>
              </Pressable>
              {types.map((t) => (
                <Pressable
                  key={t.id}
                  style={[styles.typeFilterBtn, expenseTypeFilter === t.id && styles.typeFilterBtnActive]}
                  onPress={() => setExpenseTypeFilter(t.id)}
                >
                  <Text style={[styles.typeFilterBtnText, expenseTypeFilter === t.id && styles.typeFilterBtnTextActive]}>{t.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {expenses.length === 0 ? (
          <EmptyState message="No expenses yet." />
        ) : filteredExpenses.length === 0 ? (
          <EmptyState message={`No ${filter === 'open' ? 'open' : 'closed'} expenses.`} />
        ) : (
          filteredExpenses.map((item) => (
            <View key={item.id} style={styles.cardWrap}>
              <Card>
                <View style={styles.expenseCardRow}>
                  <View style={styles.expenseCardLeft}>
                    <Text style={styles.expenseCardTitle}>{item.expense_type?.name ?? 'Expense'}</Text>
                    {item.details ? (
                      <Text style={styles.expenseCardDetails} numberOfLines={2}>{item.details}</Text>
                    ) : null}
                    <Text style={styles.expenseCardDate}>
                      {new Date(item.expense_date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.expenseCardRight}>
                    <View style={[styles.expenseCardBadge, { backgroundColor: STATUS_COLORS[item.status] ?? mutedForeground }]}>
                      <Text style={styles.expenseCardBadgeText}>{item.status}</Text>
                    </View>
                    <Text style={styles.expenseCardAmount}>
                      ${Number(item.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
              </Card>
            </View>
          ))
        )}
      </ScrollView>
      <FormModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New expense"
        submitLabel="Submit"
        submitting={submitting}
        onSubmit={handleCreate}
      >
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
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="2025-02-15" placeholderTextColor={mutedForeground} />
        <Text style={styles.label}>Amount</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="0" placeholderTextColor={mutedForeground} keyboardType="decimal-pad" />
        <Text style={styles.label}>Details</Text>
        <TextInput style={[styles.input, styles.textArea]} value={details} onChangeText={setDetails} placeholder="Description" placeholderTextColor={mutedForeground} multiline />
        <Text style={styles.label}>Attachment URL (optional)</Text>
        <TextInput style={styles.input} value={attachmentUrl} onChangeText={setAttachmentUrl} placeholder="https://..." placeholderTextColor={mutedForeground} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.base },
  summaryRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.base },
  summaryCard: {
    flex: 1,
    backgroundColor: card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryLabel: { fontSize: 12, fontWeight: '500', color: mutedForeground, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '700', color: foreground },
  typeFilterWrap: { marginBottom: spacing.base },
  typeFilterLabel: { fontSize: 14, fontWeight: '500', color: mutedForeground, marginBottom: 6 },
  typeFilterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeFilterBtn: {
    paddingHorizontal: spacing.base,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: card,
    borderWidth: 1,
    borderColor: border,
  },
  typeFilterBtnActive: { backgroundColor: primary, borderColor: primary },
  typeFilterBtnText: { fontSize: 14, color: foreground },
  typeFilterBtnTextActive: { color: primaryForeground, fontWeight: '600' },
  list: { padding: spacing.base, paddingBottom: spacing.xl },
  cardWrap: { marginBottom: spacing.md },
  expenseCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseCardLeft: { flex: 1, marginRight: spacing.md },
  expenseCardTitle: { fontSize: 18, fontWeight: '600', color: foreground, marginBottom: 4 },
  expenseCardDetails: { fontSize: 13, color: mutedForeground, marginBottom: 2 },
  expenseCardDate: { fontSize: 13, color: mutedForeground },
  expenseCardRight: { alignItems: 'flex-end' },
  expenseCardBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: 6,
  },
  expenseCardBadgeText: { fontSize: 12, fontWeight: '500', color: primaryForeground },
  expenseCardAmount: { fontSize: 20, fontWeight: '700', color: foreground },
  details: { fontSize: 13, color: mutedForeground, marginTop: 4 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6, color: foreground },
  input: { borderWidth: 1, borderColor: border, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.base, fontSize: 16 },
  textArea: { minHeight: 60 },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  pickerOption: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: muted },
  pickerOptionActive: { backgroundColor: primary },
  pickerOptionText: { fontSize: 14, color: foreground },
  pickerOptionTextActive: { color: primaryForeground },
});
