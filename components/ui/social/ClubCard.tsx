import { GradientButton } from "@/components/ui/common/GradientButton";
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
  city?: string;
}

interface ClubCardProps {
  club: Club;
  onJoin: () => void;
  onChat: () => void;
  onRanking?: () => void;
  totalPoints?: number;
}

export const ClubCard: React.FC<ClubCardProps> = ({ club, onJoin, onChat, onRanking, totalPoints }) => {
  const { colors } = useThemeMode();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>{club.name}</Text>
      <Text style={[styles.desc, { color: colors.mutedText }]}>{club.desc}</Text>
      {club.city ? (
        <Text style={[styles.city, { color: colors.mutedText }]}>🏙️ {club.city}</Text>
      ) : null}
      <Text style={[styles.participants, { color: colors.mutedText }]}>
        👥 {club.participants} membres
      </Text>

      <View style={styles.row}>
        {club.joined ? (
          <TouchableOpacity onPress={onJoin} style={[styles.joinBtn, { backgroundColor: "#D93636" }]}>
            <Text style={[styles.joinText, { color: "#fff" }]}>Quitter ❌</Text>
          </TouchableOpacity>
        ) : (
          <GradientButton label="Rejoindre" onPress={onJoin} style={{ flex: 1, borderRadius: 12 }} />
        )}

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

        {club.joined && onRanking && (
          <TouchableOpacity
            style={[styles.chatBtn, { borderColor: colors.accent, backgroundColor: colors.pill }]}
            onPress={onRanking}
          >
            <Ionicons name="document-text-outline" size={18} color={colors.accent} />
            <Text style={[styles.chatText, { color: colors.accent }]}>
              {typeof totalPoints === 'number' ? `${totalPoints} pts` : 'Points'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: "bold" },
  desc: { marginVertical: 6 },
  city: { marginBottom: 6 },
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
