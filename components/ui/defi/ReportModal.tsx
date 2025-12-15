import { useThemeMode } from "@/hooks/theme-context";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
};

// Liste des motifs de signalement
const REPORT_REASONS = [
  "Contenu inapproprié",
  "Spam / Publicité",
  "Harcèlement / Haine",
  "Autre"
];

export function ReportModal({ visible, onClose, onSubmit }: Props) {
  const { colors, theme } = useThemeMode(); // Ajout de 'theme' si dispo, sinon on utilise colors
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");

  const handleSubmit = () => {
    if (!selectedReason) return; // Force à choisir une catégorie

    // On combine la catégorie et le message détaillé
    const finalReason = details.trim().length > 0 
      ? `[${selectedReason}] ${details}` 
      : `[${selectedReason}]`;

    onSubmit(finalReason);
    
    // Reset
    setDetails("");
    setSelectedReason(null);
    onClose();
  };

  const isDark = theme === "dark";

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={[styles.card, { backgroundColor: colors.surface || "#FFFFFF" }]}>
          
          <Text style={[styles.title, { color: colors.text || "#000" }]}>
            Signaler ce défi
          </Text>
          
          <Text style={{ color: colors.mutedText || "#666", marginBottom: 15 }}>
            Sélectionnez un motif :
          </Text>

          {/* 1. Zone des Catégories (Chips) */}
          <View style={styles.chipsContainer}>
            {REPORT_REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  onPress={() => setSelectedReason(reason)}
                  style={[
                    styles.chip,
                    { 
                      borderColor: colors.mutedText || "#ccc",
                      backgroundColor: isSelected ? "#EF4444" : "transparent"
                    }
                  ]}
                >
                  <Text style={{ 
                    color: isSelected ? "white" : (colors.text || "#000"),
                    fontWeight: isSelected ? "700" : "400"
                  }}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 2. Zone de Message */}
          <TextInput
            style={[
              styles.input, 
              { 
                color: colors.text || "#000", 
                borderColor: colors.mutedText || "#ccc",
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F9FAFB" // Fond gris clair pour être visible
              }
            ]}
            placeholder="Détails supplémentaires (optionnel)..."
            placeholderTextColor={colors.mutedText || "#999"}
            multiline
            value={details}
            onChangeText={setDetails}
          />

          {/* Boutons d'action */}
          <View style={styles.buttons}>
            <TouchableOpacity onPress={onClose} style={styles.btn}>
              <Text style={{ color: colors.mutedText || "#666" }}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleSubmit} 
              disabled={!selectedReason} // Désactivé si pas de motif
              style={[
                styles.btn, 
                { backgroundColor: selectedReason ? "#EF4444" : "#ccc" }
              ]}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>Signaler</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)", // Un peu plus sombre pour le focus
    justifyContent: "center",
    padding: 20,
  },
  card: {
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 15,
    alignItems: "center",
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
});