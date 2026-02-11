import {
    background,
    destructive,
    foreground,
    mutedForeground,
    primary,
    primaryForeground,
    spacing,
    typography
} from "@/constants/theme";
import { useSetHeaderOptions } from "@/contexts/HeaderOptionsContext";
import { usersService } from "@/services/users";
import type { User } from "@/types/users";
import { getMediaSource } from "@/utils/api";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

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
      console.error("Failed to load contact", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useSetHeaderOptions(
    useMemo(() => ({ title: "Contact", showBack: true }), []),
  );

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

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
  const initial = fullName.trim()[0]?.toUpperCase() ?? "?";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.profileHeader}>
        {user.photo_url ? (
          <Image
            source={getMediaSource(user.photo_url)}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
        <Text style={styles.title}>{fullName}</Text>
      </View>
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
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  profileHeader: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: spacing.md,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: mutedForeground,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: "600",
    color: primaryForeground,
  },
  title: {
    ...typography.sectionTitle,
    fontSize: 22,
    color: foreground,
    textAlign: "center",
  },
  row: { marginBottom: spacing.base },
  label: { ...typography.label, color: mutedForeground, marginBottom: 4 },
  value: { fontSize: 16, color: foreground },
  errorText: { fontSize: 16, color: destructive },
});
