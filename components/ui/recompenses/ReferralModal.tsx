import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
// 👇 AJOUT DE 'Platform' ICI
import { Alert, Modal, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";

function randomCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// 🎨 THEME REFERRAL
const referralTheme = {
    glassBg: ["rgba(255, 255, 255, 0.95)", "rgba(255, 255, 255, 0.85)"] as const,
    glassBorder: "rgba(255, 255, 255, 0.8)",
    codeBg: "rgba(0, 143, 107, 0.08)",
    textMain: "#0A3F33",
    textMuted: "#4A665F",
    accent: "#008F6B", // Vert Marque
};

export function ReferralModal({ visible, onClose, onShared }: { visible: boolean; onClose: () => void; onShared?: () => void }) {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  const [code] = useState(() => randomCode());

  // Couleurs dynamiques
  const titleColor = isLight ? referralTheme.textMain : colors.text;
  const textColor = isLight ? referralTheme.textMuted : colors.mutedText;
  const accentColor = isLight ? referralTheme.accent : colors.accent;

  const message = useMemo(() => `Rejoins-moi sur GreenUp !\n\nUtilise mon code de parrainage : ${code}\n\n• 250 🌿 pour moi\n• 500 🌿 pour toi\n\nTélécharge l'app ici : https://greenup-app.com`, [code]);

  const shareGeneric = async () => {
    try {
      const res = await Share.share({ message });
      if (res.action === Share.sharedAction) onShared?.();
    } catch (e) {}
  };

  const copyCode = async () => {
    await Clipboard.setStringAsync(code);
    Alert.alert("Copié !", "Le code est dans le presse-papiers.");
  };

  // Wrapper Fond Carte
  const CardWrapper = isLight ? LinearGradient : View;
  const cardProps = isLight 
    ? { 
        colors: referralTheme.glassBg, 
        start: { x: 0, y: 0 }, 
        end: { x: 1, y: 1 }, 
        style: [styles.card, { borderColor: referralTheme.glassBorder, borderWidth: 1 }] 
      } 
    : { style: [styles.card, { backgroundColor: colors.surface, borderColor: "rgba(255,255,255,0.1)", borderWidth: 1 }] };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        
        <CardWrapper {...(cardProps as any)}>
          <View style={styles.handle} />
          
          <Text style={[styles.h1, { color: titleColor }]}>Parrainage</Text>
          <Text style={[styles.p, { color: textColor }]}>Invite tes amis et gagnez ensemble !</Text>

          {/* ZONE CODE */}
          <View style={[styles.codeBox, { backgroundColor: isLight ? referralTheme.codeBg : colors.surfaceAlt }]}>
            <View>
                <Text style={{ color: textColor, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 2 }}>TON CODE</Text>
                <Text style={[styles.code, { color: titleColor }]}>{code}</Text>
            </View>
            <TouchableOpacity onPress={copyCode} style={{ padding: 8 }}>
                <Ionicons name="copy-outline" size={24} color={accentColor} />
            </TouchableOpacity>
          </View>

          {/* AVANTAGES */}
          <View style={styles.bullets}>
            <View style={styles.bulletRow}>
                <View style={[styles.bulletIcon, { backgroundColor: isLight ? "#E0F7EF" : "rgba(255,255,255,0.1)" }]}>
                    <Ionicons name="gift-outline" size={18} color={accentColor} />
                </View>
                <Text style={[styles.bulletText, { color: textColor }]}>
                    <Text style={{ fontWeight: 'bold', color: titleColor }}>+250 🌿</Text> pour toi (dès 1000 pts cumulés par l'ami)
                </Text>
            </View>
            <View style={styles.bulletRow}>
                <View style={[styles.bulletIcon, { backgroundColor: isLight ? "#E0F7EF" : "rgba(255,255,255,0.1)" }]}>
                    <Ionicons name="person-add-outline" size={18} color={accentColor} />
                </View>
                <Text style={[styles.bulletText, { color: textColor }]}>
                    <Text style={{ fontWeight: 'bold', color: titleColor }}>+500 🌿</Text> pour ton ami à l'inscription
                </Text>
            </View>
          </View>

          {/* BOUTON PARTAGER */}
          <TouchableOpacity onPress={shareGeneric} activeOpacity={0.9} style={{ marginTop: 24 }}>
            <LinearGradient
                colors={isLight ? ["#008F6B", "#10B981"] : [colors.accent, colors.accent]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.primaryRow}
            >
                <Text style={styles.primaryText}>Partager mon code</Text>
                <Ionicons name="share-social" size={18} color="#FFF" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.close}>
            <Text style={{ color: textColor, fontWeight: '600' }}>Fermer</Text>
          </TouchableOpacity>
        </CardWrapper>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  card: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.2)", alignSelf: 'center', marginBottom: 20 },
  
  h1: { fontSize: 22, fontWeight: "800", fontFamily: FontFamilies.heading, textAlign: "center", marginBottom: 6 },
  p: { fontSize: 14, textAlign: "center", fontFamily: FontFamilies.body, marginBottom: 24 },
  
  codeBox: { 
      borderRadius: 16, padding: 16, 
      flexDirection: "row", alignItems: "center", justifyContent: 'space-between',
      borderWidth: 1, borderColor: "rgba(0,0,0,0.05)",
      marginBottom: 24
  },
  code: { fontSize: 24, fontWeight: "900", letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  
  bullets: { gap: 12 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bulletIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bulletText: { flex: 1, fontSize: 13, lineHeight: 18, fontFamily: FontFamilies.body },

  primaryRow: { borderRadius: 16, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", shadowColor: "#008F6B", shadowOpacity: 0.3, shadowOffset: {width: 0, height: 4}, shadowRadius: 8, elevation: 4 },
  primaryText: { fontWeight: "700", color: "#FFF", fontSize: 16, fontFamily: FontFamilies.heading },
  
  close: { marginTop: 16, alignItems: "center", paddingVertical: 10 },
});