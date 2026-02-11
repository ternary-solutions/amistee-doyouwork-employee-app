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
  status: boolean;
  photo_url: string | null;
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
