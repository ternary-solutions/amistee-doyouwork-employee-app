import {
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
import { notificationsService } from '@/services/notifications';
import type { UserNotification } from '@/types/userNotifications';
import { formatDistanceToNow } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationsService.getMyNotifications();
      setNotifications(res.items || []);
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={[styles.centered, { paddingBottom: insets.bottom }]}>
        <Text style={styles.emptyText}>No notifications found</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={notifications}
      keyExtractor={(n) => n.id || n.notification_id || String(Math.random())}
      contentContainerStyle={[styles.list, { paddingBottom: spacing.xl + insets.bottom }]}
      renderItem={({ item }) => (
        <Pressable
          style={[styles.card, !item.read && styles.cardUnread]}
          onPress={() => handleItemPress(item)}
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
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  emptyText: { fontSize: 16, color: mutedForeground },
});
