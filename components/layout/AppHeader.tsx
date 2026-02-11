import {
    primary,
    primaryDark,
    primaryForeground,
} from '@/constants/theme';
import { useMainStore } from '@/store/main';
import { getMediaUrl } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    Pressable, Image as RNImage, StyleSheet,
    Text,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
type HeaderProps = {
  navigation: {
    goBack: () => void;
    canGoBack: () => boolean;
    openDrawer?: () => void;
    getParent?: () => { openDrawer?: () => void } | undefined;
  };
  route?: { name: string };
  options?: { title?: string };
};

const logoSource = require('../../assets/images/doyouwork-logo.png');

type AppHeaderProps = HeaderProps & {
  /** Show back button instead of menu (e.g. on detail screens) */
  showBack?: boolean;
  /** Optional title below the bar (Ionic style) */
  title?: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Optional right-side action (e.g. "+" for create) */
  headerAction?: {
    label: string;
    onPress: () => void;
  };
};

export function AppHeader({
  navigation,
  showBack: showBackProp,
  title,
  subtitle,
  headerAction,
}: AppHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const me = useMainStore((state) => state.me);

  const canGoBack = navigation.canGoBack();
  const showBack = showBackProp ?? canGoBack;

  const openDrawer = () => {
    const drawer = 'getParent' in navigation ? (navigation as { getParent: () => { openDrawer?: () => void } | undefined }).getParent() : null;
    if (drawer?.openDrawer) drawer.openDrawer();
    else if ('openDrawer' in navigation && typeof (navigation as { openDrawer: () => void }).openDrawer === 'function') {
      (navigation as { openDrawer: () => void }).openDrawer();
    }
  };

  const goBack = () => {
    if (canGoBack) navigation.goBack();
    else router.back();
  };

  const goToDashboard = () => router.replace('/(app)/dashboard');
  const goToSettings = () => router.push('/(app)/settings');

  const avatarUri = getMediaUrl(me?.photo_url) || '';

  return (
    <LinearGradient
      colors={[primary, primaryDark]}
      style={[styles.wrapper, { paddingTop: insets.top }]}
    >
      <View style={styles.bar}>
        {showBack ? (
          <Pressable
            onPress={goBack}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={28} color={primaryForeground} />
          </Pressable>
        ) : (
          <Pressable
            onPress={openDrawer}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityLabel="Open menu"
          >
            <Ionicons name="menu" size={28} color={primaryForeground} />
          </Pressable>
        )}

        <Pressable
          onPress={goToDashboard}
          style={styles.logoWrap}
          accessibilityLabel="DoYouWork - Go to dashboard"
        >
          <RNImage
            source={logoSource}
            style={styles.logo}
            resizeMode="contain"
          />
        </Pressable>

        {headerAction ? (
          <Pressable
            onPress={headerAction.onPress}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
            accessibilityLabel={headerAction.label}
          >
            <Ionicons name="add" size={24} color={primaryForeground} />
          </Pressable>
        ) : (
          <Pressable
            onPress={goToSettings}
            style={({ pressed }) => [styles.avatarBtn, pressed && styles.pressed]}
            accessibilityLabel="My account"
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>
                  {me?.first_name?.[0] ?? '?'}
                </Text>
              </View>
            )}
          </Pressable>
        )}
      </View>

      {(title || subtitle) && (
        <View style={styles.titleBlock}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: 16,
    paddingHorizontal: 8,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    margin: -4,
  },
  logoWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 32,
  },
  actionBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
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
    fontSize: 16,
    fontWeight: '600',
    color: primaryForeground,
  },
  pressed: {
    opacity: 0.8,
  },
  titleBlock: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: primaryForeground,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
});
