import type { LocationInfo } from '@/types/locations';

export interface SpecializationType {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleLevel {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSpecialization {
  id: string;
  user_id: string;
  specialization_type: SpecializationType;
  role_level: RoleLevel;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  location_id: string | null;
  location: LocationInfo;
  manager_id: string | null;
  user_type_id: string;
  role: UserRole;
  first_name: string;
  last_name: string | null;
  email: string;
  phone_number: string;
  date_of_birth: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  is_active: boolean;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  location_ids: string[];
  specializations: UserSpecialization[];
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface UserInfo {
  id: string;
  email: string;
  first_name: string;
  last_name: string | null;
  role: UserRole;
}
