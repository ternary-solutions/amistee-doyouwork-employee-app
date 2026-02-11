import type { Type } from '@/types/types';
import { apiRequest } from '@/utils/api';

export const typesService = {
  async list(key: string): Promise<Type[]> {
    return apiRequest<unknown, Type[]>(
      `types/${key}`,
      { method: 'GET' },
      true,
      true
    );
  },
};
