import { background, foreground, mutedForeground, primary } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * Branded 404 screen for unmatched routes.
 */
export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>404</Text>
      <Text style={styles.message}>Page not found</Text>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => router.replace('/(app)/dashboard')}
      >
        <Text style={styles.buttonText}>Return to Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: foreground,
    marginBottom: 12,
  },
  message: {
    fontSize: 18,
    color: mutedForeground,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: primary,
    borderRadius: 8,
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
