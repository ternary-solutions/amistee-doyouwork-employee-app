import {
  border,
  destructive,
  foreground,
  mutedForeground,
  primary,
  primaryForeground,
  radius,
  spacing,
  typography,
} from '@/constants/theme';
import { repairRequestsService } from '@/services/requests/repairs';
import type { RepairRequest } from '@/types/requests/repairs';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function VehicleRequestDetailScreen() {
  const { id, requestId } = useLocalSearchParams<{
    id: string;
    requestId: string;
  }>();
  const [request, setRequest] = useState<RepairRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      const data = await repairRequestsService.getById(requestId);
      setRequest(data);
    } catch (error) {
      console.error('Failed to load repair request', error);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Request not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Repair request</Text>
      <Text style={styles.meta}>
        Vehicle: {request.vehicle?.vehicle_name ?? id} · {new Date(request.request_date).toLocaleDateString()}
      </Text>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{request.status}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{request.priority}</Text>
        </View>
      </View>
      <Text style={styles.label}>Description</Text>
      <Text style={styles.description}>{request.description}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.base, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.sectionTitle, fontSize: 20, color: foreground, marginBottom: 8 },
  meta: { fontSize: 14, color: mutedForeground, marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.base },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm, backgroundColor: primary },
  badgeText: { color: primaryForeground, fontSize: 12, fontWeight: '500' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: foreground },
  description: { fontSize: 15, color: foreground },
  errorText: { fontSize: 16, color: destructive },
});
