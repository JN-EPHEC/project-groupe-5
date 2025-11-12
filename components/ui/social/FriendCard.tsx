import { useThemeMode } from "@/hooks/theme-context";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface Friend {
  id: string;
  name: string;
  points: number;
  avatar: string;
  online: boolean;
}

interface FriendCardProps {
  friend: Friend;
  rank: number;
  onChat: () => void;
}

export const FriendCard: React.FC<FriendCardProps> = ({ friend, rank, onChat }) => {
  const { colors } = useThemeMode();

  return (
    <TouchableOpacity
      onPress={onChat}
      style={[styles.container, { backgroundColor: colors.surface }]}
      activeOpacity={0.8}
    >
      <View style={styles.left}>
        <Text style={[styles.rank, { color: colors.accent }]}>#{rank}</Text>
        <Image source={{ uri: friend.avatar }} style={styles.avatar} />
        <Text style={[styles.name, { color: colors.text }]}>{friend.name}</Text>
        {friend.online && <View style={[styles.dot, { backgroundColor: "#19D07D" }]} />}
      </View>
      <Text style={[styles.points, { color: colors.mutedText }]}>
        {friend.points} pts
      </Text>
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
