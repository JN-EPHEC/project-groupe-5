import { GradientButton } from "@/components/ui/common/GradientButton";
import { useChallenges } from "@/hooks/challenges-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CATEGORY_CONFIG } from "./constants";
import { Challenge } from "./types";

type Props = {
  challenge: Challenge;
  isOngoing: boolean;
  onToggle: (id: number) => void;
  status?: 'active' | 'pendingValidation' | 'validated';
  onValidatePhoto?: () => void;
};

export function ChallengeCard({ challenge, isOngoing, onToggle, status, onValidatePhoto }: Props) {
  const { colors } = useThemeMode();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const category = CATEGORY_CONFIG[challenge.category];
  const { current, reviewCompleted, reviewRequiredCount } = useChallenges();
  const DIFFICULTY_GRADIENTS: Record<Challenge["difficulty"], [string, string]> = {
    Facile: ["#52D192", "#2BB673"],
    Moyen: ["#F6D365", "#F4C95D"],
    Difficile: ["#F9748F", "#F45B69"],
  };

  // Hide other picked challenges once 3 validations completed
  const shouldHide = useMemo(() => {
    if (!isOngoing) return false;
    if (reviewCompleted >= reviewRequiredCount) {
      if (current && current.id !== challenge.id) return true;
    }
    return false;
  }, [isOngoing, reviewCompleted, reviewRequiredCount, current, challenge.id]);

  // Countdown until end of day for personal challenges
  const [remainingMs, setRemainingMs] = useState<number>(0);
  useEffect(() => {
    if (!isOngoing) return;
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
  }, [isOngoing]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    shouldHide ? null : (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <View style={[styles.categoryPill, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name={category.icon} size={16} color="#7DCAB0" />
          <Text style={styles.categoryText}>{category.label}</Text>
        </View>

        <View style={styles.pointsBadge}>
          <Ionicons name="leaf" size={16} color="#0F3327" />
          <Text style={styles.pointsText}>{challenge.points} pts</Text>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{challenge.title}</Text>
      <Text style={[styles.description, { color: colors.mutedText }]}>{challenge.description}</Text>

      <View style={styles.metaRow}>
        <LinearGradient
          colors={DIFFICULTY_GRADIENTS[challenge.difficulty]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.metaPill}
        >
          <Ionicons name="speedometer-outline" size={16} color="#0F3327" />
          <Text style={styles.metaTextDark}>{challenge.difficulty}</Text>
        </LinearGradient>

        <View style={[styles.metaPillMuted, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="time-outline" size={16} color="#9FB9AE" />
          <Text style={styles.metaText}>{challenge.timeLeft}</Text>
        </View>
      </View>

      {(status === 'active' || status === 'pendingValidation') && (
        <View style={[styles.timerPill]}> 
          <Ionicons name="time-outline" size={16} color={colors.accent} />
          <Text style={[styles.timerText, { color: colors.text }]}>Temps restant aujourd'hui: {formatTime(remainingMs)}</Text>
        </View>
      )}

      {isOngoing ? (
        <View style={{ marginTop: 20 }}>
          {status === 'active' && (
            <>
              <TouchableOpacity
                style={[styles.cancelBtn]}
                onPress={() => setConfirmVisible(true)}
              >
                <Text style={[styles.cancelText]}>Annuler le défi</Text>
                <Ionicons name="close-circle" size={18} color="#F45B69" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
              {onValidatePhoto && (
                <TouchableOpacity style={[styles.photoBtn, { backgroundColor: colors.accent }]} onPress={onValidatePhoto}>
                  <Ionicons name="camera" size={16} color="#0F3327" style={{ marginRight: 6 }} />
                  <Text style={styles.photoBtnText}>Valider avec photo</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          {status === 'pendingValidation' && (
            <View style={styles.pendingPill}>
              <Ionicons name="hourglass" size={16} color="#F6D365" style={{ marginRight: 6 }} />
              <Text style={styles.pendingText}>En attente de validation</Text>
            </View>
          )}
          {status === 'validated' && (
            <View style={styles.validatedPill}>
              <Ionicons name="checkmark-circle" size={18} color="#52D192" style={{ marginRight: 6 }} />
              <Text style={styles.validatedText}>Défi validé</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={{ marginTop: 24 }}>
          <GradientButton label="Relever le défi" onPress={() => onToggle(challenge.id)} />
        </View>
      )}
      {/* Cancel confirmation modal */}
      <Modal transparent visible={confirmVisible} animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Annuler le défi</Text>
            <Text style={{ color: colors.mutedText, marginTop: 6 }}>Êtes-vous sûr d'annuler ce défi ?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalCancelBtn]} onPress={() => setConfirmVisible(false)}>
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
    )
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 20, marginBottom: 18 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  categoryPill: { flexDirection: "row", alignItems: "center", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  categoryText: { color: "#7DCAB0", fontWeight: "600", marginLeft: 6 },
  pointsBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#D4F7E7", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  pointsText: { color: "#0F3327", fontWeight: "700", marginLeft: 6 },
  title: { fontSize: 18, fontWeight: "700", marginTop: 16 },
  description: { marginTop: 8, lineHeight: 20 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 16 },
  metaPill: { flexDirection: "row", alignItems: "center", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 10 },
  metaPillMuted: { flexDirection: "row", alignItems: "center", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  metaText: { color: "#9FB9AE", marginLeft: 6, fontWeight: "600" },
  metaTextDark: { color: "#0F3327", marginLeft: 6, fontWeight: "700" },
  primaryButtonActive: { marginTop: 24, backgroundColor: "#142822", borderWidth: 1, borderColor: "#7DCAB0", borderRadius: 18, paddingVertical: 12, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  primaryTextActive: { color: "#7DCAB0", fontWeight: "700" },
  cancelBtn: { marginTop: 16, backgroundColor: "#2A171A", borderWidth: 1, borderColor: "#F45B69", borderRadius: 18, paddingVertical: 12, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  cancelText: { color: "#F45B69", fontWeight: "700" },
  timerPill: { marginTop: 12, borderWidth: 1, borderColor: '#7DCAB0', borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerText: { fontWeight: '700' },
  photoBtn: { marginTop: 12, backgroundColor: "#D4F7E7", borderRadius: 18, paddingVertical: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  photoBtnText: { color: "#0F3327", fontWeight: '700' },
  pendingPill: { backgroundColor: '#142822', borderWidth: 1, borderColor: '#F6D365', borderRadius: 18, paddingVertical: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  pendingText: { color: '#F6D365', fontWeight: '700' },
  validatedPill: { backgroundColor: '#142822', borderWidth: 1, borderColor: '#52D192', borderRadius: 18, paddingVertical: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  validatedText: { color: '#52D192', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 360, borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 10 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  modalCancelBtn: { backgroundColor: '#2A3431' },
  modalConfirmBtn: { backgroundColor: '#F45B69' },
  modalCancelText: { color: '#E6FFF5', fontWeight: '700' },
  modalConfirmText: { color: '#0F3327', fontWeight: '700' },
});
