import { notificationsService } from '@/services/notifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { format } from 'date-fns';
import type { Notification } from '@/types/notifications';

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await notificationsService.getById(id);
      setNotification(data);
    } catch (err) {
      setError('Failed to load notification.');
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
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !notification) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.type}>{notification.notification_type?.name || 'Notification'}</Text>
      <Text style={styles.message}>{notification.message}</Text>
      <Text style={styles.meta}>
        {format(new Date(notification.created_at), 'PPpp')} · {notification.status}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  type: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  message: { fontSize: 16, marginBottom: 12 },
  meta: { fontSize: 13, color: '#94a3b8' },
  errorText: { fontSize: 16, color: '#dc2626' },
});
