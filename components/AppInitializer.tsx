import { useMainStore } from '@/store/main';
import { getStoredLocationId } from '@/store/main';
import { fetchMe } from '@/utils/api';
import { tokenStorage } from '@/utils/tokenStorage';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

/**
 * On app launch: if we have a token but no user in store, load stored location
 * then fetch user. On failure, clear tokens and redirect to login.
 */
export function AppInitializer() {
  const router = useRouter();
  const me = useMainStore((state) => state.me);
  const setCurrentLocationId = useMainStore((state) => state.setCurrentLocationId);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const token = await tokenStorage.getAccessToken();
      if (!token || me) return;

      try {
        const storedLocationId = await getStoredLocationId();
        if (storedLocationId) {
          setCurrentLocationId(storedLocationId);
        }
        await fetchMe();
      } catch (error) {
        if (!cancelled) {
          console.error('[AppInitializer] Failed to fetch user on startup:', error);
          await tokenStorage.clearAll();
          useMainStore.getState().setMe(null);
          useMainStore.getState().setRole(null);
          router.replace('/(auth)/login');
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [me, setCurrentLocationId, router]);

  return null;
}
