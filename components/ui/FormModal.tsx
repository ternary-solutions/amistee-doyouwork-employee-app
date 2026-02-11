import { border, card, foreground, primary, primaryForeground, radius, spacing, typography } from '@/constants/theme';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';

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
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = ['50%', contentMaxHeight === '85%' ? '85%' : '80%'];

  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onDismiss={handleDismiss}
      enablePanDownToClose
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
        >
          {children}
        </BottomSheetScrollView>
        <View style={styles.actions}>
          <AnimatedPressable
            style={styles.cancelBtn}
            onPress={onClose}
            accessibilityLabel="Cancel"
            accessibilityRole="button"
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={[styles.submitBtn, disabled && styles.submitBtnDisabled]}
            onPress={onSubmit}
            disabled={disabled}
            accessibilityLabel={submitting ? 'Submitting' : submitLabel}
            accessibilityRole="button"
          >
            <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : submitLabel}</Text>
          </AnimatedPressable>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: card,
  },
  handle: {
    backgroundColor: border,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  title: { ...typography.sectionTitle, marginBottom: spacing.base },
  body: { flex: 1 },
  bodyContent: { paddingBottom: spacing.xl },
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
