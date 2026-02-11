import {
  foreground,
  mutedForeground,
  primary,
  radius,
  spacing,
  typography,
  destructive,
} from '@/constants/theme';
import { usersService } from '@/services/users';
import type { User } from '@/types/users';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await usersService.getById(id);
      setUser(data);
    } catch (error) {
      console.error('Failed to load contact', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Contact not found.</Text>
      </View>
    );
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{fullName}</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user.email}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>{user.phone_number}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>{user.role}</Text>
      </View>
      {user.address ? (
        <View style={styles.row}>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>{user.address}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.base, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.sectionTitle, fontSize: 22, color: foreground, marginBottom: spacing.base },
  row: { marginBottom: spacing.base },
  label: { ...typography.label, color: mutedForeground, marginBottom: 4 },
  value: { fontSize: 16, color: foreground },
  errorText: { fontSize: 16, color: destructive },
});
