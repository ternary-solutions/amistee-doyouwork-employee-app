import { DocumentViewerModal } from "@/components/document/DocumentViewerModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListCard } from "@/components/ui/ListCard";
import { SkeletonListCard } from "@/components/ui/Skeleton";
import {
  background,
  border,
  card,
  foreground,
  mutedForeground,
  primary,
  primaryForeground,
  radius,
  spacing,
} from "@/constants/theme";
import { useSetHeaderOptions } from "@/contexts/HeaderOptionsContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { resourcesService } from "@/services/resources";
import type { Resource } from "@/types/resources";
import { getBaseUrl, getMediaUrl } from "@/utils/api";
import { getErrorMessage } from "@/utils/errorMessage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ResourcesScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<string>("");
  const debouncedSearch = useDebouncedValue(searchQuery.trim(), 400);
  const [docViewer, setDocViewer] = useState<{
    url: string;
    title: string;
  } | null>(null);

  useSetHeaderOptions(
    useMemo(
      () => ({
        title: "Resources",
        subtitle: "Browse documents and resources.",
        showBack: false,
      }),
      [],
    ),
  );

  // Combined filter options from both category and type (deduplicated)
  const filterOptions = useMemo(() => {
    const names = items.flatMap((r) =>
      [r.resource_category?.name, r.resource_type?.name].filter(
        (n): n is string => Boolean(n),
      ),
    );
    return Array.from(new Set(names)).sort();
  }, [items]);

  const load = useCallback(
    async (fromPullToRefresh = false) => {
      try {
        if (fromPullToRefresh) {
          setRefreshing(true);
        } else if (!hasLoadedOnce.current) {
          setLoading(true);
        }
        const res = await resourcesService.list(
          1,
          50,
          debouncedSearch || undefined,
        );
        setItems(res?.items ?? []);
        hasLoadedOnce.current = true;
      } catch (error) {
        console.error("Failed to load resources", error);
        Alert.alert(
          "Error",
          getErrorMessage(error, "Failed to load resources. Please try again."),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [debouncedSearch],
  );

  useEffect(() => {
    load();
  }, [load]);

  const openResource = useCallback((item: Resource) => {
    const raw = item.attachment_url;
    if (!raw?.trim()) return;
    const url =
      raw.startsWith("http://") || raw.startsWith("https://")
        ? raw
        : getMediaUrl(raw) ||
          `${getBaseUrl(false).replace(/\/$/, "")}${raw.startsWith("/") ? "" : "/"}${raw}`;
    setDocViewer({ url, title: item.title });
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((r) => {
      if (!filter) return true;
      return (
        r.resource_category?.name === filter || r.resource_type?.name === filter
      );
    });
  }, [items, filter]);

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
      {filterOptions.length > 0 && items.length > 0 ? (
        <View style={styles.chipsWrap}>
          <Text style={styles.chipsLabel}>Filter</Text>
          <View style={styles.chipsRow}>
            <Pressable
              style={[styles.chip, !filter && styles.chipActive]}
              onPress={() => setFilter("")}
            >
              <Text style={[styles.chipText, !filter && styles.chipTextActive]}>
                All
              </Text>
            </Pressable>
            {filterOptions.map((opt) => (
              <Pressable
                key={opt}
                style={[styles.chip, filter === opt && styles.chipActive]}
                onPress={() => setFilter(filter === opt ? "" : opt)}
              >
                <Text
                  style={[
                    styles.chipText,
                    filter === opt && styles.chipTextActive,
                  ]}
                >
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );

  if (loading && items.length === 0) {
    return (
      <View
        style={[
          styles.skeletonContainer,
          { paddingBottom: spacing.xl + insets.bottom },
        ]}
      >
        <View style={styles.searchWrap}>
          <View
            style={[
              styles.searchInput,
              { height: 44, backgroundColor: border },
            ]}
          />
        </View>
        <View style={styles.skeletonWrap}>
          <SkeletonListCard />
          <SkeletonListCard />
          <SkeletonListCard />
          <SkeletonListCard />
          <SkeletonListCard />
        </View>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={filteredItems}
        keyExtractor={(r) => r.id}
        style={{ backgroundColor: background }}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: spacing.xl + insets.bottom },
        ]}
        ListEmptyComponent={
          <EmptyState
            message={
              filter
                ? "No resources match your filters."
                : "No resources found."
            }
            icon="library-outline"
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={primary}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <ListCard
              title={item.title}
              meta={[
                `${item.resource_type?.name ?? ""} · ${item.resource_category?.name ?? ""}`,
              ]}
              onPress={() => openResource(item)}
            >
              <Text style={styles.openLabel}>Open</Text>
            </ListCard>
          </View>
        )}
      />
      <DocumentViewerModal
        visible={!!docViewer}
        onClose={() => setDocViewer(null)}
        url={docViewer?.url ?? null}
        title={docViewer?.title ?? ""}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  skeletonContainer: { flex: 1, backgroundColor: background },
  skeletonWrap: { paddingHorizontal: spacing.base },
  searchWrap: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.md,
  },
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
  chipsWrap: { marginBottom: spacing.sm },
  chipsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: mutedForeground,
    marginBottom: 6,
  },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: card,
    borderWidth: 1,
    borderColor: border,
  },
  chipActive: { backgroundColor: primary, borderColor: primary },
  chipText: { fontSize: 14, color: foreground },
  chipTextActive: { color: primaryForeground, fontWeight: "600" },
  list: { padding: spacing.base, paddingBottom: spacing.xl },
  cardWrap: { marginBottom: spacing.md },
  openLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: primary,
    marginTop: spacing.sm,
  },
});
