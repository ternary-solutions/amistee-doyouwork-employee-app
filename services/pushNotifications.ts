import { Platform } from 'react-native';
import { useMainStore } from '@/store/main';
import { deviceTokenService, type DevicePlatform } from '@/services/deviceTokens';

const ROUTE_MAP: Record<string, string> = {
  schedule: '/(app)/schedule',
  expense: '/(app)/expenses',
  spiff: '/(app)/spiffs',
  tool: '/(app)/tools',
  clothing: '/(app)/clothing',
  vehicle: '/(app)/vehicles',
  time_off: '/(app)/time-off',
  notification: '/(app)/notifications',
};

type NavigateFn = (href: string) => void;

function isWeb(): boolean {
  return Platform.OS === 'web';
}

class PushNotificationService {
  private tokenRegistered = false;
  private currentToken: string | null = null;
  private navigateRef: NavigateFn | null = null;

  setNavigation(navigate: NavigateFn) {
    this.navigateRef = navigate;
  }

  private getPlatform(): DevicePlatform {
    if (Platform.OS === 'android') return 'android';
    if (Platform.OS === 'ios') return 'ios';
    return 'web';
  }

  async initialize(): Promise<void> {
    if (isWeb()) return;
    const me = useMainStore.getState().me;
    if (!me) return;

    try {
      const Notifications = await import('expo-notifications');
      const Device = await import('expo-device');

      if (!Device.isDevice) {
        console.log('[PushNotifications] Must use a physical device for push');
        return;
      }

      const { status: existing } = await Notifications.getPermissionsAsync();
      let final = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        final = status;
      }
      if (final !== 'granted') {
        console.warn('[PushNotifications] Permission denied');
        return;
      }

      this.setupNotificationResponseListener(Notifications);

      const tokenData = await Notifications.getDevicePushTokenAsync();
      const token = tokenData?.data;
      if (token) {
        await this.registerTokenWithBackend(token);
      }
    } catch (error) {
      console.error('[PushNotifications] Error initializing:', error);
    }
  }

  private setupNotificationResponseListener(Notifications: Awaited<typeof import('expo-notifications')>): void {
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      const notificationId = (data?.notification_id ?? data?.id) as string | undefined;
      const type = (data?.type as string) ?? '';
      const url = (data?.url as string) ?? '';

      const navigate = this.navigateRef;
      if (!navigate) return;

      if (url) {
        const path = url.startsWith('/') ? `/(app)${url}` : `/(app)/${url}`;
        navigate(path);
      } else if (notificationId) {
        navigate(`/(app)/notifications/${notificationId}`);
      } else if (type) {
        const route = ROUTE_MAP[type.toLowerCase()] ?? '/(app)/notifications';
        navigate(route);
      } else {
        navigate('/(app)/notifications');
      }
    });
  }

  private async registerTokenWithBackend(token: string): Promise<void> {
    const me = useMainStore.getState().me;
    if (!me) return;
    if (this.tokenRegistered && this.currentToken === token) return;

    try {
      const platform = this.getPlatform();
      const appVersion = undefined;
      await deviceTokenService.register({
        token,
        platform,
        app_version: appVersion,
      });
      this.tokenRegistered = true;
      this.currentToken = token;
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: unknown }; message?: string };
      let msg: string;
      if (err.response?.data && typeof err.response.data === 'object' && err.response.data !== null && 'message' in err.response.data) {
        const m = (err.response.data as { message: unknown }).message;
        msg = typeof m === 'string' ? m : JSON.stringify(m);
      } else if (err.response?.status) {
        msg = `HTTP ${err.response.status}`;
      } else if (error instanceof Error) {
        msg = (error as Error).message || (error as Error).toString();
      } else if (err?.message && typeof err.message === 'string') {
        msg = err.message;
      } else {
        try {
          msg = typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error);
        } catch {
          msg = 'Unknown error';
        }
      }
      const logMsg = typeof msg === 'string' ? msg : JSON.stringify(msg);
      console.error('[PushNotifications] Error registering token:', logMsg);
      this.tokenRegistered = false;
      this.currentToken = null;
    }
  }

  async unregisterToken(): Promise<void> {
    if (!this.currentToken) return;
    try {
      await deviceTokenService.delete(this.currentToken);
    } catch (error) {
      console.warn('[PushNotifications] Error unregistering token:', error);
    } finally {
      this.tokenRegistered = false;
      this.currentToken = null;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
