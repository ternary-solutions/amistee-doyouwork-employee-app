import { useMainStore } from '@/store/main';
import { getStoredLocationId } from '@/store/main';
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

/** Placeholder image when no URL is provided (avatar, vehicle, etc.). */
const PLACEHOLDER_IMAGE_URI =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e2e8f0"/><text x="50" y="55" text-anchor="middle" fill="#64748b" font-size="36" font-family="system-ui,sans-serif">?</text></svg>'
  );

/** Full URL for a media file (avatar, vehicle image, etc.). Returns placeholder when url is empty. */
export const getMediaUrl = (url: string | null | undefined): string => {
  if (!url) return PLACEHOLDER_IMAGE_URI;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = getBaseUrl(false).replace(/\/$/, '');
  if (url.startsWith('/media/serve/')) return `${baseUrl}${url}`;
  return `${baseUrl}/media/serve?path=${encodeURIComponent(url)}`;
};

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
    return data;
  } catch (error: unknown) {
    console.error('[refreshAccessToken] Error refreshing token:', error);
    await tokenStorage.clearAll();
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

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  user: User;
};

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

  const storedLocationId = await getStoredLocationId();
  const initialLocationId =
    storedLocationId && data.user.location_ids.includes(storedLocationId)
      ? storedLocationId
      : data.user.location_ids[0] || data.user.location_id;
  useMainStore.getState().setCurrentLocationId(initialLocationId);
  useMainStore.getState().setMe(data.user);
  useMainStore.getState().setRole(data.user.role);

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
  useMainStore.getState().setUsers([]);
  useMainStore.getState().setEmployees([]);
  useMainStore.getState().setLocations([]);
  useMainStore.getState().setNotifications([]);
  useMainStore.getState().setLocationIds([]);
}

export async function fetchMe(): Promise<User> {
  const BASE_URL = getBaseUrl(true);
  const token = await tokenStorage.getAccessToken();
  const currentLocationId = useMainStore.getState().currentLocationId;
  const me = useMainStore.getState().me;
  const locationId = currentLocationId || me?.location_id;

  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};
  if (locationId) {
    headers['X-Location-Id'] = locationId;
  }

  const { data } = await axios.get<User>(`${BASE_URL}auth/me`, { headers });

  if (data.location_ids) {
    useMainStore.getState().setLocationIds(data.location_ids);
  }
  useMainStore.getState().setMe(data);
  useMainStore.getState().setRole(data.role);

  return data;
}
