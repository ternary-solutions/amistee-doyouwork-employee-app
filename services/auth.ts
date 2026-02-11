import type {
  RequestPasswordResetOTPBody,
  VerifyPasswordResetOTPBody,
  ResetPasswordWithOTPBody,
} from '@/types/auth';
import type { User } from '@/types/users';
import { apiRequest } from '@/utils/api';

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  user: User;
};

type RequestPasswordResetOTP = { message: string };
type VerifyPasswordResetOTP = { message: string };
type ResetPasswordWithOTP = { message: string };

export const authService = {
  async requestPasswordResetOTP(
    data: RequestPasswordResetOTPBody
  ): Promise<RequestPasswordResetOTP> {
    return apiRequest<RequestPasswordResetOTPBody, RequestPasswordResetOTP>(
      'auth/forgot-password/request-otp',
      { method: 'POST', data },
      false,
      true
    );
  },

  async verifyPasswordResetOTP(
    data: VerifyPasswordResetOTPBody
  ): Promise<VerifyPasswordResetOTP> {
    return apiRequest<VerifyPasswordResetOTPBody, VerifyPasswordResetOTP>(
      'auth/forgot-password/verify-otp',
      { method: 'POST', data },
      false,
      true
    );
  },

  async resetPasswordWithOTP(
    data: ResetPasswordWithOTPBody
  ): Promise<ResetPasswordWithOTP> {
    return apiRequest<ResetPasswordWithOTPBody, ResetPasswordWithOTP>(
      'auth/forgot-password/reset',
      { method: 'POST', data },
      false,
      true
    );
  },

  async requestEmployeeLoginOTP(phoneNumber: string): Promise<{ message: string }> {
    return apiRequest<{ phone_number: string }, { message: string }>(
      'auth/employee-login/request-otp',
      { method: 'POST', data: { phone_number: phoneNumber } },
      false,
      true
    );
  },

  async verifyEmployeeLoginOTP(
    phoneNumber: string,
    code: string
  ): Promise<AuthResponse> {
    return apiRequest<
      { phone_number: string; code: string },
      AuthResponse
    >(
      'auth/employee-login/verify-otp',
      { method: 'POST', data: { phone_number: phoneNumber, code } },
      false,
      true
    );
  },
};
