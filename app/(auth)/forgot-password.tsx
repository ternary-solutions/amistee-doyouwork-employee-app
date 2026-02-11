import {
    border,
    card,
    destructive,
    foreground,
    muted,
    mutedForeground,
    primary,
    primaryDark,
    primaryForeground,
    radius,
    spacing,
    typography,
} from '@/constants/theme';
import { authService } from '@/services/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Step = 'request' | 'verify' | 'reset';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [useEmail, setUseEmail] = useState(true);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const handleRequestOTP = async () => {
    setIsLoading(true);
    setError('');
    try {
      const identifier = useEmail ? { email } : { phone_number: phoneNumber };
      await authService.requestPasswordResetOTP(identifier);
      setStep('verify');
      setResendCooldown(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setError('');
    try {
      const identifier = useEmail ? { email } : { phone_number: phoneNumber };
      await authService.requestPasswordResetOTP(identifier);
      setResendCooldown(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const identifier = useEmail ? { email } : { phone_number: phoneNumber };
      await authService.verifyPasswordResetOTP({ ...identifier, code: otpCode });
      setStep('reset');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const identifier = useEmail ? { email } : { phone_number: phoneNumber };
      await authService.resetPasswordWithOTP({
        ...identifier,
        code: otpCode,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      router.replace('/(auth)/login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={[primaryDark, primary]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backLink, pressed && { opacity: 0.8 }]}
              accessibilityLabel="Back to login"
              accessibilityRole="link"
            >
              <Text style={styles.backLinkText}>← Back to login</Text>
            </Pressable>

          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {step === 'request' &&
              'Enter your email or phone number to receive a verification code'}
            {step === 'verify' &&
              'Enter the 6-digit code sent to your email or phone'}
            {step === 'reset' && 'Enter your new password'}
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {step === 'request' && (
            <>
              <View style={styles.toggleRow}>
                <Pressable
                  style={[styles.toggleBtn, useEmail && styles.toggleBtnActive]}
                  onPress={() => setUseEmail(true)}
                  accessibilityLabel="Use email"
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      useEmail && styles.toggleBtnTextActive,
                    ]}
                  >
                    Email
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.toggleBtn, !useEmail && styles.toggleBtnActive]}
                  onPress={() => setUseEmail(false)}
                  accessibilityLabel="Use phone number"
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      !useEmail && styles.toggleBtnTextActive,
                    ]}
                  >
                    Phone
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.label}>
                {useEmail ? 'Email' : 'Phone Number'}
              </Text>
              <TextInput
                style={styles.input}
                value={useEmail ? email : phoneNumber}
                onChangeText={useEmail ? setEmail : setPhoneNumber}
                placeholder={
                  useEmail ? 'your.email@example.com' : '+1234567890'
                }
                placeholderTextColor={mutedForeground}
                keyboardType={useEmail ? 'email-address' : 'phone-pad'}
                autoCapitalize="none"
              />
              <Pressable
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleRequestOTP}
                disabled={isLoading}
                accessibilityLabel="Send verification code"
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Sending...' : 'Send Verification Code'}
                </Text>
              </Pressable>
            </>
          )}

          {step === 'verify' && (
            <>
              <Text style={styles.label}>Verification Code</Text>
              <TextInput
                style={styles.input}
                value={otpCode}
                onChangeText={setOtpCode}
                placeholder="000000"
                placeholderTextColor={mutedForeground}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Text style={styles.hint}>
                Code sent to {useEmail ? email : phoneNumber}
              </Text>
              <View style={styles.row}>
                <Pressable
                  style={[styles.button, styles.buttonOutline]}
                  onPress={() => setStep('request')}
                  disabled={isLoading}
                  accessibilityLabel="Back"
                  accessibilityRole="button"
                >
                  <Text style={styles.buttonOutlineText}>Back</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.button,
                    (isLoading || otpCode.length !== 6) && styles.buttonDisabled,
                  ]}
                  onPress={handleVerifyOTP}
                  disabled={isLoading || otpCode.length !== 6}
                  accessibilityLabel="Verify code"
                  accessibilityRole="button"
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Verifying...' : 'Verify'}
                  </Text>
                </Pressable>
              </View>
              <Pressable
                onPress={handleResendOTP}
                disabled={resendCooldown > 0 || isLoading}
                style={styles.resendBtn}
              >
                <Text
                  style={[
                    styles.resendText,
                    (resendCooldown > 0 || isLoading) && styles.resendDisabled,
                  ]}
                >
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : 'Resend verification code'}
                </Text>
              </Pressable>
            </>
          )}

          {step === 'reset' && (
            <>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Min 8 characters"
                placeholderTextColor={mutedForeground}
                secureTextEntry
              />
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                placeholderTextColor={mutedForeground}
                secureTextEntry
              />
              <View style={styles.row}>
                <Pressable
                  style={[styles.button, styles.buttonOutline]}
                  onPress={() => setStep('verify')}
                  disabled={isLoading}
                  accessibilityLabel="Back"
                  accessibilityRole="button"
                >
                  <Text style={styles.buttonOutlineText}>Back</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.button,
                    (isLoading ||
                      newPassword.length < 8 ||
                      newPassword !== confirmPassword) && styles.buttonDisabled,
                  ]}
                  onPress={handleResetPassword}
                  disabled={
                    isLoading ||
                    newPassword.length < 8 ||
                    newPassword !== confirmPassword
                  }
                  accessibilityLabel="Reset password"
                  accessibilityRole="button"
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.base,
    paddingVertical: 48,
  },
  card: {
    backgroundColor: card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  backLink: {
    marginBottom: spacing.base,
  },
  backLinkText: {
    fontSize: 14,
    color: mutedForeground,
  },
  title: {
    ...typography.sectionTitle,
    fontSize: 22,
    color: foreground,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: mutedForeground,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: destructive,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: spacing.base,
    borderRadius: radius.base,
    backgroundColor: muted,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: primary,
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: mutedForeground,
  },
  toggleBtnTextActive: {
    color: primaryForeground,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: foreground,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: border,
    borderRadius: radius.base,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: spacing.base,
    backgroundColor: card,
  },
  hint: {
    fontSize: 13,
    color: mutedForeground,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  button: {
    flex: 1,
    backgroundColor: primary,
    borderRadius: radius.base,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: primary,
  },
  buttonOutlineText: {
    color: primary,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  resendBtn: {
    alignSelf: 'center',
  },
  resendText: {
    fontSize: 14,
    color: primary,
  },
  resendDisabled: {
    color: mutedForeground,
  },
});
