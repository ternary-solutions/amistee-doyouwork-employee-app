import type { Preference, PreferenceUpdate } from '@/types/preferences';
import { apiRequest } from '@/utils/api';

export const preferencesService = {
  async load(): Promise<Preference> {
    return apiRequest<unknown, Preference>(
      'preferences/me',
      { method: 'GET' },
      true,
      true
    );
  },

  async update(data: PreferenceUpdate): Promise<Preference> {
    return apiRequest<PreferenceUpdate, Preference>(
      'preferences/me',
      { method: 'PATCH', data },
      true,
      true
    );
  },
};
