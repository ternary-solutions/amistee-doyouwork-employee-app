import {
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
import type { ToolRequest, ToolRequestLineItem } from '@/types/requests/tools';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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

function getToolName(
  it: ToolRequestLineItem | Pick<ToolRequest, 'tool' | 'tool_type'>
): string {
  const tool = 'tool' in it ? it.tool : (it as ToolRequestLineItem).tool;
  const toolType =
    'tool_type' in it ? it.tool_type : (it as ToolRequestLineItem).tool_type;
  return tool?.tool_name ?? toolType?.name ?? 'Tool';
}

type Props = {
  visible: boolean;
  onClose: () => void;
  request: ToolRequest | null;
  onReturnPress?: (request: ToolRequest) => void;
};

export function ToolRequestDetailSheet({
  visible,
  onClose,
  request,
  onReturnPress,
}: Props) {
  const [fullRequest, setFullRequest] = useState<ToolRequest | null>(null);
  const [loading, setLoading] = useState(false);

  const loadRequest = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const data = await toolRequestsService.getById(id);
      setFullRequest(data);
    } catch (error) {
      console.error('Failed to load request details', error);
      Alert.alert('Error', 'Failed to load request details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible && request?.id) {
      loadRequest(request.id);
    } else if (!visible) {
      setFullRequest(null);
    }
  }, [visible, request?.id, loadRequest]);

  const displayRequest = fullRequest ?? request;
  if (!displayRequest) return null;

  const items = displayRequest.items ?? [];
  const toolNames =
    items.length > 0
      ? items.map((it) => getToolName(it)).join(', ')
      : getToolName(displayRequest);

  const outstandingReturn =
    displayRequest.status === 'CheckedOut'
      ? items.length > 0
        ? items.filter((it) => {
            const f = it.fulfilled_quantity ?? 0;
            const r = it.returned_quantity ?? 0;
            return it.tool?.is_returnable && f - r > 0;
          })
        : displayRequest.tool?.is_returnable &&
            (displayRequest.fulfilled_quantity ?? 0) -
              (displayRequest.returned_quantity ?? 0) >
              0
        ? [displayRequest]
        : []
      : [];

  const canReturn = outstandingReturn.length > 0;
  const hasNotes =
    displayRequest.message ||
    displayRequest.inspection_notes ||
    displayRequest.condition_on_return;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {loading && !fullRequest ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={primary} />
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>{toolNames || 'Tool request'}</Text>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        STATUS_COLORS[displayRequest.status] ?? mutedForeground,
                    },
                  ]}
                >
                  <Text style={styles.badgeText}>{displayRequest.status}</Text>
                </View>
              </View>

              <ScrollView
                style={styles.body}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Request details */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Request details</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Pickup date</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(displayRequest.pickup_date)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Requested</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(displayRequest.created_at)}
                    </Text>
                  </View>
                  {displayRequest.expected_return_date && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Expected return</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(displayRequest.expected_return_date)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Items */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Items</Text>
                  {items.length > 0 ? (
                    items.map((it) => (
                      <View key={it.id} style={styles.itemCard}>
                        <Text style={styles.itemTitle}>
                          {getToolName(it)} × {it.quantity}
                        </Text>
                        <Text style={styles.itemMeta}>
                          Fulfilled: {it.fulfilled_quantity ?? 0}
                          {(it.returned_quantity ?? 0) > 0 &&
                            ` · Returned: ${it.returned_quantity}`}
                          {it.tool?.is_returnable && ' · Returnable'}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.itemCard}>
                      <Text style={styles.itemTitle}>
                        {getToolName(displayRequest)} ×{' '}
                        {displayRequest.quantity ?? 0}
                      </Text>
                      <Text style={styles.itemMeta}>
                        Fulfilled: {displayRequest.fulfilled_quantity}
                        {(displayRequest.returned_quantity ?? 0) > 0 &&
                          ` · Returned: ${displayRequest.returned_quantity}`}
                        {displayRequest.tool?.is_returnable && ' · Returnable'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Notes */}
                {hasNotes && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notes</Text>
                    {displayRequest.message && (
                      <View style={styles.noteBlock}>
                        <Text style={styles.noteLabel}>Your message</Text>
                        <Text style={styles.noteText}>
                          {displayRequest.message}
                        </Text>
                      </View>
                    )}
                    {displayRequest.inspection_notes && (
                      <View style={styles.noteBlock}>
                        <Text style={styles.noteLabel}>Inspection notes</Text>
                        <Text style={styles.noteText}>
                          {displayRequest.inspection_notes}
                        </Text>
                      </View>
                    )}
                    {displayRequest.condition_on_return && (
                      <View style={styles.noteBlock}>
                        <Text style={styles.noteLabel}>
                          Condition on return
                        </Text>
                        <Text style={styles.noteText}>
                          {displayRequest.condition_on_return}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Return button */}
                {canReturn && onReturnPress && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.returnBtn,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => {
                      onClose();
                      onReturnPress(displayRequest);
                    }}
                    accessibilityLabel="Return tool"
                    accessibilityRole="button"
                  >
                    <Text style={styles.returnBtnText}>
                      Return tool{items.length > 1 ? 's' : ''}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={primaryForeground}
                    />
                  </Pressable>
                )}
              </ScrollView>

              <Pressable
                style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.8 }]}
                onPress={onClose}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  loader: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.base,
  },
  title: {
    ...typography.sectionTitle,
    color: foreground,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { color: primaryForeground, fontSize: 12, fontWeight: '600' },
  body: { maxHeight: 400 },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: mutedForeground,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: { fontSize: 14, color: mutedForeground },
  detailValue: { fontSize: 14, fontWeight: '500', color: foreground },
  itemCard: {
    backgroundColor: muted,
    padding: spacing.base,
    borderRadius: radius.base,
    marginBottom: spacing.sm,
  },
  itemTitle: { fontSize: 14, fontWeight: '600', color: foreground },
  itemMeta: { fontSize: 12, color: mutedForeground, marginTop: 4 },
  noteBlock: { marginBottom: spacing.sm },
  noteLabel: { fontSize: 12, color: mutedForeground, marginBottom: 2 },
  noteText: { fontSize: 14, color: foreground },
  returnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: primary,
    paddingVertical: 14,
    borderRadius: radius.base,
    marginBottom: spacing.base,
  },
  returnBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: primaryForeground,
  },
  closeBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: border,
  },
  closeBtnText: { fontSize: 16, fontWeight: '500', color: foreground },
});
