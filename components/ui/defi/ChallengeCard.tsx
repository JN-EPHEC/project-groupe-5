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

// 🎨 THEME CHALLENGE CARD (Inspiré du Header)
const challengeTheme = {
    // Mode Clair
    glassBg: ["rgba(240, 253, 244, 0.95)", "rgba(255, 255, 255, 0.85)"] as const,
    activeGlassBg: ["#FFFFFF", "#F0FDF4"] as const, 
    borderColor: "rgba(255, 255, 255, 0.6)",
    textMain: "#0A3F33",
    textMuted: "#4A665F",
    accent: "#008F6B",

    // Mode Sombre (Nouveau Bleu/Vert Glass)
    darkGlassBg: ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"] as const,
    darkActiveGlassBg: ["rgba(0, 151, 178, 0.25)", "rgba(0, 151, 178, 0.1)"] as const,
    darkBorderColor: "rgba(0, 151, 178, 0.3)",
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

  // For club list items, display a small progress bar (0 / 50)
  const CLUB_DENOMINATOR = 50;
  const clubProgressValue = 0; // list items show zero until a club cycle is active

  const isLightMode = mode === "light";
  
  const cardText = isLightMode ? challengeTheme.textMain : colors.text;
  const cardMuted = isLightMode ? challengeTheme.textMuted : colors.mutedText;
  const accentColor = isLightMode ? challengeTheme.accent : colors.accent;

  // Configuration de la difficulté (Couleurs)
  const diffColors = {
      Facile: { bg: isLightMode ? "#E6FFFA" : "rgba(0, 143, 107, 0.15)", text: isLightMode ? "#38A169" : "#4ADE80" },
      Moyen: { bg: isLightMode ? "#FFFBEB" : "rgba(214, 158, 46, 0.15)", text: isLightMode ? "#D69E2E" : "#FCD34D" },
      Difficile: { bg: isLightMode ? "#FFF5F5" : "rgba(229, 62, 62, 0.15)", text: isLightMode ? "#E53E3E" : "#FC8181" }
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

  // On utilise LinearGradient dans les DEUX modes pour avoir le bel effet
  const Wrapper = LinearGradient;
  
  const wrapperProps = { 
    colors: isLightMode 
        ? (isOngoing ? challengeTheme.activeGlassBg : challengeTheme.glassBg)
        : (isOngoing ? challengeTheme.darkActiveGlassBg : challengeTheme.darkGlassBg), 
    start: { x: 0, y: 0 }, 
    end: { x: 1, y: 1 }, 
    style: [
        styles.card, 
        styles.glassEffect, 
        { 
            borderColor: isLightMode ? challengeTheme.borderColor : challengeTheme.darkBorderColor,
            borderWidth: 1 
        },
        // Bordure un peu plus marquée si actif
        isOngoing && { borderColor: isLightMode ? "#BBF7D0" : "rgba(0, 151, 178, 0.6)", borderWidth: 1.5 } 
    ] 
  };

  return (
    <Wrapper {...wrapperProps}>
      {/* --- HEADER : CATEGORIE | DIFFICULTÉ | POINTS --- */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* 1. Catégorie */}
            <View style={[styles.pill, { backgroundColor: isLightMode ? "rgba(0,143,107,0.1)" : "rgba(0, 151, 178, 0.2)" }]}>
              <Ionicons name={categoryIcon} size={13} color={accentColor} />
              <Text style={[styles.pillText, { color: accentColor }]}>{categoryLabel}</Text>
            </View>

            {/* 2. Difficulté (only for personal) */}
            {categorie === "personnel" && (
              <View style={[styles.pill, { backgroundColor: diffStyle.bg }]}>
                  <Ionicons name="speedometer-outline" size={13} color={diffStyle.text} />
                  <Text style={[styles.pillText, { color: diffStyle.text }]}>{challenge.difficulty}</Text>
              </View>
            )}

            {/* 3. Points (only for personal) */}
            {categorie === "personnel" && (
              <View style={[styles.pill, { backgroundColor: isLightMode ? "#D1FAE5" : "rgba(0, 143, 107, 0.2)" }]}>
                <Ionicons name="leaf" size={13} color={isLightMode ? "#0F3327" : "#4ADE80"} />
                <Text style={[styles.pillText, { color: isLightMode ? "#0F3327" : "#4ADE80" }]}>{challenge.points} pts</Text>
              </View>
            )}
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
        <>
          {categorie === "club" ? (
            // Club list item: show small progress bar under the description
            <>
              <View style={{ marginTop: 12 }}>
                <View style={{ height: 8, backgroundColor: isLightMode ? "#E5E7EB" : "rgba(255,255,255,0.1)", borderRadius: 6, overflow: "hidden" }}>
                  <View style={{ width: `${Math.round((clubProgressValue / CLUB_DENOMINATOR) * 100)}%`, height: "100%", backgroundColor: accentColor }} />
                </View>
                <Text style={{ color: cardMuted, marginTop: 6, fontSize: 13 }}>{clubProgressValue}/{CLUB_DENOMINATOR} membres ont validé</Text>
              </View>
              <TouchableOpacity
                onPress={() => onToggle(challenge.id)}
                style={[styles.mainBtn, { backgroundColor: accentColor, marginTop: 12 }]}
              >
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Relever</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFF" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
                onPress={() => onToggle(challenge.id)}
                style={[styles.mainBtn, { backgroundColor: accentColor }]}
            >
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Relever</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </TouchableOpacity>
          )}
        </>
      )}

      {/* --- ACTIONS (Si Actif) --- */}
      {isOngoing && (
        <View style={styles.actionsContainer}>
          
          {/* TIMER */}
          {(status === "active" || status === "pendingValidation") && (
              <LinearGradient
                colors={isLightMode ? ["#FFFFFF", "#F7FDF9"] : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                style={[styles.timerPill, { borderColor: isLightMode ? "#A7F3D0" : "rgba(255,255,255,0.1)" }]}
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
                  colors={isLightMode ? ["#34D399", "#059669"] : [colors.accent, "#006C51"]}
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
                style={[styles.cancelBtn, { backgroundColor: isLightMode ? "#FEF2F2" : "rgba(239, 68, 68, 0.15)", borderColor: isLightMode ? "#FCA5A5" : "rgba(239, 68, 68, 0.3)" }]} 
                onPress={() => setConfirmVisible(true)}
            >
              <Ionicons name="close-circle" size={18} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={[styles.cancelText, { color: "#EF4444" }]}>Annuler le défi</Text>
            </TouchableOpacity>
          )}

          {/* --- AFFICHAGE PREUVE (EN ATTENTE) --- */}
          {status === "pendingValidation" && current?.id === challenge.id && current?.photoUri && (
            <View style={{ marginTop: 8 }}>
              <View style={[styles.proofContainer, { borderColor: isLightMode ? "#fff" : "rgba(255,255,255,0.2)" }]}>
                  <Image source={{ uri: current.photoUri }} style={{ height: 180, width: '100%' }} resizeMode="cover" />
              </View>
              {current.photoComment ? (
                <Text style={{ color: cardMuted, marginTop: 8, fontStyle: 'italic', textAlign: 'center' }}>"{current.photoComment}"</Text>
              ) : null}
            </View>
          )}

          {/* 🟠 WAITING FOR VALIDATION */}
          {status === "pendingValidation" && !isValidatedAndClaimed && (
            <View style={[styles.statusPill, { backgroundColor: isLightMode ? "#FFFBEB" : "rgba(245, 158, 11, 0.15)", borderColor: isLightMode ? "#FCD34D" : "rgba(245, 158, 11, 0.3)" }]}>
              <Ionicons name="hourglass" size={18} color="#D97706" style={{ marginRight: 6 }} />
              <Text style={{ color: "#D97706", fontWeight: "700" }}>En attente de validation</Text>
            </View>
          )}

          {/* 🟢 FULLY VALIDATED & POINTS CREDITED */}
          {isValidatedAndClaimed && (
            <View style={[styles.statusPill, { backgroundColor: isLightMode ? "#ECFDF5" : "rgba(16, 185, 129, 0.15)", borderColor: isLightMode ? "#34D399" : "rgba(16, 185, 129, 0.3)" }]}>
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
          <View style={[styles.modalCard, { backgroundColor: isLightMode ? "#FFF" : "#1F2937", borderColor: isLightMode ? "transparent" : "rgba(255,255,255,0.1)", borderWidth: 1 }]}> 
            <Text style={[styles.modalTitle, { color: cardText }]}>Annuler le défi</Text>
            <Text style={{ color: cardMuted, marginTop: 6 }}>
              Êtes-vous sûr d&apos;annuler ce défi ?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: isLightMode ? "#F3F4F6" : "rgba(255,255,255,0.1)" }]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={{ color: isLightMode ? "#4B5563" : "#FFF", fontWeight: "700" }}>Non</Text>
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
    // Shadow est géré ici mais le background vient du wrapperProps
    shadowColor: "#000",
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
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: { width: "100%", maxWidth: 320, borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", marginTop: 20, gap: 12 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 },
});