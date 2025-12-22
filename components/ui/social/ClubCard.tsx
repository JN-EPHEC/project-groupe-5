import { GradientButton } from "@/components/ui/common/GradientButton";
import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface Club {
  id: string;
  name: string;
  desc: string;
  participants: number;
  joined: boolean;
  city?: string;
  emoji?: string;
  photoUri?: string;
  ownerId?: string;
  officers?: string[];
  requestPending?: boolean;
}

interface ClubCardProps {
  club: Club;
  onJoin: () => void;
  onMembers: () => void;
  onRanking?: () => void;
  totalPoints?: number;
}

// 🎨 THEME CLUB CARD
const clubTheme = {
    glassBg: ["rgba(240, 253, 244, 0.95)", "rgba(255, 255, 255, 0.85)"] as const,
    borderColor: "rgba(255, 255, 255, 0.6)",
    textMain: "#0A3F33", 
    textMuted: "#4A665F",
    accent: "#008F6B", 
};

export const ClubCard: React.FC<ClubCardProps> = ({ club, onJoin, onMembers, onRanking, totalPoints }) => {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";

  const cardText = isLight ? clubTheme.textMain : colors.text;
  const cardMuted = isLight ? clubTheme.textMuted : colors.mutedText;

  const Wrapper = isLight ? LinearGradient : View;
  const wrapperProps = isLight 
    ? { 
        colors: clubTheme.glassBg, 
        start: { x: 0, y: 0 }, 
        end: { x: 1, y: 1 }, 
        style: [styles.card, styles.glassEffect] 
      }
    : { 
        style: [styles.card, { backgroundColor: colors.surface, borderColor: 'rgba(0,151,178,0.3)', borderWidth: 1 }] 
      };

  return (
    <Wrapper {...(wrapperProps as any)}>
      <View style={styles.headerRow}>
        {club.photoUri ? (
          <Image source={{ uri: club.photoUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: isLight ? "#E0F7EF" : colors.pill, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 18 }}>{club.emoji || '🌿'}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: cardText }]}>{club.name}</Text>
            {club.city ? (
                <Text style={[styles.city, { color: cardMuted }]}>🏙️ {club.city}</Text>
            ) : null}
        </View>
      </View>

      <Text style={[styles.desc, { color: cardMuted }]} numberOfLines={2}>{club.desc}</Text>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Ionicons name="people-outline" size={14} color={cardMuted} style={{ marginRight: 4 }} />
        <Text style={[styles.participants, { color: cardMuted, marginBottom: 0 }]}>
            {club.participants} membres
        </Text>
      </View>

      <View style={styles.row}>
        {club.joined ? (
          <TouchableOpacity onPress={onJoin} style={[styles.joinBtn, { backgroundColor: "#FFE4E4", borderColor: "#FFCDCD", borderWidth: 1 }]}>
            <Text style={[styles.joinText, { color: "#D93636" }]}>Quitter</Text>
          </TouchableOpacity>
        ) : (
          club.requestPending ? (
            <View style={[styles.joinBtn, { backgroundColor: isLight ? "#F0FDF4" : colors.surfaceAlt, borderColor: isLight ? "#BBF7D0" : "transparent", borderWidth: 1 }]}>
              <Text style={{ color: isLight ? "#4A665F" : colors.mutedText, fontFamily: FontFamilies.headingMedium }}>Demande envoyée</Text>
            </View>
          ) : (
            <GradientButton label="Rejoindre" onPress={onJoin} style={{ flex: 1, borderRadius: 12, height: 40 }} />
          )
        )}

        <TouchableOpacity
          style={[
            styles.chatBtn,
            { borderColor: isLight ? "#BBF7D0" : colors.accent, backgroundColor: isLight ? "#F0FDF4" : colors.pill },
          ]}
          onPress={onMembers}
        >
          <Ionicons name="people" size={18} color={isLight ? clubTheme.accent : colors.accent} />
        </TouchableOpacity>

        {club.joined && onRanking && (
          <TouchableOpacity
            style={[styles.chatBtn, { borderColor: isLight ? "#BBF7D0" : colors.accent, backgroundColor: isLight ? "#F0FDF4" : colors.pill }]}
            onPress={onRanking}
          >
            <Ionicons name="leaf" size={18} color={isLight ? clubTheme.accent : colors.accent} />
            <Text style={[styles.chatText, { color: isLight ? clubTheme.accent : colors.accent }]}>
              {typeof totalPoints === 'number' ? `${totalPoints}` : ''}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 16, marginBottom: 12 },
  glassEffect: {
    borderWidth: 1,
    borderColor: clubTheme.borderColor,
    shadowColor: "#005c4b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 17, fontFamily: FontFamilies.heading },
  desc: { marginVertical: 6, fontSize: 14, fontFamily: FontFamilies.body },
  city: { fontSize: 13, marginTop: 2, fontFamily: FontFamilies.body, fontWeight: '600' }, 
  participants: { fontSize: 13, fontFamily: FontFamilies.body, fontWeight: '600' },
  row: { flexDirection: "row", gap: 8 },
  joinBtn: { flex: 1, height: 40, borderRadius: 12, alignItems: "center", justifyContent: 'center' },
  joinText: { fontFamily: FontFamilies.headingMedium },
  avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 12 },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center',
    borderRadius: 12,
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  // CORRECTION ICI : bodyStrong n'existe pas -> on utilise headingMedium ou body + fontWeight
  chatText: { marginLeft: 6, fontFamily: FontFamilies.headingMedium, fontSize: 13 },
});