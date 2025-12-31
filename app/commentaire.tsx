// app/commentaire.tsx
import { useChallenges } from "@/hooks/challenges-context";
import { useThemeMode } from "@/hooks/theme-context";
import { submitProof } from "@/services/proofs";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 🎨 THEME COMMENTAIRE
const commentTheme = {
  bgGradient: ["#DDF7E8", "#F4FDF9"] as const,
  glassInput: "rgba(255, 255, 255, 0.8)",
  borderInput: "rgba(0,143,107,0.2)",
  textMain: "#0A3F33",
  textMuted: "#4A665F",
  accent: "#008F6B", // Vert Marque
};

export default function CommentaireScreen() {
  const { colors, mode } = useThemeMode();
  const { current, currentClub, validateWithPhoto, validateWithPhotoClub, setPhotoComment, setPhotoCommentClub } = useChallenges();
  const router = useRouter();
  const params = useLocalSearchParams<{ photoUri?: string; kind?: "perso" | "club" }>();
  const incomingKind = Array.isArray(params.kind) ? params.kind[0] : params.kind ?? "perso";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLight = mode === "light";

  // État pour la modal photo plein écran
  const [isFullImageVisible, setIsFullImageVisible] = useState(false);

  const photoUri = params.photoUri as string | undefined;
  const [comment, setComment] = useState("");

  const wordCount = useMemo(
    () => comment.trim().split(/\s+/).filter(Boolean).length,
    [comment]
  );

  const canSend = wordCount >= 3;

  if ((incomingKind === "club" && !currentClub) || (incomingKind === "perso" && !current) || !photoUri) {
    router.replace("/(tabs)/defi");
    return null;
  }

  async function sendProof(forcedComment?: string) {
    if (isSubmitting) return; 
    
    const activeDefiId = incomingKind === "club" ? currentClub?.firestoreId : current?.firestoreId;

    if (!activeDefiId || !photoUri) {
      router.replace("/(tabs)/defi");
      return;
    }

    setIsSubmitting(true);
    const finalComment = forcedComment !== undefined ? forcedComment : comment.trim();

    try {
      const { id: proofId } = await submitProof(
        activeDefiId!,
        photoUri,
        finalComment,
        incomingKind
      );

      if (incomingKind === "club") {
        await validateWithPhotoClub(photoUri, finalComment, proofId);
        await setPhotoCommentClub(finalComment);
      } else {
        await validateWithPhoto(photoUri, finalComment, proofId);
        await setPhotoComment(finalComment);
      }

      router.replace("/(tabs)/defi");
    } catch (e) {
      console.log("❌ Error submitting proof:", e);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Wrapper Fond
  const BackgroundComponent = isLight ? LinearGradient : View;
  const bgProps = isLight 
    ? { colors: commentTheme.bgGradient, style: StyleSheet.absoluteFill } 
    : { style: [StyleSheet.absoluteFill, { backgroundColor: "#021114" }] };

  // Couleurs dynamiques
  const titleColor = isLight ? commentTheme.textMain : colors.text;
  const textColor = isLight ? commentTheme.textMuted : colors.mutedText;

  return (
    // ✅ CLAVIER : TouchableWithoutFeedback pour fermer le clavier en cliquant ailleurs
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1 }}>
        <BackgroundComponent {...(bgProps as any)} />
        
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={titleColor} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: titleColor }]}>Ta preuve</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* ✅ PHOTO : Cliquable pour voir en grand */}
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => setIsFullImageVisible(true)}
              style={styles.photoContainer}
            >
              <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
              {/* Petite icône pour indiquer qu'on peut agrandir */}
              <View style={styles.expandIcon}>
                <Ionicons name="expand" size={20} color="#FFF" />
              </View>
            </TouchableOpacity>

            <Text style={{ color: textColor, marginTop: 16, marginBottom: 8, fontWeight: '600' }}>
              Explique ta preuve (min. 3 mots)
            </Text>

            {/* Input Glassmorphism */}
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Ex: Je trie des bouteilles au dépôt local"
              placeholderTextColor={isLight ? "#8AA39C" : colors.mutedText}
              multiline
              numberOfLines={5}
              editable={!isSubmitting}
              style={[
                styles.input,
                { 
                  backgroundColor: isLight ? commentTheme.glassInput : colors.surfaceAlt, 
                  color: isLight ? commentTheme.textMain : colors.text,
                  borderColor: isLight ? commentTheme.borderInput : "transparent",
                  borderWidth: 1
                },
              ]}
            />

            <Text style={{ color: textColor, alignSelf: "flex-end", marginTop: 6, fontSize: 12 }}>
              {wordCount} mot{wordCount > 1 ? "s" : ""}
            </Text>

            {/* Actions */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
              {/* Bouton PASSER */}
              <TouchableOpacity
                disabled={isSubmitting}
                onPress={() => sendProof("")} 
                style={[styles.btn, { backgroundColor: isLight ? "rgba(255,255,255,0.6)" : colors.surface, borderWidth: 1, borderColor: isLight ? "rgba(0,0,0,0.05)" : "transparent" }]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={titleColor} />
                ) : (
                  <Text style={{ color: titleColor, fontWeight: "700" }}>Passer</Text>
                )}
              </TouchableOpacity>

              {/* Bouton ENVOYER (Gradient) */}
              <TouchableOpacity
                disabled={!canSend || isSubmitting}
                onPress={() => sendProof()}
                style={{ flex: 1, borderRadius: 16, opacity: (canSend && !isSubmitting) ? 1 : 0.6 }}
              >
                <LinearGradient
                    colors={isLight ? ["#008F6B", "#10B981"] : [colors.accent, colors.accent]}
                    style={[styles.btn, { flex: 1, width: '100%' }]}
                >
                    <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}>Envoyer</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        {/* ✅ MODAL : Vue Plein Écran */}
        <Modal 
          visible={isFullImageVisible} 
          transparent={true} 
          animationType="fade"
          onRequestClose={() => setIsFullImageVisible(false)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.closeModalBtn} 
              onPress={() => setIsFullImageVisible(false)}
            >
              <Ionicons name="close-circle" size={40} color="#FFF" />
            </TouchableOpacity>
            <Image 
              source={{ uri: photoUri }} 
              style={styles.fullScreenPhoto} 
              resizeMode="contain" 
            />
          </View>
        </Modal>

      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  content: { width: "100%", maxWidth: 400, alignSelf: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  backBtn: { padding: 6 },
  title: { fontSize: 20, fontWeight: "800", fontFamily: "StylizedTitle" },
  
  photoContainer: {
      borderRadius: 20,
      marginTop: 20,
      backgroundColor: "#FFF",
      padding: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      position: 'relative', // Nécessaire pour l'icône
  },
  photo: { width: "100%", height: 280, borderRadius: 16 },
  
  // Petite icône d'agrandissement sur la miniature
  expandIcon: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6
  },

  input: { 
      borderRadius: 16, 
      padding: 16, 
      textAlignVertical: "top", 
      fontSize: 16,
      minHeight: 120
  },
  btn: { 
      flex: 1, 
      borderRadius: 16, 
      paddingVertical: 14, 
      alignItems: "center", 
      justifyContent: "center",
      shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },

  // Styles pour la Modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenPhoto: {
    width: '100%',
    height: '80%',
  },
  closeModalBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  }
});