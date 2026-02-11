import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { DashboardNotifications } from "@/components/dashboard/DashboardNotifications";
import { UpcomingVacationCard } from "@/components/dashboard/UpcomingVacationCard";
import { WeekDaySelector } from "@/components/dashboard/WeekDaySelector";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SkeletonScheduleCard } from "@/components/ui/Skeleton";
import {
  accent,
  accentForeground,
  background,
  border,
  foreground,
  muted,
  mutedForeground,
  spacing,
  typography,
} from "@/constants/theme";
import { scheduleService } from "@/services/schedules";
import { useMainStore } from "@/store/main";
import type { MyScheduleResponse } from "@/types/schedules";
import { getErrorMessage } from "@/utils/errorMessage";
import { getMediaSource } from "@/utils/mediaSource";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function DashboardScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const me = useMainStore((s) => s.me);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);
  const [schedules, setSchedules] = useState<MyScheduleResponse[]>([]);
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const openDrawer = () => {
    const nav = navigation as unknown as { openDrawer?: () => void };
    if (typeof nav.openDrawer === "function") nav.openDrawer();
  };

  const loadSchedules = useCallback(
    async (fromPullToRefresh = false) => {
      try {
        if (fromPullToRefresh) {
          setRefreshing(true);
        } else if (!hasLoadedOnce.current) {
          setLoading(true);
        }
        const res = await scheduleService.getMySchedule(dateStr);
        setSchedules(res.filter((s) => s && s.vehicle !== undefined));
        hasLoadedOnce.current = true;
      } catch (error) {
        console.error("Failed to load schedules", error);
        Alert.alert(
          "Error",
          getErrorMessage(error, "Failed to load schedule. Please try again."),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dateStr],
  );

  useEffect(() => {
    if (!me) return;
    loadSchedules();
  }, [me, loadSchedules]);

  return (
    <View style={styles.container}>
      <DashboardHero selectedDate={selectedDate} onMenuClick={openDrawer} />
      <ScrollView
        style={[styles.scroll, { backgroundColor: background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadSchedules(true)}
            tintColor={accent}
          />
        }
      >
        <WeekDaySelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        <View style={styles.body}>
          <DashboardNotifications />

          <Text style={styles.sectionTitle}>Schedule</Text>
          {!me || (loading && schedules.length === 0) ? (
            <View style={styles.skeletonWrap}>
              <SkeletonScheduleCard />
              <SkeletonScheduleCard />
              <SkeletonScheduleCard />
            </View>
          ) : schedules.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>
                No schedule for {format(selectedDate, "MMMM d, yyyy")}.
              </Text>
            </Card>
          ) : (
            schedules
              .filter((s) => s.vehicle)
              .map((schedule) => (
                <Card
                  key={
                    schedule.id || `schedule-${schedule.vehicle?.id}-${dateStr}`
                  }
                  style={styles.scheduleCard}
                  accessibilityLabel={`Schedule for ${schedule.vehicle?.vehicle_name || "Unknown vehicle"}, ${format(selectedDate, "MMMM d, yyyy")}`}
                  accessibilityRole="summary"
                >
                  <View style={styles.vehicleRow}>
                    <View style={styles.vehicleIcon}>
                      {schedule.vehicle?.image_url ? (
                        <Image
                          source={getMediaSource(schedule.vehicle.image_url)}
                          style={styles.vehicleImage}
                        />
                      ) : (
                        <Text style={styles.vehicleIconText}>🚗</Text>
                      )}
                    </View>
                    <Text style={styles.vehicleName}>
                      {schedule.vehicle?.vehicle_name || "Unknown Vehicle"}
                    </Text>
                  </View>
                  <View style={styles.membersBlock}>
                    {schedule.assigned_employees.map((member) => (
                      <View key={member.id} style={styles.memberRow}>
                        <View style={styles.memberIcon}>
                          {member.photo_url ? (
                            <Image
                              source={getMediaSource(member.photo_url)}
                              style={styles.memberImage}
                            />
                          ) : (
                            <Text style={styles.memberIconText}>
                              {[member.first_name, member.last_name]
                                .filter(Boolean)
                                .map((n) => (n ?? "")[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2) || "?"}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.memberName}>
                          {[member.first_name, member.last_name]
                            .filter(Boolean)
                            .join(" ")}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.notesBlock}>
                    <Text style={styles.notesLabel}>Notes</Text>
                    <Text
                      style={[
                        styles.notesText,
                        !schedule.notes && styles.notesPlaceholder,
                      ]}
                    >
                      {schedule.notes || "No notes"}
                    </Text>
                  </View>
                </Card>
              ))
          )}

          <Text style={styles.sectionTitle}>Vacations</Text>
          <View style={styles.ctaBtnWrap}>
            <Button
              variant="accent"
              pill
              onPress={() => router.push("/(app)/time-off")}
              accessibilityLabel="Request time off"
              accessibilityRole="button"
            >
              <View style={styles.ctaBtnContent}>
                <Text style={styles.ctaBtnText}>Request Time Off</Text>
                <Ionicons
                  name="add"
                  size={20}
                  color={accentForeground}
                  style={styles.ctaBtnIcon}
                />
              </View>
            </Button>
          </View>
          <View style={styles.vacationCardWrap}>
            <UpcomingVacationCard />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xl + 24,
  },
  body: {
    paddingTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: foreground,
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
  },
  loaderWrap: {
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  skeletonWrap: {
    gap: 0,
  },
  emptyText: {
    fontSize: 14,
    color: mutedForeground,
    textAlign: "center",
  },
  scheduleCard: {
    marginBottom: spacing.base,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  vehicleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: muted,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  vehicleImage: {
    width: "100%",
    height: "100%",
  },
  vehicleIconText: {
    fontSize: 20,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: "600",
    color: foreground,
    flex: 1,
  },
  membersBlock: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: muted,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginBottom: 4,
  },
  memberIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  memberImage: {
    width: "100%",
    height: "100%",
  },
  memberIconText: {
    fontSize: 12,
    fontWeight: "600",
    color: mutedForeground,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "500",
    color: foreground,
  },
  notesBlock: {
    marginTop: spacing.sm,
  },
  notesLabel: {
    ...typography.label,
    color: mutedForeground,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: foreground,
  },
  notesPlaceholder: {
    color: mutedForeground,
    fontStyle: "italic",
  },
  ctaBtnWrap: {
    marginBottom: spacing.md,
  },
  ctaBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: accentForeground,
  },
  ctaBtnIcon: {
    marginLeft: 2,
  },
  vacationCardWrap: {
    marginTop: spacing.sm,
  },
});
