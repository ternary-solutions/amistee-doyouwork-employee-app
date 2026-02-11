export interface ReferralCategoryInfo {
  id: string;
  name: string;
  description?: string;
}

export interface PartnerCompany {
  id: string;
  name: string;
  phone_number?: string;
  location?: string;
  details?: string;
  email?: string;
  category?: ReferralCategoryInfo;
  created_at: string;
  updated_at: string;
}

export interface PartnerCompanyList {
  items: PartnerCompany[];
  total: number;
  page: number;
  limit: number;
  total_pages?: number;
}
