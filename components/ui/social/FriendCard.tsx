import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

const friendTheme = {
    glassBg: ["rgba(240, 253, 244, 0.95)", "rgba(255, 255, 255, 0.85)"] as const,
    // THEME SOMBRE (Menthe Givrée Dark)
    darkGlassBg: ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"] as const,
    borderColor: "rgba(255, 255, 255, 0.6)",
    darkBorderColor: "rgba(0, 151, 178, 0.3)",
    textMain: "#0A3F33",
    textMuted: "#4A665F",
    accent: "#008F6B", 
    rankColor: "#008F6B",
};

export const FriendCard: React.FC<FriendCardProps> = ({ friend, rank, onChat, isMe, actionLabel, actionIcon, onAction }) => {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";

  // COULEURS ADAPTÉES
  const textColor = isMe ? (isLight ? "#0F3327" : "#0F3327") : (isLight ? friendTheme.textMain : "#FFF");
  const pointsColor = isMe ? (isLight ? "#0F3327" : "#0F3327") : (isLight ? friendTheme.accent : colors.accent);
  const rankColor = isMe ? (isLight ? "#0F3327" : "#0F3327") : (isLight ? friendTheme.rankColor : colors.accent);

  const avatarUri = friend.avatar && friend.avatar.length > 0 ? friend.avatar : null;
  const initial = friend.name ? friend.name.charAt(0).toUpperCase() : "?";

  // Wrapper : Toujours LinearGradient sauf pour "Moi" en dark (on garde le vert uni pour se distinguer)
  const Wrapper = (isMe && !isLight) ? TouchableOpacity : LinearGradient;
  
  let wrapperProps: any = {
      // Props communes
      style: [styles.container]
  };

  if (isMe && !isLight) {
      // CAS SPECIAL : "Moi" en mode sombre -> Fond vert uni
      wrapperProps.style.push({ backgroundColor: colors.accent });
      wrapperProps.onPress = onChat;
      wrapperProps.activeOpacity = 0.8;
  } else {
      // CAS STANDARD : Glassmorphism (Light ou Dark)
      wrapperProps = {
          ...wrapperProps,
          colors: isLight ? friendTheme.glassBg : friendTheme.darkGlassBg,
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
          style: [
              styles.container, 
              // Bordure adaptée
              { 
                  borderWidth: 1, 
                  borderColor: isLight ? friendTheme.borderColor : friendTheme.darkBorderColor 
              },
              isLight && styles.lightShadow // Ombre seulement en light
          ]
      };
  }

  // Rendu du contenu interne
  const content = (
    <>
    <View style={styles.left}>
      <Text style={[styles.rank, { color: rankColor }]}>#{rank}</Text>
      
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={[styles.avatar, isMe && { borderWidth: 2, borderColor: textColor }]} />
      ) : (
        <View style={[
            styles.avatar, 
            styles.avatarFallback, 
            { backgroundColor: isLight ? "#E0F7EF" : "rgba(255,255,255,0.1)" }, 
            isMe && { borderWidth: 2, borderColor: textColor }
        ]}>
          <Text style={[styles.avatarInitial, { color: isLight ? friendTheme.textMain : "#fff" }]}>{initial}</Text>
        </View>
      )}
      
      <View>
        <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>{friend.name}</Text>
        {friend.online && <Text style={{ fontSize: 10, color: '#19D07D', fontWeight: '600' }}>En ligne</Text>}
      </View>
    </View>

    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text style={[styles.points, { color: pointsColor }]}>{friend.points} pts</Text>
      
      {(!!actionLabel || !!actionIcon) && !isMe && (
        <TouchableOpacity 
            onPress={onAction} 
            style={[
                styles.actionBtn, 
                { backgroundColor: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.1)" }
            ]}
        >
          {actionIcon ? (
            <Ionicons name={actionIcon} size={18} color={isLight ? "#D93636" : "#F45B69"} />
          ) : (
            <Text style={{ color: isLight ? friendTheme.textMuted : "#CCC", fontSize: 12, fontWeight: '600' }}>{actionLabel}</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
    </>
  );

  // Si c'est un LinearGradient, on l'enveloppe dans un TouchableOpacity pour le clic
  if (Wrapper === LinearGradient) {
      return (
        <TouchableOpacity activeOpacity={0.8} onPress={onChat}>
            <Wrapper {...wrapperProps}>
                {content}
            </Wrapper>
        </TouchableOpacity>
      )
  }

  // Sinon (cas "Moi" dark mode), le TouchableOpacity est déjà le wrapper
  return (
    <Wrapper {...wrapperProps}>
        {content}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  lightShadow: {
    shadowColor: "#005c4b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  left: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallback: { justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontWeight: "700", fontSize: 16 },
  name: { fontSize: 16, fontFamily: FontFamilies.headingMedium },
  rank: { fontWeight: "bold", fontFamily: FontFamilies.heading, width: 30, textAlign: 'center' },
  points: { fontFamily: FontFamilies.bodyStrong, fontSize: 14 },
  actionBtn: {
      padding: 8,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center'
  }
});