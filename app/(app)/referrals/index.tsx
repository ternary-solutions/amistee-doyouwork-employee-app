import {
  background,
  border,
  foreground,
  mutedForeground,
  primary,
  radius,
  spacing,
} from '@/constants/theme';
import { partnerCompaniesService } from '@/services/partnerCompanies';
import type { PartnerCompany } from '@/types/partnerCompanies';
import * as Clipboard from 'expo-clipboard';
import { useSetHeaderOptions } from '@/contexts/HeaderOptionsContext';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ListCard } from '@/components/ui/ListCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonListCard } from '@/components/ui/Skeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getErrorMessage } from '@/utils/errorMessage';
import { Alert } from 'react-native';

function getPartnerMessage(item: PartnerCompany): string {
  const parts = [
    item.name,
    item.phone_number,
    item.location,
    item.email,
    item.details,
  ].filter(Boolean);
  return parts.join(' • ');
}

export default function ReferralsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<PartnerCompany[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const debouncedSearch = useDebouncedValue(searchQuery.trim(), 400);

  useSetHeaderOptions(
    useMemo(
      () => ({ title: 'Partner Companies', showBack: false }),
      [],
    ),
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, catRes] = await Promise.all([
        partnerCompaniesService.list(
          1,
          50,
          debouncedSearch || undefined,
          categoryFilter || undefined
        ),
        partnerCompaniesService.listCategories().catch(() => []),
      ]);
      setItems(listRes?.items ?? []);
      setCategories(catRes?.map((c) => ({ id: c.id, name: c.name })) ?? []);
    } catch (error) {
      console.error('Failed to load partner companies', error);
      Alert.alert(
        'Error',
        getErrorMessage(error, 'Failed to load partner companies. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, categoryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const sharePartner = useCallback((item: PartnerCompany) => {
    const message = getPartnerMessage(item);
    Share.share({ message, title: 'Partner company details' }).catch(() => {});
  }, []);

  const copyPartner = useCallback(async (item: PartnerCompany) => {
    await Clipboard.setStringAsync(getPartnerMessage(item));
  }, []);

  const renderHeader = () => (
    <View style={styles.header}>
      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search partner companies..."
        placeholderTextColor={mutedForeground}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {categories.length > 0 && items.length > 0 ? (
        <View style={styles.chipsWrap}>
          <Text style={styles.chipsLabel}>Category</Text>
          <View style={styles.chipsRow}>
            <Pressable
              style={[styles.chip, !categoryFilter && styles.chipActive]}
              onPress={() => setCategoryFilter('')}
            >
              <Text style={[styles.chipText, !categoryFilter && styles.chipTextActive]}>
                All
              </Text>
            </Pressable>
            {categories.map((c) => (
              <Pressable
                key={c.id}
                style={[styles.chip, categoryFilter === c.name && styles.chipActive]}
                onPress={() => setCategoryFilter(categoryFilter === c.name ? '' : c.name)}
              >
                <Text
                  style={[
                    styles.chipText,
                    categoryFilter === c.name && styles.chipTextActive,
                  ]}
                >
                  {c.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );

  if (loading && items.length === 0) {
    return (
      <View style={[styles.skeletonContainer, { paddingBottom: spacing.xl + insets.bottom }]}>
        <View style={styles.header}>
          <View style={[styles.searchInput, { height: 44, backgroundColor: border }]} />
        </View>
        <View style={styles.skeletonWrap}>
          <SkeletonListCard />
          <SkeletonListCard />
          <SkeletonListCard />
          <SkeletonListCard />
          <SkeletonListCard />
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(p) => p.id}
      style={{ backgroundColor: background }}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={[styles.list, { paddingBottom: spacing.xl + insets.bottom }]}
      ListEmptyComponent={
        <EmptyState
          message="No partner companies found."
          icon="business-outline"
        />
      }
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor={primary} />
      }
      renderItem={({ item }) => (
        <View style={styles.cardWrap}>
          <ListCard
            title={item.name}
            meta={[
              [item.category?.name, item.phone_number, item.location]
                .filter(Boolean)
                .join(' · ') || '—',
            ]}
            onPress={() => router.push(`/(app)/referrals/${item.id}`)}
          >
            {item.details ? (
              <Text style={styles.details} numberOfLines={2}>
                {item.details}
              </Text>
            ) : null}
            <View style={styles.actionRow}>
              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
                onPress={() => sharePartner(item)}
                accessibilityLabel="Share partner details"
                accessibilityRole="button"
              >
                <Text style={styles.actionBtnText}>Share</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
                onPress={() => copyPartner(item)}
                accessibilityLabel="Copy partner details"
                accessibilityRole="button"
              >
                <Text style={styles.actionBtnText}>Copy</Text>
              </Pressable>
            </View>
          </ListCard>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  skeletonContainer: { flex: 1, backgroundColor: background },
  skeletonWrap: { padding: spacing.base },
  header: { paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.md },
  searchInput: {
    borderWidth: 1,
    borderColor: border,
    borderRadius: radius.base,
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    fontSize: 16,
    color: foreground,
    backgroundColor: 'transparent',
    marginBottom: spacing.sm,
  },
  chipsWrap: { marginBottom: spacing.sm },
  chipsLabel: { fontSize: 12, fontWeight: '600', color: mutedForeground, marginBottom: 6 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: border,
  },
  chipActive: { backgroundColor: primary, borderColor: primary },
  chipText: { fontSize: 14, color: foreground },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  list: { paddingHorizontal: spacing.base },
  cardWrap: { marginBottom: spacing.md },
  details: { fontSize: 13, color: mutedForeground, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: spacing.base,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: primary },
});
