import {
    background,
    border,
    card,
    foreground,
    mutedForeground,
    primary,
    radius,
    spacing,
    statusBadge,
    typography,
} from "@/constants/theme";
import { useSetHeaderOptions } from "@/contexts/HeaderOptionsContext";
import { timeOffRequestsService } from "@/services/requests/timeOffs";
import type { TimeOffRequest } from "@/types/requests/timeOffs";
import { getErrorMessage } from "@/utils/errorMessage";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function getStatusBadgeStyle(status: string): { bg: string; text: string } {
  const s = statusBadge[status as keyof typeof statusBadge];
  return s ?? { bg: mutedForeground, text: "#ffffff" };
}

export default function TimeOffDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [request, setRequest] = useState<TimeOffRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useSetHeaderOptions(
    useMemo(() => ({ title: "Time Off Request", showBack: true }), []),
  );

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await timeOffRequestsService.getById(id);
      setRequest(data);
    } catch (error) {
      console.error("Failed to load time off request", error);
      Alert.alert(
        "Error",
        getErrorMessage(
          error,
          "Failed to load time off request. Please try again.",
        ),
      );
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

  if (!request) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Time off request not found.</Text>
      </View>
    );
  }

  const statusStyle = getStatusBadgeStyle(request.status);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: background }}
      contentContainerStyle={[
        styles.container,
        { paddingBottom: spacing.xl + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{request.entity_type}</Text>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>
              {request.status}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Start date</Text>
          <Text style={styles.detailValue}>
            {new Date(request.start_date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>End date</Text>
          <Text style={styles.detailValue}>
            {new Date(request.end_date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Days</Text>
          <Text style={styles.detailValue}>
            {request.time_off_days} day{request.time_off_days !== 1 ? "s" : ""}
          </Text>
        </View>

        <Text style={styles.meta}>
          Submitted{" "}
          {request.created_at
            ? new Date(request.created_at).toLocaleDateString()
            : "—"}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.base },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: card,
    borderRadius: radius.base,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: border,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: { ...typography.sectionTitle, fontSize: 20, color: foreground },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: 12, fontWeight: "600" },
  detailRow: { marginBottom: spacing.base },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: mutedForeground,
    marginBottom: spacing.sm,
  },
  detailValue: { fontSize: 15, color: foreground },
  meta: { fontSize: 13, color: mutedForeground, marginTop: spacing.base },
  errorText: { fontSize: 16, color: "#ef4444" },
});
