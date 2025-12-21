import { FontFamilies } from "@/constants/fonts";
import { db } from "@/firebaseConfig";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { LinearGradient } from "expo-linear-gradient";
import { collection, limit, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  onSubscribe?: () => void;
};

// 🎨 THEME PREMIUM (Menthe Givrée & Corail)
const premiumTheme = {
    glassBg: ["rgba(240, 253, 244, 0.95)", "rgba(255, 255, 255, 0.85)"] as const,
    borderColor: "rgba(255, 255, 255, 0.6)",
    price: "#008F6B", 
    coralGradient: ["#FF9D7E", "#FF8C66"] as const,
    textMain: "#0A3F33",
    textMuted: "#4A665F"
};

export function PremiumCard({ onSubscribe }: Props) {
  const { colors, mode } = useThemeMode();
  const { user } = useUser();
  const [isPremium, setIsPremium] = useState(false);

  // ✅ LOGIQUE ABONNEMENT TEMPS RÉEL (Conservée)
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "customers", user.uid, "subscriptions"), 
      where("status", "in", ["active", "trialing"]), 
      limit(1)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => { 
        setIsPremium(!snapshot.empty); 
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // Si Premium, on n'affiche rien (magie !)
  if (isPremium) return null;

  const isLight = mode === "light";
  
  // --- GESTION COULEURS ---
  const darkCardGradient = ["rgba(0, 151, 178, 0.2)", "rgba(0, 151, 178, 0.05)"] as const;
  const gradientColors = isLight ? premiumTheme.glassBg : darkCardGradient;
  const borderColor = isLight ? premiumTheme.borderColor : "rgba(0, 151, 178, 0.3)";
  const textPrimary = isLight ? premiumTheme.textMain : colors.text;
  const textMuted = isLight ? premiumTheme.textMuted : colors.mutedText;
  const priceColor = isLight ? premiumTheme.price : colors.accent;
  
  // Bouton : Corail en Light, Vert défaut en Dark
  const buttonGradient = isLight ? premiumTheme.coralGradient : ["#99E2B4", "#14746F"] as const;

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }} 
      end={{ x: 1, y: 1 }}
      style={[
          styles.card, 
          { borderColor }, 
          isLight && styles.lightShadow // Ombre douce uniquement en Light
      ]}
    >
      <Text style={[styles.title, { color: textPrimary }]}>Premium Green+</Text>
      <Text style={[styles.subtitle, { color: textMuted }]}>
        Masque les publicités et reroll tes défis quotidiens
      </Text>
      
      <Text style={[styles.price, { color: priceColor }]}>1,99€ / mois</Text>
      <Text style={[styles.caption, { color: textMuted }]}>Annulable à tout moment</Text>
      
      <TouchableOpacity onPress={onSubscribe} activeOpacity={0.9} style={styles.button}>
        <LinearGradient 
            colors={buttonGradient} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }} 
            style={styles.buttonGradient}
        >
          <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>Passer en Premium</Text>
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
      position: "relative" 
  },
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
      shadowColor: "rgba(255, 140, 102, 0.4)", // Ombre corail sous le bouton
      shadowOffset: { width: 0, height: 4 }, 
      shadowOpacity: 0.5, 
      shadowRadius: 8, 
      elevation: 3 
  },
  buttonGradient: { 
      borderRadius: 22, 
      paddingVertical: 14, 
      alignItems: "center", 
      justifyContent: "center" 
  },
  buttonText: { fontSize: 16, fontFamily: FontFamilies.heading },
});