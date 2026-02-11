import type { User } from '@/types/users';
import { apiRequest } from '@/utils/api';

export interface UserList {
  items: User[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string | null;
  email?: string;
  phone_number?: string;
  date_of_birth?: string | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
}

export const usersService = {
  async list(
    page = 1,
    limit = 20,
    role?: string,
    search?: string,
    user_type_id?: string,
    location_id?: string
  ): Promise<UserList> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (role) params.append('role', role);
    if (search) params.append('search', search);
    if (user_type_id) params.append('user_type_id', user_type_id);
    if (location_id) params.append('location_id', location_id);
    return apiRequest<unknown, UserList>(
      `users/?${params.toString()}`,
      { method: 'GET' },
      true,
      true
    );
  },

  async getById(id: string): Promise<User> {
    return apiRequest<unknown, User>(`users/${id}`, { method: 'GET' }, true, true);
  },

  async update(id: string, data: UserUpdate): Promise<User> {
    return apiRequest<UserUpdate, User>(`users/${id}`, { method: 'PATCH', data }, true, true);
  },

  async updatePhoto(id: string, formData: FormData): Promise<User> {
    return apiRequest<FormData, User>(`users/${id}/photo`, { method: 'PUT', data: formData }, true, true);
  },
};
