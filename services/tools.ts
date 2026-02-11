import type { Tool, ToolList } from '@/types/tools';
import { apiRequest } from '@/utils/api';

export const toolsService = {
  async list(
    page = 1,
    limit = 100,
    search?: string,
    tool_type_id?: string
  ): Promise<ToolList> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) queryParams.append('search', search);
    if (tool_type_id && tool_type_id !== 'all') queryParams.append('tool_type_id', tool_type_id);
    return apiRequest<unknown, ToolList>(
      `tools/?${queryParams.toString()}`,
      { method: 'GET' },
      true,
      true
    );
  },

  async getById(id: string): Promise<Tool> {
    return apiRequest<unknown, Tool>(`tools/${id}`, { method: 'GET' }, true, true);
  },
};
