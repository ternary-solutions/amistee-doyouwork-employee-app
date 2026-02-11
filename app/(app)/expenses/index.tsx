import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonDetailCard } from '@/components/ui/Skeleton';
import { FormModal } from '@/components/ui/FormModal';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import {
    background,
    border,
    card,
    foreground,
    muted,
    mutedForeground,
    primary,
    primaryForeground,
    radius,
    spacing,
    statusBadge,
} from '@/constants/theme';
import { expensesService } from '@/services/expenses';
import { mediaService } from '@/services/media';
import type { Expense } from '@/types/expenses';
import { getErrorMessage } from '@/utils/errorMessage';
import { toast as showToast } from '@/utils/toast';
import { hapticImpact } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
    Alert,
    Image,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getStatusBadgeStyle(status: string) {
  const s = statusBadge[status as keyof typeof statusBadge];
  return s ?? { bg: mutedForeground, text: '#ffffff' };
}

type Filter = 'open' | 'closed';

function isOpen(e: Expense) {
  return e.status === 'Pending';
}
function isClosed(e: Expense) {
  return e.status === 'Reimbursed' || e.status === 'Denied' || e.status === 'Approved';
}

export default function ExpensesScreen() {
  const navigation = useNavigation();
  const router = useRouter();
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
  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  useEffect(() => {
    if (!modalOpen) {
      setAttachmentUri(null);
    }
  }, [modalOpen]);

  const pickAttachment = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to add an attachment.',
          [{ text: 'OK' }]
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });
      if (result.canceled || !result.assets?.[0]) return;
      setAttachmentUri(result.assets[0].uri);
    } catch (error) {
      console.error('Pick attachment failed', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, []);

  const removeAttachment = useCallback(() => {
    setAttachmentUri(null);
  }, []);

  const handleCreate = async () => {
    if (!typeId || !date || !amount.trim() || !details.trim()) return;
    try {
      setSubmitting(true);
      let attachmentUrl: string | undefined;
      if (attachmentUri) {
        setUploadingAttachment(true);
        try {
          const filename = attachmentUri.split('/').pop() || 'expense-photo.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          const res = await mediaService.uploadFile(
            { uri: Platform.OS === 'web' ? attachmentUri : attachmentUri, type, name: filename },
            'expenses',
            'images'
          );
          attachmentUrl = res.file_url;
        } catch (err) {
          console.error('Upload attachment failed', err);
          Alert.alert('Error', 'Failed to upload attachment. Please try again.');
          return;
        } finally {
          setUploadingAttachment(false);
        }
      }
      await expensesService.create({
        expense_type_id: typeId,
        expense_date: date,
        amount: Number(amount),
        details: details,
        ...(attachmentUrl && { attachment_url: attachmentUrl }),
      });
      setModalOpen(false);
      setTypeId('');
      setDate('');
      setAmount('');
      setDetails('');
      setAttachmentUri(null);
      showToast.success('Expense submitted successfully.');
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
      <ScrollView
        style={[styles.scroll, { backgroundColor: background }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.xl + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.skeletonWrap}>
          <SkeletonDetailCard />
          <SkeletonDetailCard />
          <SkeletonDetailCard />
          <SkeletonDetailCard />
          <SkeletonDetailCard />
        </View>
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.scroll, { backgroundColor: background }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.xl + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={primary} />
        }
      >
        {expenses.length > 0 && (
          <>
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
          </>
        )}

        {expenses.length === 0 ? (
          <EmptyState
            message="No expenses yet. Tap + to add one."
            icon="receipt-outline"
            action={{ label: 'Add expense', onPress: () => setModalOpen(true) }}
          />
        ) : filteredExpenses.length === 0 ? (
          <EmptyState message={`No ${filter === 'open' ? 'open' : 'closed'} expenses.`} icon="receipt-outline" />
        ) : (
          filteredExpenses.map((item) => (
            <Pressable
              key={item.id}
              style={styles.cardWrap}
              onPress={() => {
                hapticImpact();
                router.push(`/(app)/expenses/${item.id}`);
              }}
            >
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
                    <View
                      style={[
                        styles.expenseCardBadge,
                        { backgroundColor: getStatusBadgeStyle(item.status).bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.expenseCardBadgeText,
                          { color: getStatusBadgeStyle(item.status).text },
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                    <Text style={styles.expenseCardAmount}>
                      ${Number(item.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
      <FormModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New expense"
        submitLabel="Submit"
        submitting={submitting || uploadingAttachment}
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
        <Text style={styles.label}>Date</Text>
        <Pressable
          style={styles.dateBtn}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={[styles.dateBtnText, !date && styles.dateBtnPlaceholder]}>
            {date ? new Date(date + 'T12:00:00').toLocaleDateString() : 'Select date'}
          </Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={date ? new Date(date + 'T12:00:00') : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) setDate(selectedDate.toISOString().slice(0, 10));
            }}
          />
        )}
        <Text style={styles.label}>Amount</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="0" placeholderTextColor={mutedForeground} keyboardType="decimal-pad" />
        <Text style={styles.label}>Details</Text>
        <TextInput style={[styles.input, styles.textArea]} value={details} onChangeText={setDetails} placeholder="Description" placeholderTextColor={mutedForeground} multiline />
        <Text style={styles.label}>Attachment (optional)</Text>
        <View style={styles.attachmentRow}>
          <Pressable
            style={[styles.attachmentBtn, attachmentUri && styles.attachmentBtnHasFile]}
            onPress={pickAttachment}
            disabled={uploadingAttachment}
          >
            {attachmentUri ? (
              <View style={styles.attachmentPreview}>
                <Image source={{ uri: attachmentUri }} style={styles.attachmentThumb} />
                <Pressable
                  style={styles.removeAttachmentBtn}
                  onPress={removeAttachment}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={24} color={mutedForeground} />
                </Pressable>
              </View>
            ) : (
              <>
                <Ionicons name="image-outline" size={24} color={primary} />
                <Text style={styles.attachmentBtnText}>
                  {uploadingAttachment ? 'Uploading...' : 'Add photo'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  skeletonWrap: { paddingHorizontal: spacing.base, gap: spacing.md },
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
  expenseCardTitle: { fontSize: 18, fontWeight: '600', color: foreground, marginBottom: 8 },
  expenseCardDetails: { fontSize: 13, color: mutedForeground, marginBottom: 6 },
  expenseCardDate: { fontSize: 13, color: mutedForeground },
  expenseCardRight: { alignItems: 'flex-end' },
  expenseCardBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: 6,
  },
  expenseCardBadgeText: { fontSize: 12, fontWeight: '500' },
  expenseCardAmount: { fontSize: 20, fontWeight: '700', color: foreground },
  details: { fontSize: 13, color: mutedForeground, marginTop: 4 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6, color: foreground },
  dateBtn: { borderWidth: 1, borderColor: border, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.base },
  dateBtnText: { fontSize: 16, color: foreground },
  dateBtnPlaceholder: { color: mutedForeground },
  input: { borderWidth: 1, borderColor: border, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.base, fontSize: 16 },
  textArea: { minHeight: 60 },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  pickerOption: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: muted },
  pickerOptionActive: { backgroundColor: primary },
  pickerOptionText: { fontSize: 14, color: foreground },
  pickerOptionTextActive: { color: primaryForeground },
  attachmentRow: { marginBottom: spacing.base },
  attachmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: border,
    borderStyle: 'dashed',
  },
  attachmentBtnHasFile: { borderStyle: 'solid' },
  attachmentBtnText: { fontSize: 14, fontWeight: '500', color: primary },
  attachmentPreview: { position: 'relative' },
  attachmentThumb: { width: 80, height: 80, borderRadius: radius.sm },
  removeAttachmentBtn: { position: 'absolute', top: -8, right: -8 },
});
