import { card, foreground, muted, mutedForeground, radius, spacing } from '@/constants/theme';
import { hapticSelection } from '@/utils/haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface SegmentedOption {
  value: string;
  label: string;
}

type SegmentedControlProps = {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
};

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <View style={styles.wrapper}>
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            style={[styles.btn, isActive && styles.btnActive]}
            onPress={() => {
              hapticSelection();
              onChange(opt.value);
            }}
          >
            <Text style={[styles.btnText, isActive && styles.btnTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    backgroundColor: muted,
    borderRadius: radius.sm,
    padding: 2,
    marginBottom: spacing.base,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.sm - 2,
  },
  btnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '500',
    color: mutedForeground,
  },
  btnTextActive: {
    color: foreground,
    fontWeight: '700',
  },
});
