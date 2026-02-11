import { muted } from '@/constants/theme';
import React, { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
};

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.9, { duration: 800 }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: muted,
  },
});

/** Skeleton row for list cards (icon + lines) */
export function SkeletonListCard() {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.row}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={cardStyles.content}>
          <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
          <Skeleton width="60%" height={12} />
        </View>
      </View>
    </View>
  );
}

/** Skeleton for expense/vehicle-style card */
export function SkeletonDetailCard() {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.header}>
        <Skeleton width={120} height={18} style={{ marginBottom: 8 }} />
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
      <Skeleton width="100%" height={14} style={{ marginBottom: 6 }} />
      <Skeleton width="70%" height={14} style={{ marginBottom: 6 }} />
      <Skeleton width="50%" height={14} />
    </View>
  );
}

/** Skeleton for dashboard schedule card */
export function SkeletonScheduleCard() {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.vehicleRow}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width={120} height={16} />
      </View>
      <View style={cardStyles.memberRow}>
        <Skeleton width={32} height={32} borderRadius={16} />
        <Skeleton width={100} height={14} />
      </View>
      <View style={cardStyles.memberRow}>
        <Skeleton width={32} height={32} borderRadius={16} />
        <Skeleton width={80} height={14} />
      </View>
      <Skeleton width="100%" height={12} style={{ marginTop: 8 }} />
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
});
