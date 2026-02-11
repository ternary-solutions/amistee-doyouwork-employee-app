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
    typography,
} from '@/constants/theme';
import { repairRequestsService } from '@/services/requests/repairs';
import { vehiclesService } from '@/services/vehicles';
import type { RepairPriority, RepairRequest } from '@/types/requests/repairs';
import { getErrorMessage } from '@/utils/errorMessage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

const PRIORITIES: RepairPriority[] = ['Low', 'Medium', 'High'];

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [vehicleName, setVehicleName] = useState<string>('');
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createDescription, setCreateDescription] = useState('');
  const [createPriority, setCreatePriority] = useState<RepairPriority>('Medium');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [v, r] = await Promise.all([
        vehiclesService.getById(id),
        repairRequestsService.list(1, 20, id),
      ]);
      setVehicleName(v.vehicle_name);
      setRequests(r?.items ?? []);
    } catch (error) {
      console.error('Failed to load vehicle/requests', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to load vehicle. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateRequest = async () => {
    const desc = createDescription.trim();
    if (!id || !desc) return;
    try {
      setSubmitting(true);
      await repairRequestsService.create({
        vehicle_id: id,
        description: desc,
        priority: createPriority,
      });
      setCreateModalOpen(false);
      setCreateDescription('');
      setCreatePriority('Medium');
      load();
    } catch (error) {
      console.error('Create repair request failed', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to submit request.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom, backgroundColor: background }]}>
      <Text style={styles.title}>{vehicleName || 'Vehicle'}</Text>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Maintenance requests</Text>
        <Pressable
          style={({ pressed }) => [styles.newRequestBtn, pressed && { opacity: 0.8 }]}
          onPress={() => setCreateModalOpen(true)}
          accessibilityLabel="New maintenance request"
          accessibilityRole="button"
        >
          <Text style={styles.newRequestBtnText}>New request</Text>
        </Pressable>
      </View>
      {requests.length === 0 ? (
        <Text style={styles.emptyText}>No repair requests.</Text>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(r) => r.id}
          style={{ backgroundColor: background }}
          contentContainerStyle={[styles.list, { paddingBottom: spacing.xl + insets.bottom }]}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
              onPress={() =>
                router.push(`/(app)/vehicles/${id}/requests/${item.id}`)
              }
              accessibilityLabel={`${item.description}, ${item.status}, view details`}
              accessibilityRole="button"
            >
              <Text style={styles.cardTitle} numberOfLines={1}>{item.description}</Text>
              <Text style={styles.meta}>
                {new Date(item.request_date).toLocaleDateString()} · {item.status} · {item.priority}
              </Text>
            </Pressable>
          )}
        />
      )}

      <Modal visible={createModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New maintenance request</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={createDescription}
                onChangeText={setCreateDescription}
                placeholder="Describe the issue..."
                placeholderTextColor={mutedForeground}
                multiline
              />
              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityRow}>
                {PRIORITIES.map((p) => (
                  <Pressable
                    key={p}
                    style={[styles.priorityBtn, createPriority === p && styles.priorityBtnActive]}
                    onPress={() => setCreatePriority(p)}
                  >
                    <Text style={[styles.priorityBtnText, createPriority === p && styles.priorityBtnTextActive]}>{p}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.8 }]} onPress={() => setCreateModalOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.submitBtn, (!createDescription.trim() || submitting) && styles.submitBtnDisabled, pressed && createDescription.trim() && !submitting && { opacity: 0.8 }]}
                onPress={handleCreateRequest}
                disabled={!createDescription.trim() || submitting}
              >
                <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.base },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.sectionTitle, fontSize: 22, color: foreground, marginBottom: spacing.base },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { ...typography.title, color: foreground },
  newRequestBtn: {
    paddingVertical: 8,
    paddingHorizontal: spacing.base,
    borderRadius: radius.sm,
    backgroundColor: primary,
  },
  newRequestBtnText: { fontSize: 14, fontWeight: '600', color: primaryForeground },
  emptyText: { fontSize: 14, color: mutedForeground, marginTop: spacing.sm },
  list: { paddingBottom: spacing.xl },
  card: {
    backgroundColor: card,
    borderRadius: radius.base,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: border,
  },
  cardTitle: { ...typography.title, color: foreground, marginBottom: 4 },
  meta: { fontSize: 13, color: mutedForeground },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalTitle: { ...typography.sectionTitle, marginBottom: spacing.base },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6, color: foreground },
  input: { borderWidth: 1, borderColor: border, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.base, fontSize: 16 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  priorityRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.base },
  priorityBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.sm, backgroundColor: muted },
  priorityBtnActive: { backgroundColor: primary },
  priorityBtnText: { fontSize: 14, fontWeight: '500', color: foreground },
  priorityBtnTextActive: { color: primaryForeground },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.base },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: border },
  cancelBtnText: { fontSize: 16, fontWeight: '500', color: foreground },
  submitBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: radius.sm, backgroundColor: primary },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: primaryForeground, fontSize: 16, fontWeight: '600' },
});
