import type {
  RequestPasswordResetOTPBody,
  VerifyPasswordResetOTPBody,
  ResetPasswordWithOTPBody,
} from '@/types/auth';
import { apiRequest } from '@/utils/api';

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
};
