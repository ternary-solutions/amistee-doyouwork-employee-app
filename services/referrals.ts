import type { Referral, ReferralCreate, ReferralList } from '@/types/referrals';
import type { Type } from '@/types/types';
import { apiRequest } from '@/utils/api';

export const referralsService = {
  async list(
    page = 1,
    limit = 20,
    search?: string,
    status?: string
  ): Promise<ReferralList> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    return apiRequest<unknown, ReferralList>(
      `referrals/?${params.toString()}`,
      { method: 'GET' },
      true,
      true
    );
  },

  async create(data: ReferralCreate): Promise<Referral> {
    return apiRequest<ReferralCreate, Referral>(
      'referrals/',
      { method: 'POST', data },
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

  /** Alias for listCategories - matches Ionic service API */
  async listTypes(): Promise<Type[]> {
    return this.listCategories();
  },
};
