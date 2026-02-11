import {
    foreground,
    mutedForeground,
    primaryForeground,
    typography,
} from "@/constants/theme";
import { getMediaSource } from "@/utils/api";
import { hapticImpact } from "@/utils/haptics";
import { Image, StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "./AnimatedPressable";
import { Card } from "./Card";

type ListCardProps = {
  title: string;
  subtitle?: string;
  /** Extra lines or content below title (e.g. date, meta) */
  meta?: string | string[];
  badge?: { text: string; backgroundColor?: string; textColor?: string };
  /** Optional avatar/photo URL - shows circular image on the left */
  avatarUrl?: string | null;
  onPress?: () => void;
  children?: React.ReactNode;
};

export function ListCard({
  title,
  subtitle,
  meta,
  badge,
  avatarUrl,
  onPress,
  children,
}: ListCardProps) {
  const metaLines = Array.isArray(meta) ? meta : meta ? [meta] : [];
  const showAvatar = avatarUrl !== undefined;
  const initial = title.trim()[0]?.toUpperCase() ?? "?";
  const content = (
    <View style={styles.row}>
      {showAvatar ? (
        avatarUrl ? (
          <View style={styles.avatarWrap}>
            <Image source={getMediaSource(avatarUrl)} style={styles.avatar} />
          </View>
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )
      ) : null}
      <View style={styles.main}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.meta}>{subtitle}</Text> : null}
        {metaLines.map((line, i) => (
          <Text key={i} style={styles.meta}>
            {line}
          </Text>
        ))}
        {children}
      </View>
      {badge ? (
        <View
          style={[
            styles.badge,
            badge.backgroundColor
              ? { backgroundColor: badge.backgroundColor }
              : undefined,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              badge.textColor ? { color: badge.textColor } : undefined,
            ]}
          >
            {badge.text}
          </Text>
        </View>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={() => {
          hapticImpact();
          onPress();
        }}
      >
        <Card>{content}</Card>
      </AnimatedPressable>
    );
  }
  return <Card>{content}</Card>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: mutedForeground,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: "600",
    color: primaryForeground,
  },
  main: { flex: 1, minWidth: 0 },
  title: { ...typography.title, color: foreground, marginBottom: 8 },
  meta: { fontSize: 13, color: mutedForeground, marginBottom: 6 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: mutedForeground,
  },
  badgeText: { color: primaryForeground, fontSize: 12, fontWeight: "500" },
  pressed: { opacity: 0.8 },
});
