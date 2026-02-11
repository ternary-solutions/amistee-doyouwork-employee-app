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
  success,
  typography,
  warning,
} from '@/constants/theme';
import { referralsService } from '@/services/referrals';
import type { Referral } from '@/types/referrals';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Share,
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
  New: '#3b82f6',
  Contacted: '#eab308',
  Qualified: '#22c55e',
  Closed: '#94a3b8',
};

export default function ReferralsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Referral[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, catRes] = await Promise.all([
        referralsService.list(1, 50),
        referralsService.listCategories(),
      ]);
      setItems(listRes?.items ?? []);
      setCategories(catRes?.map((c) => ({ id: c.id, name: c.name })) ?? []);
    } catch (error) {
      console.error('Failed to load referrals', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerAction: { label: 'New referral', onPress: () => setModalOpen(true) },
    });
  }, [navigation]);

  const getReferralMessage = useCallback((item: Referral) => {
    const parts = [
      item.company_name || 'Referral',
      item.phone_number,
      item.details,
    ].filter(Boolean);
    return parts.join(' • ');
  }, []);

  const shareReferral = useCallback((item: Referral) => {
    const message = getReferralMessage(item);
    Share.share({ message, title: 'Referral details' }).catch(() => {});
  }, [getReferralMessage]);

  const copyReferral = useCallback(async (item: Referral) => {
    await Clipboard.setStringAsync(getReferralMessage(item));
  }, [getReferralMessage]);

  const handleCreate = async () => {
    if (!categoryId || !phone.trim() || !details.trim()) return;
    try {
      setSubmitting(true);
      await referralsService.create({
        category_id: categoryId,
        company_name: companyName.trim() || undefined,
        phone_number: phone.trim(),
        details: details.trim(),
      });
      setModalOpen(false);
      setCategoryId('');
      setCompanyName('');
      setPhone('');
      setDetails('');
      load();
    } catch (error) {
      console.error('Create referral failed', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <>
      {items.length === 0 ? (
        <View style={[styles.fill, { paddingBottom: insets.bottom }]}>
          <EmptyState message="No referrals yet." />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(r) => r.id}
          style={{ backgroundColor: background }}
          contentContainerStyle={[styles.list, { paddingBottom: spacing.xl + insets.bottom }]}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <ListCard
                title={item.company_name || 'Referral'}
                meta={[`${item.category?.name ?? ''} · ${item.phone_number}`]}
                badge={{ text: item.status, backgroundColor: STATUS_COLORS[item.status] ?? '#94a3b8' }}
              >
                {item.details ? <Text style={styles.details} numberOfLines={2}>{item.details}</Text> : null}
                <View style={styles.actionRow}>
                  <Pressable
                    style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
                    onPress={() => shareReferral(item)}
                    accessibilityLabel="Share referral"
                    accessibilityRole="button"
                  >
                    <Text style={styles.actionBtnText}>Share</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
                    onPress={() => copyReferral(item)}
                    accessibilityLabel="Copy referral"
                    accessibilityRole="button"
                  >
                    <Text style={styles.actionBtnText}>Copy</Text>
                  </Pressable>
                </View>
              </ListCard>
            </View>
          )}
        />
      )}
      <FormModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New referral"
        submitLabel="Submit"
        submitting={submitting}
        onSubmit={handleCreate}
      >
        <Text style={styles.label}>Category</Text>
        <View style={styles.picker}>
          {categories.map((c) => (
            <Pressable key={c.id} style={[styles.pickerOption, categoryId === c.id && styles.pickerOptionActive]} onPress={() => setCategoryId(c.id)}>
              <Text style={[styles.pickerOptionText, categoryId === c.id && styles.pickerOptionTextActive]}>{c.name}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Company name (optional)</Text>
        <TextInput style={styles.input} value={companyName} onChangeText={setCompanyName} placeholder="Company" />
        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" />
        <Text style={styles.label}>Details</Text>
        <TextInput style={[styles.input, styles.textArea]} value={details} onChangeText={setDetails} placeholder="Details" multiline />
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
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: spacing.base,
    borderRadius: radius.sm,
    backgroundColor: muted,
  },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: primary },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6, color: foreground },
  input: { borderWidth: 1, borderColor: border, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.base, fontSize: 16 },
  textArea: { minHeight: 60 },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  pickerOption: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: muted },
  pickerOptionActive: { backgroundColor: primary },
  pickerOptionText: { fontSize: 14, color: foreground },
  pickerOptionTextActive: { color: primaryForeground },
});
