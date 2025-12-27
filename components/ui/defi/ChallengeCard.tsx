// components/ui/defi/ChallengeCard.tsx
import { useChallenges } from "@/hooks/challenges-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Challenge } from "./types";

type Props = {
  challenge: Challenge;
  categorie: "personnel" | "club";
  isOngoing: boolean;
  onToggle: (id: number) => void;
  status?: "active" | "pendingValidation" | "validated";
  onValidatePhoto?: () => void;
  onReport?: () => void;
};

// 🎨 THEME CHALLENGE CARD
const challengeTheme = {
    glassBg: ["rgba(240, 253, 244, 0.95)", "rgba(255, 255, 255, 0.85)"] as const,
    // On rend le fond actif plus blanc pour le contraste avec le texte vert
    activeGlassBg: ["#FFFFFF", "#F0FDF4"] as const, 
    borderColor: "rgba(255, 255, 255, 0.6)",
    textMain: "#0A3F33",
    textMuted: "#4A665F",
    accent: "#008F6B",
};

export function ChallengeCard({
  challenge,
  categorie,
  isOngoing,
  onToggle,
  status,
  onValidatePhoto,
  onReport,
}: Props) {
  const { colors, mode } = useThemeMode();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const { current, reviewCompleted, reviewRequiredCount } = useChallenges();

  const isValidatedAndClaimed =
    current?.id === challenge.id &&
    current?.finalStatus === "validated" &&
    current?.pointsClaimed === true;

  const categoryLabel = categorie === "personnel" ? "Perso" : "Club";
  const categoryIcon = categorie === "personnel" ? "person-outline" : "people-outline";

  const shouldHide = useMemo(() => {
    if (!isOngoing) return false;

    // Only hide other ongoing challenges when the user's own personal
    // challenge is in the pendingValidation state and the validation
    // gate has been reached.
    if (!current || current.status !== "pendingValidation") return false;

    if (reviewRequiredCount > 0 && reviewCompleted >= reviewRequiredCount) {
      if (current && current.id !== challenge.id) return true;
    }
    return false;
  }, [isOngoing, reviewCompleted, reviewRequiredCount, current, challenge.id]);

  const isLightMode = mode === "light";
  
  const cardText = isLightMode ? challengeTheme.textMain : colors.text;
  const cardMuted = isLightMode ? challengeTheme.textMuted : colors.mutedText;
  const accentColor = isLightMode ? challengeTheme.accent : colors.accent;

  // Configuration de la difficulté (Couleurs)
  const diffColors = {
      Facile: { bg: isLightMode ? "#E6FFFA" : "#142822", text: "#38A169" },
      Moyen: { bg: isLightMode ? "#FFFBEB" : "#2A2617", text: "#D69E2E" },
      Difficile: { bg: isLightMode ? "#FFF5F5" : "#2A171A", text: "#E53E3E" }
  };
  const diffStyle = diffColors[challenge.difficulty as keyof typeof diffColors] || diffColors.Facile;

  const [remainingMs, setRemainingMs] = useState<number>(0);

  useEffect(() => {
    if (!isOngoing) return;
    const computeNextNoon = () => {
      const now = new Date();
      const noonToday = new Date(now);
      noonToday.setHours(12, 0, 0, 0);
      let target = noonToday;
      if (now.getTime() >= noonToday.getTime()) {
        const noonTomorrow = new Date(now);
        noonTomorrow.setDate(noonTomorrow.getDate() + 1);
        noonTomorrow.setHours(12, 0, 0, 0);
        target = noonTomorrow;
      }
      setRemainingMs(Math.max(0, target.getTime() - now.getTime()));
    };
    computeNextNoon();
    const timer = setInterval(computeNextNoon, 1000);
    return () => clearInterval(timer);
  }, [isOngoing]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (shouldHide) return null;

  const Wrapper = isLightMode ? LinearGradient : View;
  
  // Utilisation d'une bordure verte plus marquée quand c'est actif pour le contraste
  const wrapperProps = isLightMode 
    ? { 
        colors: isOngoing ? challengeTheme.activeGlassBg : challengeTheme.glassBg, 
        start: { x: 0, y: 0 }, 
        end: { x: 1, y: 1 }, 
        style: [
            styles.card, 
            styles.glassEffect, 
            isOngoing && { borderColor: "#BBF7D0", borderWidth: 1.5 } // Bordure plus visible si actif
        ] 
      }
    : { 
        style: [styles.card, { backgroundColor: isOngoing ? "#1A2F28" : colors.surface, borderColor: 'rgba(0,151,178,0.3)', borderWidth: 1 }] 
      };

  return (
    <Wrapper {...(wrapperProps as any)}>
      {/* --- HEADER : CATEGORIE | DIFFICULTÉ | POINTS --- */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* 1. Catégorie */}
            <View style={[styles.pill, { backgroundColor: isLightMode ? "rgba(0,143,107,0.1)" : colors.surfaceAlt }]}>
              <Ionicons name={categoryIcon} size={13} color={accentColor} />
              <Text style={[styles.pillText, { color: accentColor }]}>{categoryLabel}</Text>
            </View>

            {/* 2. Difficulté (Déplacé ici) */}
            <View style={[styles.pill, { backgroundColor: diffStyle.bg }]}>
                <Ionicons name="speedometer-outline" size={13} color={diffStyle.text} />
                <Text style={[styles.pillText, { color: diffStyle.text }]}>{challenge.difficulty}</Text>
            </View>

            {/* 3. Points */}
            <View style={[styles.pill, { backgroundColor: isLightMode ? "#D1FAE5" : "#1F3A33" }]}>
              <Ionicons name="leaf" size={13} color={isLightMode ? "#0F3327" : "#52D192"} />
              <Text style={[styles.pillText, { color: isLightMode ? "#0F3327" : "#52D192" }]}>{challenge.points} pts</Text>
            </View>
        </View>

        {onReport && (
            <TouchableOpacity onPress={onReport} style={{ padding: 4 }}>
                <Ionicons name="flag-outline" size={16} color={cardMuted} />
            </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.title, { color: cardText }]}>{challenge.title}</Text>
      
      {/* Description avec moins de marge si actif pour remonter les boutons */}
      <Text style={[styles.description, { color: cardMuted, marginBottom: isOngoing ? 10 : 16 }]}>
        {challenge.description}
      </Text>

      {/* Bouton RELEVER (Si inactif) */}
      {!isOngoing && (
        <TouchableOpacity
            onPress={() => onToggle(challenge.id)}
            style={[styles.mainBtn, { backgroundColor: accentColor }]}
        >
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Relever</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* --- ACTIONS (Si Actif) --- */}
      {isOngoing && (
        <View style={styles.actionsContainer}>
          
          {/* TIMER */}
          {(status === "active" || status === "pendingValidation") && (
              <LinearGradient
                colors={isLightMode ? ["#FFFFFF", "#F7FDF9"] : ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"]}
                style={[styles.timerPill, { borderColor: isLightMode ? "#A7F3D0" : "rgba(0, 151, 178, 0.4)" }]}
              > 
              <Ionicons name="time-outline" size={18} color={accentColor} />
              <Text style={[styles.timerText, { color: cardText }]}>
                Temps restant : {formatTime(remainingMs)}
              </Text>
            </LinearGradient>
          )}

          {/* VALIDER PHOTO */}
          {status === "active" && onValidatePhoto && (
            <TouchableOpacity
              style={styles.shadowBtn}
              onPress={onValidatePhoto}
              activeOpacity={0.9}
            >
              <LinearGradient
                  colors={isLightMode ? ["#34D399", "#059669"] : [colors.accent, colors.accent]}
                  style={styles.photoBtn}
              >
                <Ionicons name="camera" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.photoBtnText}>Valider avec photo</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ANNULER (Rouge clair pour contraste) */}
          {status === "active" && (
            <TouchableOpacity 
                style={[styles.cancelBtn, { backgroundColor: isLightMode ? "#FEF2F2" : "#2A171A", borderColor: "#FCA5A5" }]} 
                onPress={() => setConfirmVisible(true)}
            >
              <Ionicons name="close-circle" size={18} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={[styles.cancelText, { color: "#EF4444" }]}>Annuler le défi</Text>
            </TouchableOpacity>
          )}

          {/* --- AFFICHAGE PREUVE (EN ATTENTE) --- */}
          {status === "pendingValidation" && current?.id === challenge.id && current?.photoUri && (
            <View style={{ marginTop: 8 }}>
              <View style={[styles.proofContainer, { borderColor: isLightMode ? "#fff" : "#333" }]}>
                  <Image source={{ uri: current.photoUri }} style={{ height: 180, width: '100%' }} resizeMode="cover" />
              </View>
              {current.photoComment ? (
                <Text style={{ color: cardMuted, marginTop: 8, fontStyle: 'italic', textAlign: 'center' }}>"{current.photoComment}"</Text>
              ) : null}
            </View>
          )}

          {/* 🟠 WAITING FOR VALIDATION */}
          {status === "pendingValidation" && !isValidatedAndClaimed && (
            <View style={[styles.statusPill, { backgroundColor: isLightMode ? "#FFFBEB" : "#2A2617", borderColor: "#FCD34D" }]}>
              <Ionicons name="hourglass" size={18} color="#D97706" style={{ marginRight: 6 }} />
              <Text style={{ color: "#D97706", fontWeight: "700" }}>En attente de validation</Text>
            </View>
          )}

          {/* 🟢 FULLY VALIDATED & POINTS CREDITED */}
          {isValidatedAndClaimed && (
            <View style={[styles.statusPill, { backgroundColor: isLightMode ? "#ECFDF5" : "#142822", borderColor: "#34D399" }]}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" style={{ marginRight: 6 }} />
              <Text style={{ color: "#059669", fontWeight: "700" }}>Votre défi a été validé 🎉</Text>
            </View>
          )}
        </View>
      )}

      {/* MODAL ANNULATION */}
      <Modal
        transparent
        visible={confirmVisible}
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isLightMode ? "#FFF" : colors.card }]}> 
            <Text style={[styles.modalTitle, { color: cardText }]}>Annuler le défi</Text>
            <Text style={{ color: cardMuted, marginTop: 6 }}>
              Êtes-vous sûr d&apos;annuler ce défi ?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: isLightMode ? "#F3F4F6" : "#2A3431" }]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={{ color: isLightMode ? "#4B5563" : "#E6FFF5", fontWeight: "700" }}>Non</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#EF4444" }]}
                onPress={() => {
                  setConfirmVisible(false);
                  onToggle(challenge.id);
                }}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Oui</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 18, marginBottom: 14 },
  glassEffect: {
    borderWidth: 1,
    borderColor: challengeTheme.borderColor,
    shadowColor: "#005c4b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  pillText: { fontWeight: "700", marginLeft: 4, fontSize: 11 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 4, fontFamily: "StylizedTitle" },
  description: { lineHeight: 20, fontSize: 14 },
  
  mainBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 4},
    elevation: 2
  },

  // Actions Container
  actionsContainer: {
    gap: 10, // Espace réduit entre les boutons
    alignItems: "stretch",
  },
  timerPill: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  timerText: { fontWeight: "700", fontSize: 14 },
  shadowBtn: {
    shadowColor: "#000", shadowOpacity: 0.15, shadowOffset: {width: 0, height: 4}, shadowRadius: 8, elevation: 3
  },
  photoBtn: {
    borderRadius: 18,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  photoBtnText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  cancelBtn: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: { fontWeight: "600", fontSize: 14 },
  
  // Styles Preuve
  proofContainer: {
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: { width: "100%", maxWidth: 320, borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", marginTop: 20, gap: 12 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 },
});