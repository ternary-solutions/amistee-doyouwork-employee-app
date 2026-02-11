import type { User } from '@/types/users';

export interface ToolTypeInfo {
  id: string;
  name: string;
  description: string | null;
}

export interface ToolInfo {
  id: string;
  tool_name: string;
  is_returnable: boolean;
  total_stock: number;
}

export interface ToolRequestLineItem {
  id: string;
  tool: ToolInfo | null;
  tool_type: ToolTypeInfo | null;
  quantity: number;
  fulfilled_quantity: number;
  returned_quantity?: number;
  expected_return_date?: string | null;
  checked_out_at?: string | null;
  returned_at?: string | null;
}

export type ToolRequestStatus =
  | 'Pending'
  | 'Approved'
  | 'Denied'
  | 'CheckedOut'
  | 'Returned';

export interface ToolRequest {
  id: string;
  user: User;
  items?: ToolRequestLineItem[];
  tool: ToolInfo | null;
  tool_type: ToolTypeInfo | null;
  quantity: number | null;
  fulfilled_quantity: number;
  returned_quantity: number | null;
  pickup_date: string | null;
  message: string | null;
  status: ToolRequestStatus;
  expected_return_date: string | null;
  condition_on_return: string | null;
  inspection_notes: string | null;
  checked_out_at: string | null;
  returned_at: string | null;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

export interface ToolRequestList {
  items: ToolRequest[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ToolRequestItem {
  tool_id: string;
  quantity: number;
}

export interface ToolRequestCreate {
  items: ToolRequestItem[];
  pickup_date: string;
  message?: string;
}
