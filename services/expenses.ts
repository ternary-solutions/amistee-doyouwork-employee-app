import type { Expense, ExpenseCreate, ExpenseList } from '@/types/expenses';
import type { Type } from '@/types/types';
import { apiRequest } from '@/utils/api';

export const expensesService = {
  async list(
    page = 1,
    limit = 20,
    search?: string,
    expense_type?: string,
    status?: string
  ): Promise<ExpenseList> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) queryParams.append('search', search);
    if (expense_type) queryParams.append('expense_type', expense_type);
    if (status) queryParams.append('status', status);
    return apiRequest<unknown, ExpenseList>(
      `expenses/?${queryParams.toString()}`,
      { method: 'GET' },
      true,
      true
    );
  },

  async create(data: ExpenseCreate): Promise<Expense> {
    return apiRequest<ExpenseCreate, Expense>('expenses/', { method: 'POST', data }, true, true);
  },

  async listTypes(): Promise<Type[]> {
    return apiRequest<unknown, Type[]>('types/expense', { method: 'GET' }, true, true);
  },
};
