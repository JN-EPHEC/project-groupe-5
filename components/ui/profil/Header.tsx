import { FontFamilies } from "@/constants/fonts";
import { db } from "@/firebaseConfig"; // ✅ Ajout des imports Firebase
import { useClub } from "@/hooks/club-context";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { LinearGradient } from "expo-linear-gradient";
import { doc, onSnapshot } from "firebase/firestore"; // ✅ Pour écouter les changements en direct
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export const Header = () => {
  const { user, loading } = useUser();
  const { joinedClub } = useClub();
  const { colors, mode } = useThemeMode();
  
  // État local pour stocker la couleur en temps réel
  const [liveColor, setLiveColor] = useState<string | null>(null);

  const isLight = mode === "light";
  const gradientColors = isLight
    ? ([colors.cardAlt, colors.card] as const)
    : (["rgba(0, 151, 178, 0.2)", "rgba(0, 151, 178, 0.05)"] as const);
    
  const primaryText = isLight ? colors.cardText : colors.text;
  const secondaryText = isLight ? colors.cardMuted : colors.mutedText;

  // 🔥 SOLUTION : Écouteur en direct sur le profil utilisateur
  // Cela permet de voir la couleur changer immédiatement même si le Context ne l'a pas
  useEffect(() => {
    if (!user?.uid) return;

    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // On met à jour la couleur si elle existe
        if (data.avatarColor) {
          setLiveColor(data.avatarColor);
        }
      }
    });

    return () => unsub();
  }, [user?.uid]);
  
  if (loading || !user) {
    return null;
  }
  
  const displayName = (user?.username ?? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`).trim() || "Invité";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  // PRIORITÉ : Couleur en direct > Couleur du User > Vert par défaut
  const avatarBgColor = liveColor || (user as any).avatarColor || "#19D07D";
  
  // Contraste du texte
  const isWhiteBg = ["#FFFFFF", "#ffffff", "#fff", "#FFF"].includes(avatarBgColor);
  const initialsColor = isWhiteBg ? "#1A1A1A" : "#FFFFFF";
  const borderColor = isWhiteBg ? "#E5E5E5" : "transparent";

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
        {/* On affiche la photo SI elle existe dans l'objet user ET qu'elle n'est pas vide */}
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              { 
                backgroundColor: avatarBgColor, 
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: borderColor
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
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40 },
  badge: { position: "absolute", bottom: 5, right: 0, borderRadius: 15, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontFamily: FontFamilies.bodyStrong },
  name: { fontSize: 24, fontFamily: FontFamilies.heading, marginTop: 10 },
  club: { fontFamily: FontFamilies.body, marginTop: 4 },
});