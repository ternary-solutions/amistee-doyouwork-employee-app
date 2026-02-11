export type ReferralStatus = 'New' | 'Contacted' | 'Qualified' | 'Closed';

export interface Referral {
  id: string;
  user: { id: string; first_name: string; last_name: string | null; email: string };
  category: { id: string; name: string; description: string | null };
  company_name: string;
  phone_number: string;
  details: string;
  status: ReferralStatus;
  created_at: string;
  updated_at: string;
}

export interface ReferralList {
  items: Referral[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ReferralCreate {
  category_id: string;
  company_name?: string;
  phone_number: string;
  details: string;
  location?: string;
}
