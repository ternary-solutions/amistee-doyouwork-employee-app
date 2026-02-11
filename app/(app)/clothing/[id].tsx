import {
    background,
    border,
    card,
    destructive,
    foreground,
    mutedForeground,
    primary,
    radius,
    spacing,
    success,
    typography,
} from '@/constants/theme';
import { clothingRequestsService } from '@/services/requests/clothings';
import type { ClothingRequest } from '@/types/requests/clothings';
import { getErrorMessage } from '@/utils/errorMessage';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_COLORS: Record<string, string> = {
  Pending: mutedForeground,
  Approved: success,
  Denied: destructive,
  Completed: primary,
};

export default function ClothingRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [request, setRequest] = useState<ClothingRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await clothingRequestsService.getById(id);
      setRequest(data);
    } catch (error) {
      console.error('Failed to load clothing request', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to load clothing request. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

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
        <Text style={styles.errorText}>Clothing request not found.</Text>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[request.status] ?? mutedForeground;

  return (
    <ScrollView
      style={{ backgroundColor: background }}
      contentContainerStyle={[styles.container, { paddingBottom: spacing.xl + insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{request.clothing_type_name ?? 'Clothing Request'}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{request.status}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Quantity</Text>
          <Text style={styles.detailValue}>{request.quantity}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Size</Text>
          <Text style={styles.detailValue}>{request.size}</Text>
        </View>
        {request.reason ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reason</Text>
            <Text style={styles.detailValue}>{request.reason}</Text>
          </View>
        ) : null}

        <Text style={styles.meta}>
          Submitted {new Date(request.created_at).toLocaleDateString()}
        </Text>
      </View>
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
  badgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  detailRow: { marginBottom: spacing.base },
  detailLabel: { fontSize: 12, fontWeight: '600', color: mutedForeground, marginBottom: spacing.sm },
  detailValue: { fontSize: 15, color: foreground },
  meta: { fontSize: 13, color: mutedForeground, marginTop: spacing.base },
  errorText: { fontSize: 16, color: destructive },
});
