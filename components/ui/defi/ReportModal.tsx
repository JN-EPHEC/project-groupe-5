import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

// 🎨 THEME REPORT MODAL
const reportTheme = {
    // Mode Clair
    glassBg: ["rgba(255, 255, 255, 0.95)", "rgba(240, 253, 244, 0.95)"] as const,
    borderColor: "rgba(255, 255, 255, 0.6)",
    textMain: "#0A3F33", 
    textMuted: "#4A665F",
    accent: "#008F6B", 
    danger: "#EF4444",

    // Mode Sombre (Nouveau Bleu/Vert Glass Harmonisé)
    darkGlassBg: ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"] as const,
    darkBorderColor: "rgba(0, 151, 178, 0.3)",
};

export function ReportModal({ visible, onClose, onSubmit }: Props) {
  const { colors, mode } = useThemeMode();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");

  const handleSubmit = () => {
    if (!selectedReason) return;

    const finalReason = details.trim().length > 0 
      ? `[${selectedReason}] ${details}` 
      : `[${selectedReason}]`;

    onSubmit(finalReason);
    
    setDetails("");
    setSelectedReason(null);
    onClose();
  };

  const isLight = mode === "light";
  
  // Couleurs dynamiques
  const titleColor = isLight ? reportTheme.textMain : colors.text;
  const textColor = isLight ? reportTheme.textMuted : colors.mutedText;

  // Wrapper conditionnel (Toujours LinearGradient pour l'effet glass)
  const Wrapper = LinearGradient;
  
  const wrapperProps = { 
    colors: isLight ? reportTheme.glassBg : reportTheme.darkGlassBg, 
    start: { x: 0, y: 0 }, 
    end: { x: 1, y: 1 }, 
    style: [
        styles.card, 
        styles.glassEffect, 
        { 
            borderColor: isLight ? reportTheme.borderColor : reportTheme.darkBorderColor,
            borderWidth: 1 
        }
    ] 
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        
        <Wrapper {...wrapperProps}>
          <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: isLight ? "#FEF2F2" : "rgba(239, 68, 68, 0.15)" }]}>
                <Ionicons name="warning-outline" size={24} color={reportTheme.danger} />
              </View>
              <Text style={[styles.title, { color: titleColor }]}>
                Signaler ce contenu
              </Text>
          </View>
          
          <Text style={{ color: textColor, marginBottom: 16, textAlign: 'center' }}>
            Aidez-nous à comprendre le problème. Ce signalement est anonyme.
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
                      borderColor: isSelected ? reportTheme.danger : (isLight ? "rgba(0,143,107,0.2)" : "rgba(255,255,255,0.1)"),
                      backgroundColor: isSelected ? reportTheme.danger : (isLight ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.05)")
                    }
                  ]}
                >
                  <Text style={{ 
                    color: isSelected ? "white" : (isLight ? reportTheme.textMain : colors.text),
                    fontWeight: isSelected ? "700" : "500",
                    fontSize: 13
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
                color: isLight ? reportTheme.textMain : colors.text, 
                borderColor: isLight ? "rgba(0,143,107,0.2)" : "rgba(255,255,255,0.1)",
                backgroundColor: isLight ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.2)" 
              }
            ]}
            placeholder="Détails supplémentaires (optionnel)..."
            placeholderTextColor={isLight ? "#8AA39C" : colors.mutedText}
            multiline
            value={details}
            onChangeText={setDetails}
          />

          {/* Boutons d'action */}
          <View style={styles.buttons}>
            <TouchableOpacity onPress={onClose} style={[styles.btn, { backgroundColor: isLight ? "#F3F4F6" : "rgba(255,255,255,0.1)" }]}>
              <Text style={{ color: isLight ? "#4B5563" : colors.mutedText, fontWeight: "600" }}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleSubmit} 
              disabled={!selectedReason}
              style={[
                styles.btn, 
                { 
                    backgroundColor: selectedReason ? reportTheme.danger : (isLight ? "#E5E7EB" : "#333"),
                    shadowColor: selectedReason ? reportTheme.danger : "transparent",
                    shadowOpacity: 0.3, shadowOffset: {width: 0, height: 4}, shadowRadius: 6, elevation: selectedReason ? 4 : 0
                }
              ]}
            >
              <Text style={{ color: selectedReason ? "white" : (isLight ? "#9CA3AF" : "#666"), fontWeight: "700" }}>Signaler</Text>
            </TouchableOpacity>
          </View>

        </Wrapper>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
    alignItems: 'center'
  },
  card: {
    padding: 24,
    borderRadius: 24,
    width: '100%',
    maxWidth: 340,
  },
  glassEffect: {
    // Shadow est géré ici mais le background vient du wrapperProps
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
      alignItems: 'center',
      marginBottom: 10
  },
  iconContainer: {
      width: 48, height: 48, borderRadius: 24,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 12
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: 'center',
    fontFamily: "StylizedTitle" // Adapte si tu n'as pas cette font
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
    justifyContent: 'center'
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
    fontSize: 15
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
});