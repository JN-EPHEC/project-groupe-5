import { useChallenges } from "@/hooks/challenges-context";
import { useThemeMode } from "@/hooks/theme-context";
import { submitProof } from "@/services/proofs";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; // ✅ AJOUT
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
  const { current, validateWithPhoto, setPhotoComment } = useChallenges();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLight = mode === "light";

  const photoUri = params.photoUri as string | undefined;
  const [comment, setComment] = useState("");

  const wordCount = useMemo(
    () => comment.trim().split(/\s+/).filter(Boolean).length,
    [comment]
  );

  const canSend = wordCount >= 3;

  if (!current || !photoUri) {
    router.replace("/(tabs)/defi");
    return null;
  }

  async function sendProof(forcedComment?: string) {
    if (isSubmitting) return; 
    
    if (!current?.firestoreId || !photoUri) {
      router.replace("/(tabs)/defi");
      return;
    }

    setIsSubmitting(true);
    const finalComment = forcedComment !== undefined ? forcedComment : comment.trim();

    try {
      const { id: proofId } = await submitProof(
        current.firestoreId,
        photoUri,
        finalComment
      );

      await validateWithPhoto(photoUri, finalComment, proofId);
      await setPhotoComment(finalComment);

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

          {/* Photo Preview avec Cadre */}
          <View style={styles.photoContainer}>
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
          </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  content: { width: "100%", maxWidth: 400, alignSelf: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  backBtn: { padding: 6 },
  title: { fontSize: 20, fontWeight: "800", fontFamily: "StylizedTitle" }, // Adapte la police
  
  photoContainer: {
      borderRadius: 20,
      marginTop: 20,
      backgroundColor: "#FFF",
      padding: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4
  },
  photo: { width: "100%", height: 280, borderRadius: 16 },
  
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
});