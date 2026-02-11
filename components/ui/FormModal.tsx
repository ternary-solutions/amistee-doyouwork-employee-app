import { border, card, foreground, primary, primaryForeground, radius, spacing, typography } from '@/constants/theme';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type FormModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  submitLabel?: string;
  submitting?: boolean;
  /** When true, submit button is disabled (e.g. validation) */
  submitDisabled?: boolean;
  onSubmit: () => void;
  /** Max height for the content area (default '80%') */
  contentMaxHeight?: string | number;
};

export function FormModal({
  visible,
  onClose,
  title,
  children,
  submitLabel = 'Submit',
  submitting = false,
  submitDisabled = false,
  onSubmit,
  contentMaxHeight = '80%',
}: FormModalProps) {
  const disabled = submitting || submitDisabled;
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.content, { maxHeight: contentMaxHeight }]}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.body}>
            {children}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.8 }]}
              onPress={onClose}
              accessibilityLabel="Cancel"
              accessibilityRole="button"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                disabled && styles.submitBtnDisabled,
                !disabled && pressed && { opacity: 0.8 },
              ]}
              onPress={onSubmit}
              disabled={disabled}
              accessibilityLabel={submitting ? 'Submitting' : submitLabel}
              accessibilityRole="button"
            >
              <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : submitLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
  },
  title: { ...typography.sectionTitle, marginBottom: spacing.base },
  body: { maxHeight: 400 },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.base,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: border,
  },
  cancelBtnText: { fontSize: 16, fontWeight: '500', color: foreground },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: primary,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: primaryForeground, fontSize: 16, fontWeight: '600' },
});
