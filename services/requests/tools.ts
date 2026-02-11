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
    status?: string
  ): Promise<ToolRequestList> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search_query', search);
    if (toolType) params.append('tool_type_id', toolType);
    if (status) params.append('status', status);
    return apiRequest<unknown, ToolRequestList>(
      `tool-requests/?${params.toString()}`,
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

  async listTypes(): Promise<Type[]> {
    return apiRequest<unknown, Type[]>('types/tool', { method: 'GET' }, true, true);
  },
};
