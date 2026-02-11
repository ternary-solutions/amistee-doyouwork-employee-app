import { EmptyState } from "@/components/ui/EmptyState";
import { FormModal } from "@/components/ui/FormModal";
import { ListCard } from "@/components/ui/ListCard";
import { SkeletonListCard } from "@/components/ui/Skeleton";
import {
    background,
    border,
    destructive,
    foreground,
    muted,
    mutedForeground,
    primary,
    primaryForeground,
    radius,
    spacing,
    success,
} from "@/constants/theme";
import { useCloseModalOnDrawerOpen } from "@/contexts/DrawerModalContext";
import { useSetHeaderOptions } from "@/contexts/HeaderOptionsContext";
import { clothingRequestsService } from "@/services/requests/clothings";
import type { ClothingObject, ClothingRequest } from "@/types/requests/clothings";
import { getErrorMessage } from "@/utils/errorMessage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
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

const STATUS_COLORS: Record<string, string> = {
  Pending: mutedForeground,
  Approved: success,
  Denied: destructive,
  Completed: primary,
};

function formatRequestTitle(request: ClothingRequest): string {
  if (request.requested_objects?.length) {
    return request.requested_objects
      .map((o) => (o.size ? `${o.name} (${o.size})` : o.name))
      .join(", ");
  }
  if (request.clothing_type_name) {
    const qty = request.quantity != null ? request.quantity : 1;
    const sz = request.size ? ` · ${request.size}` : "";
    return `${request.clothing_type_name} × ${qty}${sz}`;
  }
  return "Clothing request";
}

export default function ClothingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<ClothingRequest[]>([]);
  const [objects, setObjects] = useState<ClothingObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [size, setSize] = useState<string>("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (fromPullToRefresh = false) => {
    try {
      if (fromPullToRefresh) {
        setRefreshing(true);
      } else if (!hasLoadedOnce.current) {
        setLoading(true);
      }
      const [listRes, objectsRes] = await Promise.all([
        clothingRequestsService.list(1, 50),
        clothingRequestsService.listObjects(),
      ]);
      setRequests(listRes?.items ?? []);
      setObjects(objectsRes ?? []);
      hasLoadedOnce.current = true;
    } catch (error) {
      console.error("Failed to load clothing requests", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
        title: "Clothing Requests",
        subtitle: "Request work clothing and uniforms.",
        showBack: false,
        headerAction: {
          label: "New clothing request",
          onPress: () => setModalOpen(true),
        },
      }),
      [],
    ),
    "/(app)/clothing",
  );

  useCloseModalOnDrawerOpen(() => setModalOpen(false));

  const selectedObject = objects.find((o) => o.id === selectedId) ?? null;
  const availableSizes = selectedObject?.available_sizes?.length
    ? selectedObject.available_sizes
    : ["One Size"];

  const selectObject = (objectId: string) => {
    const isDeselecting = selectedId === objectId;
    if (isDeselecting) {
      setSelectedId(null);
      setSize("");
      return;
    }
    const obj = objects.find((o) => o.id === objectId);
    setSelectedId(objectId);
    setSize(obj?.available_sizes?.[0] ?? "One Size");
  };

  const handleCreate = async () => {
    if (!selectedId || !size) return;
    try {
      setSubmitting(true);
      await clothingRequestsService.create({
        clothing_object_ids: [selectedId],
        size: size as import("@/types/requests/clothings").ClothingSize,
        reason: reason.trim() || undefined,
      });
      setModalOpen(false);
      setSelectedId(null);
      setSize("");
      setReason("");
      load();
    } catch (error) {
      Alert.alert(
        "Error",
        getErrorMessage(
          error,
          "Failed to submit clothing request. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && requests.length === 0) {
    return (
      <View
        style={[
          styles.skeletonContainer,
          { paddingBottom: spacing.xl + insets.bottom },
        ]}
      >
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

  const fabBottom = insets.bottom + spacing.base;

  return (
    <>
      <View style={styles.screenWrap}>
        {requests.length === 0 ? (
          <View style={[styles.fill, { paddingBottom: 72 + insets.bottom }]}>
            <EmptyState
              message="No clothing requests yet."
              icon="shirt-outline"
              action={{
                label: "Request clothing",
                onPress: () => setModalOpen(true),
              }}
            />
          </View>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(r) => r.id}
            style={{ backgroundColor: background }}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: 72 + spacing.xl + insets.bottom },
            ]}
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
                  title={formatRequestTitle(item)}
                  meta={item.reason ? [item.reason] : undefined}
                  badge={{
                    text: item.status,
                    backgroundColor:
                      STATUS_COLORS[item.status] ?? mutedForeground,
                  }}
                  onPress={() => router.push(`/(app)/clothing/${item.id}`)}
                />
              </View>
            )}
          />
        )}
        <Pressable
          onPress={() => setModalOpen(true)}
          style={({ pressed }) => [
            styles.fab,
            { bottom: fabBottom },
            pressed && styles.pressed,
          ]}
          accessibilityLabel="New clothing request"
        >
          <Ionicons name="add" size={28} color={primaryForeground} />
        </Pressable>
      </View>
      <FormModal
        visible={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedId(null);
          setSize("");
        }}
        title="New clothing request"
        submitLabel="Submit"
        submitting={submitting}
        submitDisabled={!selectedId || !size}
        onSubmit={handleCreate}
        contentMaxHeight="85%"
      >
        <Text style={styles.label}>Select clothing</Text>
        <Text style={styles.hint}>Choose an item to request.</Text>
        <View style={styles.picker}>
          {objects.map((obj) => {
            const selected = selectedId === obj.id;
            const label = obj.type_name ? `${obj.name} (${obj.type_name})` : obj.name;
            return (
              <Pressable
                key={obj.id}
                style={[
                  styles.pickerOption,
                  selected && styles.pickerOptionActive,
                ]}
                onPress={() => selectObject(obj.id)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    selected && styles.pickerOptionTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {selectedId ? (
          <>
            <Text style={styles.label}>Size</Text>
            <Text style={styles.hint}>
              Select a size for {selectedObject?.name ?? "this item"}.
            </Text>
            <View style={styles.picker}>
              {availableSizes.map((s) => (
                <Pressable
                  key={s}
                  style={[
                    styles.pickerOption,
                    size === s && styles.pickerOptionActive,
                  ]}
                  onPress={() => setSize(s)}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      size === s && styles.pickerOptionTextActive,
                    ]}
                  >
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
        {objects.length === 0 && !loading ? (
          <Text style={styles.emptyObjects}>
            No clothing items available to request.
          </Text>
        ) : null}
        <Text style={styles.label}>Reason (optional)</Text>
        <TextInput
          style={styles.input}
          value={reason}
          onChangeText={setReason}
          placeholder="Reason"
        />
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  skeletonContainer: { flex: 1, backgroundColor: background },
  skeletonWrap: { padding: spacing.base },
  screenWrap: { flex: 1, backgroundColor: background },
  fill: { flex: 1, backgroundColor: background },
  list: { padding: spacing.base, paddingBottom: spacing.xl },
  cardWrap: { marginBottom: spacing.md },
  fab: {
    position: "absolute",
    right: spacing.base,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  pressed: { opacity: 0.85 },
  details: { fontSize: 13, color: mutedForeground, marginTop: 4 },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: foreground,
  },
  hint: { fontSize: 13, color: mutedForeground, marginBottom: spacing.sm },
  emptyObjects: {
    fontSize: 13,
    color: mutedForeground,
    marginBottom: spacing.base,
  },
  input: {
    borderWidth: 1,
    borderColor: border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.base,
    fontSize: 16,
  },
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
