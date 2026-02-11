import type {
    ToolRequest,
    ToolRequestCreate,
    ToolRequestList,
} from '@/types/requests/tools';
import type { Type } from '@/types/types';
import { apiRequest } from '@/utils/api';

export const toolRequestsService = {
  async list(
    page = 1,
    limit = 20,
    search?: string,
    toolType?: string,
    status?: string,
    startDate?: string,
    endDate?: string
  ): Promise<ToolRequestList> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search_query', search);
    if (toolType) params.append('tool_type_id', toolType);
    if (status) params.append('status', status);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return apiRequest<unknown, ToolRequestList>(
      `tool-requests/?${params.toString()}`,
      { method: 'GET' },
      true,
      true
    );
  },

  async getById(id: string): Promise<ToolRequest> {
    return apiRequest<unknown, ToolRequest>(
      `tool-requests/${id}`,
      { method: 'GET' },
      true,
      true
    );
  },

  async create(data: ToolRequestCreate): Promise<ToolRequest> {
    return apiRequest<ToolRequestCreate, ToolRequest>(
      'tool-requests/',
      { method: 'POST', data },
      true,
      true
    );
  },

  async returnTool(
    requestId: string,
    returnedQuantity: number,
    message?: string
  ): Promise<ToolRequest> {
    return apiRequest<
      { returned_quantity: number; message?: string },
      ToolRequest
    >(
      `tool-requests/${requestId}/return`,
      {
        method: 'POST',
        data: { returned_quantity: returnedQuantity, message },
      },
      true,
      true
    );
  },

  async listTypes(): Promise<Type[]> {
    return apiRequest<unknown, Type[]>('types/tool', { method: 'GET' }, true, true);
  },
};
