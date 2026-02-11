import { useRouter } from 'expo-router';
import { useMainStore } from '@/store/main';
import { logout } from '@/utils/api';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface PlaceholderScreenProps {
  title: string;
}

export function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  const router = useRouter();
  const me = useMainStore((state) => state.me);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Screen coming soon</Text>
      {me ? (
        <Text style={styles.user}>Logged in as {me.email}</Text>
      ) : null}
      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
  },
  user: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  logoutBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
