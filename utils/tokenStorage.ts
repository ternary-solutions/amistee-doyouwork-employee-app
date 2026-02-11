/**
 * Secure token storage for the Employee app (React Native).
 * Uses expo-secure-store. Same API and key names as the Ionic app
 * so callers (auth, API) do not need to change.
 */

import * as SecureStore from 'expo-secure-store';

const TOKEN_KEYS = {
  ACCESS: 'employee_access_token',
  REFRESH: 'employee_refresh_token',
  ROLE: 'employee_role',
} as const;

export const tokenStorage = {
  async getAccessToken(): Promise<string | undefined> {
    const value = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS);
    return value ?? undefined;
  },

  async getRefreshToken(): Promise<string | undefined> {
    const value = await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH);
    return value ?? undefined;
  },

  getAccessTokenSync(): string | undefined {
    return undefined;
  },

  getRefreshTokenSync(): string | undefined {
    return undefined;
  },

  async setAccessToken(value: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS, value);
  },

  async setRefreshToken(value: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEYS.REFRESH, value);
  },

  async setRole(value: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEYS.ROLE, value);
  },

  async removeAccessToken(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS);
  },

  async removeRefreshToken(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH);
  },

  async removeRole(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEYS.ROLE);
  },

  async clearAll(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS);
    await SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH);
    await SecureStore.deleteItemAsync(TOKEN_KEYS.ROLE);
  },
};
