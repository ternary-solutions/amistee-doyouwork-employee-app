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
import { vehiclesService } from '@/services/vehicles';
import type { Vehicle } from '@/types/vehicles';
import { useRouter } from 'expo-router';
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

export default function VehiclesListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await vehiclesService.list(1, 50);
      setVehicles(res?.items ?? []);
    } catch (error) {
      console.error('Failed to load vehicles', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && vehicles.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (vehicles.length === 0) {
    return (
      <View style={[styles.empty, { paddingBottom: insets.bottom }]}>
        <Text style={styles.emptyText}>No vehicles.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={vehicles}
      keyExtractor={(v) => v.id}
      contentContainerStyle={[styles.list, { paddingBottom: spacing.xl + insets.bottom }]}
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => router.push(`/(app)/vehicles/${item.id}`)}
          accessibilityLabel={`${item.vehicle_name}, view details`}
          accessibilityRole="button"
        >
          <Text style={styles.cardTitle}>{item.vehicle_name}</Text>
          <Text style={styles.meta}>{item.license_plate} · {item.vehicle_type?.name}</Text>
          <Text style={styles.meta}>{item.location?.name}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  emptyText: { fontSize: 15, color: mutedForeground },
  list: { padding: spacing.base, paddingBottom: spacing.xl },
  card: {
    backgroundColor: card,
    borderRadius: radius.base,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: border,
  },
  cardTitle: { ...typography.title, color: foreground, marginBottom: 4 },
  meta: { fontSize: 13, color: mutedForeground, marginBottom: 2 },
});
