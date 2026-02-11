import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
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
    const me = useMainStore.getState().me;
    if (!me) return;

    if (!Device.isDevice) {
      console.log('[PushNotifications] Must use a physical device for push');
      return;
    }

    try {
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

      this.setupNotificationResponseListener();

      const tokenData = await Notifications.getDevicePushTokenAsync();
      const token = tokenData?.data;
      if (token) {
        await this.registerTokenWithBackend(token);
      }
    } catch (error) {
      console.error('[PushNotifications] Error initializing:', error);
    }
  }

  private setupNotificationResponseListener(): void {
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
    } catch (error) {
      console.error('[PushNotifications] Error registering token:', error);
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
