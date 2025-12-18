  import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

  export interface Friend {
    id: string;
    name: string;
    points: number;
    avatar?: string | null;
    online: boolean;
  }

  interface FriendCardProps {
    friend: Friend;
    rank: number;
    onChat: () => void;
    isMe?: boolean;
    actionLabel?: string;
    actionIcon?: keyof typeof Ionicons.glyphMap;
    onAction?: () => void;
  }

  export const FriendCard: React.FC<FriendCardProps> = ({ friend, rank, onChat, isMe, actionLabel, actionIcon, onAction }) => {
    const { colors, mode } = useThemeMode();
    const isLight = mode === "light";
    const cardBg = isMe ? colors.accent : colors.glass;
    const borderStyle = isMe ? {} : { borderWidth: 1, borderColor: colors.glassBorder };
    const rankColor = isMe ? colors.pillActive : colors.accent;
    const textColor = isMe ? colors.pillActive : colors.text;

    const avatarUri = friend.avatar && friend.avatar.length > 0 ? friend.avatar : null;
    const initial = friend.name ? friend.name.charAt(0).toUpperCase() : "?";

    return (
      <TouchableOpacity
        onPress={onChat}
        style={[styles.container, { backgroundColor: cardBg }, borderStyle]}
        activeOpacity={0.8}
      >
        <View style={styles.left}>
          <Text style={[styles.rank, { color: rankColor }]}>#{rank}</Text>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={[styles.avatar, isMe && { borderWidth: 2, borderColor: textColor }]} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, isMe && { borderWidth: 2, borderColor: textColor }]}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
          <Text style={[styles.name, { color: textColor }]}>{friend.name}</Text>
          {friend.online && <View style={[styles.dot, { backgroundColor: "#19D07D" }]} />}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[styles.points, { color: textColor }]}>{friend.points} pts</Text>
          {(!!actionLabel || !!actionIcon) && !isMe && (
            <TouchableOpacity onPress={onAction} style={{ backgroundColor: colors.surfaceAlt, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10 }}>
              {actionIcon ? (
                <Ionicons name={actionIcon} size={16} color={colors.text} />
              ) : (
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>{actionLabel}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderRadius: 22,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    left: { flexDirection: "row", alignItems: "center" },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      marginHorizontal: 8,
      overflow: "hidden",
      backgroundColor: "#1F2A27",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarFallback: { backgroundColor: "#2F3A36" },
    avatarInitial: { color: "#fff", fontWeight: "700" },
    name: { fontSize: 15, fontWeight: "600" },
    rank: { marginRight: 4, fontWeight: "bold" },
    dot: { width: 10, height: 10, borderRadius: 5, marginLeft: 6 },
    points: { fontWeight: "500" },
  });
