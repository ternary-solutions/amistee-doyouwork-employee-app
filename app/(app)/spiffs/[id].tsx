import { DocumentViewerModal } from '@/components/document/DocumentViewerModal';
import {
    background,
    border,
    card,
    destructive,
    foreground,
    muted,
    mutedForeground,
    primary,
    radius,
    spacing,
    success,
    typography,
} from '@/constants/theme';
import { spiffsService } from '@/services/spiffs';
import type { Spiff } from '@/types/spiffs';
import { getMediaUrl } from '@/utils/api';
import { getErrorMessage } from '@/utils/errorMessage';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_COLORS: Record<string, string> = {
  Pending: mutedForeground,
  Approved: primary,
  Denied: destructive,
  Paid: success,
};

export default function SpiffDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [spiff, setSpiff] = useState<Spiff | null>(null);
  const [loading, setLoading] = useState(true);
  const [docViewer, setDocViewer] = useState<{ url: string; title: string } | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await spiffsService.getById(id);
      setSpiff(data);
    } catch (error) {
      console.error('Failed to load spiff', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to load spiff. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const openAttachment = useCallback((url: string | null | undefined, title: string) => {
    if (!url?.trim()) return;
    const fullUrl = url.startsWith('http') ? url : getMediaUrl(url);
    setDocViewer({ url: fullUrl, title });
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (!spiff) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Spiff not found.</Text>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[spiff.status] ?? mutedForeground;
  const attachments = spiff.attachment_urls ?? [];

  return (
    <ScrollView
      style={{ backgroundColor: background }}
      contentContainerStyle={[styles.container, { paddingBottom: spacing.xl + insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{spiff.spiff_type?.name ?? 'Spiff'}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{spiff.status}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>
            {new Date(spiff.spiff_date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount</Text>
          <Text style={styles.amountValue}>${spiff.amount}</Text>
        </View>
        {spiff.details ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Details</Text>
            <Text style={styles.detailValue}>{spiff.details}</Text>
          </View>
        ) : null}

        {attachments.length > 0 && (
          <View style={styles.attachmentsSection}>
            <Text style={styles.detailLabel}>Attachments</Text>
            <View style={styles.attachmentGrid}>
              {attachments.map((url, i) => (
                <Pressable
                  key={i}
                  style={({ pressed }) => [styles.attachmentThumb, pressed && { opacity: 0.8 }]}
                  onPress={() => openAttachment(url, `Attachment ${i + 1}`)}
                >
                  <Image source={{ uri: url.startsWith('http') ? url : getMediaUrl(url) }} style={styles.attachmentImage} />
                  <View style={styles.attachmentOverlay}>
                    <Ionicons name="expand" size={20} color="#fff" />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.meta}>
          Submitted {new Date(spiff.created_at).toLocaleDateString()}
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
    marginBottom: spacing.base,
  },
  title: { ...typography.sectionTitle, fontSize: 20, color: foreground },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  detailRow: { marginBottom: spacing.base },
  detailLabel: { fontSize: 12, fontWeight: '600', color: mutedForeground, marginBottom: 4 },
  detailValue: { fontSize: 15, color: foreground },
  amountValue: { fontSize: 22, fontWeight: '700', color: foreground },
  attachmentsSection: { marginTop: spacing.sm },
  attachmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  attachmentThumb: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: muted,
  },
  attachmentImage: { width: '100%', height: '100%' },
  attachmentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
    alignItems: 'center',
  },
  meta: { fontSize: 13, color: mutedForeground, marginTop: spacing.base },
  errorText: { fontSize: 16, color: destructive },
});
