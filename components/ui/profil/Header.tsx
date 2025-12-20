import { FontFamilies } from "@/constants/fonts";
import { db } from "@/firebaseConfig";
import { useClub } from "@/hooks/club-context";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { LinearGradient } from "expo-linear-gradient";
// ✅ AJOUT : Imports nécessaires pour vérifier l'abonnement
import { collection, doc, limit, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export const Header = () => {
  const { user, loading } = useUser();
  const { joinedClub } = useClub();
  const { colors, mode } = useThemeMode();
  
  // État local pour la couleur et le statut Premium
  const [liveColor, setLiveColor] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false); // ✅ État pour gérer le cercle doré

  const isLight = mode === "light";
  const gradientColors = isLight
    ? ([colors.cardAlt, colors.card] as const)
    : (["rgba(0, 151, 178, 0.2)", "rgba(0, 151, 178, 0.05)"] as const);
    
  const primaryText = isLight ? colors.cardText : colors.text;
  const secondaryText = isLight ? colors.cardMuted : colors.mutedText;

  // 1. Écouteur pour la couleur de l'avatar (existant)
  useEffect(() => {
    if (!user?.uid) return;

    const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.avatarColor) {
          setLiveColor(data.avatarColor);
        }
      }
    });

    return () => unsubUser();
  }, [user?.uid]);

  // 2. ✅ NOUVEAU : Écouteur pour le statut Premium (Cercle Doré)
  useEffect(() => {
    if (!user?.uid) return;

    // On écoute la collection subscriptions en temps réel
    const q = query(
      collection(db, "customers", user.uid, "subscriptions"),
      where("status", "in", ["active", "trialing"]),
      limit(1)
    );

    const unsubSub = onSnapshot(q, (snapshot) => {
      // Si snapshot n'est pas vide, c'est qu'il y a un abonnement actif
      setIsPremium(!snapshot.empty);
    });

    return () => unsubSub();
  }, [user?.uid]);
  
  if (loading || !user) {
    return null;
  }
  
  const displayName = (user?.username ?? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`).trim() || "Invité";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  // Gestion des couleurs
  const avatarBgColor = liveColor || (user as any).avatarColor || "#19D07D";
  const isWhiteBg = ["#FFFFFF", "#ffffff", "#fff", "#FFF"].includes(avatarBgColor);
  const initialsColor = isWhiteBg ? "#1A1A1A" : "#FFFFFF";

  // ✅ LOGIQUE DU CERCLE DORÉ
  // Si Premium : Doré (#FFD700) et bordure épaisse (3)
  // Sinon : Bordure standard (transparente ou grise selon le fond)
  const finalBorderColor = isPremium ? "#FFD700" : (isWhiteBg ? "#E5E5E5" : "transparent");
  const finalBorderWidth = isPremium ? 3 : (isWhiteBg ? 1 : 0);

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.header, 
        { 
          shadowColor: colors.accent, 
          borderColor: isLight ? "transparent" : "rgba(0, 151, 178, 0.3)", 
          borderWidth: isLight ? 0 : 1 
        }
      ]}
    >
      <View style={styles.avatarContainer}>
        {/* Affichage Photo ou Placeholder avec le style dynamique */}
        {user?.photoURL ? (
          <Image 
            source={{ uri: user.photoURL }} 
            style={[
              styles.avatarImage, 
              // ✅ Application de la bordure dorée ici
              { borderColor: finalBorderColor, borderWidth: finalBorderWidth } 
            ]} 
          />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              { 
                backgroundColor: avatarBgColor, 
                alignItems: "center",
                justifyContent: "center",
                // ✅ Application de la bordure dorée ici aussi
                borderWidth: finalBorderWidth,
                borderColor: finalBorderColor
              },
            ]}
          >
            <Text style={{ color: initialsColor, fontSize: 28, fontFamily: FontFamilies.heading }}>
              {initials}
            </Text>
          </View>
        )}
        
        {/* Badge Niveau */}
        <View
          style={[styles.badge, { backgroundColor: colors.accent }]}
        >
          <Text style={[styles.badgeText, { color: "#07321F" }]}>10</Text>
        </View>
      </View>
      
      <Text style={[styles.name, { color: primaryText }]}>
        Bonjour {displayName}
      </Text>
      
      {/* Affichage du statut Premium sous le nom (Optionnel, pour debug ou style) */}
      {isPremium && (
        <Text style={{ color: "#FFD700", fontFamily: FontFamilies.bodyStrong, fontSize: 12, marginTop: 2, marginBottom: 2 }}>
          MEMBRE PREMIUM
        </Text>
      )}

      <Text style={[styles.club, { color: secondaryText }]}>
        {joinedClub?.name ?? user?.bio ?? "—"}
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginTop: 28,
    marginBottom: 20,
    paddingVertical: 24,
    borderRadius: 26,
    position: "relative",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  avatarContainer: { position: "relative", alignItems: 'center', justifyContent: 'center' },
  // J'ai retiré le borderRadius ici car il est géré dynamiquement, mais on garde la taille
  avatarImage: { width: 80, height: 80, borderRadius: 40 }, 
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40 },
  badge: { position: "absolute", bottom: 5, right: 0, borderRadius: 15, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontFamily: FontFamilies.bodyStrong },
  name: { fontSize: 24, fontFamily: FontFamilies.heading, marginTop: 10 },
  club: { fontFamily: FontFamilies.body, marginTop: 4 },
});