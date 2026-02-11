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
import { resourcesService } from '@/services/resources';
import type { Resource } from '@/types/resources';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ResourcesScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await resourcesService.list(1, 50);
      setItems(res?.items ?? []);
    } catch (error) {
      console.error('Failed to load resources', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.empty, { paddingBottom: insets.bottom }]}>
        <Text style={styles.emptyText}>No resources.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(r) => r.id}
      contentContainerStyle={[styles.list, { paddingBottom: spacing.xl + insets.bottom }]}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.meta}>{item.resource_type?.name} · {item.resource_category?.name}</Text>
        </View>
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
  meta: { fontSize: 13, color: mutedForeground },
});
