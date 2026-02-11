import {
    background,
    border,
    card,
    foreground,
    mutedForeground,
    primary,
    radius,
    spacing,
} from '@/constants/theme';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { resourcesService } from '@/services/resources';
import type { Resource } from '@/types/resources';
import { getBaseUrl, getMediaUrl } from '@/utils/api';
import { getErrorMessage } from '@/utils/errorMessage';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ListCard } from '@/components/ui/ListCard';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ResourcesScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery.trim(), 400);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await resourcesService.list(1, 50, debouncedSearch || undefined);
      setItems(res?.items ?? []);
    } catch (error) {
      console.error('Failed to load resources', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to load resources. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const openResource = useCallback(async (item: Resource) => {
    const raw = item.attachment_url;
    if (!raw?.trim()) return;
    const url = raw.startsWith('http://') || raw.startsWith('https://')
      ? raw
      : getMediaUrl(raw) || `${getBaseUrl(false).replace(/\/$/, '')}${raw.startsWith('/') ? '' : '/'}${raw}`;
    try {
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
      else Alert.alert('Cannot open', 'No app can open this resource.');
    } catch (e) {
      Alert.alert('Error', getErrorMessage(e, 'Could not open resource.'));
    }
  }, []);

  const renderHeader = () => (
    <View style={styles.searchWrap}>
      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search resources..."
        placeholderTextColor={mutedForeground}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );

  if (loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(r) => r.id}
      style={{ backgroundColor: background }}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={[styles.list, { paddingBottom: spacing.xl + insets.bottom }]}
      ListEmptyComponent={<EmptyState message="No resources found." />}
      renderItem={({ item }) => (
        <View style={styles.cardWrap}>
          <ListCard
            title={item.title}
            meta={[`${item.resource_type?.name ?? ''} · ${item.resource_category?.name ?? ''}`]}
            onPress={() => openResource(item)}
          >
            <Text style={styles.openLabel}>Open</Text>
          </ListCard>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchWrap: { paddingHorizontal: spacing.base, paddingBottom: spacing.sm },
  searchInput: {
    borderWidth: 1,
    borderColor: border,
    borderRadius: radius.base,
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    fontSize: 16,
    color: foreground,
    backgroundColor: card,
  },
  list: { padding: spacing.base, paddingBottom: spacing.xl },
  cardWrap: { marginBottom: spacing.md },
  openLabel: { fontSize: 14, fontWeight: '600', color: primary, marginTop: spacing.sm },
});
