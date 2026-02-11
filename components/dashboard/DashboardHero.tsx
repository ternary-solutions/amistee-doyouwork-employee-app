import {
  background,
  primary,
  primaryDark,
  primaryForeground,
  spacing,
  typography,
} from "@/constants/theme";
import { useNotifications } from "@/contexts/NotificationContext";
import { useMainStore } from "@/store/main";
import { getMediaSource } from "@/utils/mediaSource";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const logoSource = require("../../assets/images/doyouwork-logo.png");

interface DashboardHeroProps {
  selectedDate: Date;
  onMenuClick: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function DashboardHero({
  selectedDate,
  onMenuClick,
}: DashboardHeroProps) {
  const me = useMainStore((state) => state.me);
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const dayName = format(selectedDate, "EEEE");
  const fullDate = format(selectedDate, "MMMM d, yyyy");
  const insets = useSafeAreaInsets();
  const avatarSource = getMediaSource(me?.photo_url);

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <LinearGradient colors={[primary, primaryDark]} style={styles.gradient}>
        <View style={styles.topBar}>
          <Pressable
            onPress={onMenuClick}
            style={({ pressed }) => [styles.menuBtn, pressed && styles.pressed]}
            accessibilityLabel="Open menu"
            accessibilityHint="Opens navigation drawer"
          >
            <Ionicons name="menu" size={28} color={primaryForeground} />
          </Pressable>
          <View style={styles.topBarRight}>
            <Pressable
              onPress={() => router.push("/(app)/notifications")}
              style={({ pressed }) => [
                styles.iconBtn,
                pressed && styles.pressed,
              ]}
              accessibilityLabel={
                unreadCount > 0
                  ? `${unreadCount} unread notifications`
                  : "Notifications"
              }
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color={primaryForeground}
              />
              {unreadCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => router.push("/(app)/settings")}
              style={({ pressed }) => [
                styles.avatarWrap,
                pressed && styles.pressed,
              ]}
              accessibilityLabel="My account"
            >
              {me?.photo_url ? (
                <ExpoImage source={avatarSource} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>
                    {me?.first_name
                      ? getInitials(`${me.first_name} ${me.last_name || ""}`)
                      : "?"}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.logoWrap}>
          <Image
            source={logoSource}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.dayBlock}>
          <Text style={styles.dayName}>{dayName}</Text>
          <Text style={styles.fullDate}>{fullDate}</Text>
        </View>

        <View style={styles.waveWrap} pointerEvents="none">
          <Svg
            viewBox="0 0 1440 120"
            style={[
              styles.waveSvg,
              { width: Dimensions.get("window").width, height: 40 },
            ]}
            preserveAspectRatio="xMidYMax meet"
          >
            <Path
              d="M0 120V60C240 20 480 0 720 0C960 0 1200 20 1440 60V120H0Z"
              fill={background}
            />
          </Svg>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: primary,
  },
  gradient: {
    paddingBottom: 64,
    position: "relative",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  menuBtn: {
    padding: spacing.sm,
    margin: -spacing.sm,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconBtn: {
    padding: spacing.sm,
    margin: -spacing.sm,
    position: "relative",
  },
  badge: {
    position: "absolute",
    right: 0,
    top: 0,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
  },
  pressed: {
    opacity: 0.7,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: primaryForeground,
    fontSize: 14,
    fontWeight: "600",
  },
  logoWrap: {
    alignItems: "center",
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  logoImage: {
    width: 120,
    height: 48,
  },
  dayBlock: {
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  dayName: {
    ...typography.heroDay,
    color: primaryForeground,
  },
  fullDate: {
    ...typography.heroDate,
    marginTop: spacing.sm,
  },
  waveWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 40,
  },
  waveSvg: {
    width: "100%",
    height: "100%",
  },
});
