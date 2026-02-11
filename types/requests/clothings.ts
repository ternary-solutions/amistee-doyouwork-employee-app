import type { User } from '@/types/users';

export type ClothingStatus = 'Pending' | 'Approved' | 'Denied' | 'Completed';
export type ClothingSize =
  | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL'
  | 'One Size' | '30x30' | '32x32' | '34x32' | '36x32';

export interface ClothingRequest {
  id: string;
  user: User;
  clothing_type_id: string;
  clothing_type_name?: string;
  quantity: number;
  size: ClothingSize;
  reason: string | null;
  status: ClothingStatus;
  created_at: string;
  updated_at: string;
}

export interface ClothingRequestList {
  items: ClothingRequest[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ClothingRequestCreate {
  clothing_type_id: string;
  quantity: number;
  size: ClothingSize;
  reason?: string;
}
