import React from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type AnimatedPressableProps = PressableProps & {
  /** Scale factor when pressed (default 0.98) */
  scaleAmount?: number;
};

export function AnimatedPressable({
  children,
  style,
  scaleAmount = 0.98,
  onPressIn,
  onPressOut,
  ...rest
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
    scale.value = withSpring(scaleAmount, {
      damping: 15,
      stiffness: 400,
    });
    onPressIn?.(e);
  };

  const handlePressOut = (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
    onPressOut?.(e);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...rest}
    >
      <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
    </Pressable>
  );
}
