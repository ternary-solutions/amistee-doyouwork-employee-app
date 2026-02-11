export interface Location {
  id: string;
  tenant_id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface LocationList {
  items: Location[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface LocationCreate {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
}

export interface LocationUpdate {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
}

export interface LocationInfo {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}
