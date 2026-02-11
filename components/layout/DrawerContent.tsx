import { clientInfo, menuGroups } from '@/constants/navigation';
import { primary, primaryDark, primaryForeground } from '@/constants/theme';
import { hapticImpact } from '@/utils/haptics';
import { useMainStore } from '@/store/main';
import { LocationSwitcher } from '@/components/layout/LocationSwitcher';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { getMediaUrl, logout } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { state, navigation } = props;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const me = useMainStore((state) => state.me);
  const currentRouteName = state.routes[state.index]?.name ?? '';

  const handleNavigate = useCallback(
    (name: string) => {
      hapticImpact();
      navigation.navigate(name as never);
      navigation.closeDrawer();
    },
    [navigation]
  );

  const handleMyAccount = useCallback(() => {
    hapticImpact();
    navigation.closeDrawer();
    router.push('/(app)/settings');
  }, [navigation, router]);

  const handleSignOut = useCallback(async () => {
    navigation.closeDrawer();
    await logout();
    router.replace('/(auth)/login');
  }, [navigation, router]);

  const fullName = me ? [me.first_name, me.last_name].filter(Boolean).join(' ') : '';

  return (
    <LinearGradient
      colors={[primary, primaryDark]}
      style={[styles.wrapper, { paddingTop: insets.top }]}
    >
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <View style={styles.profileBlock}>
          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              {me?.photo_url ? (
                <Image
                  source={{ uri: getMediaUrl(me.photo_url) }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {me?.first_name?.[0] ?? '?'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.profileText}>
              <Text style={styles.profileName} numberOfLines={1}>
                {fullName || 'Account'}
              </Text>
              <AnimatedPressable
                style={styles.myAccountBtn}
                onPress={handleMyAccount}
              >
                <Text style={styles.myAccountBtnText}>My Account</Text>
                <Ionicons name="chevron-forward" size={14} color={primaryForeground} />
              </AnimatedPressable>
            </View>
          </View>
        </View>

        <LocationSwitcher />

        {/* Menu groups */}
        {menuGroups.map((group, groupIndex) => (
          <View key={group.label} style={styles.group}>
            <Text style={styles.groupLabel}>{group.label}</Text>
            <View style={styles.groupItems}>
              {group.items.map((item) => {
                const isActive = currentRouteName === item.name;
                return (
                  <AnimatedPressable
                    key={item.name}
                    style={[styles.item, isActive && styles.itemActive]}
                    onPress={() => handleNavigate(item.name)}
                  >
                    <View style={styles.itemLeft}>
                      <Ionicons
                        name={item.icon as keyof typeof Ionicons.glyphMap}
                        size={22}
                        color={isActive ? primaryForeground : 'rgba(255,255,255,0.7)'}
                        style={styles.itemIcon}
                      />
                      <Text style={[styles.itemLabel, isActive && styles.itemLabelActive]}>
                        {item.label}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={isActive ? primaryForeground : 'rgba(255,255,255,0.6)'}
                    />
                  </AnimatedPressable>
                );
              })}
            </View>
            {groupIndex < menuGroups.length - 1 && <View style={styles.divider} />}
          </View>
        ))}

        {/* Notifications - drawer item for notifications screen */}
        <View style={styles.group}>
          <Text style={styles.groupLabel}>APP</Text>
          <AnimatedPressable
            style={[styles.item, currentRouteName === 'notifications' && styles.itemActive]}
            onPress={() => handleNavigate('notifications')}
          >
            <View style={styles.itemLeft}>
              <Ionicons
                name="notifications"
                size={22}
                color={
                  currentRouteName === 'notifications'
                    ? primaryForeground
                    : 'rgba(255,255,255,0.7)'
                }
                style={styles.itemIcon}
              />
              <Text
                style={[
                  styles.itemLabel,
                  currentRouteName === 'notifications' && styles.itemLabelActive,
                ]}
              >
                Notifications
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={
                currentRouteName === 'notifications'
                  ? primaryForeground
                  : 'rgba(255,255,255,0.6)'
              }
            />
          </AnimatedPressable>
        </View>

        {/* Client badge */}
        <View style={styles.clientBadge}>
          <Ionicons name="business" size={16} color="rgba(255,255,255,0.7)" />
          <Text style={styles.clientName}>{clientInfo.name}</Text>
        </View>

        {/* Sign out */}
        <AnimatedPressable
            style={styles.signOutBtn}
            onPress={async () => {
              hapticImpact();
              await handleSignOut();
            }}
        >
          <Ionicons name="log-out-outline" size={20} color={primaryForeground} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </AnimatedPressable>
      </DrawerContentScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  profileBlock: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: primaryForeground,
  },
  profileText: { flex: 1, minWidth: 0 },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
  },
  myAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
  },
  myAccountBtnText: {
    fontSize: 14,
    color: primaryForeground,
  },
  group: {
    marginTop: 16,
    marginBottom: 8,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  groupItems: {
    gap: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  itemIcon: {
    marginRight: 12,
  },
  itemActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: primaryForeground,
  },
  itemLabelActive: {
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginTop: 20,
    marginBottom: 12,
  },
  clientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  clientName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'transparent',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: primaryForeground,
  },
});
