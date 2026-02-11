import type { UserInfo } from '@/types/users';

export interface ExpenseTypeInfo {
  id: string;
  name: string;
  description: string | null;
}

export type ExpenseStatus = 'Pending' | 'Approved' | 'Denied' | 'Reimbursed';

export interface Expense {
  id: string;
  user: UserInfo;
  expense_type: ExpenseTypeInfo;
  expense_date: string;
  amount: string;
  details: string | null;
  status: ExpenseStatus;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseList {
  items: Expense[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ExpenseCreate {
  expense_type_id: string;
  expense_date: string;
  amount: number | string;
  details: string;
  attachment_url?: string;
}

export interface ExpenseComment {
  id: string;
  expense_id: string;
  user: { id: string; first_name: string; last_name: string | null; email: string };
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCommentCreate {
  comment: string;
}
