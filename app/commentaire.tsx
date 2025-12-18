// app/commentaire.tsx
import { useChallenges } from "@/hooks/challenges-context";
import { useThemeMode } from "@/hooks/theme-context";
import { submitProof } from "@/services/proofs";
import { Ionicons } from "@expo/vector-icons";
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

export default function CommentaireScreen() {
  const { colors } = useThemeMode();
  const { current, validateWithPhoto, setPhotoComment } = useChallenges();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cast explicite pour TypeScript
  const photoUri = params.photoUri as string | undefined;
  const [comment, setComment] = useState("");

  const wordCount = useMemo(
    () => comment.trim().split(/\s+/).filter(Boolean).length,
    [comment]
  );

  const canSend = wordCount >= 3;

  // Sécurité initiale
  if (!current || !photoUri) {
    router.replace("/(tabs)/defi");
    return null;
  }

  async function sendProof(forcedComment?: string) {
    if (isSubmitting) return; 
    
    // Vérification stricte pour TypeScript (supprime les erreurs rouges)
    if (!current?.firestoreId || !photoUri) {
      router.replace("/(tabs)/defi");
      return;
    }

    setIsSubmitting(true);
    const finalComment = forcedComment !== undefined ? forcedComment : comment.trim();

    try {
      // 1. Envoi à Firebase avec des valeurs garanties non-nulles
      const { id: proofId } = await submitProof(
        current.firestoreId, // Garanti par le IF au-dessus
        photoUri,            // Garanti par le IF au-dessus
        finalComment
      );

      // 2. Mise à jour du contexte
      await validateWithPhoto(photoUri, finalComment, proofId);
      await setPhotoComment(finalComment);

      // 3. Redirection
      router.replace("/(tabs)/defi");
    } catch (e) {
      console.log("❌ Error submitting proof:", e);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Ta preuve</Text>
          <View style={{ width: 24 }} />
        </View>

        <Image source={{ uri: photoUri }} style={styles.photo} />

        <Text style={{ color: colors.mutedText, marginTop: 12 }}>
          Explique ta preuve (min. 3 mots)
        </Text>

        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Ex: Je trie des bouteilles au dépôt local"
          placeholderTextColor={colors.mutedText}
          multiline
          numberOfLines={5}
          editable={!isSubmitting}
          style={[
            styles.input,
            { backgroundColor: colors.surface, color: colors.text },
          ]}
        />

        <Text style={{ color: colors.mutedText, alignSelf: "flex-end", marginTop: 6 }}>
          {wordCount} mot{wordCount > 1 ? "s" : ""}
        </Text>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          <TouchableOpacity
            disabled={isSubmitting}
            onPress={() => sendProof("")} 
            style={[styles.btn, { backgroundColor: colors.surface }]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={{ color: colors.text, fontWeight: "700" }}>Passer</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!canSend || isSubmitting}
            onPress={() => sendProof()}
            style={[
              styles.btn,
              {
                backgroundColor: canSend && !isSubmitting ? colors.accent : "#2A3431",
                opacity: isSubmitting ? 0.6 : 1,
              },
            ]}
          >
            <Text
              style={{
                color: canSend ? "#0F3327" : "#8AA39C",
                fontWeight: "700",
              }}
            >
              Envoyer
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  content: { width: "100%", maxWidth: 400, alignSelf: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { padding: 6 },
  title: { fontSize: 20, fontWeight: "700" },
  photo: { width: "100%", height: 280, borderRadius: 16, marginTop: 14 },
  input: { borderRadius: 12, padding: 12, marginTop: 8, textAlignVertical: "top" },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
});