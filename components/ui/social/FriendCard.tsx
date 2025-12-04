import { useThemeMode } from "@/hooks/theme-context";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface Friend {
  id: string;
  name: string;
  points: number;
  photoURL: string;
  online: boolean;
}

interface FriendCardProps {
  friend: Friend;
  rank: number;
  onChat: () => void;
  isMe?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export const FriendCard: React.FC<FriendCardProps> = ({ friend, rank, onChat, isMe, actionLabel, onAction }) => {
  const { colors } = useThemeMode();
  const rankColor = isMe ? "#0F3327" : colors.accent;
  const getDefaultAvatar = (seed: string) =>
    `https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(seed || "GreenUp")}&backgroundColor=1F2A27&textColor=ffffff`;
  const avatarUri = friend.photoURL && friend.photoURL.length > 0 ? friend.photoURL : getDefaultAvatar(friend.name || friend.id);

  return (
    <TouchableOpacity
      onPress={onChat}
      style={[styles.container, { backgroundColor: isMe ? colors.accent : colors.surface }]}
      activeOpacity={0.8}
    >
      <View style={styles.left}>
        <Text style={[styles.rank, { color: rankColor }]}>#{rank}</Text>
        <Image
          source={{ uri: avatarUri }}
          style={[styles.avatar, isMe && { borderWidth: 2, borderColor: colors.text }]}
        />
        <Text style={[styles.name, { color: colors.text }]}>{friend.name}</Text>
        {friend.online && <View style={[styles.dot, { backgroundColor: "#19D07D" }]} />}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={[styles.points, { color: colors.text }]}>{friend.points} pts</Text>
        {!!actionLabel && !isMe && (
          <TouchableOpacity onPress={onAction} style={{ backgroundColor: colors.surfaceAlt, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10 }}>
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>{actionLabel}</Text>
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
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  left: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 34, height: 34, borderRadius: 17, marginHorizontal: 8 },
  name: { fontSize: 15, fontWeight: "600" },
  rank: { marginRight: 4, fontWeight: "bold" },
  dot: { width: 10, height: 10, borderRadius: 5, marginLeft: 6 },
  points: { fontWeight: "500" },
});
