import {
  border,
  card,
  foreground,
  muted,
  mutedForeground,
  primary,
  primaryForeground,
  radius,
  spacing,
  success,
  typography,
} from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { notificationsService } from '@/services/notifications';
import type { UserNotification } from '@/types/userNotifications';
import { formatDistanceToNow } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export function DashboardNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationsService.getMyNotifications(1, 25, undefined, true);
      setNotifications(res.items || []);
      setUnreadCount(res.total ?? 0);
    } catch (e) {
      console.error('[DashboardNotifications]', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handlePress = async (n: UserNotification) => {
    const id = n.id || n.notification_id || '';
    if (id && !n.read) {
      try {
        await notificationsService.markAsRead(id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((x) =>
            (x.id || x.notification_id) === id ? { ...x, read: true } : x
          )
        );
      } catch (_) {}
    }
    if (id) router.push(`/(app)/notifications/${id}`);
  };

  const handleViewAll = () => router.push('/(app)/notifications');

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <Button variant="outline" size="sm" onPress={handleViewAll} accessibilityLabel="View all notifications" accessibilityRole="button">
          View All
        </Button>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={mutedForeground} style={styles.loader} />
      ) : notifications.length === 0 ? (
        <Text style={styles.muted}>No new notifications</Text>
      ) : notifications.length === 1 ? (
        <NotificationRow
          notification={notifications[0]}
          onPress={() => handlePress(notifications[0])}
        />
      ) : (
        notifications.slice(0, 3).map((n) => {
          const id = n.id || n.notification_id || '';
          return (
            <NotificationRow
              key={id}
              notification={n}
              onPress={() => handlePress(n)}
            />
          );
        })
      )}
    </View>
  );
}

function NotificationRow({
  notification,
  onPress,
}: {
  notification: UserNotification;
  onPress: () => void;
}) {
  const dateLabel = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
  });
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityLabel={`${notification.type || 'Notification'}: ${notification.message}`}
      accessibilityRole="button"
    >
      <View style={styles.cardInner}>
        <View style={styles.iconWrap}>
          <Ionicons name="notifications" size={20} color={primary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardType}>{notification.type || 'Notification'}</Text>
          <Text style={styles.cardMessage} numberOfLines={2}>
            {notification.message}
          </Text>
          <Text style={styles.cardDate}>{dateLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: foreground,
  },
  badge: {
    backgroundColor: success,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: primaryForeground,
    fontSize: 12,
    fontWeight: '600',
  },
  loader: {
    marginVertical: spacing.sm,
  },
  muted: {
    fontSize: 14,
    color: mutedForeground,
  },
  card: {
    backgroundColor: card,
    borderWidth: 1,
    borderColor: border,
    borderRadius: radius.base,
    padding: spacing.base,
    marginBottom: spacing.sm,
  },
  pressed: { opacity: 0.8 },
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
  cardContent: {
    flex: 1,
  },
  cardType: {
    fontSize: 12,
    fontWeight: '600',
    color: mutedForeground,
    marginBottom: 4,
  },
  cardMessage: {
    fontSize: 14,
    color: foreground,
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    color: mutedForeground,
  },
});
