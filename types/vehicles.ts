import type { LocationInfo } from '@/types/locations';

export interface VehicleType {
  id: string;
  name: string;
  description: string | null;
}

export interface Vehicle {
  id: string;
  location: LocationInfo;
  vehicle_type: VehicleType;
  vehicle_name: string;
  license_plate: string;
  vin: string;
  status?: boolean | null;
  photo_url: string | null;
  /** Insurance document URL (from backend) */
  insurance_doc?: string | null;
  /** Registration document URL (from backend) */
  registration_doc?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleList {
  items: Vehicle[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
