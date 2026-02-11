import { EmptyState } from "@/components/ui/EmptyState";
import { FormModal } from "@/components/ui/FormModal";
import { ListCard } from "@/components/ui/ListCard";
import {
  background,
  border,
  foreground,
  muted,
  mutedForeground,
  primary,
  primaryForeground,
  radius,
  spacing,
  success,
  warning,
} from "@/constants/theme";
import { useCloseModalOnDrawerOpen } from "@/contexts/DrawerModalContext";
import { useSetHeaderOptions } from "@/contexts/HeaderOptionsContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { suggestionsService } from "@/services/suggestions";
import type { Suggestion } from "@/types/suggestions";
import { getErrorMessage } from "@/utils/errorMessage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STATUS_COLORS: Record<string, string> = {
  Open: primary,
  "In Review": warning,
  Implemented: success,
  Closed: mutedForeground,
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "Open", label: "Open" },
  { value: "In Review", label: "In Review" },
  { value: "Implemented", label: "Implemented" },
  { value: "Closed", label: "Closed" },
];

export default function SuggestionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [typeId, setTypeId] = useState("");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const load = useCallback(
    async (fromPullToRefresh = false) => {
      try {
        if (fromPullToRefresh) {
          setRefreshing(true);
        } else if (!hasLoadedOnce.current) {
          setLoading(true);
        }
        const [listRes, typesRes] = await Promise.all([
          suggestionsService.list(
            1,
            50,
            debouncedSearch.trim() || undefined,
            statusFilter || undefined,
          ),
          suggestionsService.listTypes(),
        ]);
        setItems(listRes?.items ?? []);
        setTypes(typesRes?.map((t) => ({ id: t.id, name: t.name })) ?? []);
        hasLoadedOnce.current = true;
      } catch (error) {
        console.error("Failed to load suggestions", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [debouncedSearch, statusFilter],
  );

  useEffect(() => {
    load();
  }, [load]);

  // Dismiss create modal when navigating away (e.g. via hamburger menu)
  useFocusEffect(
    useCallback(() => {
      return () => setModalOpen(false);
    }, []),
  );

  useSetHeaderOptions(
    useMemo(
      () => ({
        title: "Suggestions",
        subtitle: "Submit and track ideas and feedback.",
        showBack: false,
        headerAction: {
          label: "New suggestion",
          onPress: () => setModalOpen(true),
        },
      }),
      [],
    ),
    "/(app)/suggestions",
  );

  useCloseModalOnDrawerOpen(() => setModalOpen(false));

  const handleCreate = async () => {
    if (!typeId || !title.trim() || !details.trim()) return;
    try {
      setSubmitting(true);
      await suggestionsService.create({
        suggestion_type_id: typeId,
        title: title.trim(),
        details: details.trim(),
      });
      setModalOpen(false);
      setTypeId("");
      setTitle("");
      setDetails("");
      load();
    } catch (error) {
      Alert.alert(
        "Error",
        getErrorMessage(
          error,
          "Failed to submit suggestion. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  const hasActiveFilters = Boolean(debouncedSearch.trim() || statusFilter);
  const emptyMessage = hasActiveFilters
    ? "No suggestions match your filters."
    : "No suggestions yet.";
  const emptyAction = !hasActiveFilters
    ? { label: "New suggestion", onPress: () => setModalOpen(true) }
    : undefined;

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={(s) => s.id}
        style={{ backgroundColor: background }}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: spacing.xl + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search suggestions..."
              placeholderTextColor={mutedForeground}
            />
            <View style={styles.filterRow}>
              {STATUS_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value || "all"}
                  style={[
                    styles.filterChip,
                    statusFilter === opt.value && styles.filterChipActive,
                  ]}
                  onPress={() => setStatusFilter(opt.value)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      statusFilter === opt.value && styles.filterChipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState message={emptyMessage} action={emptyAction} />
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <ListCard
              title={item.title}
              meta={[
                `${item.suggestion_type?.name ?? ""} · ${new Date(item.created_at).toLocaleDateString()}`,
              ]}
              badge={{
                text: item.status,
                backgroundColor: STATUS_COLORS[item.status] ?? "#94a3b8",
              }}
              onPress={() => router.push(`/(app)/suggestions/${item.id}`)}
            >
              {item.details ? (
                <Text style={styles.details} numberOfLines={2}>
                  {item.details}
                </Text>
              ) : null}
            </ListCard>
          </View>
        )}
      />
      <FormModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New suggestion"
        submitLabel="Submit"
        submitting={submitting}
        onSubmit={handleCreate}
      >
        <Text style={styles.label}>Type</Text>
        <View style={styles.picker}>
          {types.map((t) => (
            <Pressable
              key={t.id}
              style={[
                styles.pickerOption,
                typeId === t.id && styles.pickerOptionActive,
              ]}
              onPress={() => setTypeId(t.id)}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  typeId === t.id && styles.pickerOptionTextActive,
                ]}
              >
                {t.name}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
        />
        <Text style={styles.label}>Details</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={details}
          onChangeText={setDetails}
          placeholder="Details"
          multiline
        />
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  fill: { flex: 1, backgroundColor: background },
  list: { padding: spacing.base, paddingBottom: spacing.xl },
  skeletonContainer: { flex: 1, backgroundColor: background },
  skeletonWrap: { padding: spacing.base },
  header: {
    width: "100%",
    alignSelf: "stretch",
    marginBottom: spacing.base,
  },
  searchInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: border,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: 16,
    color: foreground,
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: muted,
  },
  filterChipActive: { backgroundColor: primary },
  filterChipText: { fontSize: 14, color: foreground },
  filterChipTextActive: { color: primaryForeground },
  cardWrap: { marginBottom: spacing.md },
  details: { fontSize: 13, color: mutedForeground, marginTop: 4 },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: foreground,
  },
  input: {
    borderWidth: 1,
    borderColor: border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.base,
    fontSize: 16,
  },
  textArea: { minHeight: 60 },
  picker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  pickerOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: muted,
  },
  pickerOptionActive: { backgroundColor: primary },
  pickerOptionText: { fontSize: 14, color: foreground },
  pickerOptionTextActive: { color: primaryForeground },
});
