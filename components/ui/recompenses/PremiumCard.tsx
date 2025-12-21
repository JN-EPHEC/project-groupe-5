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

// 🎨 LE NOUVEAU THEME (Juste les couleurs, pas de logique)
const premiumTheme = {
    glassBg: ["rgba(240, 253, 244, 0.95)", "rgba(255, 255, 255, 0.85)"] as const, // Fond Menthe
    borderColor: "rgba(255, 255, 255, 0.6)",
    price: "#008F6B", 
    coralGradient: ["#FF9D7E", "#FF8C66"] as const, // Bouton Corail
    textMain: "#0A3F33",
    textMuted: "#4A665F"
};

export function PremiumCard({ onSubscribe }: Props) {
  const { colors, mode } = useThemeMode();
  const { user } = useUser(); // ✅ Récupération de l'utilisateur
  const [isPremium, setIsPremium] = useState(false); // ✅ État pour gérer la visibilité

  // ✅ ÉCOUTEUR EN TEMPS RÉEL (Ta logique exacte conservée)
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

  // --- RENDU VISUEL (Mise à jour Design uniquement) ---

  const isLight = mode === "light";
  const darkCardGradient = ["rgba(0, 151, 178, 0.2)", "rgba(0, 151, 178, 0.05)"] as const;
  
  // Changement ici : On utilise le thème Menthe si Light
  const gradientColors = isLight 
    ? premiumTheme.glassBg 
    : darkCardGradient;
    
  const borderColor = isLight ? premiumTheme.borderColor : "rgba(0, 151, 178, 0.3)";
  
  const textPrimary = isLight ? premiumTheme.textMain : colors.text;
  const textMuted = isLight ? premiumTheme.textMuted : colors.mutedText;
  const priceColor = isLight ? premiumTheme.price : colors.accent;
  
  // Bouton : Corail en Light, Vert en Dark
  const buttonGradient = isLight 
    ? premiumTheme.coralGradient 
    : ["#99E2B4", "#14746F"] as const;
    
  const buttonTextColor = "#FFFFFF";

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
          styles.card, 
          { borderColor },
          isLight && styles.lightShadow // Ajout de l'ombre douce
      ]}
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
  // Style ajouté pour l'effet "glace" en relief
  lightShadow: { 
      shadowColor: "#005c4b", 
      shadowOffset: { width: 0, height: 8 }, 
      shadowOpacity: 0.06, 
      shadowRadius: 16, 
      elevation: 3 
  },
  title: { fontSize: 20, fontFamily: FontFamilies.heading },
  subtitle: { marginTop: 8, lineHeight: 20, fontFamily: FontFamilies.headingMedium },
  price: { marginTop: 14, fontSize: 22, fontFamily: FontFamilies.heading },
  caption: { marginTop: 4, fontFamily: FontFamilies.headingMedium },
  button: {
    marginTop: 16,
    borderRadius: 22,
    // Ombre sous le bouton pour le peps
    shadowColor: "rgba(255, 140, 102, 0.4)", 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.5, 
    shadowRadius: 8, 
    elevation: 3 
  },
  buttonGradient: {
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontSize: 16, fontFamily: FontFamilies.heading },
});

// Gardé pour compatibilité si tu l'utilises avec import default ailleurs
export default PremiumCard;