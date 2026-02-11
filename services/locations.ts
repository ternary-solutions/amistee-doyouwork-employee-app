import type {
    Location,
    LocationCreate,
    LocationList,
    LocationUpdate,
} from '@/types/locations';
import { apiRequest } from '@/utils/api';

export const locationsService = {
  async list(page = 1, limit = 100): Promise<LocationList> {
    return apiRequest<unknown, LocationList>(
      `locations/?page=${page}&limit=${limit}`,
      {},
      true,
      true
    );
  },

  async getById(id: string): Promise<Location> {
    return apiRequest<unknown, Location>(
      `locations/${id}`,
      {},
      true,
      true
    );
  },

  async create(data: LocationCreate): Promise<Location> {
    return apiRequest<LocationCreate, Location>(
      'locations/',
      { method: 'POST', data },
      true,
      true
    );
  },

  async update(id: string, data: LocationUpdate): Promise<Location> {
    return apiRequest<LocationUpdate, Location>(
      `locations/${id}`,
      { method: 'PATCH', data },
      true,
      true
    );
  },

  async delete(id: string): Promise<void> {
    return apiRequest<unknown, void>(
      `locations/${id}`,
      { method: 'DELETE' },
      true,
      true
    );
  },
};
