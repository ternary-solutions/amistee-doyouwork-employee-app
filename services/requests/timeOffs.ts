import type {
  TimeOffRequest,
  TimeOffRequestCreate,
  TimeOffRequestList,
} from '@/types/requests/timeOffs';
import { apiRequest } from '@/utils/api';

export const timeOffRequestsService = {
  async list(
    page = 1,
    limit = 20,
    status?: string
  ): Promise<TimeOffRequestList> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append('status', status);
    return apiRequest<unknown, TimeOffRequestList>(
      `time-off-requests/?${params.toString()}`,
      { method: 'GET' },
      true,
      true
    );
  },

  async create(data: TimeOffRequestCreate): Promise<TimeOffRequest> {
    return apiRequest<TimeOffRequestCreate, TimeOffRequest>(
      'time-off-requests/',
      { method: 'POST', data },
      true,
      true
    );
  },
};
