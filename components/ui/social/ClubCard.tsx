import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface Club {
  id: string;
  name: string;
  desc: string;
  participants: number;
  joined: boolean;
}

interface ClubCardProps {
  club: Club;
  onJoin: () => void;
  onChat: () => void;
}

export const ClubCard: React.FC<ClubCardProps> = ({ club, onJoin, onChat }) => {
  const { colors } = useThemeMode();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>{club.name}</Text>
      <Text style={[styles.desc, { color: colors.mutedText }]}>{club.desc}</Text>
      <Text style={[styles.participants, { color: colors.mutedText }]}>
        👥 {club.participants} membres
      </Text>

      <View style={styles.row}>
        <TouchableOpacity
          onPress={onJoin}
          style={[
            styles.joinBtn,
            { backgroundColor: club.joined ? "#D93636" : colors.accent },
          ]}
        >
          <Text style={[styles.joinText, { color: colors.text }]}>
            {club.joined ? "Quitter ❌" : "Rejoindre"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chatBtn,
            { borderColor: colors.accent, backgroundColor: colors.pill },
          ]}
          onPress={onChat}
        >
          <Ionicons name="chatbubbles-outline" size={18} color={colors.accent} />
          <Text style={[styles.chatText, { color: colors.accent }]}>Discuter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: "bold" },
  desc: { marginVertical: 6 },
  participants: { marginBottom: 10 },
  row: { flexDirection: "row" },
  joinBtn: { flex: 1, padding: 10, borderRadius: 12, alignItems: "center" },
  joinText: { fontWeight: "600" },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginLeft: 8,
    borderWidth: 1,
  },
  chatText: { marginLeft: 6, fontWeight: "600" },
});
