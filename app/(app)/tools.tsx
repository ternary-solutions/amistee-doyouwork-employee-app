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
import { toolRequestsService } from '@/services/requests/tools';
import { toolsService } from '@/services/tools';
import { getErrorMessage } from '@/utils/errorMessage';
import type { ToolRequest, ToolRequestLineItem } from '@/types/requests/tools';
import type { Tool } from '@/types/tools';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { FormModal } from '@/components/ui/FormModal';
import { ListCard } from '@/components/ui/ListCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonDetailCard } from '@/components/ui/Skeleton';
import { ToolRequestDetailSheet } from '@/components/tools/ToolRequestDetailSheet';

const STATUS_COLORS: Record<string, string> = {
  Pending: '#eab308',
  Approved: '#3b82f6',
  CheckedOut: '#22c55e',
  Denied: '#ef4444',
  Returned: mutedForeground,
};

function formatDate(d: string | null | undefined) {
  return d ? new Date(d).toLocaleDateString() : '—';
}

type CartItem = { tool_id: string; quantity: number };

function getToolNames(request: ToolRequest): string {
  const items = request.items ?? [];
  if (items.length > 0) {
    return items
      .map((it) => it.tool?.tool_name ?? it.tool_type?.name ?? 'Tool')
      .join(', ');
  }
  return request.tool?.tool_name ?? request.tool_type?.name ?? 'Tool';
}

function getRequestedSummary(request: ToolRequest): string {
  const items = request.items ?? [];
  const totalQty = request.quantity ?? items.reduce((sum, it) => sum + it.quantity, 0);
  if (items.length > 0) {
    return items
      .map(
        (it) =>
          `${it.tool?.tool_name ?? it.tool_type?.name ?? 'Tool'} × ${it.quantity}`
      )
      .join(', ');
  }
  return `Requested: ${totalQty}`;
}

function getFulfilledSummary(items: ToolRequestLineItem[]): string {
  const fulfilled = items.filter((it) => (it.fulfilled_quantity ?? 0) > 0);
  if (fulfilled.length === 0) return '';
  return fulfilled
    .map(
      (it) =>
        `${it.tool?.tool_name ?? it.tool_type?.name ?? 'Tool'} × ${it.fulfilled_quantity}`
    )
    .join(', ');
}

function getRejectedSummary(items: ToolRequestLineItem[]): string {
  const rejected = items.filter((it) => (it.fulfilled_quantity ?? 0) === 0);
  if (rejected.length === 0) return '';
  return rejected
    .map(
      (it) =>
        `${it.tool?.tool_name ?? it.tool_type?.name ?? 'Tool'} × ${it.quantity}`
    )
    .join(', ');
}

/** Requests with returnable items still out with the user */
function getRequestsToReturn(requests: ToolRequest[]): ToolRequest[] {
  return requests.filter((req) => {
    if (req.status !== 'CheckedOut') return false;
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
          `${it.tool?.tool_name ?? it.tool_type?.name ?? 'Tool'} × ${(it.fulfilled_quantity ?? 0) - (it.returned_quantity ?? 0)}`
      );
    return outstanding.join(', ');
  }
  const out =
    (request.fulfilled_quantity ?? 0) - (request.returned_quantity ?? 0);
  return `${request.tool?.tool_name ?? request.tool_type?.name ?? 'Tool'} × ${out}`;
}

export default function ToolsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [toolRequests, setToolRequests] = useState<ToolRequest[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [createPickup, setCreatePickup] = useState('');
  const [createMessage, setCreateMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnRequest, setReturnRequest] = useState<ToolRequest | null>(null);
  const [returnQty, setReturnQty] = useState('');
  const [returnComment, setReturnComment] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ToolRequest | null>(null);
  const [showPickupDatePicker, setShowPickupDatePicker] = useState(false);

  const [createToolsSearch, setCreateToolsSearch] = useState('');
  const debouncedSearch = useDebouncedValue(createToolsSearch, 300);
  const [createToolsPage, setCreateToolsPage] = useState(1);
  const [createToolsTotalPages, setCreateToolsTotalPages] = useState(1);
  const [createToolsTotal, setCreateToolsTotal] = useState(0);
  const [createToolsLoading, setCreateToolsLoading] = useState(false);
  const [createToolsLoadingMore, setCreateToolsLoadingMore] = useState(false);
  const [toolsById, setToolsById] = useState<Map<string, Tool>>(new Map());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const requestsRes = await toolRequestsService.list(1, 50);
      setToolRequests(requestsRes?.items ?? []);
    } catch (error) {
      console.error('Failed to load requests', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to load tool requests. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const PAGE_SIZE = 24;
  const loadCreateTools = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!createModalOpen) return;
      if (append) setCreateToolsLoadingMore(true);
      else setCreateToolsLoading(true);
      try {
        const data = await toolsService.list(
          pageNum,
          PAGE_SIZE,
          debouncedSearch || undefined
        );
        const items = data?.items ?? [];
        setTools((prev) => (append ? [...prev, ...items] : items));
        setCreateToolsPage(pageNum);
        setCreateToolsTotalPages(data?.total_pages ?? 1);
        setCreateToolsTotal(data?.total ?? 0);
        setToolsById((prev) => {
          const next = new Map(prev);
          items.forEach((t) => next.set(t.id, t));
          return next;
        });
      } catch (error) {
        console.error('Failed to load tools', error);
        Alert.alert('Error', getErrorMessage(error, 'Failed to load tools. Please try again.'));
      } finally {
        setCreateToolsLoading(false);
        setCreateToolsLoadingMore(false);
      }
    },
    [createModalOpen, debouncedSearch]
  );

  useEffect(() => {
    if (createModalOpen) {
      setCreateToolsPage(1);
      loadCreateTools(1, false);
    } else {
      setTools([]);
      setCreateToolsSearch('');
      setCreateToolsPage(1);
      setToolsById(new Map());
    }
  }, [createModalOpen, debouncedSearch, loadCreateTools]);

  const loadMoreCreateTools = useCallback(() => {
    if (createToolsPage >= createToolsTotalPages || createToolsLoadingMore || createToolsLoading)
      return;
    const nextPage = createToolsPage + 1;
    setCreateToolsPage(nextPage);
    setCreateToolsLoadingMore(true);
    loadCreateTools(nextPage, true);
  }, [
    createToolsPage,
    createToolsTotalPages,
    createToolsLoadingMore,
    createToolsLoading,
    loadCreateTools,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerAction: { label: 'New tool request', onPress: () => setCreateModalOpen(true) },
      subtitle: 'Request your equipment',
    });
  }, [navigation]);

  const addToCart = (tool: Tool) => {
    if (!tool || tool.total_stock <= 0) return;
    setToolsById((prev) => new Map(prev).set(tool.id, tool));
    setCart((prev) => {
      const existing = prev.find((c) => c.tool_id === tool.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + 1, tool.total_stock);
        return prev.map((c) =>
          c.tool_id === tool.id ? { ...c, quantity: newQty } : c
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
      const newQty = Math.max(0, Math.min(existing.quantity + delta, tool.total_stock));
      if (newQty === 0) return prev.filter((c) => c.tool_id !== toolId);
      return prev.map((c) =>
        c.tool_id === toolId ? { ...c, quantity: newQty } : c
      );
    });
  };

  const removeFromCart = (toolId: string) => {
    setCart((prev) => prev.filter((c) => c.tool_id !== toolId));
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
      setCreatePickup('');
      setCreateMessage('');
      load();
    } catch (error) {
      console.error('Create tool request failed', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to submit tool request. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const openReturnModal = async (request: ToolRequest) => {
    try {
      const full = await toolRequestsService.getById(request.id);
      setReturnRequest(full);
      const max = Math.max(0, (full.fulfilled_quantity ?? 0) - (full.returned_quantity ?? 0));
      setReturnQty(max > 0 ? String(max) : '');
      setReturnComment('');
      setReturnModalOpen(true);
    } catch (error) {
      console.error('Failed to load request for return', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to load request.'));
    }
  };

  const handleReturn = async () => {
    if (!returnRequest) return;
    const qty = parseInt(returnQty, 10);
    const max = Math.max(0, (returnRequest.fulfilled_quantity ?? 0) - (returnRequest.returned_quantity ?? 0));
    if (!Number.isFinite(qty) || qty < 1 || qty > max) return;
    const totalReturned = (returnRequest.returned_quantity ?? 0) + qty;
    try {
      setReturnSubmitting(true);
      await toolRequestsService.returnTool(
        returnRequest.id,
        totalReturned,
        returnComment.trim() || undefined
      );
      setReturnModalOpen(false);
      setReturnRequest(null);
      setReturnQty('');
      setReturnComment('');
      load();
    } catch (error) {
      console.error('Return tool failed', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to return tool. Please try again.'));
    } finally {
      setReturnSubmitting(false);
    }
  };

  const maxReturnable = returnRequest
    ? Math.max(0, (returnRequest.fulfilled_quantity ?? 0) - (returnRequest.returned_quantity ?? 0))
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

  if (loading && toolRequests.length === 0) {
    return (
      <ScrollView
        style={{ backgroundColor: background }}
        contentContainerStyle={[styles.list, { paddingBottom: spacing.xl + insets.bottom }]}
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
    const showFulfillment = ['Approved', 'CheckedOut', 'Returned'].includes(item.status);

    return (
      <View style={styles.cardWrap}>
        <ListCard
          title={getToolNames(item)}
          meta={[
            getRequestedSummary(item),
            `Pickup: ${formatDate(item.pickup_date)}`,
            `Requested: ${formatDate(item.created_at)}`,
          ]}
          badge={{ text: item.status, backgroundColor: STATUS_COLORS[item.status] ?? mutedForeground }}
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
                <Text style={styles.fulfilledText}>Fulfilled: {fulfilledSummary}</Text>
              ) : null}
              {rejectedSummary ? (
                <Text style={styles.rejectedText}>Rejected: {rejectedSummary}</Text>
              ) : null}
              {expectedReturn ? (
                <Text style={styles.meta}>Expected return: {formatDate(expectedReturn)}</Text>
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
            message="No tool requests yet. Tap + to create one."
            icon="construct-outline"
            action={{ label: 'Request tools', onPress: () => setCreateModalOpen(true) }}
          />
        </View>
      ) : (
        <ScrollView
          style={{ backgroundColor: background }}
          contentContainerStyle={[styles.list, { paddingBottom: spacing.xl + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} tintColor={primary} />
          }
        >
          {/* Tools to return section */}
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
                  <Ionicons name="chevron-forward" size={20} color={foreground} />
                </Pressable>
              ))}
            </View>
          )}

          {/* My Requests section */}
          <View style={styles.requestsSection}>
            <Text style={styles.sectionTitle}>My Requests</Text>
            {toolRequests.map((item) => renderRequestCard(item))}
          </View>
        </ScrollView>
      )}

      {/* Create modal: multi-tool cart */}
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
        <TextInput
          style={[styles.input, styles.searchInput]}
          value={createToolsSearch}
          onChangeText={setCreateToolsSearch}
          placeholder="Search tools..."
          placeholderTextColor={mutedForeground}
        />
        <ScrollView
          style={styles.toolListScroll}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const paddingToBottom = 60;
            if (
              layoutMeasurement.height + contentOffset.y >=
              contentSize.height - paddingToBottom
            ) {
              loadMoreCreateTools();
            }
          }}
          scrollEventThrottle={400}
          nestedScrollEnabled
        >
          {createToolsLoading ? (
            <View style={styles.toolsLoader}>
              <ActivityIndicator size="small" color={primary} />
            </View>
          ) : tools.length === 0 ? (
            <Text style={styles.mutedText}>
              {debouncedSearch ? 'No tools match your search.' : 'No tools available.'}
            </Text>
          ) : (
            <>
              {tools.map((t) => (
                <View key={t.id} style={styles.toolRow}>
                  <View style={styles.toolInfo}>
                    <Text style={styles.toolName}>{t.tool_name}</Text>
                    <Text style={styles.toolStock}>
                      {t.total_stock > 0 ? `Stock: ${t.total_stock}` : 'Out of stock'}
                    </Text>
                  </View>
                  <Pressable
                    style={[
                      styles.addToolBtn,
                      (createToolsLoading || t.total_stock <= 0) && styles.addToolBtnDisabled,
                    ]}
                    onPress={() => addToCart(t)}
                    disabled={createToolsLoading || t.total_stock <= 0}
                  >
                    <Text style={styles.addToolBtnText}>
                      {cart.find((c) => c.tool_id === t.id) ? 'Add more' : 'Add'}
                    </Text>
                  </Pressable>
                </View>
              ))}
              {!createToolsLoading && createToolsPage < createToolsTotalPages && (
                createToolsLoadingMore ? (
                  <View style={styles.loadMoreLoader}>
                    <ActivityIndicator size="small" color={primary} />
                  </View>
                ) : (
                  <Pressable
                    style={({ pressed }) => [styles.loadMoreBtn, pressed && { opacity: 0.8 }]}
                    onPress={loadMoreCreateTools}
                  >
                    <Text style={styles.loadMoreBtnText}>
                      Load more ({tools.length} of {createToolsTotal})
                    </Text>
                  </Pressable>
                )
              )}
            </>
          )}
        </ScrollView>
        <Text style={styles.label}>Cart ({cart.reduce((s, c) => s + c.quantity, 0)} item(s))</Text>
        {cart.length === 0 ? (
          <Text style={styles.mutedText}>Your cart is empty.</Text>
        ) : (
          <View style={styles.cartList}>
            {cart.map((c) => {
              const tool = toolsById.get(c.tool_id) ?? tools.find((t) => t.id === c.tool_id);
              if (!tool) return null;
              return (
                <View key={c.tool_id} style={styles.cartRow}>
                  <View style={styles.cartInfo}>
                    <Text style={styles.cartToolName}>{tool.tool_name}</Text>
                    <Text style={styles.meta}>{tool.total_stock} available</Text>
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
                    <Pressable style={styles.removeBtn} onPress={() => removeFromCart(c.tool_id)}>
                      <Text style={styles.removeBtnText}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <Text style={styles.label}>Pickup date</Text>
        <Pressable
          style={styles.dateBtn}
          onPress={() => setShowPickupDatePicker(true)}
        >
          <Text style={[styles.dateBtnText, !createPickup && styles.dateBtnPlaceholder]}>
            {createPickup ? new Date(createPickup + 'T12:00:00').toLocaleDateString() : 'Select date'}
          </Text>
        </Pressable>
        {showPickupDatePicker && (
          <DateTimePicker
            value={createPickup ? new Date(createPickup + 'T12:00:00') : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, selectedDate) => {
              setShowPickupDatePicker(Platform.OS === 'ios');
              if (selectedDate) setCreatePickup(selectedDate.toISOString().slice(0, 10));
            }}
          />
        )}
        <Text style={styles.label}>Comment (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={createMessage}
          onChangeText={setCreateMessage}
          placeholder="Describe why you need these tools..."
          placeholderTextColor={mutedForeground}
          multiline
        />
      </FormModal>

      {/* Return modal */}
      <Modal visible={returnModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {returnRequest
                ? returnRequest.tool?.tool_name ?? returnRequest.tool_type?.name ?? 'Return tool'
                : 'Return tool'}
            </Text>
            {returnRequest && (
              <>
                <View style={styles.returnSummary}>
                  <Text style={styles.returnSummaryRow}>
                    <Text style={styles.returnLabel}>Fulfilled: </Text>
                    <Text style={styles.returnValue}>{returnRequest.fulfilled_quantity}</Text>
                  </Text>
                  {(returnRequest.returned_quantity ?? 0) > 0 && (
                    <Text style={styles.returnSummaryRow}>
                      <Text style={styles.returnLabel}>Already returned: </Text>
                      <Text style={styles.returnValue}>{returnRequest.returned_quantity}</Text>
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
                    style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.8 }]}
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
                      {returnSubmitting ? 'Returning...' : 'Return tool'}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fef3c7',
    borderRadius: radius.base,
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  toReturnCardContent: { flex: 1 },
  toReturnCardTitle: {
    fontSize: 15,
    fontWeight: '600',
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
  fulfilledText: { fontSize: 13, color: '#166534', marginBottom: 2 },
  rejectedText: { fontSize: 13, color: '#991b1b', marginBottom: 2 },
  returnBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: spacing.base,
    borderRadius: radius.sm,
    backgroundColor: muted,
  },
  returnBtnText: { fontSize: 14, fontWeight: '600', color: foreground },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalScroll: { maxHeight: 400 },
  modalTitle: { ...typography.sectionTitle, marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6, color: foreground },
  dateBtn: { borderWidth: 1, borderColor: border, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.base },
  dateBtnText: { fontSize: 16, color: foreground },
  dateBtnPlaceholder: { color: mutedForeground },
  input: {
    borderWidth: 1,
    borderColor: border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.base,
    fontSize: 16,
  },
  textArea: { minHeight: 60 },
  mutedText: { fontSize: 14, color: mutedForeground, marginBottom: spacing.base },
  searchInput: { marginBottom: spacing.sm },
  toolList: { marginBottom: spacing.base },
  toolListScroll: { maxHeight: 200, marginBottom: spacing.base },
  toolsLoader: { paddingVertical: spacing.lg, alignItems: 'center' },
  loadMoreLoader: { paddingVertical: spacing.sm, alignItems: 'center' },
  loadMoreBtn: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  loadMoreBtnText: { fontSize: 14, fontWeight: '500', color: primary },
  toolRow: {
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
  addToolBtn: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: primary,
  },
  addToolBtnDisabled: { opacity: 0.5 },
  addToolBtnText: { fontSize: 13, fontWeight: '600', color: primaryForeground },
  cartList: { marginBottom: spacing.base },
  cartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: border,
  },
  cartInfo: { flex: 1 },
  cartToolName: { fontSize: 14, fontWeight: '500', color: foreground },
  cartQtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 18, fontWeight: '600', color: foreground },
  qtyValue: { fontSize: 14, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  removeBtn: { paddingVertical: 4, paddingHorizontal: spacing.sm },
  removeBtnText: { fontSize: 13, color: primary },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.base },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: border,
  },
  cancelBtnText: { fontSize: 16, fontWeight: '500', color: foreground },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: primary,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: primaryForeground, fontSize: 16, fontWeight: '600' },
  returnSummary: {
    backgroundColor: muted,
    padding: spacing.base,
    borderRadius: radius.base,
    marginBottom: spacing.base,
  },
  returnSummaryRow: { marginBottom: 4 },
  returnLabel: { fontSize: 14, color: mutedForeground },
  returnValue: { fontSize: 14, fontWeight: '600', color: foreground },
});
