import {
  border,
  card,
  foreground,
  mutedForeground,
  primary,
  radius,
  spacing,
  typography,
} from '@/constants/theme';
import { usersService } from '@/services/users';
import type { User } from '@/types/users';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function ContactsListScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await usersService.list(1, 50);
      setUsers(res?.items ?? []);
    } catch (error) {
      console.error('Failed to load contacts', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && users.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (users.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No contacts.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(u) => u.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => router.push(`/(app)/contacts/${item.id}`)}
        >
          <Text style={styles.cardTitle}>
            {[item.first_name, item.last_name].filter(Boolean).join(' ')}
          </Text>
          <Text style={styles.meta}>{item.email}</Text>
          <Text style={styles.meta}>{item.phone_number}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  emptyText: { fontSize: 15, color: mutedForeground },
  list: { padding: spacing.base, paddingBottom: spacing.xl },
  card: {
    backgroundColor: card,
    borderRadius: radius.base,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: border,
  },
  cardTitle: { ...typography.title, color: foreground, marginBottom: 4 },
  meta: { fontSize: 13, color: mutedForeground, marginBottom: 2 },
});
