import { useMainStore } from '@/store/main';
import { pushNotificationService } from '@/services/pushNotifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

/**
 * Sets the navigation callback for push notification taps and initializes
 * push when user is loaded. Must be mounted inside the navigation tree.
 */
export function PushNotificationSetup() {
  const router = useRouter();
  const me = useMainStore((state) => state.me);
  const initRef = useRef(false);

  useEffect(() => {
    pushNotificationService.setNavigation((href) => {
      router.push(href as any);
    });
  }, [router]);

  useEffect(() => {
    if (!me || initRef.current) return;
    initRef.current = true;
    pushNotificationService.initialize();
  }, [me]);

  return null;
}
