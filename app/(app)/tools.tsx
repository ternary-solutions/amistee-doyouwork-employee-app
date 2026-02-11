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
  typography,
} from '@/constants/theme';
import { toolRequestsService } from '@/services/requests/tools';
import { toolsService } from '@/services/tools';
import type { ToolRequest } from '@/types/requests/tools';
import type { Tool } from '@/types/tools';
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
  Pending: '#eab308',
  Approved: '#3b82f6',
  CheckedOut: '#22c55e',
  Denied: '#ef4444',
  Returned: mutedForeground,
};

function formatDate(d: string | null | undefined) {
  return d ? new Date(d).toLocaleDateString() : '—';
}

export default function ToolsScreen() {
  const insets = useSafeAreaInsets();
  const [toolRequests, setToolRequests] = useState<ToolRequest[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [createToolId, setCreateToolId] = useState('');
  const [createQty, setCreateQty] = useState('');
  const [createPickup, setCreatePickup] = useState('');
  const [createMessage, setCreateMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [toolsRes, requestsRes] = await Promise.all([
        toolsService.list(1, 100),
        toolRequestsService.list(1, 50),
      ]);
      setTools(toolsRes?.items ?? []);
      setToolRequests(requestsRes?.items ?? []);
    } catch (error) {
      console.error('Failed to load tools/requests', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    const toolId = createToolId.trim();
    const qty = parseInt(createQty, 10);
    const pickup = createPickup.trim();
    if (!toolId || !Number.isFinite(qty) || qty < 1 || !pickup) return;
    try {
      setSubmitting(true);
      await toolRequestsService.create({
        items: [{ tool_id: toolId, quantity: qty }],
        pickup_date: pickup,
        message: createMessage.trim() || undefined,
      });
      setModalOpen(false);
      setCreateToolId('');
      setCreateQty('');
      setCreatePickup('');
      setCreateMessage('');
      load();
    } catch (error) {
      console.error('Create tool request failed', error);
    } finally {
      setSubmitting(false);
    }
  };

  const toolName = (r: ToolRequest) => {
    const items = r.items ?? [];
    if (items.length > 0) {
      return items.map((it) => it.tool?.tool_name ?? it.tool_type?.name ?? 'Tool').join(', ');
    }
    return r.tool?.tool_name ?? r.tool_type?.name ?? 'Tool';
  };

  if (loading && toolRequests.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Tool Requests</Text>
        <Pressable style={styles.createBtn} onPress={() => setModalOpen(true)}>
          <Text style={styles.createBtnText}>New request</Text>
        </Pressable>
      </View>
      <Text style={styles.subtitle}>Request your equipment</Text>

      {toolRequests.length === 0 ? (
        <View style={[styles.empty, { paddingBottom: insets.bottom }]}>
          <Text style={styles.emptyText}>No tool requests yet. Create one to get started.</Text>
        </View>
      ) : (
        <FlatList
          data={toolRequests}
          keyExtractor={(r) => r.id}
          contentContainerStyle={[styles.list, { paddingBottom: spacing.xl + insets.bottom }]}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardMain}>
                  <Text style={styles.cardTitle}>{toolName(item)}</Text>
                  <Text style={styles.meta}>Pickup: {formatDate(item.pickup_date)}</Text>
                  <Text style={styles.meta}>Requested: {formatDate(item.created_at)}</Text>
                  {item.message ? (
                    <Text style={styles.message}>{item.message}</Text>
                  ) : null}
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
            <Text style={styles.modalTitle}>New tool request</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Tool</Text>
              <View style={styles.picker}>
                {tools.map((t) => (
                  <Pressable
                    key={t.id}
                    style={[styles.pickerOption, createToolId === t.id && styles.pickerOptionActive]}
                    onPress={() => setCreateToolId(t.id)}
                  >
                    <Text style={[styles.pickerOptionText, createToolId === t.id && styles.pickerOptionTextActive]}>
                      {t.tool_name}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={createQty}
                onChangeText={setCreateQty}
                placeholder="1"
                keyboardType="number-pad"
              />
              <Text style={styles.label}>Pickup date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={createPickup}
                onChangeText={setCreatePickup}
                placeholder="2025-02-15"
              />
              <Text style={styles.label}>Message (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={createMessage}
                onChangeText={setCreateMessage}
                placeholder="Notes"
                multiline
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleCreate}
                disabled={submitting}
              >
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
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: 4 },
  title: { ...typography.sectionTitle, color: foreground },
  createBtn: { backgroundColor: primary, paddingHorizontal: spacing.base, paddingVertical: 10, borderRadius: radius.sm },
  createBtnText: { color: primaryForeground, fontWeight: '600' },
  subtitle: { fontSize: 14, color: mutedForeground, paddingHorizontal: spacing.base, marginBottom: spacing.base },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  emptyText: { fontSize: 15, color: mutedForeground, textAlign: 'center' },
  list: { padding: spacing.base, paddingBottom: spacing.xl },
  card: { backgroundColor: card, borderRadius: radius.base, padding: spacing.base, marginBottom: spacing.md, borderWidth: 1, borderColor: border },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardMain: { flex: 1 },
  cardTitle: { ...typography.title, color: foreground, marginBottom: 4 },
  meta: { fontSize: 13, color: mutedForeground, marginBottom: 2 },
  message: { fontSize: 13, color: mutedForeground, marginTop: 4 },
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
