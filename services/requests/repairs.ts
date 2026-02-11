import type {
  RepairRequest,
  RepairRequestCreate,
  RepairRequestList,
} from '@/types/requests/repairs';
import { apiRequest } from '@/utils/api';

export const repairRequestsService = {
  async list(page = 1, limit = 20, vehicleId?: string): Promise<RepairRequestList> {
    const query = vehicleId
      ? `vehicle_id=${vehicleId}&page=${page}&limit=${limit}`
      : `page=${page}&limit=${limit}`;
    return apiRequest<unknown, RepairRequestList>(
      `repair-requests/?${query}`,
      { method: 'GET' },
      true,
      true
    );
  },

  async getById(id: string): Promise<RepairRequest> {
    return apiRequest<unknown, RepairRequest>(
      `repair-requests/${id}`,
      { method: 'GET' },
      true,
      true
    );
  },

  async create(data: RepairRequestCreate): Promise<RepairRequest> {
    return apiRequest<RepairRequestCreate, RepairRequest>(
      'repair-requests/',
      { method: 'POST', data },
      true,
      true
    );
  },
};
