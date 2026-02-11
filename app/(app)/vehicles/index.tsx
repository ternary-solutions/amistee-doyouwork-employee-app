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
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { vehiclesService } from '@/services/vehicles';
import type { Vehicle } from '@/types/vehicles';
import { getErrorMessage } from '@/utils/errorMessage';
import { getMediaUrl } from '@/utils/api';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/ui/EmptyState';

export default function VehiclesListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all');
  const debouncedSearch = useDebouncedValue(searchQuery.trim(), 400);

  const vehicleTypeOptions = useMemo(() => {
    const names = vehicles
      .map((v) => v.vehicle_type?.name)
      .filter((n): n is string => Boolean(n));
    const unique = Array.from(new Set(names)).sort();
    return ['all', ...unique];
  }, [vehicles]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await vehiclesService.list(
        1,
        50,
        debouncedSearch || undefined,
        vehicleTypeFilter === 'all' ? undefined : vehicleTypeFilter
      );
      setVehicles(res?.items ?? []);
    } catch (error) {
      console.error('Failed to load vehicles', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to load vehicles. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, vehicleTypeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const renderHeader = () => (
    <View style={styles.filterWrap}>
      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search vehicles..."
        placeholderTextColor={mutedForeground}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <View style={styles.typeFilterRow}>
        <Text style={styles.filterLabel}>Type:</Text>
        <View style={styles.typeFilterOptions}>
          {vehicleTypeOptions.map((opt) => (
            <Pressable
              key={opt}
              style={[
                styles.typeFilterBtn,
                (vehicleTypeFilter === opt || (opt === 'all' && vehicleTypeFilter === 'all')) && styles.typeFilterBtnActive,
              ]}
              onPress={() => setVehicleTypeFilter(opt)}
            >
              <Text
                style={[
                  styles.typeFilterBtnText,
                  (vehicleTypeFilter === opt || (opt === 'all' && vehicleTypeFilter === 'all')) && styles.typeFilterBtnTextActive,
                ]}
              >
                {opt === 'all' ? 'All' : opt}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  if (loading && vehicles.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={vehicles}
      keyExtractor={(v) => v.id}
      style={{ backgroundColor: background }}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={[styles.list, { paddingBottom: spacing.xl + insets.bottom }]}
      ListEmptyComponent={<EmptyState message="No vehicles found." />}
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
          onPress={() => router.push(`/(app)/vehicles/${item.id}`)}
          accessibilityLabel={`${item.vehicle_name}, view details`}
          accessibilityRole="button"
        >
          <View style={styles.cardInner}>
            {item.photo_url ? (
              <Image source={{ uri: getMediaUrl(item.photo_url) }} style={styles.cardThumb} />
            ) : (
              <View style={styles.cardThumbPlaceholder}>
                <Text style={styles.cardThumbEmoji}>🚗</Text>
              </View>
            )}
            <View style={styles.cardContent}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>{item.vehicle_name}</Text>
                {item.license_plate ? (
                  <Text style={styles.licensePlate} numberOfLines={1}>{item.license_plate}</Text>
                ) : null}
              </View>
              <Text style={styles.meta}>
                {[item.vehicle_type?.name, item.make && item.model ? `${item.make} ${item.model}` : null, item.year]
                  .filter(Boolean)
                  .join(' · ') || item.location?.name || '—'}
              </Text>
              {item.location?.name ? (
                <Text style={styles.meta}>{item.location.name}</Text>
              ) : null}
              {item.status !== undefined && item.status !== null && (
                <View style={[styles.statusBadge, item.status ? styles.statusActive : styles.statusInactive]}>
                  <Text style={styles.statusBadgeText}>{item.status ? 'Active' : 'Out of Service'}</Text>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterWrap: { paddingHorizontal: spacing.base, paddingBottom: spacing.md },
  searchInput: {
    borderWidth: 1,
    borderColor: border,
    borderRadius: radius.base,
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    fontSize: 16,
    color: foreground,
    backgroundColor: card,
    marginBottom: spacing.sm,
  },
  filterLabel: { fontSize: 14, fontWeight: '500', color: mutedForeground, marginBottom: 6 },
  typeFilterRow: { marginBottom: spacing.sm },
  typeFilterOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
  card: {
    backgroundColor: card,
    borderRadius: radius.base,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: border,
  },
  cardInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardThumb: { width: 56, height: 56, borderRadius: radius.sm },
  cardThumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardThumbEmoji: { fontSize: 24 },
  cardContent: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { ...typography.title, color: foreground, flex: 1 },
  licensePlate: { fontSize: 12, color: mutedForeground, flexShrink: 0 },
  meta: { fontSize: 13, color: mutedForeground, marginBottom: 2 },
  statusBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusActive: { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
  statusInactive: { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  statusBadgeText: { fontSize: 11, fontWeight: '600', color: foreground },
});
