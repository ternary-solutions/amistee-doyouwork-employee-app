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
} from '@/constants/theme';
import { useMainStore } from '@/store/main';
import { fetchMe, login } from '@/utils/api';
import { tokenStorage } from '@/utils/tokenStorage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
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

export default function LoginScreen() {
  const router = useRouter();
  const me = useMainStore((state) => state.me);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await tokenStorage.getAccessToken();
      if (token) {
        try {
          await fetchMe();
          router.replace('/(app)/dashboard');
        } catch (err) {
          console.error('[Login] Token validation failed:', err);
          await tokenStorage.clearAll();
        }
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  const canSubmit = identifier.length > 0 && password.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await login(identifier, password);
      router.replace('/(app)/dashboard');
    } catch (err: unknown) {
      const res = err as { data?: { detail?: string }; message?: string };
      const errorMessage =
        res?.data?.detail ||
        res?.message ||
        'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingAuth) {
    return (
      <LinearGradient
        colors={[primaryDark, primary]}
        style={styles.gradient}
      >
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryForeground} />
        </View>
      </LinearGradient>
    );
  }

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
            <View style={styles.logoWrap}>
              <Image
                source={require('../../assets/images/doyouwork-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.card}>
              <Text style={styles.brandTitle}>Amistee</Text>
            <Text style={styles.title}>Amistee Employee</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

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
              onPress={() => router.push('/(auth)/forgot-password')}
              style={({ pressed }) => [styles.forgotLink, pressed && { opacity: 0.8 }]}
              accessibilityLabel="Forgot password?"
              accessibilityRole="link"
            >
              <Text style={styles.forgotLinkText}>Forgot password?</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                (!canSubmit || submitting) && styles.buttonDisabled,
                canSubmit && !submitting && pressed && { opacity: 0.8 },
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit || submitting}
              accessibilityLabel="Sign in"
              accessibilityRole="button"
            >
              {submitting ? (
                <ActivityIndicator color={primaryForeground} />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.base,
    paddingVertical: 48,
  },
  logoWrap: {
    alignItems: 'center',
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
    width: '100%',
    alignSelf: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: foreground,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: mutedForeground,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.lg,
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
  errorText: {
    fontSize: 14,
    color: destructive,
    marginBottom: spacing.sm,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: spacing.base,
  },
  forgotLinkText: {
    fontSize: 14,
    color: primary,
  },
  button: {
    backgroundColor: primary,
    borderRadius: radius.base,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
});
