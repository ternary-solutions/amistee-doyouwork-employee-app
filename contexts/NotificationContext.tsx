import { notificationsService } from '@/services/notifications';
import { useMainStore } from '@/store/main';
import type { UserNotification } from '@/types/userNotifications';
import { getBaseUrl } from '@/utils/api';
import { tokenStorage } from '@/utils/tokenStorage';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { Alert } from 'react-native';

interface NotificationContextType {
  notifications: UserNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

function getWebSocketUrl(userId: string, token: string): string {
  let baseUrl = getBaseUrl(false);
  baseUrl = baseUrl.replace(/\/+$/, '');
  const wsBaseUrl = baseUrl
    .replace(/^http:/i, 'ws:')
    .replace(/^https:/i, 'wss:');
  const wsPath = `/ws/notifications/${userId}`;
  return `${wsBaseUrl}${wsPath}?token=${encodeURIComponent(token)}`;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const me = useMainStore((state) => state.me);
  const fetchedUserIdRef = useRef<string | null>(null);

  const fetchInitialNotifications = useCallback(async () => {
    const currentMe = useMainStore.getState().me;
    if (!currentMe?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await notificationsService.getMyNotifications(1, 100);
      const fetchedNotifications = response.items || [];
      const mappedNotifications = fetchedNotifications.map((n) => ({
        ...n,
        id: n.id || n.notification_id,
        notification_id: n.notification_id || n.id,
      }));
      const sorted = mappedNotifications.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setNotifications(sorted);
      const unread = sorted.filter(
        (n) => n.read === false || n.read === undefined
      ).length;
      setUnreadCount(unread);
    } catch (error: unknown) {
      console.error('[NotificationContext] Failed to fetch notifications:', error);
      const message =
        (error as { response?: { data?: { detail?: string } }; message?: string })
          ?.response?.data?.detail ||
        (error as { message?: string })?.message ||
        'Failed to load notifications';
      Alert.alert('Error', `${message}. Please try again.`);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    await fetchInitialNotifications();
  }, [fetchInitialNotifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await notificationsService.markAsRead(notificationId);
        setNotifications((prev) =>
          prev.map((n) => {
            const nId = n.id || n.notification_id;
            return nId === notificationId ? { ...n, read: true } : n;
          })
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('[NotificationContext] Failed to mark as read:', error);
        await fetchInitialNotifications();
      }
    },
    [fetchInitialNotifications]
  );

  // Subscribe to store changes for initial fetch when me becomes available
  useEffect(() => {
    let previousMeId: string | null = null;
    const unsubscribe = useMainStore.subscribe((state) => {
      const currentMe = state.me;
      const currentMeId = currentMe?.id ? String(currentMe.id) : null;
      if (
        currentMeId &&
        currentMeId !== previousMeId &&
        fetchedUserIdRef.current !== currentMeId
      ) {
        previousMeId = currentMeId;
        fetchedUserIdRef.current = currentMeId;
        fetchInitialNotifications().catch((err) => {
          console.error('[NotificationContext] Store subscription fetch error:', err);
          setLoading(false);
        });
      } else if (currentMeId) {
        previousMeId = currentMeId;
      } else {
        previousMeId = null;
      }
    });

    const currentMe = useMainStore.getState().me;
    if (currentMe?.id) {
      const userId = String(currentMe.id);
      if (fetchedUserIdRef.current !== userId) {
        previousMeId = userId;
        fetchedUserIdRef.current = userId;
        fetchInitialNotifications().catch((err) => {
          console.error('[NotificationContext] Initial fetch error:', err);
          setLoading(false);
        });
      }
    }

    return unsubscribe;
  }, [fetchInitialNotifications]);

  // WebSocket connection management
  useEffect(() => {
    if (!me?.id) return;

    let cancelled = false;

    const run = async () => {
      const token = await tokenStorage.getAccessToken();
      if (cancelled || !token) return;

      const userId = String(me.id);

      const connectWebSocket = () => {
        try {
          const wsUrl = getWebSocketUrl(userId, token);
          const ws = new WebSocket(wsUrl);
          wsRef.current = ws;

          const connectionTimeout = setTimeout(() => {
            if (ws.readyState === WebSocket.CONNECTING) {
              console.warn('[NotificationContext] WebSocket still connecting after 5s');
            } else if (ws.readyState === WebSocket.CLOSED) {
              console.error('[NotificationContext] WebSocket closed before opening');
            }
          }, 5000);

          ws.onopen = () => {
            clearTimeout(connectionTimeout);
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = null;
            }
          };

          ws.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data as string);
              if (message.event === 'notification') {
                const newNotification: UserNotification = {
                  ...message.data,
                  id: message.data.id || message.data.notification_id,
                  notification_id:
                    message.data.notification_id || message.data.id,
                  read: message.data.read !== undefined ? message.data.read : false,
                };

                setNotifications((prev) => {
                  const newId = newNotification.id || newNotification.notification_id;
                  const exists = prev.some((n) => {
                    const nId = n.id || n.notification_id;
                    return nId === newId;
                  });
                  if (exists) {
                    return prev.map((n) => {
                      const nId = n.id || n.notification_id;
                      return nId === newId ? newNotification : n;
                    });
                  }
                  return [newNotification, ...prev];
                });

                if (newNotification.unread_count !== undefined) {
                  setUnreadCount(newNotification.unread_count);
                } else if (!newNotification.read) {
                  setUnreadCount((prev) => prev + 1);
                }
                // State updates above; UI (badge, list) will reflect. Add a toast library
                // if you want an in-app banner for new notifications.
              }
            } catch (error) {
              console.error('[NotificationContext] WebSocket message parse error:', error);
            }
          };

          ws.onerror = () => {
            console.error('[NotificationContext] WebSocket error');
          };

          ws.onclose = (event) => {
            clearTimeout(connectionTimeout);
            if (event.code !== 1000 && !cancelled) {
              reconnectTimeoutRef.current = setTimeout(() => {
                connectWebSocket();
              }, 3000);
            }
          };
        } catch (error) {
          console.error('[NotificationContext] WebSocket connection failed:', error);
        }
      };

      connectWebSocket();
    };

    run();

    return () => {
      cancelled = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
    };
  }, [me?.id]);

  // Fetch when meId becomes available (fallback for token-first flow)
  useEffect(() => {
    const run = async () => {
      const token = await tokenStorage.getAccessToken();
      if (token && !me?.id) {
        const { fetchMe } = await import('@/utils/api');
        fetchMe()
          .then(() => {
            const updatedMe = useMainStore.getState().me;
            if (updatedMe?.id && fetchedUserIdRef.current !== String(updatedMe.id)) {
              fetchedUserIdRef.current = String(updatedMe.id);
              fetchInitialNotifications().catch(() => setLoading(false));
            }
          })
          .catch(() => setLoading(false));
        return;
      }

      if (me?.id) {
        const userId = String(me.id);
        if (fetchedUserIdRef.current !== userId) {
          fetchedUserIdRef.current = userId;
          fetchInitialNotifications().catch(() => setLoading(false));
        } else {
          setLoading(false);
        }
      } else if (!token) {
        setLoading(false);
        fetchedUserIdRef.current = null;
      }
    };
    run();
  }, [me?.id, fetchInitialNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
