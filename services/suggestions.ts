import type { Suggestion, SuggestionCreate, SuggestionList } from '@/types/suggestions';
import type { Type } from '@/types/types';
import { apiRequest } from '@/utils/api';

export const suggestionsService = {
  async list(
    page = 1,
    limit = 20,
    search?: string,
    status?: string
  ): Promise<SuggestionList> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    return apiRequest<unknown, SuggestionList>(
      `suggestions/?${params.toString()}`,
      { method: 'GET' },
      true,
      true
    );
  },

  async create(data: SuggestionCreate): Promise<Suggestion> {
    return apiRequest<SuggestionCreate, Suggestion>(
      'suggestions/',
      { method: 'POST', data },
      true,
      true
    );
  },

  async listTypes(): Promise<Type[]> {
    return apiRequest<unknown, Type[]>('types/suggestion', { method: 'GET' }, true, true);
  },
};
