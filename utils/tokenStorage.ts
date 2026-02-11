/**
 * Token storage for the Employee app.
 * - Native (iOS/Android): expo-secure-store
 * - Web: localStorage (expo-secure-store is not fully supported on web)
 * Same API and key names as the Ionic app so callers (auth, API) do not need to change.
 */

import { Platform } from 'react-native';

const TOKEN_KEYS = {
  ACCESS: 'employee_access_token',
  REFRESH: 'employee_refresh_token',
  ROLE: 'employee_role',
} as const;

function isWeb(): boolean {
  return Platform.OS === 'web';
}

async function getItem(key: string): Promise<string | undefined> {
  if (isWeb()) {
    if (typeof localStorage === 'undefined') return undefined;
    return localStorage.getItem(key) ?? undefined;
  }
  const SecureStore = await import('expo-secure-store');
  const value = await SecureStore.getItemAsync(key);
  return value ?? undefined;
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb()) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string): Promise<void> {
  if (isWeb()) {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.deleteItemAsync(key);
}

export const tokenStorage = {
  async getAccessToken(): Promise<string | undefined> {
    return getItem(TOKEN_KEYS.ACCESS);
  },

  async getRefreshToken(): Promise<string | undefined> {
    return getItem(TOKEN_KEYS.REFRESH);
  },

  getAccessTokenSync(): string | undefined {
    if (isWeb() && typeof localStorage !== 'undefined') {
      return localStorage.getItem(TOKEN_KEYS.ACCESS) ?? undefined;
    }
    return undefined;
  },

  getRefreshTokenSync(): string | undefined {
    return undefined;
  },

  async setAccessToken(value: string): Promise<void> {
    await setItem(TOKEN_KEYS.ACCESS, value);
  },

  async setRefreshToken(value: string): Promise<void> {
    await setItem(TOKEN_KEYS.REFRESH, value);
  },

  async setRole(value: string): Promise<void> {
    await setItem(TOKEN_KEYS.ROLE, value);
  },

  async removeAccessToken(): Promise<void> {
    await removeItem(TOKEN_KEYS.ACCESS);
  },

  async removeRefreshToken(): Promise<void> {
    await removeItem(TOKEN_KEYS.REFRESH);
  },

  async removeRole(): Promise<void> {
    await removeItem(TOKEN_KEYS.ROLE);
  },

  async clearAll(): Promise<void> {
    await removeItem(TOKEN_KEYS.ACCESS);
    await removeItem(TOKEN_KEYS.REFRESH);
    await removeItem(TOKEN_KEYS.ROLE);
  },
};
