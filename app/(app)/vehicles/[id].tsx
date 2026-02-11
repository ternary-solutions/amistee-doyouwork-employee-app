import {
  border,
  card,
  foreground,
  mutedForeground,
  primary,
  radius,
  spacing,
  typography,
} from '@/constants/theme';
import { repairRequestsService } from '@/services/requests/repairs';
import { vehiclesService } from '@/services/vehicles';
import type { RepairRequest } from '@/types/requests/repairs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [vehicleName, setVehicleName] = useState<string>('');
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  }, [id]);

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

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Text style={styles.title}>{vehicleName || 'Vehicle'}</Text>
      <Text style={styles.sectionTitle}>Maintenance requests</Text>
      {requests.length === 0 ? (
        <Text style={styles.emptyText}>No repair requests.</Text>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(r) => r.id}
          contentContainerStyle={[styles.list, { paddingBottom: spacing.xl + insets.bottom }]}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.base },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.sectionTitle, fontSize: 22, color: foreground, marginBottom: spacing.base },
  sectionTitle: { ...typography.title, color: foreground, marginBottom: spacing.md },
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
});
