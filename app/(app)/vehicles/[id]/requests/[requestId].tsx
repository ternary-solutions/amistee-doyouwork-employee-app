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
    typography,
} from '@/constants/theme';
import { repairRequestsService } from '@/services/requests/repairs';
import { getErrorMessage } from '@/utils/errorMessage';
import type { RepairRequest, RepairRequestComment } from '@/types/requests/repairs';
import { format } from 'date-fns';
import { useSetHeaderOptions } from '@/contexts/HeaderOptionsContext';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CommentRow({ comment }: { comment: RepairRequestComment }) {
  const name = comment.user
    ? [comment.user.first_name, comment.user.last_name].filter(Boolean).join(' ')
    : 'User';
  return (
    <View style={styles.commentRow}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>{name}</Text>
        <Text style={styles.commentDate}>
          {format(new Date(comment.created_at), 'MMM d, yyyy · h:mm a')}
        </Text>
      </View>
      <Text style={styles.commentText}>{comment.comment}</Text>
    </View>
  );
}

export default function VehicleRequestDetailScreen() {
  const { id, requestId } = useLocalSearchParams<{
    id: string;
    requestId: string;
  }>();
  const insets = useSafeAreaInsets();
  const [request, setRequest] = useState<RepairRequest | null>(null);
  const [comments, setComments] = useState<RepairRequestComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useSetHeaderOptions(
    useMemo(
      () => ({ title: 'Repair Request', showBack: true }),
      [],
    ),
  );

  const load = useCallback(async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      const data = await repairRequestsService.getById(requestId);
      setRequest(data);
    } catch (error) {
      console.error('Failed to load repair request', error);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  const loadComments = useCallback(async () => {
    if (!requestId) return;
    try {
      setCommentsLoading(true);
      const list = await repairRequestsService.getComments(requestId);
      setComments(list ?? []);
    } catch (error) {
      console.error('Failed to load comments', error);
    } finally {
      setCommentsLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleAddComment = async () => {
    const text = newComment.trim();
    if (!requestId || !text || submitting) return;
    try {
      setSubmitting(true);
      await repairRequestsService.createComment(requestId, { comment: text });
      setNewComment('');
      loadComments();
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to add comment. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Request not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: background }]}
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <Text style={styles.title}>Repair request</Text>
      <Text style={styles.meta}>
        Vehicle: {request.vehicle?.vehicle_name ?? id} ·{' '}
        {format(new Date(request.request_date), 'MMM d, yyyy')}
      </Text>
      {request.user && (
        <Text style={styles.meta}>
          Reported by: {request.user.first_name} {request.user.last_name ?? ''}
        </Text>
      )}
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{request.status}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{request.priority}</Text>
        </View>
      </View>
      <Text style={styles.label}>Description</Text>
      <Text style={styles.description}>{request.description}</Text>

      <Text style={styles.sectionTitle}>Comments</Text>
      {commentsLoading && comments.length === 0 ? (
        <ActivityIndicator size="small" color={mutedForeground} style={styles.commentsLoader} />
      ) : comments.length === 0 ? (
        <Text style={styles.mutedText}>No comments yet.</Text>
      ) : (
        <View style={styles.commentsList}>
          {comments.map((c) => (
            <CommentRow key={c.id} comment={c} />
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
          maxLength={500}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.base, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.sectionTitle, fontSize: 20, color: foreground, marginBottom: 8 },
  meta: { fontSize: 14, color: mutedForeground, marginBottom: 4 },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.base },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm, backgroundColor: primary },
  badgeText: { color: primaryForeground, fontSize: 12, fontWeight: '500' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: foreground },
  description: { fontSize: 15, color: foreground, marginBottom: spacing.lg },
  sectionTitle: { ...typography.title, color: foreground, marginBottom: spacing.sm },
  commentsLoader: { marginVertical: spacing.sm },
  mutedText: { fontSize: 14, color: mutedForeground, marginBottom: spacing.sm },
  commentsList: { marginBottom: spacing.base },
  commentRow: {
    backgroundColor: muted,
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
  submitCommentBtnText: { color: primaryForeground, fontSize: 14, fontWeight: '600' },
  errorText: { fontSize: 16, color: destructive },
});
