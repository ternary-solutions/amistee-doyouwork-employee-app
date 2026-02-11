import { primaryForeground } from '@/constants/theme';
import { useMainStore } from '@/store/main';
import { locationsService } from '@/services/locations';
import type { Location } from '@/types/locations';
import { hapticImpact } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export function LocationSwitcher() {
  const locationIds = useMainStore((s) => s.locationIds);
  const currentLocationId = useMainStore((s) => s.currentLocationId);
  const setCurrentLocationId = useMainStore((s) => s.setCurrentLocationId);

  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const scale = useSharedValue(0.96);

  const loadLocations = useCallback(async () => {
    if (locationIds.length === 0) return;
    try {
      setLoading(true);
      const res = await locationsService.list(1, 100);
      const ids = locationIds as string[];
      const userLocs = (res?.items ?? []).filter((loc) => ids.includes(loc.id));
      setLocations(userLocs);
    } catch (error) {
      console.error('[LocationSwitcher] Failed to load locations:', error);
    } finally {
      setLoading(false);
    }
  }, [locationIds]);

  useEffect(() => {
    if (locationIds.length > 1) {
      loadLocations();
    }
  }, [locationIds.length, loadLocations]);

  const currentLocation = locations.find((l) => l.id === currentLocationId);

  useEffect(() => {
    if (modalVisible) {
      scale.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = 0.96;
    }
  }, [modalVisible, scale]);

  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (locationIds.length <= 1) return null;

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
        onPress={() => {
          hapticImpact();
          setModalVisible(true);
        }}
        accessibilityLabel="Switch location"
        accessibilityRole="button"
      >
        <Ionicons name="business" size={18} color={primaryForeground} />
        <Text style={styles.triggerText} numberOfLines={1}>
          {loading
            ? 'Loading...'
            : currentLocation?.name ?? currentLocationId ?? 'Select location'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={primaryForeground} />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View style={[styles.modalContent, animatedContentStyle]}>
            <Text style={styles.modalTitle}>Select Location</Text>
            {loading ? (
              <View style={styles.loader}>
                <ActivityIndicator size="small" color={primaryForeground} />
              </View>
            ) : (
              locations.map((loc) => (
                <Pressable
                  key={loc.id}
                  style={({ pressed }) => [
                    styles.option,
                    loc.id === currentLocationId && styles.optionActive,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    hapticImpact();
                    setCurrentLocationId(loc.id);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      loc.id === currentLocationId && styles.optionTextActive,
                    ]}
                  >
                    {loc.name}
                  </Text>
                  {loc.id === currentLocationId ? (
                    <Ionicons name="checkmark" size={20} color={primaryForeground} />
                  ) : null}
                </Pressable>
              ))
            )}
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 12,
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
    color: primaryForeground,
    fontWeight: '500',
  },
  pressed: { opacity: 0.8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: primaryForeground,
    marginBottom: 16,
  },
  loader: { paddingVertical: 24, alignItems: 'center' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  optionActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  optionText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  optionTextActive: {
    fontWeight: '600',
    color: primaryForeground,
  },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
});
