import {
  background,
  border,
  card,
  foreground,
  mutedForeground,
  primary,
  radius,
  spacing,
} from '@/constants/theme';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usersService } from '@/services/users';
import type { User } from '@/types/users';
import { getErrorMessage } from '@/utils/errorMessage';
import { useRouter } from 'expo-router';
import { ListCard } from '@/components/ui/ListCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function ContactsListScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery.trim(), 400);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await usersService.list(1, 50, debouncedSearch || undefined);
      setUsers(res?.items ?? []);
    } catch (error) {
      console.error('Failed to load contacts', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to load contacts. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const renderHeader = () => (
    <View style={styles.searchWrap}>
      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search contacts..."
        placeholderTextColor={mutedForeground}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );

  if (loading && users.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(u) => u.id}
      style={{ backgroundColor: background }}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<EmptyState message="No contacts found." />}
      renderItem={({ item }) => (
        <View style={styles.cardWrap}>
          <ListCard
            title={[item.first_name, item.last_name].filter(Boolean).join(' ') || 'Contact'}
            meta={[item.email, item.phone_number].filter(Boolean)}
            onPress={() => router.push(`/(app)/contacts/${item.id}`)}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchWrap: { paddingHorizontal: spacing.base, paddingBottom: spacing.sm },
  searchInput: {
    borderWidth: 1,
    borderColor: border,
    borderRadius: radius.base,
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    fontSize: 16,
    color: foreground,
    backgroundColor: card,
  },
  list: { padding: spacing.base, paddingBottom: spacing.xl },
  cardWrap: { marginBottom: spacing.md },
});
