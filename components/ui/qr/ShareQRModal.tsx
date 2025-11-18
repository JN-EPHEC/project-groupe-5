import React, { useRef } from "react";
import { Linking, Modal, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
// NOTE: Avoid static imports for expo-file-system / expo-sharing to prevent web bundler errors
// We'll dynamic import them only when needed inside share handlers.
import { Ionicons } from "@expo/vector-icons";

export type ShareQRModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  qrValue: string; // data encoded in the QR
  shareText?: string; // text for shares (WhatsApp / generic)
  accentColor?: string;
};

export const ShareQRModal: React.FC<ShareQRModalProps> = ({ visible, onClose, title = "Partager", subtitle, qrValue, shareText, accentColor = "#34D399" }) => {
  const qrRef = useRef<QRCode | null>(null);

  const shareQRImage = async () => {
    try {
      // Dynamically import native modules only when invoked
      const FileSystem = await import("expo-file-system");
      const Sharing = await import("expo-sharing");
      const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || "";
      const filePath = cacheDir + `qr-${Date.now()}.png`;
      const asText = await new Promise<string>((resolve) => {
        // @ts-ignore - types don't expose toDataURL in defs
        qrRef.current?.toDataURL((data: string) => resolve(data));
      });
      await (FileSystem as any).writeAsStringAsync(filePath, asText, { encoding: (FileSystem as any).EncodingType.Base64 });
      if (await (Sharing as any).isAvailableAsync()) {
        await (Sharing as any).shareAsync(filePath);
      } else {
        // Fallback to generic share of link/text if image sharing unavailable
        await Share.share({ message: shareText || qrValue });
      }
    } catch (e) {
      await Share.share({ message: shareText || qrValue });
    }
  };

  const shareLinkGeneric = async () => {
    await Share.share({ message: shareText || qrValue });
  };

  const shareWhatsApp = async () => {
    const msg = encodeURIComponent(shareText || qrValue);
    const url = `whatsapp://send?text=${msg}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      await shareLinkGeneric();
    }
  };
  const shareInstagram = async () => {
    // Try opening Instagram, then fall back to generic share
    const canOpen = await Linking.canOpenURL('instagram://app');
    if (canOpen) {
      await Linking.openURL('instagram://app');
      // Also present OS share sheet with image for convenience
      await shareQRImage();
    } else {
      await shareQRImage();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.card, { borderColor: accentColor }]}> 
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" color="#fff" size={22} />
            </TouchableOpacity>
          </View>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.qrContainer}>
            <QRCode value={qrValue} size={220} backgroundColor="transparent" color="#fff" getRef={(c) => (qrRef.current = c)} />
          </View>
          <View style={styles.row}>
            <TouchableOpacity onPress={shareQRImage} style={[styles.btn, { backgroundColor: accentColor }]}>
              <Ionicons name="image-outline" size={18} color="#0F3327" />
              <Text style={[styles.btnText, { color: "#0F3327" }]}>Partager l'image</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={shareLinkGeneric} style={styles.btnAlt}>
              <Ionicons name="share-social-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>Partager le lien</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={shareWhatsApp} style={styles.btnAlt}>
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
            <Text style={[styles.btnText, { color: "#fff" }]}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={shareInstagram} style={styles.btnAlt}>
            <Ionicons name="logo-instagram" size={18} color="#fff" />
            <Text style={[styles.btnText, { color: "#fff" }]}>Instagram</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
  card: { width: "100%", maxWidth: 420, backgroundColor: "#0B1220", borderRadius: 20, padding: 16, borderWidth: 1 },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  subtitle: { color: "#A1A1AA", marginBottom: 10 },
  qrContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  row: { flexDirection: "row", gap: 10, marginTop: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 },
  btnAlt: { paddingVertical: 12, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: "#232A3A", marginTop: 10 },
  btnText: { color: "#fff", fontWeight: "700" },
});
