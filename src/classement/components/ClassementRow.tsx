import { FontFamilies } from "@/constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { ClassementUser } from "../types/classement";

type Props = {
  user: ClassementUser;
  isDarkMode: boolean;
};

// 🎨 CONFIGURATION DES RANGS (Couleurs & Fonds)
const getRankConfig = (rank: number) => {
  // #1 : OR
  if (rank === 1) return { 
    main: "#FFD700", 
    bgDark: ["rgba(255, 215, 0, 0.15)", "rgba(255, 215, 0, 0.05)"], 
    bgLight: ["#FFF9C4", "#FFFDE7"], 
    icon: "trophy", badge: true 
  };
  
  // #2 : ARGENT (Brillant)
  if (rank === 2) return { 
    main: "#C0C0C0", 
    bgDark: ["rgba(192, 192, 192, 0.15)", "rgba(192, 192, 192, 0.05)"], 
    bgLight: ["#F1F5F9", "#F8FAFC"], 
    icon: "medal", badge: true 
  };
  
  // #3 : BRONZE
  if (rank === 3) return { 
    main: "#FB923C", 
    bgDark: ["rgba(251, 146, 60, 0.15)", "rgba(251, 146, 60, 0.05)"], 
    bgLight: ["#FFEDD5", "#FFF7ED"], 
    icon: "medal", badge: true 
  };
  
  // #4 - #5 : CYAN
  if (rank <= 5) return { 
    main: "#2DD4BF", 
    bgDark: ["rgba(45, 212, 191, 0.15)", "rgba(45, 212, 191, 0.05)"], 
    bgLight: ["#CCFBF1", "#E0F2FE"], 
    icon: "flame", badge: false 
  };
  
  // #6 - #10 : BLEU CIEL
  if (rank <= 10) return { 
    main: "#38BDF8", 
    bgDark: ["rgba(56, 189, 248, 0.15)", "rgba(56, 189, 248, 0.05)"], 
    bgLight: ["#E0F2FE", "#F0F9FF"], 
    icon: "star", badge: false 
  };

  // #11 - #25 : GRIS ARDOISE (Distinct de l'argent, "Slate Blue")
  if (rank <= 25) return { 
    main: "#64748B", 
    bgDark: ["rgba(100, 116, 139, 0.15)", "rgba(100, 116, 139, 0.05)"], 
    bgLight: ["#F1F5F9", "#F8FAFC"], 
    icon: null, badge: false 
  };
  
  // Reste (> 25) : VERT APP
  return { 
    main: "#008F6B", 
    bgDark: ["#0F2825", "#081C1A"], 
    bgLight: ["#FFFFFF", "#F0FDF4"], 
    icon: null, badge: false 
  };
};

export function ClassementRow({ user, isDarkMode }: Props) {
  const rank = user.rank ?? 999;
  const isCurrentUser = user.isCurrentUser;
  const isQualified = user.qualified === true;
  const config = getRankConfig(rank);
  
  const displayName = user.displayName || "Utilisateur";
  const avatarColor = (user as any).avatarColor || "#19D07D"; 
  
  // ✅ FIX INITIALES : Utilise la 1ère lettre de chaque mot (Ex: "Vincent Goffinet" -> "VG")
  const initials = displayName
    .trim()
    .split(/\s+/) // Sépare par les espaces
    .map((n) => n[0]) // Prend la 1ère lettre
    .join("")
    .toUpperCase()
    .slice(0, 2); // Garde max 2 lettres

  const isWhiteBg = ["#FFFFFF", "#ffffff", "#fff", "#FFF"].includes(avatarColor);

  // Couleurs adaptatives
  const textColorPrimary = isDarkMode ? "#FFFFFF" : "#0A3F33"; 
  const textColorSecondary = isDarkMode ? "#94a3b8" : "#4A665F"; 
  const rankTextColor = rank <= 25 ? config.main : (isDarkMode ? "#FFFFFF" : "#0A3F33");

  // Fond de carte
  let backgroundGradient = isDarkMode ? config.bgDark : config.bgLight;
  let borderColor = config.main; 
  let borderWidth = isCurrentUser ? 2 : 1; 

  // Distinction "C'est moi"
  if (isCurrentUser) {
     backgroundGradient = isDarkMode 
        ? [`${config.main}40`, `${config.main}15`] // Plus visible
        : [`${config.main}40`, "#FFFFFF"]; 
  } else if (isDarkMode) {
     borderColor = "rgba(255,255,255,0.1)"; // Bordure subtile pour les autres
     borderWidth = 0.5;
  }

  // Couleur du texte des initiales
  const initialsColor = isWhiteBg ? "#1A1A1A" : "#FFFFFF";

  return (
    <LinearGradient
      colors={backgroundGradient as [string, string]} 
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[
        styles.card,
        { 
          borderColor: borderColor,
          borderWidth: borderWidth,
          opacity: isQualified || isCurrentUser ? 1 : 0.6,
          shadowColor: isCurrentUser ? config.main : "transparent",
          shadowOpacity: isCurrentUser ? 0.3 : 0,
          shadowRadius: 8,
          elevation: isCurrentUser ? 4 : 0,
        }
      ]}
    >
      {/* 1. RANG */}
      <View style={styles.rankContainer}>
        <Text style={[
          styles.rankText, 
          { 
            color: rankTextColor,
            fontSize: rank <= 3 ? 22 : 16,
          }
        ]}>
          #{rank}
        </Text>
      </View>

      {/* 2. AVATAR */}
      <View style={styles.avatarWrapper}>
        <View style={[
            styles.avatarBorder, 
            { 
                borderColor: config.main,
                borderWidth: rank <= 3 ? 2.5 : 1.5,
            }
        ]}>
            {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: avatarColor }]}>
                    <Text style={[styles.avatarInitials, { color: initialsColor }]}>
                        {initials}
                    </Text>
                </View>
            )}
        </View>
        
        {config.badge && (
            <View style={[styles.miniBadge, { backgroundColor: config.main, borderColor: isDarkMode ? "#000" : "#fff" }]}>
                <Ionicons name={config.icon as any} size={10} color={isDarkMode ? "#000" : "#fff"} />
            </View>
        )}
      </View>

      {/* 3. INFOS */}
      <View style={styles.infoContainer}>
        <Text 
            numberOfLines={1} 
            ellipsizeMode="tail"
            style={[
                styles.name, 
                { 
                    color: textColorPrimary, 
                    fontWeight: isCurrentUser ? "800" : "700"
                }
            ]}
        >
          {displayName}
        </Text>
        
        {!isQualified ? (
            <Text style={styles.notQualifiedText}>Non qualifié</Text>
        ) : (
            <Text style={[
                styles.subText, 
                { color: rank <= 25 ? config.main : textColorSecondary }
            ]}>
                {rank <= 10 ? "Au sommet !" : "Continue !"}
            </Text>
        )}
      </View>

      {/* 4. POINTS */}
      <View style={styles.pointsContainer}>
        <Text style={[styles.pointsValue, { color: textColorPrimary }]}>
            {user.rankingPoints}
        </Text>
        <Text style={[styles.pointsUnit, { color: textColorSecondary }]}>pts</Text>
      </View>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 18,
    marginBottom: 8,
  },
  rankContainer: {
    width: 38,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  rankText: {
    fontFamily: FontFamilies.heading,
    fontWeight: "900",
    fontStyle: "italic",
  },
  avatarWrapper: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarBorder: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    padding: 2, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: FontFamilies.heading
  },
  miniBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
    marginRight: 4,
  },
  name: {
    fontSize: 15,
    fontFamily: FontFamilies.body,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  subText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: FontFamilies.body,
  },
  notQualifiedText: {
    fontSize: 11,
    color: "#EF4444",
    fontWeight: "600",
    fontStyle: 'italic'
  },
  pointsContainer: {
    alignItems: "flex-end",
    minWidth: 40,
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: "800",
    fontFamily: FontFamilies.heading,
  },
  pointsUnit: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: -2,
  }
});