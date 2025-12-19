// components/ui/defi/ValidationCard.tsx
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CATEGORY_CONFIG } from "./constants";

export type ValidationItem = {
  id: number | string;
  title: string;
  description: string;
  category: string; // Simplifié pour matcher avec ce qui vient de Firebase
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
  onReport?: () => void; // 👇 La fonction qui vient du parent (defi.tsx)
};

export function ValidationCard({ item, onValidate, onReject, onReport }: Props) {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  
  const cardAlt = isLight ? colors.cardAlt : "rgba(0, 151, 178, 0.05)";
  const cardText = isLight ? colors.cardText : colors.text;
  const cardMuted = isLight ? colors.cardMuted : colors.mutedText;

  // Gestion sécurisée de la catégorie (si inconnue, icône par défaut)
  const categoryConfig = CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG] || { 
      label: item.category, 
      icon: "leaf-outline" 
  };

  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: colors.glass || colors.card, // Fallback si colors.glass n'est pas défini
        borderColor: colors.glassBorder || "transparent",
        borderWidth: colors.glassBorder ? 1 : 0,
        // Ajout d'une ombre douce si pas de bordure "glass"
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }
    ]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={[styles.categoryPill, { backgroundColor: cardAlt }]}> 
          <Ionicons name={categoryConfig.icon as any} size={16} color="#7DCAB0" />
          <Text style={styles.categoryText}>{categoryConfig.label}</Text>
        </View>

        <View style={styles.pointsBadge}>
          <Ionicons name="leaf" size={16} color="#0F3327" />
          <Text style={styles.pointsText}>{item.points} pts</Text>
        </View>
      </View>

      {/* TITRE & AUTEUR */}
      <Text style={[styles.title, { color: cardText }]}>{item.title}</Text>
      <Text style={[styles.subtitle, { color: cardMuted }]}>
        Par {item.userName || "Utilisateur"}
      </Text>

      {/* PHOTO DE PREUVE */}
      {item.photoUrl && (
        <Image source={{ uri: item.photoUrl }} style={styles.photo} />
      )}

      {/* COMMENTAIRE */}
      {item.comment && (
        <View style={[styles.commentBox, { backgroundColor: cardAlt }]}>
            <Text style={{ color: cardText, fontStyle: "italic", fontSize: 13 }}>
                "{item.comment}"
            </Text>
        </View>
      )}

      {/* ACTIONS */}
      <View style={styles.actions}>
        <TouchableOpacity 
            style={[styles.secondaryButton, { backgroundColor: cardAlt }]}
            onPress={onReject}
        > 
          <Ionicons name="close-circle" size={18} color={cardMuted} style={styles.leadingIcon} />
          <Text style={[styles.secondaryText, { color: cardMuted }]}>Refuser</Text>
        </TouchableOpacity>

        {/* 👇 BOUTON SIGNALER CONNECTÉ À onReport */}
        <TouchableOpacity 
            style={[
                styles.warnButton, 
                { backgroundColor: isLight ? '#FEF3C7' : '#451a03', borderColor: '#D97706', borderWidth: 1 }
            ]}
            onPress={onReport} // Appelle la modale globale
        >
          <Ionicons name="flag-outline" size={18} color="#D97706" style={styles.leadingIcon} />
          <Text style={[styles.warnText, { color: '#D97706' }]}>Signaler</Text>
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.successButton, { backgroundColor: colors.accent }]} 
            onPress={onValidate}
        >
          <Ionicons name="checkmark-circle" size={18} color="#0F3327" style={styles.leadingIcon} />
          <Text style={styles.successText}>Valider</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryText: {
    color: "#7DCAB0",
    fontWeight: "600",
    marginLeft: 6,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D4F7E7",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pointsText: {
    color: "#0F3327",
    fontWeight: "700",
    marginLeft: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 12,
  },
  photo: {
    borderRadius: 18,
    height: 180,
    width: "100%",
    marginBottom: 12,
    resizeMode: "cover",
  },
  commentBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    paddingVertical: 12,
  },
  warnButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    paddingVertical: 12,
  },
  successButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    paddingVertical: 12,
  },
  warnText: {
    fontWeight: '700',
    fontSize: 12,
  },
  secondaryText: {
    fontWeight: "600",
    fontSize: 12,
  },
  successText: {
    color: "#0F3327",
    fontWeight: "700",
    fontSize: 12,
  },
  leadingIcon: {
    marginRight: 6,
  },
});