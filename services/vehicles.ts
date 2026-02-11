import type { Vehicle, VehicleList } from '@/types/vehicles';
import { apiRequest } from '@/utils/api';

export const vehiclesService = {
  async list(
    page = 1,
    limit = 20,
    search?: string,
    vehicleType?: string
  ): Promise<VehicleList> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);
    if (vehicleType && vehicleType !== 'all') params.append('vehicle_type', vehicleType);
    return apiRequest<unknown, VehicleList>(
      `vehicles/?${params.toString()}`,
      { method: 'GET' },
      true,
      true
    );
  },

  async getById(id: string): Promise<Vehicle> {
    return apiRequest<unknown, Vehicle>(`vehicles/${id}`, { method: 'GET' }, true, true);
  },
};
