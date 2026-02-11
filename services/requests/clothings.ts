import type {
  ClothingRequest,
  ClothingRequestCreate,
  ClothingRequestList,
} from '@/types/requests/clothings';
import type { Type } from '@/types/types';
import { apiRequest } from '@/utils/api';

export const clothingRequestsService = {
  async list(
    page = 1,
    limit = 20,
    search?: string,
    clothingType?: string,
    size?: string
  ): Promise<ClothingRequestList> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);
    if (clothingType && clothingType !== 'All') params.append('clothing_type', clothingType);
    if (size && size !== 'All') params.append('size', size);
    return apiRequest<unknown, ClothingRequestList>(
      `clothing-requests/?${params.toString()}`,
      { method: 'GET' },
      true,
      true
    );
  },

  async create(data: ClothingRequestCreate): Promise<ClothingRequest> {
    return apiRequest<ClothingRequestCreate, ClothingRequest>(
      'clothing-requests/',
      { method: 'POST', data },
      true,
      true
    );
  },

  async listTypes(): Promise<Type[]> {
    return apiRequest<unknown, Type[]>('types/clothing', { method: 'GET' }, true, true);
  },
};
