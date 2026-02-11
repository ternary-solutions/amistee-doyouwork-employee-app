import {
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
import { suggestionsService } from '@/services/suggestions';
import type { Suggestion } from '@/types/suggestions';
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
  Open: primary,
  'In Review': warning,
  Implemented: success,
  Closed: mutedForeground,
};

export default function SuggestionsScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [typeId, setTypeId] = useState('');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, typesRes] = await Promise.all([
        suggestionsService.list(1, 50),
        suggestionsService.listTypes(),
      ]);
      setItems(listRes?.items ?? []);
      setTypes(typesRes?.map((t) => ({ id: t.id, name: t.name })) ?? []);
    } catch (error) {
      console.error('Failed to load suggestions', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!typeId || !title.trim() || !details.trim()) return;
    try {
      setSubmitting(true);
      await suggestionsService.create({ suggestion_type_id: typeId, title: title.trim(), details: details.trim() });
      setModalOpen(false);
      setTypeId('');
      setTitle('');
      setDetails('');
      load();
    } catch (error) {
      console.error('Create suggestion failed', error);
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
      <View style={styles.header}>
        <Text style={styles.title}>Suggestions</Text>
        <Pressable style={styles.createBtn} onPress={() => setModalOpen(true)}>
          <Text style={styles.createBtnText}>New suggestion</Text>
        </Pressable>
      </View>
      {items.length === 0 ? (
        <View style={[styles.empty, { paddingBottom: insets.bottom }]}>
          <Text style={styles.emptyText}>No suggestions yet.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(s) => s.id}
          contentContainerStyle={[styles.list, { paddingBottom: spacing.xl + insets.bottom }]}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardMain}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.meta}>{item.suggestion_type?.name} · {new Date(item.created_at).toLocaleDateString()}</Text>
                  <Text style={styles.details} numberOfLines={2}>{item.details}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] ?? '#94a3b8' }]}>
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
            <Text style={styles.modalTitle}>New suggestion</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Type</Text>
              <View style={styles.picker}>
                {types.map((t) => (
                  <Pressable key={t.id} style={[styles.pickerOption, typeId === t.id && styles.pickerOptionActive]} onPress={() => setTypeId(t.id)}>
                    <Text style={[styles.pickerOptionText, typeId === t.id && styles.pickerOptionTextActive]}>{t.name}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.label}>Title</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Title" />
              <Text style={styles.label}>Details</Text>
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
