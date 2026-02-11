import {
  background,
  border,
  card,
  foreground,
  muted,
  mutedForeground,
  primary,
  radius,
  spacing,
  typography,
} from '@/constants/theme';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { notificationsService } from '@/services/notifications';
import type { UserNotification } from '@/types/userNotifications';
import { getErrorMessage } from '@/utils/errorMessage';
import { hapticImpact } from '@/utils/haptics';
import { formatDistanceToNow } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonListCard } from '@/components/ui/Skeleton';

export default function NotificationsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery.trim(), 400);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationsService.getMyNotifications(1, 25, debouncedSearch || undefined);
      setNotifications(res.items || []);
    } catch (error) {
      console.error('Failed to load notifications', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to load notifications. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const renderHeader = () => (
    <View style={styles.searchWrap}>
      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search notifications..."
        placeholderTextColor={mutedForeground}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );

  const handleItemPress = async (n: UserNotification) => {
    const id = n.id || n.notification_id || '';
    if (!id) return;
    if (!n.read) {
      try {
        await notificationsService.markAsRead(id);
        setNotifications((prev) =>
          prev.map((x) =>
            (x.id || x.notification_id) === id ? { ...x, read: true } : x
          )
        );
      } catch (_) {}
    }
    router.push(`/(app)/notifications/${id}`);
  };

  if (loading && notifications.length === 0) {
    return (
      <View style={[styles.skeletonContainer, { paddingBottom: spacing.xl + insets.bottom }]}>
        <View style={styles.searchWrap}>
          <View style={[styles.searchInput, { height: 44, backgroundColor: border }]} />
        </View>
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

  return (
    <FlatList
      data={notifications}
      keyExtractor={(n) => n.id || n.notification_id || String(Math.random())}
      style={{ backgroundColor: background }}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={[styles.list, { paddingBottom: spacing.xl + insets.bottom }]}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor={primary} />
      }
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.card, !item.read && styles.cardUnread, pressed && { opacity: 0.8 }]}
          onPress={() => {
            hapticImpact();
            handleItemPress(item);
          }}
          accessibilityLabel={`${item.type || 'Notification'}: ${item.message}`}
          accessibilityRole="button"
        >
          <View style={styles.cardInner}>
            <View style={styles.iconWrap}>
              <Ionicons name="notifications" size={20} color={primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.type}>{item.type || 'Notification'}</Text>
              <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
              <Text style={styles.date}>
                {formatDistanceToNow(new Date(item.created_at), {
                  addSuffix: true,
                })}
              </Text>
            </View>
          </View>
        </Pressable>
      )}
      ListEmptyComponent={<EmptyState message="No notifications found" icon="notifications-outline" />}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  skeletonContainer: { flex: 1, backgroundColor: background },
  skeletonWrap: { paddingHorizontal: spacing.base },
  searchWrap: { paddingHorizontal: spacing.base, paddingBottom: spacing.sm },
  searchInput: {
    borderWidth: 1,
    borderColor: border,
    borderRadius: radius.base,
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    fontSize: 16,
    color: foreground,
    backgroundColor: card,
  },
  list: { padding: spacing.base, paddingBottom: spacing.xl },
  card: {
    backgroundColor: card,
    borderRadius: radius.base,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: border,
  },
  cardUnread: { borderLeftWidth: 4, borderLeftColor: primary },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1 },
  type: { ...typography.label, color: mutedForeground, marginBottom: 4 },
  message: { fontSize: 15, color: foreground, marginBottom: 4 },
  date: { fontSize: 12, color: mutedForeground },
});
