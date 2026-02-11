import {
  border,
  card,
  destructive,
  foreground,
  mutedForeground,
  primary,
  radius,
  spacing,
  typography,
} from '@/constants/theme';
import { notificationsService } from '@/services/notifications';
import type { Notification } from '@/types/notifications';
import { format } from 'date-fns';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
        <ActivityIndicator size="large" color={primary} />
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
      <View style={styles.card}>
        <Text style={styles.type}>{notification.notification_type?.name || 'Notification'}</Text>
        <Text style={styles.message}>{notification.message}</Text>
        <Text style={styles.meta}>
          {format(new Date(notification.created_at), 'PPpp')} · {notification.status}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.base, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: card,
    borderRadius: radius.base,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: border,
  },
  type: { fontSize: 14, fontWeight: '600', color: mutedForeground, marginBottom: 8 },
  message: { fontSize: 16, color: foreground, marginBottom: 12 },
  meta: { fontSize: 13, color: mutedForeground },
  errorText: { fontSize: 16, color: destructive },
});
