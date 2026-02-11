import {
  background,
  border,
  card,
  foreground,
  mutedForeground,
  primary,
  radius,
  spacing,
  typography,
} from '@/constants/theme';
import { partnerCompaniesService } from '@/services/partnerCompanies';
import type { PartnerCompany } from '@/types/partnerCompanies';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useSetHeaderOptions } from '@/contexts/HeaderOptionsContext';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getErrorMessage } from '@/utils/errorMessage';

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

export default function PartnerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [partner, setPartner] = useState<PartnerCompany | null>(null);
  const [loading, setLoading] = useState(true);

  useSetHeaderOptions(
    useMemo(
      () => ({ title: 'Partner Company', showBack: true }),
      [],
    ),
  );

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await partnerCompaniesService.getById(id);
      setPartner(data);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to load partner company. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const sharePartner = useCallback(() => {
    if (!partner) return;
    Share.share({ message: getPartnerMessage(partner), title: partner.name }).catch(() => {});
  }, [partner]);

  const copyPartner = useCallback(async () => {
    if (!partner) return;
    await Clipboard.setStringAsync(getPartnerMessage(partner));
  }, [partner]);

  const openPhone = useCallback(() => {
    if (!partner?.phone_number) return;
    const tel = partner.phone_number.replace(/\D/g, '');
    Linking.openURL(`tel:${tel}`).catch(() => {});
  }, [partner?.phone_number]);

  const openEmail = useCallback(() => {
    if (!partner?.email) return;
    Linking.openURL(`mailto:${partner.email}`).catch(() => {});
  }, [partner?.email]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (!partner) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Partner company not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: background }}
      contentContainerStyle={[styles.container, { paddingBottom: spacing.xl + insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{partner.name}</Text>
          {partner.category?.name ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{partner.category.name}</Text>
            </View>
          ) : null}
        </View>

        {partner.details ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Details</Text>
            <Text style={styles.detailValue}>{partner.details}</Text>
          </View>
        ) : null}

        {partner.phone_number ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Pressable
              style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.8 }]}
              onPress={openPhone}
            >
              <Text style={styles.linkText}>{partner.phone_number}</Text>
              <Ionicons name="call-outline" size={18} color={primary} />
            </Pressable>
          </View>
        ) : null}

        {partner.email ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email</Text>
            <Pressable
              style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.8 }]}
              onPress={openEmail}
            >
              <Text style={styles.linkText}>{partner.email}</Text>
              <Ionicons name="mail-outline" size={18} color={primary} />
            </Pressable>
          </View>
        ) : null}

        {partner.location ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{partner.location}</Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
            onPress={sharePartner}
          >
            <Ionicons name="share-outline" size={20} color={primary} />
            <Text style={styles.actionBtnText}>Share</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
            onPress={copyPartner}
          >
            <Ionicons name="copy-outline" size={20} color={primary} />
            <Text style={styles.actionBtnText}>Copy</Text>
          </Pressable>
        </View>
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
    backgroundColor: primary,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  detailRow: { marginBottom: spacing.base },
  detailLabel: { fontSize: 12, fontWeight: '600', color: mutedForeground, marginBottom: 4 },
  detailValue: { fontSize: 15, color: foreground },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  linkText: { fontSize: 15, color: primary, fontWeight: '500' },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.base,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: border,
  },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: primary },
  errorText: { fontSize: 16, color: '#ef4444' },
});
