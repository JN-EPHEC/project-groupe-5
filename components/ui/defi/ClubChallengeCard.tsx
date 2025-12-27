// components/ui/defi/ClubChallengeCard.tsx
import { useChallenges } from "@/hooks/challenges-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; // ✅ Added LinearGradient
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

// 🎨 THEME CLUB CHALLENGE CARD
const clubChallengeTheme = {
  glassBg: ["rgba(240, 253, 244, 0.95)", "rgba(255, 255, 255, 0.85)"] as const,
  activeGlassBg: ["#E0F7EF", "#D1FAE5"] as const,
  borderColor: "rgba(255, 255, 255, 0.6)",
  textMain: "#0A3F33",
  textMuted: "#4A665F",
  accent: "#008F6B",
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

  // Hide logic — only hide when the club challenge is itself in pendingValidation
  // and the club validation counters indicate the gate has been reached.

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

      // Get next Monday (0=Sun .. 1=Mon .. 6=Sat)
      const day = now.getDay();
      const daysUntilMonday = (8 - day) % 7; // if today is Monday and before noon -> 0

      const target = new Date(now);

      // If today is Monday and before 12:00, target is today at 12:00
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
  const Wrapper = isLight ? LinearGradient : View;
  const wrapperProps = isLight
    ? {
        colors: participating ? clubChallengeTheme.activeGlassBg : clubChallengeTheme.glassBg,
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
        style: [styles.card, styles.glassEffect],
      }
    : {
        style: [
          styles.card,
          {
            backgroundColor: participating ? "#1A2F28" : colors.surface,
            borderColor: "rgba(0,151,178,0.3)",
            borderWidth: 1,
          },
        ],
      };

  return (
    <Wrapper {...(wrapperProps as any)}>
      <View style={styles.header}> 
        <View style={[styles.categoryPill, { backgroundColor: isLight ? "rgba(0,143,107,0.1)" : colors.surfaceAlt }]}>
          <Ionicons name={categoryIcon} size={14} color={accentColor} />
          <Text style={[styles.categoryText, { color: accentColor }]}>{categoryLabel}</Text>
        </View>
      </View>

      <Text style={[styles.title, { color: cardText }]}>{challenge.title}</Text>
      <Text style={[styles.description, { color: cardMuted }]}>{challenge.description}</Text>



      {participating && (
        <LinearGradient
            colors={isLight ? ["#FFFFFF", "#F0FDF4"] : ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"]}
            style={[styles.timerPill, { borderColor: isLight ? "#BBF7D0" : "rgba(0, 151, 178, 0.4)" }]}
        >
          <Ionicons name="time-outline" size={18} color={accentColor} />
          <Text style={[styles.timerText, { color: cardText }]}>Temps restant jusqu'à lundi 12:00 : {formatTime(remainingMs)}</Text>
        </LinearGradient>
      )}

      {/* 🟢 CLUB PROGRESSION BAR */}
      {participating && (
        <View style={{ marginTop: 14 }}>
          <Text style={{ color: cardText, fontWeight: "700", marginBottom: 6 }}>Progression du club</Text>

          <View style={{ height: 10, borderRadius: 8, backgroundColor: isLight ? "#E5E7EB" : "#0f1f1b", overflow: "hidden" }}>
            <View style={{ width: `${Math.round((progressCount / CLUB_DENOMINATOR) * 100)}%`, height: "100%", backgroundColor: accentColor }} />
          </View>

          <Text style={{ color: cardMuted, marginTop: 4 }}>{progressCount}/{CLUB_DENOMINATOR} membres ont validé</Text>
        </View>
      )}

      <View style={{ marginTop: 20 }}>
        {participating ? (
          <>
            {/* Photo validation button (mirror perso) */}
            {status === "active" && onValidatePhoto && (
              <TouchableOpacity
                style={[styles.shadowBtn]}
                onPress={onValidatePhoto}
                activeOpacity={0.9}
              >
                <LinearGradient
                    colors={isLight ? ["#34D399", "#059669"] : [colors.accent, colors.accent]}
                    style={styles.photoBtn}
                >
                    <Ionicons name="camera" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.photoBtnText}>Valider avec photo</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* If proof submitted (pendingValidation), show the proof preview */}
            {status === "pendingValidation" && (
              <View style={{ marginTop: 8 }}>
                <View style={[styles.proofContainer, { borderColor: isLight ? "#fff" : "#333" }]}> 
                    <Image source={{ uri: (challenge as any).photoUri || "" }} style={{ height: 180, width: '100%' }} resizeMode="cover" />
                </View>

                {/* Pending status — mirror perso: user cannot cancel after proof submitted */}
                <View style={{ marginTop: 10, borderRadius: 12, padding: 12, backgroundColor: isLight ? "#FFFBEB" : "#2A2617", borderWidth: 1, borderColor: "#FCD34D" }}>
                  <Text style={{ color: "#D97706", fontWeight: "700" }}>Ta preuve est en cours de validation</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: "#FCA5A5", backgroundColor: isLight ? "#FEF2F2" : "#2A171A", marginTop: 12 }]}
              onPress={() => setConfirmVisible(true)}
            >
              <Text style={[styles.cancelText, { color: "#EF4444" }]}>Annuler le défi</Text>
              <Ionicons name="close-circle" size={18} color="#EF4444" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
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

      <View style={{ marginTop: 20 }}>
        {participating ? (
          <>
            {/* Photo validation button (mirror perso) */}
            {status === "active" && onValidatePhoto && (
              <TouchableOpacity
                style={[styles.shadowBtn]}
                onPress={onValidatePhoto}
                activeOpacity={0.9}
              >
                <LinearGradient
                    colors={isLight ? ["#34D399", "#059669"] : [colors.accent, colors.accent]}
                    style={styles.photoBtn}
                >
                    <Ionicons name="camera" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.photoBtnText}>Valider avec photo</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* If proof submitted (pendingValidation), show the proof preview */}
            {status === "pendingValidation" && (
              <View style={{ marginTop: 8 }}>
                <View style={[styles.proofContainer, { borderColor: isLight ? "#fff" : "#333" }]}>
                    <Image source={{ uri: (challenge as any).photoUri || "" }} style={{ height: 180, width: '100%' }} resizeMode="cover" />
                </View>

                {/* Pending status — mirror perso: user cannot cancel after proof submitted */}
                <View style={{ marginTop: 10, borderRadius: 12, padding: 12, backgroundColor: isLight ? "#FFFBEB" : "#2A2617", borderWidth: 1, borderColor: "#FCD34D" }}>
                  <Text style={{ color: "#D97706", fontWeight: "700" }}>Ta preuve est en cours de validation</Text>
                </View>
              </View>
            )}

            {status !== "pendingValidation" && (
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: "#FCA5A5", backgroundColor: isLight ? "#FEF2F2" : "#2A171A", marginTop: 12 }]}
                onPress={() => setConfirmVisible(true)}
              >
                <Text style={[styles.cancelText, { color: "#EF4444" }]}>Annuler le défi</Text>
                <Ionicons name="close-circle" size={18} color="#EF4444" style={{ marginLeft: 8 }} />
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
          <View style={[styles.modalCard, { backgroundColor: isLight ? "#FFF" : colors.card }]}>
            <Text style={[styles.modalTitle, { color: cardText }]}>Annuler le défi</Text>
            <Text style={{ color: cardMuted, marginTop: 6 }}>Êtes-vous sûr d'annuler ce défi ?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: isLight ? "#F3F4F6" : "#2A3431" }]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={{ color: isLight ? "#4B5563" : "#E6FFF5", fontWeight: "700" }}>Non</Text>
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
    borderWidth: 1,
    borderColor: clubChallengeTheme.borderColor,
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
  title: { fontSize: 18, fontWeight: "700", marginTop: 16, fontFamily: "StylizedTitle" }, // Adapte la police
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