// components/ui/defi/ClubChallengeCard.tsx
import { useChallenges } from "@/hooks/challenges-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; // ✅ Added LinearGradient
import React, { useEffect, useMemo, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CATEGORY_CONFIG } from "./constants";
import type { ClubChallenge } from "./types";

type Props = {
  challenge: ClubChallenge;
  participating: boolean;
  onParticipate: (id: number) => void;
  onCancel: (id: number) => void;
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

export function ClubChallengeCard({ challenge, participating, onParticipate, onCancel }: Props) {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  
  // Dynamic colors based on theme
  const cardText = isLight ? clubChallengeTheme.textMain : colors.text;
  const cardMuted = isLight ? clubChallengeTheme.textMuted : colors.mutedText;
  const accentColor = isLight ? clubChallengeTheme.accent : colors.accent;

  // Configuration retrieval with fallback
  const rawCategory = CATEGORY_CONFIG[challenge.category as keyof typeof CATEGORY_CONFIG];
  const category = rawCategory || {
    icon: "help-circle-outline" as any,
    label: challenge.category || "Divers",
    color: "#7DCAB0",
  };

  const [confirmVisible, setConfirmVisible] = useState(false);
  const { current, reviewCompleted, reviewRequiredCount } = useChallenges();

  // Hide logic
  const shouldHide = useMemo(() => {
    if (!participating) return false;
    if (reviewCompleted >= reviewRequiredCount) {
      if (current && current.id !== challenge.id) return true;
    }
    return false;
  }, [participating, reviewCompleted, reviewRequiredCount, current, challenge.id]);

  // Countdown logic
  const [remainingMs, setRemainingMs] = useState<number>(0);
  useEffect(() => {
    if (!participating) return;
    const computeEndOfDay = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const diff = end.getTime() - now.getTime();
      setRemainingMs(Math.max(0, diff));
    };
    computeEndOfDay();
    const timer = setInterval(computeEndOfDay, 1000);
    return () => clearInterval(timer);
  }, [participating]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (shouldHide) return null;

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
          <Ionicons name={category.icon} size={14} color={accentColor} />
          <Text style={[styles.categoryText, { color: accentColor }]}>{category.label}</Text>
        </View>
        <View style={[styles.pointsBadge, { backgroundColor: isLight ? "#D1FAE5" : "#1F3A33" }]}>
          <Ionicons name="leaf" size={14} color={isLight ? "#0F3327" : "#52D192"} />
          <Text style={[styles.pointsText, { color: isLight ? "#0F3327" : "#52D192" }]}>{challenge.points} pts</Text>
        </View>
      </View>

      <Text style={[styles.title, { color: cardText }]}>{challenge.title}</Text>
      <Text style={[styles.description, { color: cardMuted }]}>{challenge.description}</Text>

      <View style={styles.counterRow}>
        <Ionicons name="people-outline" size={16} color={cardMuted} />
        <Text style={[styles.counterText, { color: cardMuted }]}>
          {challenge.participants}/{challenge.goalParticipants} participants
        </Text>
      </View>

      {participating && (
        <LinearGradient
            colors={isLight ? ["#FFFFFF", "#F0FDF4"] : ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"]}
            style={[styles.timerPill, { borderColor: isLight ? "#BBF7D0" : "rgba(0, 151, 178, 0.4)" }]}
        >
          <Ionicons name="time-outline" size={18} color={accentColor} />
          <Text style={[styles.timerText, { color: cardText }]}>
            Temps restant aujourd'hui: {formatTime(remainingMs)}
          </Text>
        </LinearGradient>
      )}

      <View style={{ marginTop: 20 }}>
        {participating ? (
          <>
            <View style={[styles.ongoingPill, { borderColor: accentColor, backgroundColor: isLight ? "#ECFDF5" : "#142822" }]}>
              <Text style={[styles.ongoingText, { color: accentColor }]}>Défi en cours</Text>
              <Ionicons name="checkmark-circle" size={18} color={accentColor} style={{ marginLeft: 8 }} />
            </View>
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