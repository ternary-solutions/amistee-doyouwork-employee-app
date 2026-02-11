import { useMainStore } from '@/store/main';
import type { ApiRequestOptions, RefreshTokenResponse } from '@/types/auth';
import type { User } from '@/types/users';
import { UserRoleMap } from '@/utils/enum';
import { tokenStorage } from '@/utils/tokenStorage';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export const getBaseUrl = (requireApiVersion = true): string => {
  const base =
    (process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined) ||
    'https://amistee.ternary.com.bd/';
  return base.endsWith('/') ? base : `${base}/`;
};

/** WebSocket base for real-time notifications: wss://amistee.ternary.com.bd/ws/notifications/ */
export const getWebSocketNotificationsBaseUrl = (): string => {
  const envBase =
    (process.env.EXPO_PUBLIC_WS_NOTIFICATIONS_BASE_URL as string | undefined);
  if (envBase) {
    const base = envBase.replace(/\/+$/, '');
    return base.startsWith('ws://') || base.startsWith('wss://')
      ? base
      : base.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
  }
  const httpBase = getBaseUrl(false).replace(/\/+$/, '');
  return httpBase
    .replace(/^http:/i, 'ws:')
    .replace(/^https:/i, 'wss:');
};

export { getMediaUrl, getMediaSource } from '@/utils/mediaSource';

async function refreshAccessToken(): Promise<RefreshTokenResponse> {
  const BASE_URL = getBaseUrl(true);
  const refreshToken = await tokenStorage.getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const { data } = await axios.post<RefreshTokenResponse>(
      `${BASE_URL}auth/refresh`,
      { refresh_token: refreshToken }
    );
    await tokenStorage.setAccessToken(data.access_token);
    useMainStore.getState().setAccessToken(data.access_token);
    return data;
  } catch (error: unknown) {
    console.error('[refreshAccessToken] Error refreshing token:', error);
    await tokenStorage.clearAll();
    useMainStore.getState().setAccessToken(null);
    throw new Error('Session expired. Please log in again.');
  }
}

export async function apiRequest<Req, Res>(
  endpoint: string,
  options: ApiRequestOptions<Req> = {},
  requireAuth = true,
  requireApiVersion = true,
  isRetry = false
): Promise<Res> {
  const BASE_URL = getBaseUrl(requireApiVersion);
  let token = await tokenStorage.getAccessToken();

  if (requireAuth && !token) {
    throw new Error('Authentication error. Please log in again.');
  }

  const currentLocationId = useMainStore.getState().currentLocationId;
  const me = useMainStore.getState().me;
  const locationId = currentLocationId || me?.location_id;

  const headers: Record<string, string> = {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (requireAuth && locationId) {
    headers['X-Location-Id'] = locationId;
  }

  if (options.data instanceof FormData) {
    delete headers['Content-Type'];
  }

  const config: AxiosRequestConfig = {
    url: `${BASE_URL}${endpoint}`,
    method: options.method || 'GET',
    headers,
    data: options.data || undefined,
  };

  try {
    const response: AxiosResponse<Res> = await axios(config);
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number } };
    if (
      axiosError.response?.status === 401 &&
      requireAuth &&
      !isRetry
    ) {
      try {
        await refreshAccessToken();
        return apiRequest<Req, Res>(
          endpoint,
          options,
          requireAuth,
          requireApiVersion,
          true
        );
      } catch {
        await tokenStorage.clearAll();
        useMainStore.getState().setMe(null);
        useMainStore.getState().setRole(null);
        throw new Error('Session expired. Please log in again.');
      }
    }

    if (axiosError.response?.status === 401 && requireAuth) {
      throw new Error('Session expired. Please log in again.');
    }

    if (axiosError.response) {
      throw axiosError.response;
    }

    throw new Error('A network error occurred. Please check your connection.');
  }
}

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  user: User;
};

async function applyAuthResponse(data: LoginResponse): Promise<void> {
  if (data.user.role !== 'EMPLOYEE') {
    throw new Error(
      'Only Employee can login. You are logged in as ' +
        UserRoleMap[data.user.role] +
        '.'
    );
  }
  await tokenStorage.setAccessToken(data.access_token);
  await tokenStorage.setRefreshToken(data.refresh_token);
  await tokenStorage.setRole(data.user.role);
  useMainStore.getState().setAccessToken(data.access_token);

  // All employees are single location; use the user's location only
  const locationId = data.user.location_id ?? data.user.location_ids?.[0] ?? null;
  useMainStore.getState().setCurrentLocationId(locationId);
  useMainStore.getState().setMe(data.user);
  useMainStore.getState().setRole(data.user.role);
}

export async function login(
  emailOrPhone: string,
  password: string
): Promise<LoginResponse> {
  const BASE_URL = getBaseUrl(true);
  const isEmail = emailOrPhone.includes('@');
  const loginBody = isEmail
    ? { email: emailOrPhone, password }
    : { phone_number: emailOrPhone, password };
  const { data } = await axios.post<LoginResponse>(
    `${BASE_URL}auth/login`,
    loginBody
  );
  await applyAuthResponse(data);
  return data;
}

export async function loginWithOTP(
  phoneNumber: string,
  code: string
): Promise<LoginResponse> {
  const { authService } = await import('@/services/auth');
  const data = await authService.verifyEmployeeLoginOTP(phoneNumber, code);
  await applyAuthResponse(data);
  return data;
}

export async function logout(): Promise<void> {
  try {
    const { pushNotificationService } = await import('@/services/pushNotifications');
    await pushNotificationService.unregisterToken();
  } catch (e) {
    console.warn('[logout] Failed to unregister push token:', e);
  }
  await tokenStorage.clearAll();
  useMainStore.getState().setMe(null);
  useMainStore.getState().setRole(null);
  useMainStore.getState().setAccessToken(null);
  useMainStore.getState().setUsers([]);
  useMainStore.getState().setEmployees([]);
  useMainStore.getState().setLocations([]);
  useMainStore.getState().setNotifications([]);
  useMainStore.getState().setLocationIds([]);
}

export async function fetchMe(): Promise<User> {
  const data = await apiRequest<unknown, User>(
    'auth/me',
    { method: 'GET' },
    true,
    true
  );

  if (data.location_ids) {
    useMainStore.getState().setLocationIds(data.location_ids);
  }
  // All employees are single location; keep currentLocationId in sync with user
  const locationId = data.location_id ?? data.location_ids?.[0] ?? null;
  useMainStore.getState().setCurrentLocationId(locationId);
  useMainStore.getState().setMe(data);
  useMainStore.getState().setRole(data.role);

  return data;
}
