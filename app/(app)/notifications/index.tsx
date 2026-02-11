import { notificationsService } from '@/services/notifications';
import type { UserNotification } from '@/types/userNotifications';
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
import { format } from 'date-fns';

export default function NotificationsListScreen() {
  const router = useRouter();
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
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No notifications found</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={notifications}
      keyExtractor={(n) => n.id || n.notification_id || String(Math.random())}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          style={[styles.card, !item.read && styles.cardUnread]}
          onPress={() => handleItemPress(item)}
        >
          <Text style={styles.type}>{item.type || 'Notification'}</Text>
          <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.date}>
            {format(new Date(item.created_at), 'yyyy-MM-dd')}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardUnread: { borderLeftWidth: 4, borderLeftColor: '#0b4a91' },
  type: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4 },
  message: { fontSize: 15, marginBottom: 4 },
  date: { fontSize: 12, color: '#94a3b8' },
  emptyText: { fontSize: 16, color: '#64748b' },
});
