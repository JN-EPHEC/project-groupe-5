// components/ui/defi/ValidationCard.tsx
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; // ✅ AJOUT
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CATEGORY_CONFIG } from "./constants";

export type ValidationItem = {
  id: number | string;
  title: string;
  description: string;
  category: string;
  difficulty: "Facile" | "Moyen" | "Difficile" | string;
  points: number;
  audience: string;
  timeLeft: string;
  userName?: string;
  photoUrl?: string;
  comment?: string;
};

type Props = {
  item: ValidationItem;
  onValidate: () => void;
  onReject: () => void;
  onReport?: () => void;
};

// 🎨 THEME VALIDATION CARD
const validationTheme = {
    glassBg: ["rgba(255, 255, 255, 0.95)", "rgba(240, 253, 244, 0.95)"] as const,
    borderColor: "rgba(255, 255, 255, 0.6)",
    textMain: "#0A3F33",
    textMuted: "#4A665F",
    accent: "#008F6B",
};

export function ValidationCard({ item, onValidate, onReject, onReport }: Props) {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  
  // Couleurs dynamiques
  const cardText = isLight ? validationTheme.textMain : colors.text;
  const cardMuted = isLight ? validationTheme.textMuted : colors.mutedText;

  // Gestion sécurisée de la catégorie
  const categoryConfig = CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG] || { 
      label: item.category, 
      icon: "leaf-outline" 
  };

  //validation de commentaire => éviter l'affichage de commentaires vides
  const hasValidComment =
    typeof item.comment === "string" && item.comment.trim().length > 0;

  // Wrapper conditionnel (LinearGradient si Light, View si Dark)
  const Wrapper = isLight ? LinearGradient : View;
  const wrapperProps = isLight 
    ? { 
        colors: validationTheme.glassBg, 
        start: { x: 0, y: 0 }, 
        end: { x: 1, y: 1 }, 
        style: [styles.card, styles.glassEffect] 
      }
    : { 
        style: [styles.card, { backgroundColor: colors.surface || colors.card, borderColor: 'rgba(0,151,178,0.3)', borderWidth: 1 }] 
      };

  return (
    <Wrapper {...(wrapperProps as any)}> 
      {/* HEADER */}
      <View style={styles.header}>
        <View style={[styles.categoryPill, { backgroundColor: isLight ? "rgba(0,143,107,0.1)" : colors.surfaceAlt }]}> 
          <Ionicons name={categoryConfig.icon as any} size={14} color="#008F6B" />
          <Text style={[styles.categoryText, { color: "#008F6B" }]}>{categoryConfig.label}</Text>
        </View>

        <View style={[styles.pointsBadge, { backgroundColor: isLight ? "#D1FAE5" : "#1F3A33" }]}>
          <Ionicons name="leaf" size={14} color={isLight ? "#0F3327" : "#52D192"} />
          <Text style={[styles.pointsText, { color: isLight ? "#0F3327" : "#52D192" }]}>{item.points} pts</Text>
        </View>
      </View>

      {/* TITRE & AUTEUR */}
      <Text style={[styles.title, { color: cardText }]}>{item.title}</Text>
      <Text style={[styles.subtitle, { color: cardMuted }]}>
        Par {item.userName || "Utilisateur"}
      </Text>

      {/* PHOTO DE PREUVE */}
      {item.photoUrl && (
        <View style={styles.photoContainer}>
            <Image source={{ uri: item.photoUrl }} style={styles.photo} />
        </View>
      )}

      {/* COMMENTAIRE */}
      {hasValidComment && (
        <View style={styles.commentBox}>
          <Text style={{ color: cardText, fontStyle: "italic", fontSize: 13, textAlign: "center" }}>
            "{item.comment}"
          </Text>
        </View>
      )}

      {/* ACTIONS */}
      <View style={styles.actions}>
        <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: isLight ? "#FEF2F2" : "#2A171A", borderColor: "#FCA5A5", borderWidth: 1 }]}
            onPress={onReject}
        > 
          <Ionicons name="close-circle" size={18} color="#EF4444" />
          <Text style={[styles.actionText, { color: "#EF4444" }]}>Refuser</Text>
        </TouchableOpacity>

        {/* BOUTON SIGNALER */}
        <TouchableOpacity 
            style={[
                styles.actionBtn, 
                { backgroundColor: isLight ? '#FFFBEB' : '#451a03', borderColor: '#FCD34D', borderWidth: 1 }
            ]}
            onPress={onReport}
        >
          <Ionicons name="flag-outline" size={18} color="#D97706" />
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: isLight ? "#D1FAE5" : validationTheme.accent, flex: 1.5 }]} 
            onPress={onValidate}
        >
          <Ionicons name="checkmark-circle" size={18} color="#065F46" style={{ marginRight: 6 }} />
          <Text style={[styles.actionText, { color: "#065F46" }]}>Valider</Text>
        </TouchableOpacity>
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
  },
  glassEffect: {
    borderWidth: 1,
    borderColor: validationTheme.borderColor,
    shadowColor: "#005c4b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  categoryText: {
    fontWeight: "700",
    marginLeft: 4,
    fontSize: 11
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pointsText: {
    fontWeight: "700",
    marginLeft: 4,
    fontSize: 11
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
    fontFamily: "StylizedTitle" // Adapte si besoin
  },
  subtitle: {
    marginTop: 2,
    marginBottom: 12,
    fontSize: 13,
  },
  photoContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 4,
    borderColor: "#fff", // Cadre photo blanc
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
  },
  photo: {
    height: 200,
    width: "100%",
    resizeMode: "cover",
  },
  commentBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)"
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 12,
    gap: 6
  },
  actionText: {
    fontWeight: "700",
    fontSize: 13,
  },
});