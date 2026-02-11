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
  typography,
} from '@/constants/theme';
import { spiffsService } from '@/services/spiffs';
import type { Spiff } from '@/types/spiffs';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { FormModal } from '@/components/ui/FormModal';
import { ListCard } from '@/components/ui/ListCard';
import { EmptyState } from '@/components/ui/EmptyState';

const STATUS_COLORS: Record<string, string> = {
  Pending: mutedForeground,
  Approved: primary,
  Denied: destructive,
  Paid: success,
};

export default function SpiffsScreen() {
  const navigation = useNavigation();
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerAction: { label: 'New spiff', onPress: () => setModalOpen(true) },
    });
  }, [navigation]);

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
      {totalPaid > 0 && (
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total earned (Paid)</Text>
          <Text style={styles.totalAmount}>${totalPaid.toFixed(2)}</Text>
        </View>
      )}
      {spiffs.length === 0 ? (
        <View style={[styles.fill, { paddingBottom: insets.bottom }]}>
          <EmptyState message="No spiffs yet." />
        </View>
      ) : (
        <FlatList
          data={spiffs}
          keyExtractor={(s) => s.id}
          style={{ backgroundColor: background }}
          contentContainerStyle={[styles.list, { paddingBottom: spacing.xl + insets.bottom }]}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <ListCard
                title={item.spiff_type?.name ?? 'Spiff'}
                meta={[`${new Date(item.spiff_date).toLocaleDateString()} · $${item.amount}`]}
                badge={{ text: item.status, backgroundColor: STATUS_COLORS[item.status] ?? mutedForeground }}
              >
                {item.details ? <Text style={styles.details} numberOfLines={2}>{item.details}</Text> : null}
              </ListCard>
            </View>
          )}
        />
      )}
      <FormModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New spiff"
        submitLabel="Submit"
        submitting={submitting}
        onSubmit={handleCreate}
      >
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
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fill: { flex: 1, backgroundColor: background },
  totalCard: { marginHorizontal: spacing.base, marginBottom: spacing.base, padding: spacing.base, backgroundColor: '#f0fdf4', borderRadius: radius.base },
  totalLabel: { fontSize: 13, color: mutedForeground },
  totalAmount: { fontSize: 22, fontWeight: '700', color: success },
  list: { padding: spacing.base, paddingBottom: spacing.xl },
  cardWrap: { marginBottom: spacing.md },
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
