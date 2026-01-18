import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

export type ShareQRModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  qrValue: string; // La donnée du QR (le lien)
  shareText?: string; // Le texte à partager
  accentColor?: string;
};

export const ShareQRModal: React.FC<ShareQRModalProps> = ({ 
  visible, 
  onClose, 
  title = "Partager", 
  subtitle, 
  qrValue, 
  shareText, 
  accentColor = "#34D399" 
}) => {

  // Fonction simple de partage natif (Lien / Texte)
  const handleShare = async () => {
    try {
      await Share.share({ 
        message: shareText || qrValue,
        // url: qrValue // Utile sur iOS pour que ça soit reconnu comme lien direct
      });
    } catch (error) {
      console.log("Erreur de partage", error);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.card, { borderColor: accentColor }]}> 
          
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Ionicons name="close" color="#fff" size={24} />
            </TouchableOpacity>
          </View>

          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          {/* Grand QR Code */}
          <View style={styles.qrContainer}>
            <QRCode 
              value={qrValue} 
              size={280} // Agrandissement
              backgroundColor="transparent" 
              color="#fff" 
            />
          </View>

          {/* Bouton Unique de Partage */}
          <TouchableOpacity 
            onPress={handleShare} 
            style={[styles.btn, { backgroundColor: accentColor }]}
          >
            <Ionicons name="share-outline" size={20} color="#0F3327" />
            <Text style={[styles.btnText, { color: "#0F3327" }]}>Partager le lien</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.7)", 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 24 
  },
  card: { 
    width: "100%", 
    maxWidth: 400, 
    backgroundColor: "#0B1220", 
    borderRadius: 24, 
    padding: 24, 
    borderWidth: 1,
    alignItems: 'center' // Centre tout le contenu
  },
  headerRow: { 
    width: '100%',
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 8 
  },
  title: { 
    color: "#fff", 
    fontSize: 20, 
    fontWeight: "700" 
  },
  subtitle: { 
    color: "#A1A1AA", 
    marginBottom: 20,
    fontSize: 14,
    textAlign: 'center',
    alignSelf: 'flex-start'
  },
  qrContainer: { 
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  btn: { 
    width: '100%',
    paddingVertical: 16, 
    borderRadius: 16, 
    alignItems: "center", 
    flexDirection: "row", 
    justifyContent: "center", 
    gap: 8 
  },
  btnText: { 
    fontWeight: "700",
    fontSize: 16
  },
});