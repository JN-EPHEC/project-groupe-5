// commentaire.tsx
import { useChallenges } from "@/hooks/challenges-context";
import { useThemeMode } from "@/hooks/theme-context";
import { submitProof } from "@/services/proofs"; // IMPORTANT
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
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


  const photoUri = params.photoUri as string | undefined;

  const [comment, setComment] = useState("");

  const wordCount = useMemo(
    () => comment.trim().split(/\s+/).filter(Boolean).length,
    [comment]
  );

  const canSend = wordCount >= 3;

  // If user arrives here without proper state, redirect
  if (!current || !photoUri) {
    router.replace("/(tabs)/defi");
    return null;
  }

  async function sendProof() {
    if (isSubmitting) return;   // ⛔ block double tap
    setIsSubmitting(true);

    if (!current || !photoUri) {
      router.replace("/(tabs)/defi");
      return;
    }

    const trimmedComment = comment.trim();

    try {
      const { id: proofId } = await submitProof(
        current.firestoreId!,
        photoUri,
        trimmedComment
      );

      await validateWithPhoto(photoUri, trimmedComment, proofId);
      await setPhotoComment(trimmedComment);

      router.replace("/(tabs)/defi");
    } catch (e) {
      console.log("❌ Error submitting proof:", e);
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
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
          style={[
            styles.input,
            { backgroundColor: colors.surface, color: colors.text },
          ]}
        />

        <Text
          style={{
            color: colors.mutedText,
            alignSelf: "flex-end",
            marginTop: 6,
          }}
        >
          {wordCount} mot{wordCount > 1 ? "s" : ""}
        </Text>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/defi")}
            style={[styles.btn, { backgroundColor: colors.surface }]}
          >
            <Text style={{ color: colors.text, fontWeight: "700" }}>Passer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!canSend || isSubmitting}
            onPress={sendProof}
            style={[
              styles.btn,
              {
                backgroundColor:
                  canSend && !isSubmitting ? colors.accent : "#2A3431",
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { padding: 6 },
  title: { fontSize: 20, fontWeight: "700" },
  photo: {
    width: "100%",
    height: 280,
    borderRadius: 16,
    marginTop: 14,
  },
  input: {
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    textAlignVertical: "top",
  },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
});
