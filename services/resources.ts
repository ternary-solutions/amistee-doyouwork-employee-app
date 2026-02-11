import type { ResourceList } from '@/types/resources';
import { apiRequest } from '@/utils/api';

export const resourcesService = {
  async list(
    page = 1,
    limit = 20,
    search?: string
  ): Promise<ResourceList> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);
    return apiRequest<unknown, ResourceList>(
      `resources/?${params.toString()}`,
      { method: 'GET' },
      true,
      true
    );
  },
};
