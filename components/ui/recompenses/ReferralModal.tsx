import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Linking, Modal, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";

function randomCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function ReferralModal({ visible, onClose, onShared }: { visible: boolean; onClose: () => void; onShared?: () => void }) {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  const cardBackground = isLight ? colors.card : colors.surface;
  const cardAlt = isLight ? colors.cardAlt : colors.surfaceAlt;
  const cardText = isLight ? colors.cardText : colors.text;
  const cardMuted = isLight ? colors.cardMuted : colors.mutedText;
  const [code] = useState(() => randomCode());

  const message = useMemo(() => `Rejoins-moi sur notre app écoresponsable !\n\nVoici mon code de parrainage : ${code}\n\n• 250 🌿 pour toi lorsque ton ami atteint 1000 pièces au total\n• 500 🌿 pour ton ami quand il entre le code à l'inscription\n\nBoutique cadeaux: échange tes pièces contre des bons (PayPal, Nike, etc.).`, [code]);

  const shareGeneric = async () => {
    try {
      const res = await Share.share({ message });
      if (res.action === Share.sharedAction) onShared?.();
    } catch (e) {
      // noop
    }
  };

  const shareWhatsApp = async () => {
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      onShared?.();
    } catch {}
  };

  const copyCode = async () => {
    try {
      // Try expo-clipboard first (dynamic)
      const mod: any = await import("expo-clipboard").catch(() => null);
      if (mod?.setStringAsync) {
        await mod.setStringAsync(code);
      } else if (typeof navigator !== "undefined" && (navigator as any).clipboard?.writeText) {
        await (navigator as any).clipboard.writeText(code);
      }
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: cardBackground }]}>          
          <Text style={[styles.h1, { color: cardText }]}>Parrainage</Text>
          <Text style={[styles.p, { color: cardMuted }]}>Gagne des pièces en parrainant tes amis !</Text>

          <View style={[styles.codeBox, { backgroundColor: cardAlt }]}> 
            <Text style={styles.code}>{code}</Text>
            <TouchableOpacity onPress={copyCode} style={[styles.copyBtn, { backgroundColor: colors.accent }]}>
              <Text style={{ color: "#0F3327", fontWeight: "700" }}>Copier</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bullets}>
            <Text style={[styles.p, { color: cardText }]}>• 250 🌿 pour le parrain quand le filleul atteint 1000 pièces</Text>
            <Text style={[styles.p, { color: cardText }]}>• 500 🌿 pour le filleul quand il entre le code</Text>
          </View>

          {/* Bouton unique "Partager" avec petit logo WhatsApp à droite */}
          <TouchableOpacity onPress={shareGeneric} style={[styles.primaryRow, { backgroundColor: colors.accent }]}>            
            <Text style={styles.primaryText}>Partager</Text>
            <Ionicons name="logo-whatsapp" size={18} color="#0F3327" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.close}>
            <Text style={{ color: cardMuted }}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  card: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 },
  h1: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  p: { fontSize: 13, marginTop: 8, textAlign: "center" },
  codeBox: { marginTop: 16, borderRadius: 16, padding: 12, flexDirection: "row", alignItems: "center" },
  code: { flex: 1, fontSize: 22, fontWeight: "900", letterSpacing: 2, textAlign: "center" },
  copyBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  bullets: { marginTop: 8 },
  primaryRow: { marginTop: 16, borderRadius: 14, paddingVertical: 12, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  primaryText: { fontWeight: "800", color: "#0F3327" },
  secondary: { marginTop: 10, borderWidth: 2, borderRadius: 14, paddingVertical: 10, alignItems: "center" },
  secondaryText: { fontWeight: "800" },
  close: { marginTop: 10, alignItems: "center", paddingVertical: 8 },
});
