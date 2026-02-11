import type { Spiff, SpiffCreate, SpiffList } from '@/types/spiffs';
import type { Type } from '@/types/types';
import { apiRequest } from '@/utils/api';

export const spiffsService = {
  async list(
    page = 1,
    limit = 20,
    search?: string,
    status?: string,
    spiff_type?: string
  ): Promise<SpiffList> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) queryParams.append('search', search);
    if (status) queryParams.append('status', status);
    if (spiff_type) queryParams.append('spiff_type', spiff_type);
    return apiRequest<unknown, SpiffList>(
      `spiffs/?${queryParams.toString()}`,
      { method: 'GET' },
      true,
      true
    );
  },

  async getById(id: string): Promise<Spiff> {
    return apiRequest<unknown, Spiff>(`spiffs/${id}`, { method: 'GET' }, true, true);
  },

  async create(data: SpiffCreate): Promise<Spiff> {
    return apiRequest<SpiffCreate, Spiff>('spiffs/', { method: 'POST', data }, true, true);
  },

  async listTypes(): Promise<Type[]> {
    return apiRequest<unknown, Type[]>('types/spiff', { method: 'GET' }, true, true);
  },
};
