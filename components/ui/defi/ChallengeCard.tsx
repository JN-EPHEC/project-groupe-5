import { GradientButton } from "@/components/ui/common/GradientButton";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  const category = CATEGORY_CONFIG[challenge.category];
  const DIFFICULTY_GRADIENTS: Record<Challenge["difficulty"], [string, string]> = {
    Facile: ["#52D192", "#2BB673"],
    Moyen: ["#F6D365", "#F4C95D"],
    Difficile: ["#F9748F", "#F45B69"],
  };

  return (
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

      {isOngoing ? (
        <View style={{ marginTop: 24 }}>
          {status === 'active' && (
            <>
              <TouchableOpacity style={[styles.primaryButtonActive]} onPress={() => onToggle(challenge.id)}>
                <Text style={[styles.primaryTextActive]}>Défi en cours</Text>
                <Ionicons name="checkmark-circle" size={18} color="#7DCAB0" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
              {onValidatePhoto && (
                <TouchableOpacity style={styles.photoBtn} onPress={onValidatePhoto}>
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
    </View>
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
  photoBtn: { marginTop: 12, backgroundColor: "#D4F7E7", borderRadius: 18, paddingVertical: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  photoBtnText: { color: "#0F3327", fontWeight: '700' },
  pendingPill: { backgroundColor: '#142822', borderWidth: 1, borderColor: '#F6D365', borderRadius: 18, paddingVertical: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  pendingText: { color: '#F6D365', fontWeight: '700' },
  validatedPill: { backgroundColor: '#142822', borderWidth: 1, borderColor: '#52D192', borderRadius: 18, paddingVertical: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  validatedText: { color: '#52D192', fontWeight: '700' },
});
