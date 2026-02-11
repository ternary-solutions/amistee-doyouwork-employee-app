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
import { clothingRequestsService } from '@/services/requests/clothings';
import type { ClothingRequest } from '@/types/requests/clothings';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
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
  Approved: success,
  Denied: destructive,
  Completed: primary,
};
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'] as const;

export default function ClothingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<ClothingRequest[]>([]);
  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [typeId, setTypeId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [size, setSize] = useState<string>('M');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, typesRes] = await Promise.all([
        clothingRequestsService.list(1, 50),
        clothingRequestsService.listTypes(),
      ]);
      setRequests(listRes?.items ?? []);
      setTypes(typesRes?.map((t) => ({ id: t.id, name: t.name })) ?? []);
    } catch (error) {
      console.error('Failed to load clothing requests', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerAction: { label: 'New clothing request', onPress: () => setModalOpen(true) },
    });
  }, [navigation]);

  const handleCreate = async () => {
    if (!typeId || !quantity.trim() || !size) return;
    const qty = parseInt(quantity, 10);
    if (!Number.isFinite(qty) || qty < 1) return;
    try {
      setSubmitting(true);
      await clothingRequestsService.create({
        clothing_type_id: typeId,
        quantity: qty,
        size: size as ClothingRequest['size'],
        reason: reason.trim() || undefined,
      });
      setModalOpen(false);
      setTypeId('');
      setQuantity('');
      setReason('');
      load();
    } catch (error) {
      console.error('Create clothing request failed', error);
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
      {requests.length === 0 ? (
        <View style={[styles.fill, { paddingBottom: insets.bottom }]}>
          <EmptyState message="No clothing requests yet." />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(r) => r.id}
          style={{ backgroundColor: background }}
          contentContainerStyle={[styles.list, { paddingBottom: spacing.xl + insets.bottom }]}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <ListCard
                title={item.clothing_type_name ?? 'Clothing'}
                meta={[`Qty: ${item.quantity} · Size: ${item.size}`]}
                badge={{ text: item.status, backgroundColor: STATUS_COLORS[item.status] ?? mutedForeground }}
              >
                {item.reason ? <Text style={styles.details} numberOfLines={2}>{item.reason}</Text> : null}
              </ListCard>
            </View>
          )}
        />
      )}
      <FormModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New clothing request"
        submitLabel="Submit"
        submitting={submitting}
        onSubmit={handleCreate}
        contentMaxHeight="85%"
      >
        <Text style={styles.label}>Type</Text>
        <View style={styles.picker}>
          {types.map((t) => (
            <Pressable key={t.id} style={[styles.pickerOption, typeId === t.id && styles.pickerOptionActive]} onPress={() => setTypeId(t.id)}>
              <Text style={[styles.pickerOptionText, typeId === t.id && styles.pickerOptionTextActive]}>{t.name}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Quantity</Text>
        <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} placeholder="1" keyboardType="number-pad" />
        <Text style={styles.label}>Size</Text>
        <View style={styles.picker}>
          {SIZES.map((s) => (
            <Pressable key={s} style={[styles.pickerOption, size === s && styles.pickerOptionActive]} onPress={() => setSize(s)}>
              <Text style={[styles.pickerOptionText, size === s && styles.pickerOptionTextActive]}>{s}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Reason (optional)</Text>
        <TextInput style={styles.input} value={reason} onChangeText={setReason} placeholder="Reason" />
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fill: { flex: 1, backgroundColor: background },
  list: { padding: spacing.base, paddingBottom: spacing.xl },
  cardWrap: { marginBottom: spacing.md },
  details: { fontSize: 13, color: mutedForeground, marginTop: 4 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6, color: foreground },
  input: { borderWidth: 1, borderColor: border, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.base, fontSize: 16 },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  pickerOption: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: muted },
  pickerOptionActive: { backgroundColor: primary },
  pickerOptionText: { fontSize: 14, color: foreground },
  pickerOptionTextActive: { color: primaryForeground },
});
