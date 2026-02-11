import type { User } from '@/types/users';

export type RefreshTokenResponse = {
  access_token: string;
  token_type: 'bearer';
};

export type ApiRequestOptions<T> = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: T | FormData;
  headers?: Record<string, string | undefined>;
};

export interface Login {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  user: User;
}

export interface LoginBody {
  email?: string;
  phone_number?: string;
  password: string;
}

export interface PasswordResetRequestBody {
  email: string;
}

export interface RequestPasswordResetOTPBody {
  email?: string;
  phone_number?: string;
}

export interface VerifyPasswordResetOTPBody {
  email?: string;
  phone_number?: string;
  code: string;
}

export interface ResetPasswordWithOTPBody {
  email?: string;
  phone_number?: string;
  code: string;
  new_password: string;
  confirm_password: string;
}
