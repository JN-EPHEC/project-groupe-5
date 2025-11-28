import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { CATEGORY_CONFIG } from "./constants";

export type ValidationItem = {
  id: number;
  title: string;
  description: string;
  category: keyof typeof CATEGORY_CONFIG;
  difficulty: "Facile" | "Moyen" | "Difficile";
  points: number;
  audience: "Membre";
  timeLeft: string;
  userName: string;
  photoUrl: string;
};

type Props = {
  item: ValidationItem;
  onValidate: () => void;
  onReject: () => void;
};

export function ValidationCard({ item, onValidate, onReject }: Props) {
  const { colors } = useThemeMode();
  const category = CATEGORY_CONFIG[item.category];
  const [reported, setReported] = useState(false);
  const [hiddenProof, setHiddenProof] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const reasons = [
    "Contenu inapproprié",
    "Spam",
    "Harcèlement",
    "Contenu trompeur",
    "Autre",
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={[styles.categoryPill, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name={category.icon} size={16} color="#7DCAB0" />
          <Text style={styles.categoryText}>{category.label}</Text>
        </View>

        <View style={styles.pointsBadge}>
          <Ionicons name="leaf" size={16} color="#0F3327" />
          <Text style={styles.pointsText}>{item.points} pts</Text>
        </View>
      </View>

      {/* TITRE */}
      <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>Par {item.userName}</Text>

      {/* Message de signalement */}
      {reported && (
        <View style={[styles.banner, { backgroundColor: colors.surfaceAlt }]}> 
          <Ionicons name="alert-circle" size={18} color={colors.accent} style={styles.leadingIcon} />
          <Text style={{ color: colors.text, fontWeight: '600' }}>Merci, votre signalement a été pris en compte.</Text>
        </View>
      )}

      {/* BOÎTE DE PREUVE */}
      {hiddenProof ? (
        <View style={[styles.hiddenBox, { backgroundColor: colors.surfaceAlt }]}> 
          <Text style={{ color: colors.mutedText }}>Cette preuve est temporairement masquée en attente de vérification.</Text>
        </View>
      ) : (
        <Image source={{ uri: item.photoUrl }} style={styles.photo} />
      )}

      {/* ACTIONS */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.surfaceAlt }]}
          onPress={onReject}
        > 
          <Ionicons name="close-circle" size={18} color="#EBE6D3" style={styles.leadingIcon} />
          <Text style={[styles.secondaryText, { color: "#EBE6D3" }]}>Refuser</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.warnButton, { backgroundColor: '#2A2E2D', borderColor: '#D97706', borderWidth: 1 }]}
          onPress={() => setReportVisible(true)}
        >
          <Ionicons name="flag-outline" size={18} color="#D97706" style={styles.leadingIcon} />
          <Text style={[styles.warnText, { color: '#D97706' }]}>Signaler</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.successButton, { backgroundColor: colors.accent }]} onPress={onValidate}>
          <Ionicons name="checkmark-circle" size={18} color="#0F3327" style={styles.leadingIcon} />
          <Text style={styles.successText}>Valider</Text>
        </TouchableOpacity>
      </View>

      {/* Report modal */}
      <Modal transparent visible={reportVisible} animationType="fade" onRequestClose={() => setReportVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }] }>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Signaler la preuve</Text>
            <Text style={{ color: colors.mutedText, marginTop: 6 }}>Sélectionnez un motif et ajoutez un commentaire facultatif.</Text>
            <View style={{ marginTop: 12 }}>
              {reasons.map((r) => (
                <TouchableOpacity key={r} onPress={() => setSelectedReason(r)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                  <Ionicons name={selectedReason === r ? 'radio-button-on' : 'radio-button-off'} size={18} color={colors.accent} />
                  <Text style={{ marginLeft: 8, color: colors.text }}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Commentaire (facultatif)"
              placeholderTextColor={colors.mutedText}
              multiline
              numberOfLines={3}
              style={{ backgroundColor: colors.surfaceAlt, color: colors.text, borderRadius: 12, padding: 12, marginTop: 10, textAlignVertical: 'top' }}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.surfaceAlt }]} onPress={() => setReportVisible(false)}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!selectedReason}
                style={[styles.modalBtn, { backgroundColor: selectedReason ? colors.accent : colors.surfaceAlt }]}
                onPress={() => {
                  // In a real app, send report: { reason: selectedReason, comment }
                  setReportVisible(false);
                  setReported(true);
                  setHiddenProof(true);
                }}
              >
                <Text style={{ color: selectedReason ? '#0F3327' : colors.mutedText, fontWeight: '700' }}>Envoyer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 8,
  },
  photo: {
    borderRadius: 18,
    height: 150,
    width: "100%",
    marginTop: 12,
  },
  hiddenBox: {
    borderRadius: 18,
    padding: 16,
    width: '100%',
    marginTop: 12,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    paddingVertical: 12,
    width: "32%",
  },
  warnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingVertical: 12,
    width: '32%',
  },
  warnText: {
    fontWeight: '700',
  },
  secondaryText: {
    fontWeight: "600",
  },
  successButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    paddingVertical: 12,
    width: "32%",
  },
  successText: {
    color: "#0F3327",
    fontWeight: "700",
  },
  leadingIcon: {
    marginRight: 8,
  },
  // Reuse modal styles similar to other components
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 380, borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 10 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
});
