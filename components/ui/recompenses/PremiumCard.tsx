import { FontFamilies } from "@/constants/fonts";
import { db } from "@/firebaseConfig"; // ✅ Import Firebase
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context"; // ✅ Import du contexte utilisateur
import { LinearGradient } from "expo-linear-gradient";
import { collection, limit, onSnapshot, query, where } from "firebase/firestore"; // ✅ Imports Firestore
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  onSubscribe?: () => void;
};

export function PremiumCard({ onSubscribe }: Props) {
  const { colors, mode } = useThemeMode();
  const { user } = useUser(); // ✅ Récupération de l'utilisateur
  const [isPremium, setIsPremium] = useState(false); // ✅ État pour gérer la visibilité

  // ✅ ÉCOUTEUR EN TEMPS RÉEL (Copie de la logique du Header)
  useEffect(() => {
    if (!user?.uid) return;

    // On regarde s'il y a un abonnement actif ou en essai
    const q = query(
      collection(db, "customers", user.uid, "subscriptions"),
      where("status", "in", ["active", "trialing"]),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Si on trouve un document, c'est que l'utilisateur est Premium
      setIsPremium(!snapshot.empty);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // ✅ MAGIE : Si l'utilisateur est Premium, on n'affiche RIEN du tout
  if (isPremium) {
    return null;
  }

  // --- Le reste du code d'affichage normal pour les non-premium ---

  const isLight = mode === "light";
  const darkCardGradient = ["rgba(0, 151, 178, 0.2)", "rgba(0, 151, 178, 0.05)"] as const;
  const gradientColors = isLight
    ? ([colors.cardAlt, colors.card] as const)
    : darkCardGradient;
  const borderColor = isLight ? "rgba(255,255,255,0.12)" : "rgba(0, 151, 178, 0.3)";
  const textPrimary = isLight ? colors.cardText : colors.text;
  const textMuted = isLight ? colors.cardMuted : colors.mutedText;
  const priceColor = colors.accent;
  const buttonGradient = [
    "#99E2B4",
    "#88D4AB",
    "#78C6A3",
    "#67B99A",
    "#56AB91",
    "#469D89",
    "#358F80",
    "#248277",
    "#14746F",
  ] as const;
  const buttonTextColor = "#FFFFFF";

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderColor }]}
    >
      <Text style={[styles.title, { color: textPrimary }]}>Premium Green+</Text>
      <Text style={[styles.subtitle, { color: textMuted }]}>Masque les publicités et reroll tes défis quotidiens </Text>

      <Text style={[styles.price, { color: priceColor }]}>1,99€ / mois</Text>
      <Text style={[styles.caption, { color: textMuted }]}>Annulable à tout moment</Text>

      <TouchableOpacity onPress={onSubscribe} activeOpacity={0.9} style={styles.button}>
        <LinearGradient
          colors={buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          <Text style={[styles.buttonText, { color: buttonTextColor }]}>Passer en Premium</Text>
        </LinearGradient>
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
  },
  buttonGradient: {
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontSize: 16, fontFamily: FontFamilies.heading },
});

export default PremiumCard;