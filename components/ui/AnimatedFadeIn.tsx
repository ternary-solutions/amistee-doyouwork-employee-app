import React, { useEffect } from 'react';
import { type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type AnimatedFadeInProps = {
  children: React.ReactNode;
  /** Duration in ms (default 250) */
  duration?: number;
  /** Delay in ms for stagger effect (default 0) */
  delay?: number;
  /** Optional translateY offset on enter (default 0) */
  translateY?: number;
  style?: ViewStyle;
};

export function AnimatedFadeIn({
  children,
  duration = 250,
  delay = 0,
  translateY = 0,
  style,
}: AnimatedFadeInProps) {
  const opacity = useSharedValue(0);
  const translate = useSharedValue(translateY);

  useEffect(() => {
    const id = setTimeout(() => {
      opacity.value = withTiming(1, { duration });
      if (translateY !== 0) {
        translate.value = withTiming(0, { duration });
      }
    }, delay);

    return () => clearTimeout(id);
  }, [delay, duration, opacity, translate, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: translateY !== 0 ? [{ translateY: translate.value }] : [],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}
