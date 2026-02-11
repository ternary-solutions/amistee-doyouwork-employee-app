import { AlphabetIndex } from '@/components/contacts/AlphabetIndex';
import { ListCard } from '@/components/ui/ListCard';
import { EmptyState } from '@/components/ui/EmptyState';
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
import { typesService } from '@/services/types';
import { usersService } from '@/services/users';
import { useMainStore } from '@/store/main';
import type { Type } from '@/types/types';
import type { User } from '@/types/users';
import { getErrorMessage } from '@/utils/errorMessage';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

function groupUsersByLetter(users: User[]): { letter: string; data: User[] }[] {
  const sorted = [...users].sort((a, b) => {
    const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
    const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
    return nameA.localeCompare(nameB);
  });
  const grouped: Record<string, User[]> = {};
  for (const user of sorted) {
    const letter = (user.first_name?.[0] || '?').toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(user);
  }
  return Object.keys(grouped)
    .sort()
    .map((letter) => ({ letter, data: grouped[letter]! }));
}

export default function ContactsListScreen() {
  const router = useRouter();
  const me = useMainStore((s) => s.me);
  const [users, setUsers] = useState<User[]>([]);
  const [types, setTypes] = useState<Type[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery.trim(), 400);
  const sectionListRef = useRef<SectionList | null>(null);

  const locationId = me?.location_id || undefined;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, typesRes] = await Promise.all([
        usersService.list(
          1,
          100,
          undefined,
          debouncedSearch || undefined,
          typeFilter || undefined,
          locationId
        ),
        typesService.list('user').catch(() => []),
      ]);
      setUsers(usersRes?.items ?? []);
      setTypes(typesRes ?? []);
    } catch (error) {
      console.error('Failed to load contacts', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to load contacts. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, typeFilter, locationId]);

  useEffect(() => {
    load();
  }, [load]);

  const sections = useMemo(() => groupUsersByLetter(users), [users]);
  const letters = useMemo(() => sections.map((s) => s.letter), [sections]);

  const handleJumpToLetter = useCallback((letter: string) => {
    const index = sections.findIndex((s) => s.letter === letter);
    if (index >= 0 && sectionListRef.current) {
      sectionListRef.current.scrollToLocation({
        sectionIndex: index,
        itemIndex: 0,
        viewPosition: 0,
      });
    }
  }, [sections]);

  const renderHeader = () => (
    <View style={styles.header}>
      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search contacts..."
        placeholderTextColor={mutedForeground}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {types.length > 0 && (
        <View style={styles.typeFilterRow}>
          <Pressable
            style={[styles.typeChip, !typeFilter && styles.typeChipActive]}
            onPress={() => setTypeFilter('')}
          >
            <Text style={[styles.typeChipText, !typeFilter && styles.typeChipTextActive]}>
              All
            </Text>
          </Pressable>
          {types.map((t) => (
            <Pressable
              key={t.id}
              style={[styles.typeChip, typeFilter === t.id && styles.typeChipActive]}
              onPress={() => setTypeFilter(typeFilter === t.id ? '' : t.id)}
            >
              <Text style={[styles.typeChipText, typeFilter === t.id && styles.typeChipTextActive]}>
                {t.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );

  const renderSectionHeader = ({ section }: { section: { letter: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.letter}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.cardWrap}>
      <ListCard
        title={[item.first_name, item.last_name].filter(Boolean).join(' ') || 'Contact'}
        meta={[item.email, item.phone_number].filter(Boolean)}
        onPress={() => router.push(`/(app)/contacts/${item.id}`)}
      />
    </View>
  );

  if (loading && users.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: background }]}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <SectionList
        ref={sectionListRef}
        sections={sections}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<EmptyState message="No contacts found." icon="people-outline" />}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        stickySectionHeadersEnabled
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={primary} />
        }
      />
      <AlphabetIndex letters={letters} onJump={handleJumpToLetter} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: spacing.base, paddingBottom: spacing.sm },
  searchInput: {
    borderWidth: 1,
    borderColor: border,
    borderRadius: radius.base,
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    fontSize: 16,
    color: foreground,
    backgroundColor: card,
    marginBottom: spacing.sm,
  },
  typeFilterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: card,
    borderWidth: 1,
    borderColor: border,
  },
  typeChipActive: { backgroundColor: primary, borderColor: primary },
  typeChipText: { fontSize: 14, color: foreground },
  typeChipTextActive: { color: '#fff', fontWeight: '600' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl },
  sectionHeader: {
    backgroundColor: card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: border,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: mutedForeground,
  },
  cardWrap: { marginBottom: spacing.md },
});
