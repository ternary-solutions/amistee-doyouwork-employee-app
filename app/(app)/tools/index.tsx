import { ToolRequestDetailSheet } from "@/components/tools/ToolRequestDetailSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormModal } from "@/components/ui/FormModal";
import { ListCard } from "@/components/ui/ListCard";
import { SkeletonDetailCard } from "@/components/ui/Skeleton";
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
} from "@/constants/theme";
import { useCloseModalOnDrawerOpen } from "@/contexts/DrawerModalContext";
import { useSetHeaderOptions } from "@/contexts/HeaderOptionsContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { toolRequestsService } from "@/services/requests/tools";
import { toolsService } from "@/services/tools";
import {
  useToolRequestDraftStore,
  type CartItem,
} from "@/store/toolRequestDraft";
import type { ToolRequest, ToolRequestLineItem } from "@/types/requests/tools";
import type { Tool } from "@/types/tools";
import { getErrorMessage } from "@/utils/errorMessage";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format, startOfDay } from "date-fns";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STATUS_COLORS: Record<string, string> = {
  Pending: "#eab308",
  Approved: "#3b82f6",
  CheckedOut: "#22c55e",
  Denied: "#ef4444",
  Returned: mutedForeground,
};

function formatDate(d: string | null | undefined) {
  return d ? new Date(d).toLocaleDateString() : "—";
}

function getToolNames(request: ToolRequest): string {
  const items = request.items ?? [];
  if (items.length > 0) {
    return items
      .map((it) => it.tool?.tool_name ?? it.tool_type?.name ?? "Tool")
      .join(", ");
  }
  return request.tool?.tool_name ?? request.tool_type?.name ?? "Tool";
}

function getRequestedSummary(request: ToolRequest): string {
  const items = request.items ?? [];
  const totalQty =
    request.quantity ?? items.reduce((sum, it) => sum + it.quantity, 0);
  if (items.length > 0) {
    return items
      .map(
        (it) =>
          `${it.tool?.tool_name ?? it.tool_type?.name ?? "Tool"} × ${it.quantity}`,
      )
      .join(", ");
  }
  return `Requested: ${totalQty}`;
}

function getFulfilledSummary(items: ToolRequestLineItem[]): string {
  const fulfilled = items.filter((it) => (it.fulfilled_quantity ?? 0) > 0);
  if (fulfilled.length === 0) return "";
  return fulfilled
    .map(
      (it) =>
        `${it.tool?.tool_name ?? it.tool_type?.name ?? "Tool"} × ${it.fulfilled_quantity}`,
    )
    .join(", ");
}

function getRejectedSummary(items: ToolRequestLineItem[]): string {
  const rejected = items.filter((it) => (it.fulfilled_quantity ?? 0) === 0);
  if (rejected.length === 0) return "";
  return rejected
    .map(
      (it) =>
        `${it.tool?.tool_name ?? it.tool_type?.name ?? "Tool"} × ${it.quantity}`,
    )
    .join(", ");
}

/** Requests with returnable items still out with the user */
function getRequestsToReturn(requests: ToolRequest[]): ToolRequest[] {
  return requests.filter((req) => {
    if (req.status !== "CheckedOut") return false;
    const items = req.items ?? [];
    if (items.length > 0) {
      return items.some((it) => {
        const f = it.fulfilled_quantity ?? 0;
        const r = it.returned_quantity ?? 0;
        return it.tool?.is_returnable && f - r > 0;
      });
    }
    return (
      req.tool?.is_returnable &&
      (req.fulfilled_quantity ?? 0) - (req.returned_quantity ?? 0) > 0
    );
  });
}

function getOutstandingSummary(request: ToolRequest): string {
  const items = request.items ?? [];
  if (items.length > 0) {
    const outstanding = items
      .filter((it) => {
        const f = it.fulfilled_quantity ?? 0;
        const r = it.returned_quantity ?? 0;
        return it.tool?.is_returnable && f - r > 0;
      })
      .map(
        (it) =>
          `${it.tool?.tool_name ?? it.tool_type?.name ?? "Tool"} × ${(it.fulfilled_quantity ?? 0) - (it.returned_quantity ?? 0)}`,
      );
    return outstanding.join(", ");
  }
  const out =
    (request.fulfilled_quantity ?? 0) - (request.returned_quantity ?? 0);
  return `${request.tool?.tool_name ?? request.tool_type?.name ?? "Tool"} × ${out}`;
}

const COMBO_RESULTS_LIMIT = 8;
const MIN_PICKUP_DATE = new Date();
MIN_PICKUP_DATE.setHours(0, 0, 0, 0);
const MAX_PICKUP_DATE = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

export default function ToolsScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const consumeCatalogPending = useToolRequestDraftStore(
    (s) => s.consumeCatalogPending,
  );
  const saveDraftBeforeCatalog = useToolRequestDraftStore(
    (s) => s.saveDraftBeforeCatalog,
  );

  const [toolRequests, setToolRequests] = useState<ToolRequest[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [createPickup, setCreatePickup] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnRequest, setReturnRequest] = useState<ToolRequest | null>(null);
  const [returnQty, setReturnQty] = useState("");
  const [returnComment, setReturnComment] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ToolRequest | null>(
    null,
  );
  const [showPickupDatePicker, setShowPickupDatePicker] = useState(false);

  const [createToolsSearch, setCreateToolsSearch] = useState("");
  const debouncedSearch = useDebouncedValue(createToolsSearch, 300);
  const [createToolsLoading, setCreateToolsLoading] = useState(false);
  const [toolsById, setToolsById] = useState<Map<string, Tool>>(new Map());

  const load = useCallback(async (fromPullToRefresh = false) => {
    try {
      if (fromPullToRefresh) {
        setRefreshing(true);
      } else if (!hasLoadedOnce.current) {
        setLoading(true);
      }
      const requestsRes = await toolRequestsService.list(1, 50);
      setToolRequests(requestsRes?.items ?? []);
      hasLoadedOnce.current = true;
    } catch (error) {
      console.error("Failed to load requests", error);
      Alert.alert(
        "Error",
        getErrorMessage(
          error,
          "Failed to load tool requests. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadCreateTools = useCallback(async () => {
    if (!createModalOpen) return;
    setCreateToolsLoading(true);
    try {
      const data = await toolsService.list(
        1,
        COMBO_RESULTS_LIMIT,
        debouncedSearch || undefined,
      );
      const items = data?.items ?? [];
      setTools(items);
      setToolsById((prev) => {
        const next = new Map(prev);
        items.forEach((t) => next.set(t.id, t));
        return next;
      });
    } catch (error) {
      console.error("Failed to load tools", error);
      Alert.alert(
        "Error",
        getErrorMessage(error, "Failed to load tools. Please try again."),
      );
    } finally {
      setCreateToolsLoading(false);
    }
  }, [createModalOpen, debouncedSearch]);

  useEffect(() => {
    if (createModalOpen) {
      loadCreateTools();
    } else {
      setTools([]);
      setCreateToolsSearch("");
      setToolsById(new Map());
    }
  }, [createModalOpen, debouncedSearch, loadCreateTools]);

  // Prefill pickup date to today when opening create modal
  useEffect(() => {
    if (createModalOpen && !createPickup) {
      setCreatePickup(format(startOfDay(new Date()), "yyyy-MM-dd"));
    }
  }, [createModalOpen, createPickup]);

  useFocusEffect(
    useCallback(() => {
      const state = useToolRequestDraftStore.getState();
      if (state.openCreateModalOnReturn) {
        const { pending, draft } = consumeCatalogPending();
        // Restore draft and merge catalog items into cart
        const merged = [...draft.cart];
        pending.forEach((p) => {
          const existing = merged.find((c) => c.tool_id === p.tool_id);
          if (existing) {
            const idx = merged.indexOf(existing);
            merged.splice(idx, 1, {
              ...existing,
              quantity: existing.quantity + p.quantity,
            });
          } else {
            merged.push(p);
          }
        });
        setCart(merged);
        setCreatePickup(draft.pickup);
        setCreateMessage(draft.message);
        setCreateModalOpen(true);
      }
      // Dismiss all modals/sheets when navigating away (e.g. via hamburger menu)
      return () => {
        setCreateModalOpen(false);
        setReturnModalOpen(false);
        setReturnRequest(null);
        setDetailSheetOpen(false);
        setSelectedRequest(null);
        setShowPickupDatePicker(false);
      };
    }, [consumeCatalogPending]),
  );

  useEffect(() => {
    load();
  }, [load]);

  useSetHeaderOptions(
    useMemo(
      () => ({
        title: "Tools & Equipment",
        subtitle: "Request tools, track requests, and return items.",
        showBack: false,
        headerAction: {
          label: "New tool request",
          onPress: () => setCreateModalOpen(true),
        },
      }),
      [],
    ),
    "/(app)/tools",
  );

  useCloseModalOnDrawerOpen(() => {
    setCreateModalOpen(false);
    setReturnModalOpen(false);
    setReturnRequest(null);
    setDetailSheetOpen(false);
    setSelectedRequest(null);
  });

  const addToCart = (tool: Tool) => {
    if (!tool || tool.total_stock <= 0) return;
    setToolsById((prev) => new Map(prev).set(tool.id, tool));
    setCart((prev) => {
      const existing = prev.find((c) => c.tool_id === tool.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + 1, tool.total_stock);
        return prev.map((c) =>
          c.tool_id === tool.id ? { ...c, quantity: newQty } : c,
        );
      }
      return [...prev, { tool_id: tool.id, quantity: 1 }];
    });
  };

  const updateCartQty = (toolId: string, delta: number) => {
    const tool = toolsById.get(toolId) ?? tools.find((t) => t.id === toolId);
    if (!tool) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.tool_id === toolId);
      if (!existing) return prev;
      const newQty = Math.max(
        0,
        Math.min(existing.quantity + delta, tool.total_stock),
      );
      if (newQty === 0) return prev.filter((c) => c.tool_id !== toolId);
      return prev.map((c) =>
        c.tool_id === toolId ? { ...c, quantity: newQty } : c,
      );
    });
  };

  const removeFromCart = (toolId: string) => {
    setCart((prev) => prev.filter((c) => c.tool_id !== toolId));
  };

  const handleOpenCatalog = () => {
    saveDraftBeforeCatalog(cart, createPickup, createMessage);
    setCreateModalOpen(false);
    router.push("/(app)/tools/catalog");
  };

  const handleCreate = async () => {
    const pickup = createPickup.trim();
    if (cart.length === 0 || !pickup) return;
    try {
      setSubmitting(true);
      await toolRequestsService.create({
        items: cart,
        pickup_date: pickup,
        message: createMessage.trim() || undefined,
      });
      setCreateModalOpen(false);
      setCart([]);
      setCreatePickup("");
      setCreateMessage("");
      load();
    } catch (error) {
      console.error("Create tool request failed", error);
      Alert.alert(
        "Error",
        getErrorMessage(
          error,
          "Failed to submit tool request. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openReturnModal = async (request: ToolRequest) => {
    try {
      const full = await toolRequestsService.getById(request.id);
      setReturnRequest(full);
      const max = Math.max(
        0,
        (full.fulfilled_quantity ?? 0) - (full.returned_quantity ?? 0),
      );
      setReturnQty(max > 0 ? String(max) : "");
      setReturnComment("");
      setReturnModalOpen(true);
    } catch (error) {
      console.error("Failed to load request for return", error);
      Alert.alert("Error", getErrorMessage(error, "Failed to load request."));
    }
  };

  const handleReturn = async () => {
    if (!returnRequest) return;
    const qty = parseInt(returnQty, 10);
    const max = Math.max(
      0,
      (returnRequest.fulfilled_quantity ?? 0) -
        (returnRequest.returned_quantity ?? 0),
    );
    if (!Number.isFinite(qty) || qty < 1 || qty > max) return;
    const totalReturned = (returnRequest.returned_quantity ?? 0) + qty;
    try {
      setReturnSubmitting(true);
      await toolRequestsService.returnTool(
        returnRequest.id,
        totalReturned,
        returnComment.trim() || undefined,
      );
      setReturnModalOpen(false);
      setReturnRequest(null);
      setReturnQty("");
      setReturnComment("");
      load();
    } catch (error) {
      console.error("Return tool failed", error);
      Alert.alert("Error", getErrorMessage(error, "Failed to return tool."));
    } finally {
      setReturnSubmitting(false);
    }
  };

  const maxReturnable = returnRequest
    ? Math.max(
        0,
        (returnRequest.fulfilled_quantity ?? 0) -
          (returnRequest.returned_quantity ?? 0),
      )
    : 0;

  const requestsToReturn = getRequestsToReturn(toolRequests);

  const openDetail = (req: ToolRequest) => {
    setSelectedRequest(req);
    setDetailSheetOpen(true);
  };

  const handleReturnFromDetail = (req: ToolRequest) => {
    setDetailSheetOpen(false);
    setSelectedRequest(null);
    openReturnModal(req);
  };

  const handleDateChange = (_: unknown, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPickupDatePicker(false);
    }
    if (selectedDate) setCreatePickup(selectedDate.toISOString().slice(0, 10));
  };

  const confirmDatePicker = () => {
    setShowPickupDatePicker(false);
  };

  if (loading && toolRequests.length === 0) {
    return (
      <ScrollView
        style={{ backgroundColor: background }}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: spacing.xl + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.skeletonWrap}>
          <SkeletonDetailCard />
          <SkeletonDetailCard />
          <SkeletonDetailCard />
          <SkeletonDetailCard />
          <SkeletonDetailCard />
        </View>
      </ScrollView>
    );
  }

  const renderRequestCard = (item: ToolRequest) => {
    const items = item.items ?? [];
    const fulfilledSummary = getFulfilledSummary(items);
    const rejectedSummary = getRejectedSummary(items);
    const expectedReturn =
      items.find((it) => it.expected_return_date)?.expected_return_date ??
      item.expected_return_date;
    const showFulfillment = ["Approved", "CheckedOut", "Returned"].includes(
      item.status,
    );

    return (
      <View style={styles.cardWrap}>
        <ListCard
          title={getToolNames(item)}
          meta={[
            getRequestedSummary(item),
            `Pickup: ${formatDate(item.pickup_date)}`,
            `Requested: ${formatDate(item.created_at)}`,
          ]}
          badge={{
            text: item.status,
            backgroundColor: STATUS_COLORS[item.status] ?? mutedForeground,
          }}
          onPress={() => openDetail(item)}
        >
          {item.message ? (
            <Text style={styles.message} numberOfLines={2}>
              {item.message}
            </Text>
          ) : null}
          {showFulfillment && (
            <View style={styles.fulfillmentBlock}>
              {fulfilledSummary ? (
                <Text style={styles.fulfilledText}>
                  Fulfilled: {fulfilledSummary}
                </Text>
              ) : null}
              {rejectedSummary ? (
                <Text style={styles.rejectedText}>
                  Rejected: {rejectedSummary}
                </Text>
              ) : null}
              {expectedReturn ? (
                <Text style={styles.meta}>
                  Expected return: {formatDate(expectedReturn)}
                </Text>
              ) : null}
            </View>
          )}
        </ListCard>
      </View>
    );
  };

  return (
    <>
      {toolRequests.length === 0 ? (
        <View style={[styles.fill, { paddingBottom: insets.bottom }]}>
          <EmptyState
            message="No tool requests yet."
            icon="construct-outline"
            action={{
              label: "Request tools",
              onPress: () => setCreateModalOpen(true),
            }}
          />
        </View>
      ) : (
        <ScrollView
          style={{ backgroundColor: background }}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: spacing.xl + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={primary}
            />
          }
        >
          {requestsToReturn.length > 0 && (
            <View style={styles.toReturnSection}>
              <Text style={styles.sectionTitle}>Tools to return</Text>
              <Text style={styles.sectionSubtitle}>
                Items you have checked out that must be returned
              </Text>
              {requestsToReturn.map((req) => (
                <Pressable
                  key={req.id}
                  style={({ pressed }) => [
                    styles.toReturnCard,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => openDetail(req)}
                  accessibilityLabel={`${getToolNames(req)}, return due ${formatDate(req.expected_return_date)}`}
                  accessibilityRole="button"
                >
                  <View style={styles.toReturnCardContent}>
                    <Text style={styles.toReturnCardTitle}>
                      {getToolNames(req)}
                    </Text>
                    <Text style={styles.toReturnCardMeta}>
                      Out: {getOutstandingSummary(req)}
                    </Text>
                    {req.expected_return_date && (
                      <Text style={styles.toReturnCardMeta}>
                        Due: {formatDate(req.expected_return_date)}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={foreground}
                  />
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.requestsSection}>
            <Text style={styles.sectionTitle}>My Requests</Text>
            {toolRequests.map((item) => (
              <Fragment key={item.id}>{renderRequestCard(item)}</Fragment>
            ))}
          </View>
        </ScrollView>
      )}

      <FormModal
        visible={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Request tools"
        submitLabel="Submit"
        submitting={submitting}
        submitDisabled={cart.length === 0 || !createPickup.trim()}
        onSubmit={handleCreate}
        contentMaxHeight="85%"
      >
        <Text style={styles.label}>Select tools</Text>
        <View style={styles.comboboxRow}>
          <BottomSheetTextInput
            style={[styles.input, styles.searchInput]}
            value={createToolsSearch}
            onChangeText={setCreateToolsSearch}
            placeholder="Search tools..."
            placeholderTextColor={mutedForeground}
          />
          <Pressable
            style={({ pressed }) => [
              styles.catalogBtn,
              pressed && { opacity: 0.8 },
            ]}
            onPress={handleOpenCatalog}
          >
            <Ionicons name="list" size={18} color={primaryForeground} />
            <Text style={styles.catalogBtnText}>Catalog</Text>
          </Pressable>
        </View>
        <View style={styles.comboboxDropdown}>
          {createToolsLoading ? (
            <View style={styles.toolsLoader}>
              <ActivityIndicator size="small" color={primary} />
            </View>
          ) : tools.length === 0 ? (
            <Text style={styles.mutedText}>
              {debouncedSearch
                ? "No tools match. Try catalog."
                : "Search or browse catalog."}
            </Text>
          ) : (
            <FlatList
              data={tools.slice(0, 3)}
              keyExtractor={(t) => t.id}
              renderItem={({ item: t }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.toolRow,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => addToCart(t)}
                  disabled={createToolsLoading || t.total_stock <= 0}
                >
                  <View style={styles.toolInfo}>
                    <Text style={styles.toolName}>{t.tool_name}</Text>
                    <Text style={styles.toolStock}>
                      {t.total_stock > 0
                        ? `Stock: ${t.total_stock}`
                        : "Out of stock"}
                    </Text>
                  </View>
                  <Text style={styles.addToolBtnText}>
                    {cart.find((c) => c.tool_id === t.id)
                      ? "+ Add more"
                      : "+ Add"}
                  </Text>
                </Pressable>
              )}
              scrollEnabled={false}
            />
          )}
        </View>

        <Text style={styles.label}>
          Cart ({cart.reduce((s, c) => s + c.quantity, 0)} item(s))
        </Text>
        {cart.length === 0 ? (
          <Text style={styles.mutedText}>Your cart is empty.</Text>
        ) : (
          <View style={styles.cartList}>
            {cart
              .map((c) => ({
                c,
                tool:
                  toolsById.get(c.tool_id) ??
                  tools.find((t) => t.id === c.tool_id),
              }))
              .filter(
                (
                  entry,
                ): entry is {
                  c: CartItem;
                  tool: NonNullable<ReturnType<typeof toolsById.get>>;
                } => entry.tool != null,
              )
              .map(({ c, tool }, index) => (
                <View key={`cart-${c.tool_id}-${index}`} style={styles.cartRow}>
                  <View style={styles.cartInfo}>
                    <Text style={styles.cartToolName}>{tool.tool_name}</Text>
                    <Text style={styles.meta}>
                      {tool.total_stock} available
                    </Text>
                  </View>
                  <View style={styles.cartQtyRow}>
                    <Pressable
                      style={styles.qtyBtn}
                      onPress={() => updateCartQty(c.tool_id, -1)}
                    >
                      <Text style={styles.qtyBtnText}>−</Text>
                    </Pressable>
                    <Text style={styles.qtyValue}>{c.quantity}</Text>
                    <Pressable
                      style={styles.qtyBtn}
                      onPress={() => updateCartQty(c.tool_id, 1)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </Pressable>
                    <Pressable
                      style={styles.removeBtn}
                      onPress={() => removeFromCart(c.tool_id)}
                    >
                      <Text style={styles.removeBtnText}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
          </View>
        )}

        <Text style={styles.label}>Pickup date</Text>
        <Pressable
          style={[styles.dateBtn, createPickup && styles.dateBtnSelected]}
          onPress={() => setShowPickupDatePicker(true)}
        >
          <Text
            style={[
              styles.dateBtnText,
              !createPickup && styles.dateBtnPlaceholder,
            ]}
          >
            {createPickup
              ? new Date(createPickup + "T12:00:00").toLocaleDateString()
              : "Select date"}
          </Text>
          {createPickup ? (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={primary}
              style={styles.dateCheck}
            />
          ) : null}
        </Pressable>
        {showPickupDatePicker && (
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={
                createPickup ? new Date(createPickup + "T12:00:00") : new Date()
              }
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              themeVariant={Platform.OS === "ios" ? "light" : undefined}
              minimumDate={MIN_PICKUP_DATE}
              maximumDate={MAX_PICKUP_DATE}
              onChange={handleDateChange}
            />
            {Platform.OS === "ios" && (
              <View style={styles.datePickerActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.datePickerBtn,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => setShowPickupDatePicker(false)}
                >
                  <Text style={styles.datePickerCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.datePickerBtn,
                    styles.datePickerDone,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={confirmDatePicker}
                >
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        <Text style={styles.label}>Comment (optional)</Text>
        <BottomSheetTextInput
          style={[styles.input, styles.textArea]}
          value={createMessage}
          onChangeText={setCreateMessage}
          placeholder="Describe why you need these tools..."
          placeholderTextColor={mutedForeground}
          multiline
        />
      </FormModal>

      <Modal visible={returnModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>
              {returnRequest
                ? (returnRequest.tool?.tool_name ??
                  returnRequest.tool_type?.name ??
                  "Return tool")
                : "Return tool"}
            </Text>
            {returnRequest && (
              <>
                <View style={styles.returnSummary}>
                  <Text style={styles.returnSummaryRow}>
                    <Text style={styles.returnLabel}>Fulfilled: </Text>
                    <Text style={styles.returnValue}>
                      {returnRequest.fulfilled_quantity}
                    </Text>
                  </Text>
                  {(returnRequest.returned_quantity ?? 0) > 0 && (
                    <Text style={styles.returnSummaryRow}>
                      <Text style={styles.returnLabel}>Already returned: </Text>
                      <Text style={styles.returnValue}>
                        {returnRequest.returned_quantity}
                      </Text>
                    </Text>
                  )}
                  <Text style={styles.returnSummaryRow}>
                    <Text style={styles.returnLabel}>Max returnable: </Text>
                    <Text style={styles.returnValue}>{maxReturnable}</Text>
                  </Text>
                </View>
                <Text style={styles.label}>Quantity to return</Text>
                <TextInput
                  style={styles.input}
                  value={returnQty}
                  onChangeText={setReturnQty}
                  placeholder={`1–${maxReturnable}`}
                  placeholderTextColor={mutedForeground}
                  keyboardType="number-pad"
                />
                <Text style={styles.label}>Comment (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={returnComment}
                  onChangeText={setReturnComment}
                  placeholder="Condition, notes..."
                  placeholderTextColor={mutedForeground}
                  multiline
                />
                <View style={styles.modalActions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.cancelBtn,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => {
                      setReturnModalOpen(false);
                      setReturnRequest(null);
                    }}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.submitBtn,
                      (returnSubmitting ||
                        !returnQty ||
                        parseInt(returnQty, 10) < 1 ||
                        parseInt(returnQty, 10) > maxReturnable) &&
                        styles.submitBtnDisabled,
                      !returnSubmitting && pressed && { opacity: 0.8 },
                    ]}
                    onPress={handleReturn}
                    disabled={
                      returnSubmitting ||
                      !returnQty ||
                      parseInt(returnQty, 10) < 1 ||
                      parseInt(returnQty, 10) > maxReturnable
                    }
                  >
                    <Text style={styles.submitBtnText}>
                      {returnSubmitting ? "Returning..." : "Return tool"}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <ToolRequestDetailSheet
        visible={detailSheetOpen}
        onClose={() => {
          setDetailSheetOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onReturnPress={handleReturnFromDetail}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  skeletonWrap: { padding: spacing.base },
  fill: { flex: 1, backgroundColor: background },
  list: { padding: spacing.base, paddingBottom: spacing.xl },
  toReturnSection: { marginBottom: spacing.lg },
  sectionTitle: {
    ...typography.sectionTitle,
    color: foreground,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: mutedForeground,
    marginBottom: spacing.base,
  },
  toReturnCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fef3c7",
    borderRadius: radius.base,
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  toReturnCardContent: { flex: 1 },
  toReturnCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: foreground,
  },
  toReturnCardMeta: {
    fontSize: 13,
    color: mutedForeground,
    marginTop: 2,
  },
  requestsSection: { marginTop: spacing.sm },
  cardWrap: { marginBottom: spacing.md },
  meta: { fontSize: 13, color: mutedForeground, marginBottom: 2 },
  message: { fontSize: 13, color: mutedForeground, marginTop: 4 },
  fulfillmentBlock: { marginTop: spacing.sm },
  fulfilledText: { fontSize: 13, color: "#166534", marginBottom: 2 },
  rejectedText: { fontSize: 13, color: "#991b1b", marginBottom: 2 },
  returnBtn: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: spacing.base,
    borderRadius: radius.sm,
    backgroundColor: muted,
  },
  returnBtnText: { fontSize: 14, fontWeight: "600", color: foreground },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: "85%",
  },
  modalScroll: { maxHeight: 400 },
  modalTitle: { ...typography.sectionTitle, marginBottom: spacing.lg },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: foreground,
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.base,
  },
  dateBtnSelected: {
    borderColor: primary,
    backgroundColor: `${primary}08`,
  },
  dateBtnText: { fontSize: 16, color: foreground, flex: 1 },
  dateBtnPlaceholder: { color: mutedForeground },
  dateCheck: { marginLeft: spacing.sm },
  datePickerContainer: {
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: border,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  datePickerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: border,
    backgroundColor: muted,
  },
  datePickerBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  datePickerDone: { backgroundColor: primary },
  datePickerCancelText: { fontSize: 16, color: foreground },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: "600",
    color: primaryForeground,
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
  mutedText: {
    fontSize: 14,
    color: mutedForeground,
    marginBottom: spacing.base,
  },
  searchInput: { marginBottom: 0, flex: 1 },
  comboboxRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  catalogBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: primary,
    justifyContent: "center",
  },
  catalogBtnText: { fontSize: 14, fontWeight: "600", color: primaryForeground },
  comboboxDropdown: {
    maxHeight: 220,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: border,
    borderRadius: radius.sm,
    padding: spacing.xs,
    backgroundColor: card,
  },
  toolList: { marginBottom: spacing.base },
  toolsLoader: { paddingVertical: spacing.lg, alignItems: "center" },
  toolRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: muted,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  toolInfo: { flex: 1 },
  toolName: { fontSize: 14, fontWeight: "600", color: foreground },
  toolStock: { fontSize: 12, color: mutedForeground },
  addToolBtnText: { fontSize: 13, fontWeight: "600", color: primary },
  cartList: { marginBottom: spacing.base },
  cartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: border,
  },
  cartInfo: { flex: 1 },
  cartToolName: { fontSize: 14, fontWeight: "500", color: foreground },
  cartQtyRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: muted,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: { fontSize: 18, fontWeight: "600", color: foreground },
  qtyValue: {
    fontSize: 14,
    fontWeight: "600",
    minWidth: 24,
    textAlign: "center",
  },
  removeBtn: { paddingVertical: 4, paddingHorizontal: spacing.sm },
  removeBtnText: { fontSize: 13, color: primary },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.base,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: border,
  },
  cancelBtnText: { fontSize: 16, fontWeight: "500", color: foreground },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    borderRadius: radius.sm,
    backgroundColor: primary,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: primaryForeground, fontSize: 16, fontWeight: "600" },
  returnSummary: {
    backgroundColor: muted,
    padding: spacing.base,
    borderRadius: radius.base,
    marginBottom: spacing.base,
  },
  returnSummaryRow: { marginBottom: 4 },
  returnLabel: { fontSize: 14, color: mutedForeground },
  returnValue: { fontSize: 14, fontWeight: "600", color: foreground },
});
