import { Button } from '@/components/ui/Button';
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
import { useNotifications } from '@/contexts/NotificationContext';
import type { UserNotification } from '@/types/userNotifications';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export function DashboardNotifications() {
  const router = useRouter();
  const { notifications, unreadCount, loading, markAsRead, refreshNotifications } =
    useNotifications();

  // Filter to unread for dashboard display (matches previous unread_only behavior)
  const unreadNotifications = notifications.filter(
    (n) => n.read === false || n.read === undefined
  );

  const handlePress = async (n: UserNotification) => {
    const id = n.id || n.notification_id || '';
    if (id && !n.read) {
      await markAsRead(id);
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
        <Button
          variant="outline"
          size="sm"
          onPress={() => {
            handleViewAll();
            refreshNotifications();
          }}
          accessibilityLabel="View all notifications"
          accessibilityRole="button"
        >
          View All
        </Button>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={mutedForeground} style={styles.loader} />
      ) : unreadNotifications.length === 0 ? (
        <Text style={styles.muted}>No new notifications</Text>
      ) : unreadNotifications.length === 1 ? (
        <NotificationRow
          notification={unreadNotifications[0]}
          onPress={() => handlePress(unreadNotifications[0])}
        />
      ) : (
        unreadNotifications.slice(0, 3).map((n) => {
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
