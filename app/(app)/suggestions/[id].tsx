import {
  background,
  border,
  card,
  foreground,
  mutedForeground,
  primary,
  radius,
  spacing,
  success,
  typography,
  warning,
} from '@/constants/theme';
import { suggestionsService } from '@/services/suggestions';
import type { Suggestion } from '@/types/suggestions';
import { getErrorMessage } from '@/utils/errorMessage';
import { useSetHeaderOptions } from '@/contexts/HeaderOptionsContext';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_COLORS: Record<string, string> = {
  Open: primary,
  'In Review': warning,
  Implemented: success,
  Closed: mutedForeground,
};

export default function SuggestionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await suggestionsService.getById(id);
      setSuggestion(data);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to load suggestion. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useSetHeaderOptions(
    useMemo(
      () => ({ title: 'Suggestion', showBack: true }),
      [],
    ),
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (!suggestion) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Suggestion not found.</Text>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[suggestion.status] ?? mutedForeground;

  return (
    <ScrollView
      style={{ backgroundColor: background }}
      contentContainerStyle={[styles.container, { paddingBottom: spacing.xl + insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{suggestion.title}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{suggestion.status}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type</Text>
          <Text style={styles.detailValue}>{suggestion.suggestion_type?.name ?? '—'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Details</Text>
          <Text style={styles.detailValue}>{suggestion.details}</Text>
        </View>

        <Text style={styles.meta}>
          Submitted {new Date(suggestion.created_at).toLocaleDateString()}
          {suggestion.updated_at !== suggestion.created_at && (
            <> · Updated {new Date(suggestion.updated_at).toLocaleDateString()}</>
          )}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.base },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: card,
    borderRadius: radius.base,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: { ...typography.sectionTitle, fontSize: 20, color: foreground, flex: 1, marginRight: spacing.sm },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  detailRow: { marginBottom: spacing.base },
  detailLabel: { fontSize: 12, fontWeight: '600', color: mutedForeground, marginBottom: 4 },
  detailValue: { fontSize: 15, color: foreground },
  meta: { fontSize: 13, color: mutedForeground, marginTop: spacing.base },
  errorText: { fontSize: 16, color: '#ef4444' },
});
