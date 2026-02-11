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
} from '@/constants/theme';
import { toolsService } from '@/services/tools';
import { getErrorMessage } from '@/utils/errorMessage';
import type { Tool } from '@/types/tools';
import { useToolRequestDraftStore } from '@/store/toolRequestDraft';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PAGE_SIZE = 24;

export default function ToolCatalogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addFromCatalog = useToolRequestDraftStore((s) => s.addFromCatalog);

  const [tools, setTools] = useState<Tool[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadTools = useCallback(
    async (pageNum: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const data = await toolsService.list(
          pageNum,
          PAGE_SIZE,
          debouncedSearch || undefined
        );
        const items = data?.items ?? [];
        setTools((prev) => (append ? [...prev, ...items] : items));
        setPage(pageNum);
        setTotalPages(data?.total_pages ?? 1);
        setTotalCount(data?.total ?? 0);
      } catch (error) {
        console.error('Failed to load tools', error);
        Alert.alert('Error', getErrorMessage(error, 'Failed to load tools. Please try again.'));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch]
  );

  useEffect(() => {
    setPage(1);
    loadTools(1, false);
  }, [debouncedSearch, loadTools]);

  const loadMore = useCallback(() => {
    if (page >= totalPages || loadingMore || loading) return;
    loadTools(page + 1, true);
  }, [page, totalPages, loadingMore, loading, loadTools]);

  const handleAdd = (tool: Tool) => {
    if (tool.total_stock <= 0) return;
    addFromCatalog(tool);
    router.back();
  };

  const renderItem = ({ item }: { item: Tool }) => (
    <View style={styles.row}>
      <View style={styles.toolInfo}>
        <Text style={styles.toolName}>{item.tool_name}</Text>
        <Text style={styles.toolStock}>
          {item.total_stock > 0 ? `Stock: ${item.total_stock}` : 'Out of stock'}
        </Text>
      </View>
      <Pressable
        style={[
          styles.addBtn,
          (loading || item.total_stock <= 0) && styles.addBtnDisabled,
        ]}
        onPress={() => handleAdd(item)}
        disabled={loading || item.total_stock <= 0}
      >
        <Text style={styles.addBtnText}>Add</Text>
      </Pressable>
    </View>
  );

  const ListFooter = () =>
    page < totalPages ? (
      loadingMore ? (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color={primary} />
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.loadMoreBtn, pressed && { opacity: 0.8 }]}
          onPress={loadMore}
        >
          <Text style={styles.loadMoreText}>
            Load more ({tools.length} of {totalCount})
          </Text>
        </Pressable>
      )
    ) : null;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={20} color={mutedForeground} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search tools..."
          placeholderTextColor={mutedForeground}
          autoCapitalize="none"
        />
      </View>

      {loading && tools.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primary} />
        </View>
      ) : (
        <FlatList
          data={tools}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {debouncedSearch ? 'No tools match your search.' : 'No tools available.'}
            </Text>
          }
          ListFooterComponent={ListFooter}
          refreshControl={
            <RefreshControl
              refreshing={loading && !loadingMore}
              onRefresh={() => loadTools(1, false)}
              tintColor={primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: background,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: border,
    borderRadius: radius.sm,
    backgroundColor: card,
  },
  searchIcon: {
    marginLeft: spacing.md,
  },
  searchInput: {
    flex: 1,
    borderWidth: 0,
    padding: spacing.md,
    fontSize: 16,
    color: foreground,
  },
  list: {
    padding: spacing.base,
    paddingTop: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: muted,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  toolInfo: { flex: 1 },
  toolName: { fontSize: 14, fontWeight: '600', color: foreground },
  toolStock: { fontSize: 12, color: mutedForeground },
  addBtn: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: primary,
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { fontSize: 13, fontWeight: '600', color: primaryForeground },
  loader: { paddingVertical: spacing.sm, alignItems: 'center' },
  loadMoreBtn: { paddingVertical: spacing.sm, alignItems: 'center' },
  loadMoreText: { fontSize: 14, fontWeight: '500', color: primary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: mutedForeground, textAlign: 'center', marginTop: spacing.xl },
});
