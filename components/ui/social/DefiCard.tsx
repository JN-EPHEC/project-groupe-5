import { useThemeMode } from "@/hooks/theme-context";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface Defi {
  id: string;
  name: string;
  desc: string;
  places: number;
  mode: string;
  joined: boolean;
}

interface DefiCardProps {
  defi: Defi;
  onJoin: () => void;
}

export const DefiCard: React.FC<DefiCardProps> = ({ defi, onJoin }) => {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  const cardText = isLight ? colors.cardText : colors.text;
  const cardMuted = isLight ? colors.cardMuted : colors.mutedText;

  return (
    <View style={[styles.card, { backgroundColor: isLight ? colors.card : colors.surface }]}> 
      <Text style={[styles.title, { color: cardText }]}>{defi.name}</Text>
      <Text style={[styles.desc, { color: cardMuted }]}>{defi.desc}</Text>
      <Text style={[styles.participants, { color: cardMuted }]}>
        🧍‍♂️ {defi.mode.toUpperCase()} • {defi.places} places restantes
      </Text>

      <TouchableOpacity
        onPress={onJoin}
        style={[
          styles.joinBtn,
          { backgroundColor: defi.joined ? colors.surfaceAlt : colors.accent },
        ]}
      >
        <Text
          style={[
            styles.joinText,
            { color: defi.joined ? colors.text : "#0F3327" },
          ]}
        >
          {defi.joined ? "Rejoint ✅" : "Rejoindre"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: "bold" },
  desc: { marginVertical: 6 },
  participants: { marginBottom: 10 },
  joinBtn: { padding: 10, borderRadius: 12, alignItems: "center" },
  joinText: { fontWeight: "600" },
});
