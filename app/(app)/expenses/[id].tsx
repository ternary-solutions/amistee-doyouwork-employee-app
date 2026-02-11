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
    primaryForeground,
} from '@/constants/theme';
import { expensesService } from '@/services/expenses';
import type { Expense, ExpenseComment } from '@/types/expenses';
import { getMediaUrl } from '@/utils/api';
import { getErrorMessage } from '@/utils/errorMessage';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useSetHeaderOptions } from '@/contexts/HeaderOptionsContext';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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
  const [comments, setComments] = useState<ExpenseComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [docViewer, setDocViewer] = useState<{ url: string; title: string } | null>(null);

  useSetHeaderOptions(
    useMemo(
      () => ({ title: 'Expense', showBack: true }),
      [],
    ),
  );

  const loadComments = useCallback(async () => {
    if (!id) return;
    try {
      setCommentsLoading(true);
      const list = await expensesService.getComments(id);
      setComments(list ?? []);
    } catch (error) {
      console.error('Failed to load comments', error);
    } finally {
      setCommentsLoading(false);
    }
  }, [id]);

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

  useEffect(() => {
    if (id && expense) loadComments();
  }, [id, expense, loadComments]);

  const handleAddComment = useCallback(async () => {
    const text = newComment.trim();
    if (!id || !text || submitting) return;
    try {
      setSubmitting(true);
      await expensesService.addComment(id, { comment: text });
      setNewComment('');
      loadComments();
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to add comment. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }, [id, newComment, submitting, loadComments]);

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

      <Text style={styles.sectionTitle}>Comments</Text>
      {commentsLoading && comments.length === 0 ? (
        <ActivityIndicator size="small" color={mutedForeground} style={styles.commentsLoader} />
      ) : comments.length === 0 ? (
        <Text style={styles.mutedText}>No comments yet.</Text>
      ) : (
        <View style={styles.commentsList}>
          {comments.map((c) => (
            <View key={c.id} style={styles.commentRow}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>
                  {[c.user?.first_name, c.user?.last_name].filter(Boolean).join(' ') || 'User'}
                </Text>
                <Text style={styles.commentDate}>
                  {format(new Date(c.created_at), 'MMM d, yyyy · h:mm a')}
                </Text>
              </View>
              <Text style={styles.commentText}>{c.comment}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.addCommentBlock}>
        <TextInput
          style={styles.commentInput}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Add a comment..."
          placeholderTextColor={mutedForeground}
          multiline
          maxLength={2000}
        />
        <Pressable
          style={[
            styles.submitCommentBtn,
            (!newComment.trim() || submitting) && styles.submitCommentBtnDisabled,
          ]}
          onPress={handleAddComment}
          disabled={!newComment.trim() || submitting}
        >
          <Text style={styles.submitCommentBtnText}>
            {submitting ? 'Sending...' : 'Send'}
          </Text>
        </Pressable>
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
  sectionTitle: { ...typography.title, color: foreground, marginTop: spacing.lg, marginBottom: spacing.sm },
  commentsLoader: { marginVertical: spacing.sm },
  mutedText: { fontSize: 14, color: mutedForeground, marginBottom: spacing.sm },
  commentsList: { marginBottom: spacing.base },
  commentRow: {
    backgroundColor: '#f1f5f9',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  commentAuthor: { fontSize: 14, fontWeight: '600', color: foreground },
  commentDate: { fontSize: 12, color: mutedForeground },
  commentText: { fontSize: 14, color: foreground },
  addCommentBlock: { marginTop: spacing.sm },
  commentInput: {
    borderWidth: 1,
    borderColor: border,
    borderRadius: radius.base,
    padding: spacing.md,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  submitCommentBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: primary,
  },
  submitCommentBtnDisabled: { opacity: 0.6 },
  submitCommentBtnText: { fontSize: 14, fontWeight: '600', color: primaryForeground },
  errorText: { fontSize: 16, color: '#ef4444' },
});
