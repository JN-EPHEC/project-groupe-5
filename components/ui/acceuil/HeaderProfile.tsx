import { FontFamilies } from "@/constants/fonts";
import { db } from "@/firebaseConfig";
import { useClub } from "@/hooks/club-context";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { collection, doc, limit, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const headerTheme = {
    glassBg: ["rgba(240, 253, 244, 0.95)", "rgba(255, 255, 255, 0.85)"] as const,
    borderColor: "rgba(255, 255, 255, 0.6)",
    textMain: "#0A3F33",
    textMuted: "#4A665F",
    coralBadge: "#FF8C66",
    watermarkColor: "rgba(0, 143, 107, 0.12)", 
};

export const Header = () => {
  const { user, loading } = useUser();
  const { joinedClub } = useClub();
  const { colors, mode } = useThemeMode();
  
  // ✅ LOGIQUE RESTAURÉE : États pour le temps réel
  const [liveColor, setLiveColor] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  const isLight = mode === "light";

  // ✅ LOGIQUE RESTAURÉE : Écouteur Couleur Avatar
  useEffect(() => {
    if (!user?.uid) return;
    const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => { 
        if (docSnap.exists()) { 
            const data = docSnap.data(); 
            if (data.avatarColor) setLiveColor(data.avatarColor); 
        } 
    });
    return () => unsubUser();
  }, [user?.uid]);

  // ✅ LOGIQUE RESTAURÉE : Écouteur Premium
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "customers", user.uid, "subscriptions"), where("status", "in", ["active", "trialing"]), limit(1));
    const unsubSub = onSnapshot(q, (snapshot) => { setIsPremium(!snapshot.empty); });
    return () => unsubSub();
  }, [user?.uid]);
  
  if (loading || !user) return null;
  
  const displayName = (user?.username ?? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`).trim() || "Invité";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const avatarBgColor = liveColor || (user as any).avatarColor || "#19D07D";
  const isWhiteBg = ["#FFFFFF", "#ffffff", "#fff", "#FFF"].includes(avatarBgColor);
  
  // Bordure dorée si premium
  const finalBorderColor = isPremium ? "#FFD700" : (isWhiteBg ? "#E5E5E5" : "transparent");
  const finalBorderWidth = isPremium ? 3 : (isWhiteBg ? 1 : 0);
  
  const badgeColor = isLight ? headerTheme.coralBadge : colors.accent;
  const badgeTextColor = isLight ? "#FFFFFF" : "#07321F";
  const primaryText = isLight ? headerTheme.textMain : colors.text;
  const secondaryText = isLight ? headerTheme.textMuted : colors.mutedText;

  return (
    <LinearGradient
      colors={isLight ? headerTheme.glassBg : (["rgba(0, 151, 178, 0.2)", "rgba(0, 151, 178, 0.05)"] as const)}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[
        styles.header, 
        { borderColor: isLight ? headerTheme.borderColor : "rgba(0, 151, 178, 0.3)", borderWidth: 1, shadowColor: isLight ? "#005c4b" : colors.accent },
        isLight && styles.lightShadow
      ]}
    >
      {/* 🍃 DESIGN : Feuille Élégante en haut à droite */}
      {isLight && (
        <View style={styles.watermarkContainer} pointerEvents="none">
            <Ionicons name="leaf" size={100} color={headerTheme.watermarkColor} />
        </View>
      )}

      <View style={{ zIndex: 10, alignItems: 'center' }}>
        <View style={styles.avatarContainer}>
            {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={[styles.avatarImage, { borderColor: finalBorderColor, borderWidth: finalBorderWidth }]} />
            ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: avatarBgColor, borderWidth: finalBorderWidth, borderColor: finalBorderColor }]}>
                <Text style={{ color: isWhiteBg ? "#1A1A1A" : "#FFFFFF", fontSize: 28, fontFamily: FontFamilies.heading }}>{initials}</Text>
            </View>
            )}
            <View style={[styles.badge, { backgroundColor: badgeColor }]}><Text style={[styles.badgeText, { color: badgeTextColor }]}>10</Text></View>
        </View>
        
        <Text style={[styles.name, { color: primaryText }]}>Bonjour {displayName}</Text>
        
        {isPremium && (
            <Text style={styles.premiumText}>MEMBRE PREMIUM</Text>
        )}

        <Text style={[styles.club, { color: secondaryText }]}>
            {joinedClub?.name ?? user?.bio ?? "—"}
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: { alignItems: "center", marginTop: 28, marginBottom: 20, paddingVertical: 24, borderRadius: 26, position: "relative", width: "100%", overflow: 'hidden' },
  lightShadow: { shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3 },
  avatarContainer: { position: "relative", alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 80, height: 80, borderRadius: 40 }, 
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", bottom: 0, right: 0, borderRadius: 15, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 2, borderColor: "#FFF" },
  badgeText: { fontFamily: FontFamilies.bodyStrong, fontSize: 12 },
  name: { fontSize: 24, fontFamily: FontFamilies.heading, marginTop: 12 },
  club: { fontFamily: FontFamilies.body, marginTop: 4 },
  premiumText: { color: "#FFD700", fontFamily: FontFamilies.bodyStrong, fontSize: 12, marginTop: 2, marginBottom: 2 },
  watermarkContainer: { position: 'absolute', top: -20, right: -25, transform: [{ rotate: '-20deg' }] }
});