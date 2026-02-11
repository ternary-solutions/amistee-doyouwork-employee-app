import { Button } from '@/components/ui/Button';
import {
    accent,
    accentForeground,
    border,
    card,
    foreground,
    radius,
    spacing,
} from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { addDays, format, isSameDay, startOfWeek, subDays } from 'date-fns';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface WeekDaySelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function WeekDaySelector({
  selectedDate,
  onDateChange,
}: WeekDaySelectorProps) {
  const insets = useSafeAreaInsets();
  const today = new Date();
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const horizontalPadding = Math.max(spacing.lg, spacing.base + Math.max(insets.left, insets.right));

  const goToPrevWeek = () => onDateChange(subDays(selectedDate, 7));
  const goToNextWeek = () => onDateChange(addDays(selectedDate, 7));
  const goToToday = () => onDateChange(today);
  const isTodaySelected = isSameDay(selectedDate, today);

  return (
    <View style={[styles.wrapper, { paddingHorizontal: horizontalPadding }]}>
      <View style={styles.todayRow}>
        <Button
          variant={isTodaySelected ? 'accent' : 'outline'}
          size="sm"
          pill
          onPress={goToToday}
          accessibilityLabel="Go to today"
          accessibilityRole="button"
        >
          Today
        </Button>
        <View style={styles.arrows}>
          <Pressable
            onPress={goToPrevWeek}
            style={({ pressed }) => [styles.arrowBtn, pressed && styles.pressed]}
            accessibilityLabel="Previous week"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={22} color={foreground} />
          </Pressable>
          <Pressable
            onPress={goToNextWeek}
            style={({ pressed }) => [styles.arrowBtn, pressed && styles.pressed]}
            accessibilityLabel="Next week"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-forward" size={22} color={foreground} />
          </Pressable>
        </View>
      </View>
      <View style={styles.grid}>
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);
          return (
            <Pressable
              key={day.toISOString()}
              onPress={() => onDateChange(day)}
              style={[
                styles.dayBtn,
                isSelected && styles.dayBtnSelected,
                isToday && !isSelected && styles.dayBtnToday,
              ]}
              accessibilityLabel={format(day, 'EEEE, MMM d')}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.dayLabel,
                  isSelected && styles.dayLabelSelected,
                ]}
              >
                {format(day, 'EEE')}
              </Text>
              <Text
                style={[
                  styles.dayNum,
                  isSelected && styles.dayNumSelected,
                ]}
              >
                {format(day, 'd')}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: -24,
    marginBottom: spacing.sm,
  },
  todayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  arrows: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  arrowBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  grid: {
    flexDirection: 'row',
    gap: 6,
  },
  dayBtn: {
    flex: 1,
    backgroundColor: card,
    borderWidth: 1,
    borderColor: border,
    borderRadius: radius.base,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBtnSelected: {
    backgroundColor: accent,
    borderColor: accent,
  },
  dayBtnToday: {
    borderWidth: 2,
    borderColor: accent,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: foreground,
    opacity: 0.8,
  },
  dayLabelSelected: {
    color: accentForeground,
    opacity: 1,
  },
  dayNum: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '700',
    color: foreground,
  },
  dayNumSelected: {
    color: accentForeground,
  },
});
