import { useThemeMode } from "@/hooks/theme-context";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  onSubscribe?: () => void;
};

export function PremiumCard({ onSubscribe }: Props) {
  const { colors } = useThemeMode();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceAlt }]}> 
      <Text style={[styles.title, { color: colors.text }]}>Premium Green+</Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>Masque les publicités et reroll tes défis quotidiens </Text>

      <Text style={[styles.price, { color: colors.accent }]}>4,90€ / mois</Text>
      <Text style={[styles.caption, { color: colors.mutedText }]}>Annulable à tout moment</Text>

      <TouchableOpacity
        onPress={onSubscribe}
        activeOpacity={0.9}
        style={[styles.button, { backgroundColor: colors.accent }]}
      >
        <Text style={styles.buttonText}>Passer en Premium</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    marginTop: 20,
  },
  title: { fontSize: 20, fontWeight: "800" },
  subtitle: { marginTop: 8, lineHeight: 20 },
  price: { marginTop: 14, fontSize: 20, fontWeight: "900" },
  caption: { marginTop: 4 },
  button: {
    marginTop: 16,
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { fontWeight: "900", color: "#0F3327" },
});

export default PremiumCard;
