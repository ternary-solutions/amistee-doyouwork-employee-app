import type { PartnerCompany, PartnerCompanyList } from '@/types/partnerCompanies';
import type { Type } from '@/types/types';
import { apiRequest } from '@/utils/api';

export const partnerCompaniesService = {
  async list(
    page = 1,
    limit = 20,
    search?: string,
    category_name?: string
  ): Promise<PartnerCompanyList> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);
    if (category_name) params.append('category_name', category_name);
    return apiRequest<unknown, PartnerCompanyList>(
      `partner-companies/?${params.toString()}`,
      { method: 'GET' },
      true,
      true
    );
  },

  async getById(id: string): Promise<PartnerCompany> {
    return apiRequest<unknown, PartnerCompany>(
      `partner-companies/${id}`,
      { method: 'GET' },
      true,
      true
    );
  },

  async listCategories(): Promise<Type[]> {
    return apiRequest<unknown, Type[]>(
      'types/referral-category',
      { method: 'GET' },
      true,
      true
    );
  },
};
