// components/ui/defi/ClubChallengeCard.tsx
import { useChallenges } from "@/hooks/challenges-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { ClubChallenge } from "./types";

type Props = {
  challenge: ClubChallenge;
  participating: boolean;
  status?: "active" | "pendingValidation" | "validated";
  onParticipate: (id: number) => void;
  onCancel: (id: number) => void;
  onValidatePhoto?: () => void;
};

// 🎨 THEME CLUB CHALLENGE CARD (Harmonisé avec ChallengeCard)
const clubChallengeTheme = {
    // Mode Clair
    glassBg: ["rgba(240, 253, 244, 0.95)", "rgba(255, 255, 255, 0.85)"] as const,
    // ✅ MODIF: Blanc cassé vert (comme ChallengeCard) au lieu du vert soutenu
    activeGlassBg: ["#FFFFFF", "#F0FDF4"] as const, 
    borderColor: "rgba(255, 255, 255, 0.6)",
    textMain: "#0A3F33",
    textMuted: "#4A665F",
    accent: "#008F6B",

    // Mode Sombre
    darkGlassBg: ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"] as const,
    darkActiveGlassBg: ["rgba(0, 151, 178, 0.25)", "rgba(0, 151, 178, 0.1)"] as const,
    darkBorderColor: "rgba(0, 151, 178, 0.3)",
};

export function ClubChallengeCard({ challenge, participating, status, onParticipate, onCancel, onValidatePhoto }: Props) {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  
  // Dynamic colors based on theme
  const cardText = isLight ? clubChallengeTheme.textMain : colors.text;
  const cardMuted = isLight ? clubChallengeTheme.textMuted : colors.mutedText;
  const accentColor = isLight ? clubChallengeTheme.accent : colors.accent;

  // Show club label explicitly and hide points/difficulty for club cards
  const categoryLabel = "Club";
  const categoryIcon = "people-outline" as any;

  // Members / progress — UI: hardcoded denominator per design
  const CLUB_DENOMINATOR = 50;
  const progressCount = (challenge as any).progressCount ?? 0;
  const [confirmVisible, setConfirmVisible] = useState(false);
  const { currentClub, reviewCompletedClub, reviewRequiredCountClub } = useChallenges();

  // Hide logic
  const shouldHide = useMemo(() => {
    if (!participating) return false;

    if (!currentClub || currentClub.status !== "pendingValidation") return false;

    if (reviewRequiredCountClub > 0 && reviewCompletedClub >= reviewRequiredCountClub && currentClub.id !== challenge.id) {
      return true;
    }

    return false;
  }, [participating, reviewCompletedClub, reviewRequiredCountClub, currentClub, challenge.id]);

  if (shouldHide) return null;

  // Countdown logic: next Monday at 12:00
  const [remainingMs, setRemainingMs] = useState<number>(0);
  useEffect(() => {
    if (!participating) return;

    const computeNextMondayNoon = () => {
      const now = new Date();
      const day = now.getDay();
      const daysUntilMonday = (8 - day) % 7; 
      const target = new Date(now);

      if (day === 1 && now.getHours() < 12) {
        target.setHours(12, 0, 0, 0);
      } else {
        const addDays = daysUntilMonday === 0 ? 7 : daysUntilMonday;
        target.setDate(now.getDate() + addDays);
        target.setHours(12, 0, 0, 0);
      }

      const diff = target.getTime() - now.getTime();
      setRemainingMs(Math.max(0, diff));
    };

    computeNextMondayNoon();
    const timer = setInterval(computeNextMondayNoon, 1000);
    return () => clearInterval(timer);
  }, [participating]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}j ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
    }
    return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  };

  // Wrapper Selection
  const Wrapper = LinearGradient;
  
  const wrapperProps = {
    colors: isLight 
        ? (participating ? clubChallengeTheme.activeGlassBg : clubChallengeTheme.glassBg)
        : (participating ? clubChallengeTheme.darkActiveGlassBg : clubChallengeTheme.darkGlassBg),
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    style: [
        styles.card, 
        styles.glassEffect, 
        {
            borderColor: isLight ? clubChallengeTheme.borderColor : clubChallengeTheme.darkBorderColor,
            borderWidth: 1,
        },
        // ✅ AJOUT: Bordure verte active comme sur ChallengeCard
        participating && { borderColor: isLight ? "#BBF7D0" : "rgba(0, 151, 178, 0.6)", borderWidth: 1.5 }
    ],
  };

  return (
    <Wrapper {...wrapperProps}>
      <View style={styles.header}> 
        <View style={[styles.categoryPill, { backgroundColor: isLight ? "rgba(0,143,107,0.1)" : "rgba(0, 151, 178, 0.2)" }]}>
          <Ionicons name={categoryIcon} size={14} color={accentColor} />
          <Text style={[styles.categoryText, { color: accentColor }]}>{categoryLabel}</Text>
        </View>
      </View>

      <Text style={[styles.title, { color: cardText }]}>{challenge.title}</Text>
      <Text style={[styles.description, { color: cardMuted, marginBottom: participating ? 10 : 16 }]}>{challenge.description}</Text>

      {participating && (
        <LinearGradient
            colors={isLight ? ["#FFFFFF", "#F7FDF9"] : ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"]}
            style={[styles.timerPill, { borderColor: isLight ? "#A7F3D0" : "rgba(0, 151, 178, 0.4)" }]}
        >
          <Ionicons name="time-outline" size={18} color={accentColor} />
          <Text style={[styles.timerText, { color: cardText }]}>Fin : {formatTime(remainingMs)}</Text>
        </LinearGradient>
      )}

      {/* 🟢 CLUB PROGRESSION BAR */}
      {participating && (
        <View style={{ marginTop: 14 }}>
          <Text style={{ color: cardText, fontWeight: "700", marginBottom: 6 }}>Progression du club</Text>

          <View style={{ height: 10, borderRadius: 8, backgroundColor: isLight ? "#E5E7EB" : "rgba(255,255,255,0.1)", overflow: "hidden" }}>
            <View style={{ width: `${Math.round((progressCount / CLUB_DENOMINATOR) * 100)}%`, height: "100%", backgroundColor: accentColor }} />
          </View>

          <Text style={{ color: cardMuted, marginTop: 4 }}>{progressCount}/{CLUB_DENOMINATOR} membres ont validé</Text>
        </View>
      )}

      <View style={{ marginTop: 20 }}>
        {participating ? (
          <>
            {/* Photo validation button */}
            {status === "active" && onValidatePhoto && (
              <TouchableOpacity
                style={[styles.shadowBtn]}
                onPress={onValidatePhoto}
                activeOpacity={0.9}
              >
                <LinearGradient
                    colors={isLight ? ["#34D399", "#059669"] : [colors.accent, "#006C51"]}
                    style={styles.photoBtn}
                >
                    <Ionicons name="camera" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.photoBtnText}>Valider avec photo</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* If proof submitted (pendingValidation) */}
            {status === "pendingValidation" && (
              <View style={{ marginTop: 8 }}>
                <View style={[styles.proofContainer, { borderColor: isLight ? "#fff" : "rgba(255,255,255,0.1)" }]}>
                    <Image source={{ uri: (challenge as any).photoUri || "" }} style={{ height: 180, width: '100%' }} resizeMode="cover" />
                </View>

                <View style={{ marginTop: 10, borderRadius: 12, padding: 12, backgroundColor: isLight ? "#FFFBEB" : "rgba(245, 158, 11, 0.15)", borderWidth: 1, borderColor: isLight ? "#FCD34D" : "rgba(245, 158, 11, 0.3)" }}>
                  <Text style={{ color: "#D97706", fontWeight: "700", textAlign: "center" }}>Ta preuve est en cours de validation</Text>
                </View>
              </View>
            )}

            {status !== "pendingValidation" && (
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: isLight ? "#FCA5A5" : "rgba(239, 68, 68, 0.3)", backgroundColor: isLight ? "#FEF2F2" : "rgba(239, 68, 68, 0.15)", marginTop: 12 }]}
                onPress={() => setConfirmVisible(true)}
              >
                <Ionicons name="close-circle" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={[styles.cancelText, { color: "#EF4444" }]}>Annuler le défi</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <TouchableOpacity
            style={[styles.participateBtn, { backgroundColor: accentColor, shadowColor: accentColor }]}
            onPress={() => onParticipate(challenge.id)}
          >
            <Text style={styles.participateText}>Participe</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cancel confirmation modal */}
      <Modal
        transparent
        visible={confirmVisible}
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isLight ? "#FFF" : "#1F2937", borderColor: isLight ? "transparent" : "rgba(255,255,255,0.1)", borderWidth: 1 }]}>
            <Text style={[styles.modalTitle, { color: cardText }]}>Annuler le défi</Text>
            <Text style={{ color: cardMuted, marginTop: 6 }}>Êtes-vous sûr d'annuler ce défi ?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: isLight ? "#F3F4F6" : "rgba(255,255,255,0.1)" }]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={{ color: isLight ? "#4B5563" : "#FFF", fontWeight: "700" }}>Non</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#EF4444" }]}
                onPress={() => {
                  setConfirmVisible(false);
                  onCancel(challenge.id);
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
  card: { borderRadius: 24, padding: 20, marginBottom: 18 },
  glassEffect: {
    shadowColor: "#005c4b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: { fontWeight: "600", marginLeft: 6, fontSize: 12 },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pointsText: { fontWeight: "700", marginLeft: 6, fontSize: 12 },
  title: { fontSize: 18, fontWeight: "700", marginTop: 16, fontFamily: "StylizedTitle" },
  description: { marginTop: 8, lineHeight: 22, fontSize: 14 },
  counterRow: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 8 },
  counterText: { fontWeight: "600", fontSize: 13 },
  participateBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  participateText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  ongoingPill: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  ongoingText: { fontWeight: "700" },
  cancelBtn: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: { fontWeight: "600" },
  timerPill: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  timerText: { fontWeight: "600", fontSize: 14 },
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
  proofContainer: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },
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