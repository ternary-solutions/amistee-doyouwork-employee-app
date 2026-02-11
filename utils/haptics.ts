import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Light impact for button/list taps */
export function hapticImpact() {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Selection feedback for toggles/segments */
export function hapticSelection() {
  if (Platform.OS === 'web') return;
  Haptics.selectionAsync().catch(() => {});
}
