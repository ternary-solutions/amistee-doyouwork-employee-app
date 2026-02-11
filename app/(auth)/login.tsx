import {
  border,
  card,
  destructive,
  foreground,
  mutedForeground,
  primary,
  primaryDark,
  primaryForeground,
  radius,
  spacing,
  typography,
} from "@/constants/theme";
import { authService } from "@/services/auth";
import { fetchMe, login, loginWithOTP } from "@/utils/api";
import { tokenStorage } from "@/utils/tokenStorage";
import * as Sentry from "@sentry/react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function normalizePhone(phone: string): string {
  return phone.replace(/\s|-|\(|\)/g, "").trim();
}

export default function LoginScreen() {
  const router = useRouter();
  const [usePhoneLogin, setUsePhoneLogin] = useState(false);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const startCooldown = useCallback(() => {
    setCooldownRemaining(60);
  }, []);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const t = setTimeout(() => setCooldownRemaining((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldownRemaining]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await tokenStorage.getAccessToken();
      if (token) {
        try {
          await fetchMe();
          router.replace("/(app)/dashboard");
        } catch (err) {
          console.error("[Login] Token validation failed:", err);
          await tokenStorage.clearAll();
        }
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  const canSubmitEmail = identifier.length > 0 && password.length > 0;

  const canRequestOtp = !usePhoneLogin
    ? false
    : normalizePhone(phone).length >= 10 && cooldownRemaining === 0;
  const canVerifyOtp = usePhoneLogin && otpSent && otpCode.length === 6;

  const handleEmailSubmit = async () => {
    if (!canSubmitEmail || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await login(identifier, password);
      router.replace("/(app)/dashboard");
    } catch (err: unknown) {
      const res = err as { data?: { detail?: string }; message?: string };
      const errorMessage =
        res?.data?.detail ||
        res?.message ||
        "Login failed. Please check your credentials.";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!canRequestOtp || submitting) return;
    const raw = normalizePhone(phone);
    if (raw.length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await authService.requestEmployeeLoginOTP(
        raw.startsWith("+") ? raw : `+${raw}`,
      );
      setOtpSent(true);
      setOtpCode("");
      startCooldown();
    } catch (err: unknown) {
      const res = err as {
        response?: { data?: { detail?: string } };
        message?: string;
      };
      const errorMessage =
        (Array.isArray(res?.response?.data?.detail)
          ? (res.response?.data?.detail as string[])?.[0]
          : res?.response?.data?.detail) ||
        res?.message ||
        "Failed to send code. Please try again.";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!canVerifyOtp || submitting) return;
    const raw = normalizePhone(phone);
    setSubmitting(true);
    setError("");
    try {
      await loginWithOTP(raw.startsWith("+") ? raw : `+${raw}`, otpCode);
      router.replace("/(app)/dashboard");
    } catch (err: unknown) {
      const res = err as {
        response?: { data?: { detail?: string } };
        message?: string;
      };
      const errorMessage =
        (Array.isArray(res?.response?.data?.detail)
          ? (res.response?.data?.detail as string[])?.[0]
          : res?.response?.data?.detail) ||
        res?.message ||
        "Invalid code. Please try again.";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const switchToPhone = () => {
    setUsePhoneLogin(true);
    setError("");
    setIdentifier("");
    setPassword("");
    setOtpSent(false);
    setOtpCode("");
  };

  const switchToEmail = () => {
    setUsePhoneLogin(false);
    setError("");
    setPhone("");
    setOtpSent(false);
    setOtpCode("");
  };

  if (checkingAuth) {
    return (
      <LinearGradient colors={[primaryDark, primary]} style={styles.gradient}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryForeground} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[primaryDark, primary]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoWrap}>
              <Image
                source={require("../../assets/images/doyouwork-logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.card}>
              <Text style={styles.brandTitle}>Amistee</Text>
              <Text style={styles.title}>Amistee Employee</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>

              {!usePhoneLogin ? (
                <>
                  <Button
                    title="Try!"
                    onPress={() => {
                      Sentry.captureException(new Error("First error"));
                    }}
                  />
                  <Text style={styles.label}>Email or Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    value={identifier}
                    onChangeText={setIdentifier}
                    placeholder="your.email@example.com or +1234567890"
                    placeholderTextColor={mutedForeground}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                  />

                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor={mutedForeground}
                    secureTextEntry
                    autoComplete="password"
                  />
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <Pressable
                    onPress={() => router.push("/(auth)/forgot-password")}
                    style={({ pressed }) => [
                      styles.forgotLink,
                      pressed && { opacity: 0.8 },
                    ]}
                    accessibilityLabel="Forgot password?"
                    accessibilityRole="link"
                  >
                    <Text style={styles.forgotLinkText}>Forgot password?</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.button,
                      (!canSubmitEmail || submitting) && styles.buttonDisabled,
                      canSubmitEmail &&
                        !submitting &&
                        pressed && { opacity: 0.8 },
                    ]}
                    onPress={handleEmailSubmit}
                    disabled={!canSubmitEmail || submitting}
                    accessibilityLabel="Sign in"
                    accessibilityRole="button"
                  >
                    {submitting ? (
                      <ActivityIndicator color={primaryForeground} />
                    ) : (
                      <Text style={styles.buttonText}>Sign In</Text>
                    )}
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+1 234 567 8900"
                    placeholderTextColor={mutedForeground}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    editable={!otpSent}
                  />

                  {!otpSent ? (
                    <>
                      {error ? (
                        <Text style={styles.errorText}>{error}</Text>
                      ) : null}
                      <Pressable
                        style={({ pressed }) => [
                          styles.button,
                          (!canRequestOtp || submitting) &&
                            styles.buttonDisabled,
                          canRequestOtp &&
                            !submitting &&
                            pressed && { opacity: 0.8 },
                        ]}
                        onPress={handleRequestOtp}
                        disabled={!canRequestOtp || submitting}
                        accessibilityLabel="Send code"
                        accessibilityRole="button"
                      >
                        {submitting ? (
                          <ActivityIndicator color={primaryForeground} />
                        ) : cooldownRemaining > 0 ? (
                          <Text style={styles.buttonText}>
                            Resend in {cooldownRemaining}s
                          </Text>
                        ) : (
                          <Text style={styles.buttonText}>Send Code</Text>
                        )}
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <Text style={styles.label}>Verification Code</Text>
                      <TextInput
                        style={styles.input}
                        value={otpCode}
                        onChangeText={(t) =>
                          setOtpCode(t.replace(/\D/g, "").slice(0, 6))
                        }
                        placeholder="Enter 6-digit code"
                        placeholderTextColor={mutedForeground}
                        keyboardType="number-pad"
                        maxLength={6}
                        autoFocus
                      />
                      {error ? (
                        <Text style={styles.errorText}>{error}</Text>
                      ) : null}
                      <Pressable
                        style={({ pressed }) => [
                          styles.button,
                          (!canVerifyOtp || submitting) &&
                            styles.buttonDisabled,
                          canVerifyOtp &&
                            !submitting &&
                            pressed && { opacity: 0.8 },
                        ]}
                        onPress={handleVerifyOtp}
                        disabled={!canVerifyOtp || submitting}
                        accessibilityLabel="Verify"
                        accessibilityRole="button"
                      >
                        {submitting ? (
                          <ActivityIndicator color={primaryForeground} />
                        ) : (
                          <Text style={styles.buttonText}>
                            Verify & Sign In
                          </Text>
                        )}
                      </Pressable>
                      <Pressable
                        onPress={handleRequestOtp}
                        disabled={cooldownRemaining > 0 || submitting}
                        style={({ pressed }) => [
                          styles.resendLink,
                          pressed && { opacity: 0.8 },
                          (cooldownRemaining > 0 || submitting) && {
                            opacity: 0.5,
                          },
                        ]}
                      >
                        <Text style={styles.forgotLinkText}>
                          {cooldownRemaining > 0
                            ? `Resend code in ${cooldownRemaining}s`
                            : "Resend code"}
                        </Text>
                      </Pressable>
                    </>
                  )}
                </>
              )}

              <Pressable
                onPress={usePhoneLogin ? switchToEmail : switchToPhone}
                style={({ pressed }) => [
                  styles.switchLink,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.forgotLinkText}>
                  {usePhoneLogin ? "Login with email" : "Login with phone"}
                </Text>
              </Pressable>
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.base,
    paddingVertical: 48,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  logoImage: {
    width: 200,
    height: 96,
  },
  card: {
    backgroundColor: card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: primary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: foreground,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: mutedForeground,
    textAlign: "center",
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
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
  errorText: {
    fontSize: 14,
    color: destructive,
    marginBottom: spacing.sm,
  },
  forgotLink: {
    alignSelf: "flex-end",
    marginBottom: spacing.base,
  },
  resendLink: {
    alignSelf: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.base,
  },
  switchLink: {
    alignSelf: "center",
    marginTop: spacing.base,
  },
  forgotLinkText: {
    fontSize: 14,
    color: primary,
  },
  button: {
    backgroundColor: primary,
    borderRadius: radius.base,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: primaryForeground,
    fontSize: 16,
    fontWeight: "600",
  },
});
