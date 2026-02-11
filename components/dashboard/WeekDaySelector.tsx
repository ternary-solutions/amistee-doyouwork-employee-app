import { Button } from "@/components/ui/Button";
import {
  accent,
  accentForeground,
  border,
  card,
  foreground,
  radius,
  spacing,
} from "@/constants/theme";
import { hapticSelection } from "@/utils/haptics";
import { Ionicons } from "@expo/vector-icons";
import { addDays, format, isSameDay, startOfWeek, subDays } from "date-fns";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const SELECTION_DURATION = 220;

interface WeekDaySelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

function DayCell({
  day,
  selectedDate,
  today,
  onPress,
}: {
  day: Date;
  selectedDate: Date;
  today: Date;
  onPress: () => void;
}) {
  const isSelected = isSameDay(day, selectedDate);
  const isToday = isSameDay(day, today);
  const selected = useSharedValue(isSelected ? 1 : 0);
  const todayHighlight = useSharedValue(isToday && !isSelected ? 1 : 0);

  useEffect(() => {
    selected.value = withTiming(isSelected ? 1 : 0, {
      duration: SELECTION_DURATION,
    });
  }, [isSelected, selected]);

  useEffect(() => {
    todayHighlight.value = withTiming(isToday && !isSelected ? 1 : 0, {
      duration: SELECTION_DURATION,
    });
  }, [isToday, isSelected, todayHighlight]);

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    const isTodayOnly = todayHighlight.value * (1 - selected.value);
    return {
      backgroundColor: interpolateColor(selected.value, [0, 1], [card, accent]),
      borderColor: interpolateColor(
        selected.value + isTodayOnly,
        [0, 1],
        [border, accent],
      ),
      borderWidth: 1 + isTodayOnly,
    };
  });

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      selected.value,
      [0, 1],
      [foreground, accentForeground],
    ),
    opacity: 0.8 + selected.value * 0.2,
  }));

  const numStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      selected.value,
      [0, 1],
      [foreground, accentForeground],
    ),
  }));

  return (
    <Pressable
      onPress={() => {
        hapticSelection();
        onPress();
      }}
      style={styles.dayBtnWrap}
      accessibilityLabel={format(day, "EEEE, MMM d")}
      accessibilityRole="button"
    >
      <Animated.View style={[styles.dayBtn, animatedStyle]}>
        <Animated.Text style={[styles.dayLabel, labelStyle]}>
          {format(day, "EEE")}
        </Animated.Text>
        <Animated.Text style={[styles.dayNum, numStyle]}>
          {format(day, "d")}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

export function WeekDaySelector({
  selectedDate,
  onDateChange,
}: WeekDaySelectorProps) {
  const today = new Date();
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const goToPrevWeek = () => onDateChange(subDays(selectedDate, 7));
  const goToNextWeek = () => onDateChange(addDays(selectedDate, 7));
  const goToToday = () => onDateChange(today);
  const isTodaySelected = isSameDay(selectedDate, today);

  return (
    <View style={styles.wrapper}>
      <View style={styles.todayRow}>
        <Button
          variant={isTodaySelected ? "accent" : "outline"}
          size="md"
          pill
          onPress={goToToday}
          accessibilityLabel="Go to today"
          accessibilityRole="button"
        >
          Today
        </Button>
        <View style={styles.arrows}>
          <Pressable
            onPress={() => {
              hapticSelection();
              goToPrevWeek();
            }}
            style={({ pressed }) => [
              styles.arrowBtn,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Previous week"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={22} color={foreground} />
          </Pressable>
          <Pressable
            onPress={() => {
              hapticSelection();
              goToNextWeek();
            }}
            style={({ pressed }) => [
              styles.arrowBtn,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Next week"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-forward" size={22} color={foreground} />
          </Pressable>
        </View>
      </View>
      <View style={styles.grid}>
        {weekDays.map((day) => (
          <DayCell
            key={day.toISOString()}
            day={day}
            selectedDate={selectedDate}
            today={today}
            onPress={() => onDateChange(day)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  todayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  arrows: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  arrowBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7 },
  grid: {
    flexDirection: "row",
    gap: 6,
  },
  dayBtnWrap: {
    flex: 1,
  },
  dayBtn: {
    flex: 1,
    borderRadius: radius.base,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dayNum: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: "700",
  },
});
