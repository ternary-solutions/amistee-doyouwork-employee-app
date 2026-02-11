import { EmptyState } from "@/components/ui/EmptyState";
import { FormModal } from "@/components/ui/FormModal";
import { ListCard } from "@/components/ui/ListCard";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SkeletonListCard } from "@/components/ui/Skeleton";
import {
    background,
    border,
    foreground,
    muted,
    mutedForeground,
    primary,
    primaryForeground,
    radius,
    spacing,
    statusBadge,
} from "@/constants/theme";
import { useCloseModalOnDrawerOpen } from "@/contexts/DrawerModalContext";
import { useSetHeaderOptions } from "@/contexts/HeaderOptionsContext";
import { timeOffRequestsService } from "@/services/requests/timeOffs";
import type { TimeOffRequest } from "@/types/requests/timeOffs";
import { getErrorMessage } from "@/utils/errorMessage";
import { toast as showToast } from "@/utils/toast";
import DateTimePicker from "@react-native-community/datetimepicker";
import { addDays, format, startOfDay } from "date-fns";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TYPES: ("Vacation" | "Sick" | "Personal")[] = [
  "Vacation",
  "Sick",
  "Personal",
];
function getStatusBadgeStyle(status: string): { bg: string; text: string } {
  const s = statusBadge[status as keyof typeof statusBadge];
  return s ?? { bg: mutedForeground, text: primaryForeground };
}

type Filter = "open" | "closed";

function getTodayYMD(): string {
  return format(startOfDay(new Date()), "yyyy-MM-dd");
}

export default function TimeOffScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);
  const [filter, setFilter] = useState<Filter>("open");
  const [modalOpen, setModalOpen] = useState(false);
  const [entityType, setEntityType] = useState<
    "Vacation" | "Sick" | "Personal"
  >("Vacation");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const todayYMD = getTodayYMD();
  const startDateObj = startDate
    ? new Date(startDate + "T12:00:00")
    : new Date(todayYMD + "T12:00:00");
  const endDateObj = endDate
    ? new Date(endDate + "T12:00:00")
    : new Date(todayYMD + "T12:00:00");
  const minStartDate = startOfDay(new Date());
  const minEndDate = startDate
    ? startOfDay(new Date(startDate + "T12:00:00"))
    : minStartDate;
  const maxEndDate = startDate
    ? addDays(new Date(startDate + "T12:00:00"), 365)
    : addDays(new Date(), 365);

  const filteredRequests = requests.filter((r) =>
    filter === "open"
      ? r.status === "Pending"
      : r.status === "Approved" || r.status === "Denied",
  );

  const load = useCallback(async (fromPullToRefresh = false) => {
    try {
      if (fromPullToRefresh) {
        setRefreshing(true);
      } else if (!hasLoadedOnce.current) {
        setLoading(true);
      }
      const res = await timeOffRequestsService.list(1, 50);
      setRequests(res?.items ?? []);
      hasLoadedOnce.current = true;
    } catch (error) {
      console.error("Failed to load time off requests", error);
      Alert.alert(
        "Error",
        getErrorMessage(
          error,
          "Failed to load time off requests. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Dismiss create modal when navigating away (e.g. via hamburger menu)
  useFocusEffect(
    useCallback(() => {
      return () => {
        setModalOpen(false);
        setShowStartPicker(false);
        setShowEndPicker(false);
      };
    }, []),
  );

  // Prefill start/end to today when opening the modal
  useEffect(() => {
    if (modalOpen && !startDate && !endDate) {
      setStartDate(todayYMD);
      setEndDate(todayYMD);
    }
  }, [modalOpen, startDate, endDate, todayYMD]);

  // Keep end >= start when start changes
  useEffect(() => {
    if (startDate && endDate && endDate < startDate) {
      setEndDate(startDate);
    }
  }, [startDate, endDate]);

  useSetHeaderOptions(
    useMemo(
      () => ({
        title: "Time Off",
        subtitle: "Request vacation, sick, or personal time off.",
        showBack: false,
        headerAction: {
          label: "New time off request",
          onPress: () => setModalOpen(true),
        },
      }),
      [],
    ),
    "/(app)/time-off",
  );

  useCloseModalOnDrawerOpen(() => setModalOpen(false));

  const handleCreate = async () => {
    if (!startDate.trim() || !endDate.trim()) return;
    try {
      setSubmitting(true);
      await timeOffRequestsService.create({
        entity_type: entityType,
        start_date: startDate,
        end_date: endDate,
      });
      setModalOpen(false);
      setStartDate("");
      setEndDate("");
      setShowStartPicker(false);
      setShowEndPicker(false);
      showToast.success("Time off request submitted.");
      load();
    } catch (error) {
      console.error("Create time off failed", error);
      Alert.alert(
        "Error",
        getErrorMessage(
          error,
          "Failed to submit time off request. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && requests.length === 0) {
    return (
      <ScrollView
        style={[styles.scroll, { backgroundColor: background }]}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: spacing.xl + insets.bottom },
          { paddingTop: insets.top },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.skeletonPlaceholder} />
        <View style={styles.skeletonWrap}>
          <SkeletonListCard />
          <SkeletonListCard />
          <SkeletonListCard />
          <SkeletonListCard />
          <SkeletonListCard />
        </View>
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.scroll, { backgroundColor: background }]}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: spacing.xl + insets.bottom },
          { paddingTop: 16 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={primary}
          />
        }
      >
        <SegmentedControl
          options={[
            { value: "open", label: "Open" },
            { value: "closed", label: "Closed" },
          ]}
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
        />

        {requests.length === 0 ? (
          <EmptyState
            message="No time off requests yet. Tap the button below to request time off."
            icon="calendar-outline"
            action={{
              label: "Request time off",
              onPress: () => setModalOpen(true),
            }}
          />
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            message={`No ${filter === "open" ? "open" : "closed"} time off requests.`}
            icon="calendar-outline"
          />
        ) : (
          filteredRequests.map((item) => (
            <View key={item.id} style={styles.cardWrap}>
              <ListCard
                title={item.entity_type}
                meta={[
                  `${new Date(item.start_date).toLocaleDateString()} – ${new Date(item.end_date).toLocaleDateString()}`,
                  `${item.time_off_days} day(s)`,
                ]}
                badge={{
                  text: item.status,
                  backgroundColor: getStatusBadgeStyle(item.status).bg,
                  textColor: getStatusBadgeStyle(item.status).text,
                }}
                onPress={() => router.push(`/(app)/time-off/${item.id}`)}
              />
            </View>
          ))
        )}
      </ScrollView>
      <FormModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New time off request"
        submitLabel="Submit"
        submitting={submitting}
        onSubmit={handleCreate}
      >
        <Text style={styles.label}>Type</Text>
        <View style={styles.picker}>
          {TYPES.map((t) => (
            <Pressable
              key={t}
              style={[
                styles.pickerOption,
                entityType === t && styles.pickerOptionActive,
              ]}
              onPress={() => setEntityType(t)}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  entityType === t && styles.pickerOptionTextActive,
                ]}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Start date</Text>
        <Pressable
          style={styles.dateBtn}
          onPress={() => setShowStartPicker(true)}
        >
          <Text style={styles.dateBtnText}>
            {startDate || "Select start date"}
          </Text>
        </Pressable>
        {showStartPicker && (
          <DateTimePicker
            value={startDateObj}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={minStartDate}
            onChange={(_, date) => {
              setShowStartPicker(Platform.OS === "android");
              if (date) {
                const ymd = format(date, "yyyy-MM-dd");
                setStartDate(ymd);
                if (endDate && endDate < ymd) setEndDate(ymd);
              }
            }}
          />
        )}
        <Text style={styles.label}>End date</Text>
        <Pressable
          style={styles.dateBtn}
          onPress={() => setShowEndPicker(true)}
        >
          <Text style={styles.dateBtnText}>{endDate || "Select end date"}</Text>
        </Pressable>
        {showEndPicker && (
          <DateTimePicker
            value={endDateObj}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={minEndDate}
            maximumDate={maxEndDate}
            onChange={(_, date) => {
              setShowEndPicker(Platform.OS === "android");
              if (date) setEndDate(format(date, "yyyy-MM-dd"));
            }}
          />
        )}
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl },
  skeletonPlaceholder: { height: 52, marginBottom: spacing.base },
  skeletonWrap: { paddingHorizontal: spacing.base },
  list: { padding: spacing.base, paddingBottom: spacing.xl },
  cardWrap: { marginBottom: spacing.md },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: foreground,
  },
  dateBtn: {
    borderWidth: 1,
    borderColor: border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.base,
  },
  dateBtnText: { fontSize: 16, color: foreground },
  input: {
    borderWidth: 1,
    borderColor: border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.base,
    fontSize: 16,
  },
  picker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  pickerOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: muted,
  },
  pickerOptionActive: { backgroundColor: primary },
  pickerOptionText: { fontSize: 14, color: foreground },
  pickerOptionTextActive: { color: primaryForeground },
});
