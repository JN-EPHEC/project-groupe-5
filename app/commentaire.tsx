import { useChallenges } from "@/hooks/challenges-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function CommentaireScreen() {
  const { colors } = useThemeMode();
  const { current, setFeedback } = useChallenges() as any; // setFeedback not used here but keep pattern
  const { setPhotoComment } = useChallenges() as any;
  const router = useRouter();

  const [comment, setComment] = useState("");

  const wordCount = useMemo(() => comment.trim().split(/\s+/).filter(Boolean).length, [comment]);
  const canSend = wordCount >= 3;

  if (!current || current.status !== 'pendingValidation' || !current.photoUri) {
    router.replace('/(tabs)/defi');
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          {/* Arrow goes back to la caméra */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Ta preuve</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Photo preview */}
        <Image source={{ uri: current.photoUri }} style={styles.photo} />

        {/* Comment input */}
        <Text style={{ color: colors.mutedText, marginTop: 12 }}>Explique ta preuve (min. 3 mots)</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Ex: Je trie ces bouteilles au point de collecte local"
          placeholderTextColor={colors.mutedText}
          multiline
          numberOfLines={5}
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
        />
        <Text style={{ color: colors.mutedText, alignSelf: 'flex-end', marginTop: 6 }}>{wordCount} mot{wordCount>1?'s':''}</Text>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          {/* Passer -> avancer sans commentaire */}
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/defi')}
            style={[styles.btn, { backgroundColor: colors.surface }]}
          >
            <Text style={{ color: colors.text, fontWeight: '700' }}>Passer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!canSend}
            onPress={() => { setPhotoComment(comment.trim()); router.replace('/(tabs)/defi'); }}
            style={[styles.btn, { backgroundColor: canSend ? colors.accent : '#2A3431' }]}
          >
            <Text style={{ color: canSend ? '#0F3327' : '#8AA39C', fontWeight: '700' }}>Envoyer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  content: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 6 },
  title: { fontSize: 20, fontWeight: '700' },
  photo: { width: '100%', height: 280, borderRadius: 16, marginTop: 14 },
  input: { borderRadius: 12, padding: 12, marginTop: 8, textAlignVertical: 'top' },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
});
