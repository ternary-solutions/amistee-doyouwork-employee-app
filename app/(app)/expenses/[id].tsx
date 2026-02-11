import { DocumentViewerModal } from '@/components/document/DocumentViewerModal';
import {
    background,
    border,
    card,
    foreground,
    mutedForeground,
    primary,
    radius,
    spacing,
    statusBadge,
    typography,
} from '@/constants/theme';
import { expensesService } from '@/services/expenses';
import type { Expense } from '@/types/expenses';
import { getMediaUrl } from '@/utils/api';
import { getErrorMessage } from '@/utils/errorMessage';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getStatusBadgeStyle(status: string) {
  const s = statusBadge[status as keyof typeof statusBadge];
  return s ?? { bg: mutedForeground, text: '#ffffff' };
}

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [docViewer, setDocViewer] = useState<{ url: string; title: string } | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await expensesService.getById(id);
      setExpense(data);
    } catch (error) {
      console.error('Failed to load expense', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to load expense. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const openAttachment = useCallback((url: string | null | undefined) => {
    if (!url?.trim()) return;
    const fullUrl = url.startsWith('http') ? url : getMediaUrl(url);
    setDocViewer({ url: fullUrl, title: 'Attachment' });
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Expense not found.</Text>
      </View>
    );
  }

  const statusStyle = getStatusBadgeStyle(expense.status);

  return (
    <ScrollView
      style={{ backgroundColor: background }}
      contentContainerStyle={[styles.container, { paddingBottom: spacing.xl + insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{expense.expense_type?.name ?? 'Expense'}</Text>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>
              {expense.status}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>
            {new Date(expense.expense_date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount</Text>
          <Text style={styles.amountValue}>
            ${Number(expense.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        {expense.details ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Details</Text>
            <Text style={styles.detailValue}>{expense.details}</Text>
          </View>
        ) : null}

        {expense.attachment_url ? (
          <View style={styles.attachmentSection}>
            <Text style={styles.detailLabel}>Attachment</Text>
            <Pressable
              style={({ pressed }) => [styles.attachmentBtn, pressed && { opacity: 0.8 }]}
              onPress={() => openAttachment(expense.attachment_url)}
            >
              <Ionicons name="document-text" size={24} color={primary} />
              <Text style={styles.attachmentLabel}>View attachment</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.meta}>
          Submitted {new Date(expense.created_at).toLocaleDateString()}
        </Text>
      </View>

      <DocumentViewerModal
        visible={!!docViewer}
        onClose={() => setDocViewer(null)}
        url={docViewer?.url ?? null}
        title={docViewer?.title ?? ''}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.base },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: card,
    borderRadius: radius.base,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.sectionTitle, fontSize: 20, color: foreground },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  detailRow: { marginBottom: spacing.base },
  detailLabel: { fontSize: 12, fontWeight: '600', color: mutedForeground, marginBottom: spacing.sm },
  detailValue: { fontSize: 15, color: foreground },
  amountValue: { fontSize: 22, fontWeight: '700', color: foreground },
  attachmentSection: { marginTop: spacing.sm },
  attachmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: border,
  },
  attachmentLabel: { fontSize: 14, fontWeight: '500', color: primary },
  meta: { fontSize: 13, color: mutedForeground, marginTop: spacing.base },
  errorText: { fontSize: 16, color: '#ef4444' },
});
