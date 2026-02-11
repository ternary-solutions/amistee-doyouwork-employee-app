import { apiRequest } from '@/utils/api';

export type DevicePlatform = 'android' | 'ios' | 'web';

export interface DeviceTokenRegister {
  token: string;
  platform: DevicePlatform;
  device_id?: string;
  app_version?: string;
}

export interface DeviceTokenResponse {
  id: string;
  user_id: string;
  token: string;
  platform: DevicePlatform;
  device_id?: string;
  app_version?: string;
  created_at: string;
  updated_at: string;
}

export const deviceTokenService = {
  async register(data: DeviceTokenRegister): Promise<DeviceTokenResponse> {
    return apiRequest<DeviceTokenRegister, DeviceTokenResponse>(
      'device-tokens/',
      { method: 'POST', data },
      true,
      true
    );
  },

  async delete(token: string): Promise<void> {
    return apiRequest<{ token: string }, void>(
      'device-tokens/',
      { method: 'DELETE', data: { token } },
      true,
      true
    );
  },

  async deleteAll(): Promise<{ count: number }> {
    return apiRequest<unknown, { count: number }>(
      'device-tokens/all',
      { method: 'DELETE' },
      true,
      true
    );
  },
};
