import { useChallenges } from "@/hooks/challenges-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
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

export function ClubChallengeCard({ challenge, participating, onParticipate, onCancel }: Props) {
  const { colors } = useThemeMode();
  const category = CATEGORY_CONFIG[challenge.category];
  const [confirmVisible, setConfirmVisible] = useState(false);
  const { current, reviewCompleted, reviewRequiredCount } = useChallenges();

  // Hide cards of other picked challenges once 3 validations are reached
  const shouldHide = useMemo(() => {
    if (!participating) return false;
    if (reviewCompleted >= reviewRequiredCount) {
      // If this is not the current validated challenge, hide it
      if (current && current.id !== challenge.id) return true;
    }
    return false;
  }, [participating, reviewCompleted, reviewRequiredCount, current, challenge.id]);

  // Countdown until end of day once participating
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

      <View style={styles.counterRow}>
        <Ionicons name="people-outline" size={16} color="#9FB9AE" />
        <Text style={[styles.counterText, { color: colors.mutedText }]}>
          {challenge.participants}/{challenge.goalParticipants} participants
        </Text>
      </View>

      {participating && (
        <View style={[styles.timerPill, { borderColor: colors.accent }]}> 
          <Ionicons name="time-outline" size={16} color={colors.accent} />
          <Text style={[styles.timerText, { color: colors.text }]}>Temps restant aujourd'hui: {formatTime(remainingMs)}</Text>
        </View>
      )}

      <View style={{ marginTop: 16 }}>
        {participating ? (
          <>
            <View style={styles.ongoingPill}>
              <Text style={styles.ongoingText}>Défi en cours</Text>
              <Ionicons name="checkmark-circle" size={18} color="#7DCAB0" style={{ marginLeft: 8 }} />
            </View>
            <TouchableOpacity style={[styles.cancelBtn, { marginTop: 10 }]} onPress={() => setConfirmVisible(true)}>
              <Text style={styles.cancelText}>Annuler le défi</Text>
              <Ionicons name="close-circle" size={18} color="#F45B69" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={[styles.participateBtn, { backgroundColor: colors.accent }]} onPress={() => onParticipate(challenge.id)}>
            <Text style={styles.participateText}>Participe</Text>
          </TouchableOpacity>
        )}
      </View>

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
                  onCancel(challenge.id);
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
  counterRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  counterText: { fontWeight: '600' },
  participateBtn: { borderRadius: 18, paddingVertical: 12, alignItems: 'center' },
  participateText: { color: '#0F3327', fontWeight: '700' },
  ongoingPill: { backgroundColor: '#142822', borderWidth: 1, borderColor: '#7DCAB0', borderRadius: 18, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { backgroundColor: '#2A171A', borderWidth: 1, borderColor: '#F45B69', borderRadius: 18, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  cancelText: { color: '#F45B69', fontWeight: '700' },
  timerPill: { marginTop: 12, borderWidth: 1, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerText: { fontWeight: '700' },
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
