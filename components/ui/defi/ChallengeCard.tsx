import { useChallenges } from "@/hooks/challenges-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Challenge } from "./types";

type Props = {
  challenge: Challenge;
  categorie: "personnel" | "club"; // NEW: perso vs club
  isOngoing: boolean;
  onToggle: (id: number) => void;
  status?: "active" | "pendingValidation" | "validated";
  onValidatePhoto?: () => void;
};

export function ChallengeCard({
  challenge,
  categorie,
  isOngoing,
  onToggle,
  status,
  onValidatePhoto,
}: Props) {
  const { colors, mode } = useThemeMode();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const { current, reviewCompleted, reviewRequiredCount } = useChallenges();

  const DIFFICULTY_GRADIENTS: Record<Challenge["difficulty"], [string, string]> = {
    Facile: ["#52D192", "#2BB673"],
    Moyen: ["#F6D365", "#F4C95D"],
    Difficile: ["#F9748F", "#F45B69"],
  };

  // Top pill now: just "Perso" / "Club"
  const categoryLabel = categorie === "personnel" ? "Perso" : "Club";
  const categoryIcon = categorie === "personnel" ? "person-outline" : "people-outline";

  // Hide other picked challenges once 3 validations completed
  const shouldHide = useMemo(() => {
    if (!isOngoing) return false;
    if (reviewCompleted >= reviewRequiredCount) {
      if (current && current.id !== challenge.id) return true;
    }
    return false;
  }, [isOngoing, reviewCompleted, reviewRequiredCount, current, challenge.id]);

  const isLightMode = mode === "light";
  const cardBackground = colors.card;
  const cardAlt = colors.cardAlt;
  const cardText = isLightMode ? colors.cardText : colors.text;
  const cardMuted = isLightMode ? colors.cardMuted : colors.mutedText;
  const timerBackground = isLightMode ? "rgba(25, 208, 125, 0.08)" : "rgba(0, 151, 178, 0.2)";
  const timerBorder = isLightMode ? "#33d186" : "rgba(0, 151, 178, 0.4)";

  // Countdown until next noon (12:00)
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
      const diff = target.getTime() - now.getTime();
      setRemainingMs(Math.max(0, diff));
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
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
      s
    ).padStart(2, "0")}`;
  };

  if (shouldHide) return null;

  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: colors.glass, 
        borderColor: colors.glassBorder,
        borderWidth: 1,
      }
    ]}> 
      {/* HEADER PILL + POINTS */}
      <View style={styles.header}>
        <View style={[styles.categoryPill, { backgroundColor: cardAlt }]}>
          <Ionicons name={categoryIcon} size={16} color="#7DCAB0" />
          <Text style={styles.categoryText}>{categoryLabel}</Text>
        </View>

        <View style={styles.pointsBadge}>
          <Ionicons name="leaf" size={16} color="#0F3327" />
          <Text style={styles.pointsText}>{challenge.points} pts</Text>
        </View>
      </View>

      <Text style={[styles.title, { color: cardText }]}>{challenge.title}</Text>
      <Text style={[styles.description, { color: cardMuted }]}>
        {challenge.description}
      </Text>

      {/* Difficulty + Action Button */}
      <View style={styles.metaRow}>
        {/* DIFFICULTY PILL */}
        <View
          style={[
            styles.metaPill,
            {
              backgroundColor:
                challenge.difficulty === "Facile"
                  ? "#52D19233"
                  : challenge.difficulty === "Moyen"
                  ? "#F4C95D33"
                  : "#F45B6933",
            },
          ]}
        >
          <Ionicons
            name="speedometer-outline"
            size={16}
            color={
              challenge.difficulty === "Facile"
                ? "#52D192"
                : challenge.difficulty === "Moyen"
                ? "#F4C95D"
                : "#F45B69"
            }
          />
          <Text
            style={[
              styles.metaTextDark,
              {
                color:
                  challenge.difficulty === "Facile"
                    ? "#52D192"
                    : challenge.difficulty === "Moyen"
                    ? "#F4C95D"
                    : "#F45B69",
              },
            ]}
          >
            {challenge.difficulty}
          </Text>
        </View>

        {/* Action Button (only if not ongoing) */}
        {!isOngoing && (
          <TouchableOpacity
            onPress={() => onToggle(challenge.id)}
            style={{
              backgroundColor: colors.accent,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Text style={{ color: '#0F3327', fontWeight: '700', fontSize: 13 }}>Relever</Text>
            <Ionicons name="arrow-forward" size={14} color="#0F3327" />
          </TouchableOpacity>
        )}
      </View>

      {/* ACTIONS */}
      {isOngoing && (
        <View style={styles.actionsContainer}>
          {(status === "active" || status === "pendingValidation") && (
              <View style={[styles.timerPill, { backgroundColor: timerBackground, borderColor: timerBorder }]}> 
              <Ionicons name="time-outline" size={16} color={colors.accent} />
              <Text style={[styles.timerText, { color: cardText }]}>
                Temps restant jusqu&apos;à midi : {formatTime(remainingMs)}
              </Text>
            </View>
          )}

          {status === "active" && onValidatePhoto && (
            <TouchableOpacity
                style={[styles.photoBtn, { backgroundColor: colors.accent }]}
              onPress={onValidatePhoto}
              activeOpacity={0.9}
            >
              <Ionicons name="camera" size={18} color="#0F3327" style={{ marginRight: 8 }} />
              <Text style={styles.photoBtnText}>Valider avec photo</Text>
            </TouchableOpacity>
          )}

          {status === "active" && (
              <TouchableOpacity style={[styles.cancelBtn]} onPress={() => setConfirmVisible(true)}>
              <Ionicons name="close-circle" size={16} color="#F45B69" style={{ marginRight: 6 }} />
              <Text style={styles.cancelText}>Annuler le défi</Text>
            </TouchableOpacity>
          )}

          {/* Proof preview + comment above pending status */}
          {status === "pendingValidation" && current?.id === challenge.id && current?.photoUri && (
            <View style={{ marginTop: 12 }}>
              <Image source={{ uri: current.photoUri }} style={{ height: 150, width: '100%', borderRadius: 16 }} />
              {current.photoComment ? (
                <Text style={{ color: cardText, marginTop: 8 }}>{current.photoComment}</Text>
              ) : null}
            </View>
          )}

          {status === "pendingValidation" && (
            <View style={styles.pendingPill}>
              <Ionicons
                name="hourglass"
                size={16}
                color="#F6D365"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.pendingText}>En attente de validation</Text>
            </View>
          )}

          {status === "validated" && (
            <View style={styles.validatedPill}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color="#52D192"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.validatedText}>Défi validé</Text>
            </View>
          )}
        </View>
      )}

      {/* Cancel confirmation modal */}
      <Modal
        transparent
        visible={confirmVisible}
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBackground }]}> 
            <Text style={[styles.modalTitle, { color: cardText }]}>Annuler le défi</Text>
            <Text style={{ color: cardMuted, marginTop: 6 }}>
              Êtes-vous sûr d&apos;annuler ce défi ?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.modalCancelText}>Non</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirmBtn]}
                onPress={() => {
                  setConfirmVisible(false);
                  onToggle(challenge.id);
                }}
              >
                <Text style={styles.modalConfirmText}>Oui</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 16, marginBottom: 14 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: { color: "#7DCAB0", fontWeight: "600", marginLeft: 6, fontSize: 12 },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D4F7E7",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pointsText: { color: "#0F3327", fontWeight: "700", marginLeft: 6, fontSize: 12 },
  title: { fontSize: 16, fontWeight: "700", marginTop: 12 },
  description: { marginTop: 6, lineHeight: 18, fontSize: 13 },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
  },
  metaPillMuted: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  metaText: { color: "#9FB9AE", marginLeft: 6, fontWeight: "600" },
  metaTextDark: { color: "#0F3327", marginLeft: 6, fontWeight: "700" },
  actionsContainer: {
    marginTop: 18,
    gap: 12,
    alignItems: "stretch",
  },
  cancelBtn: {
    borderRadius: 18,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2A171A",
    borderWidth: 1,
    borderColor: "#F45B69",
    paddingHorizontal: 18,
    alignSelf: "stretch",
  },
  cancelText: { color: "#F45B69", fontWeight: "600", fontSize: 14 },
  timerPill: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "stretch",
  },
  timerText: { fontWeight: "700", fontSize: 15 },
  photoBtn: {
    borderRadius: 18,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgba(0, 231, 118, 0.4)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
    alignSelf: "stretch",
  },
  photoBtnText: { color: "#0F3327", fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },
  pendingPill: {
    backgroundColor: "#142822",
    borderWidth: 1,
    borderColor: "#F6D365",
    borderRadius: 18,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  pendingText: { color: "#F6D365", fontWeight: "700" },
  validatedPill: {
    backgroundColor: "#142822",
    borderWidth: 1,
    borderColor: "#52D192",
    borderRadius: 18,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  validatedText: { color: "#52D192", fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: { width: "100%", maxWidth: 360, borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    gap: 10,
  },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  modalCancelBtn: { backgroundColor: "#2A3431" },
  modalConfirmBtn: { backgroundColor: "#F45B69" },
  modalCancelText: { color: "#E6FFF5", fontWeight: "700" },
  modalConfirmText: { color: "#0F3327", fontWeight: "700" },
});
