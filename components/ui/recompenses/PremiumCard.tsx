import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  onSubscribe?: () => void;
};

export function PremiumCard({ onSubscribe }: Props) {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  const gradientColors = isLight ? [colors.cardAlt, colors.card] : [colors.surfaceAlt, colors.surface];
  const borderColor = isLight ? "rgba(255,255,255,0.12)" : colors.surfaceAlt;
  const textPrimary = isLight ? colors.cardText : colors.text;
  const textMuted = isLight ? colors.cardMuted : colors.mutedText;
  const priceColor = colors.accent;
  const buttonBg = colors.accent;
  const buttonTextColor = isLight ? "#FFFFFF" : "#0F3327";
  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderColor }]}
    >
      <Text style={[styles.title, { color: textPrimary }]}>Premium Green+</Text>
      <Text style={[styles.subtitle, { color: textMuted }]}>Masque les publicités et reroll tes défis quotidiens </Text>

      <Text style={[styles.price, { color: priceColor }]}>4,90€ / mois</Text>
      <Text style={[styles.caption, { color: textMuted }]}>Annulable à tout moment</Text>

      <TouchableOpacity
        onPress={onSubscribe}
        activeOpacity={0.9}
        style={[styles.button, { backgroundColor: buttonBg }]}
      >
        <Text style={[styles.buttonText, { color: buttonTextColor }]}>Passer en Premium</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderWidth: 1,
    position: "relative",
  },
  title: { fontSize: 20, fontFamily: FontFamilies.heading },
  subtitle: { marginTop: 8, lineHeight: 20, fontFamily: FontFamilies.headingMedium },
  price: { marginTop: 14, fontSize: 22, fontFamily: FontFamilies.heading },
  caption: { marginTop: 4, fontFamily: FontFamilies.headingMedium },
  button: {
    marginTop: 16,
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { fontSize: 16, fontFamily: FontFamilies.heading },
});

export default PremiumCard;
