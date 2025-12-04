import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import React, { useMemo, useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { uploadProfilePhoto } from "@/services/profile";
import { auth, db } from "../firebaseConfig";

export default function EditProfileScreen() {
  const { user, loading } = useUser();
  const { colors } = useThemeMode();
  const router = useRouter();

  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [photoURL, setPhotoURL] = useState<string | null>(user?.photoURL ?? null);
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => !saving && !!auth.currentUser, [saving]);

  async function pickImage() {
    try {
      // On web, permission prompt is not required the same way
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== "granted") return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
      if (!res.canceled && res.assets[0]?.uri) {
        setPhotoURL(res.assets[0].uri);
      }
    } catch {}
  }

  const isRemoteUri = (uri: string | null) => Boolean(uri && uri.startsWith("http"));

  async function save() {
    if (!canSave || !auth.currentUser) return;
    setSaving(true);
    try {
      const ref = doc(db, "users", auth.currentUser.uid);
      let nextPhotoURL: string | null = photoURL ?? null;

      if (photoURL && !isRemoteUri(photoURL)) {
        nextPhotoURL = await uploadProfilePhoto(photoURL);
        setPhotoURL(nextPhotoURL);
      }

      const updatePayload: Record<string, any> = {
        username: username || null,
        bio: bio || null,
      };

      if ((nextPhotoURL ?? null) !== (user?.photoURL ?? null)) {
        updatePayload.photoURL = nextPhotoURL ?? null;
      }

      // Merge fields; if doc doesn't exist yet, create it
      await setDoc(ref, updatePayload, { merge: true });
      Alert.alert("Profil mis à jour");
      router.back();
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={[styles.title, { color: colors.text }]}>Modifier mon profil</Text>

        <View style={{ alignItems: "center", marginTop: 16 }}>
          <Pressable onPress={pickImage} style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={{ width: "100%", height: "100%" }} />
            ) : (
              <Text style={{ color: colors.mutedText }}>Choisir une photo</Text>
            )}
          </Pressable>
          <TouchableOpacity onPress={pickImage} style={{ marginTop: 8, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>Modifier la photo</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: colors.mutedText }]}>Username</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.surfaceAlt, color: colors.text, backgroundColor: colors.surface }]}
          value={username}
          onChangeText={setUsername}
          placeholder="Nom d'utilisateur"
          autoCapitalize="none"
        />

        <Text style={[styles.label, { color: colors.mutedText }]}>Bio</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.surfaceAlt, color: colors.text, backgroundColor: colors.surface, height: 100, textAlignVertical: "top" }]}
          value={bio}
          onChangeText={setBio}
          placeholder="Quelques mots sur vous"
          multiline
          numberOfLines={4}
        />

        <Pressable onPress={save} disabled={!canSave} style={[styles.saveBtn, { backgroundColor: colors.accent, opacity: canSave ? 1 : 0.6 }]}>
          <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>{saving ? "..." : "Enregistrer"}</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={[styles.saveBtn, { backgroundColor: colors.surface, marginTop: 10 }]}>
          <Text style={{ color: colors.text, fontWeight: "700", textAlign: "center" }}>Quitter sans sauvegarder</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  title: { fontSize: 22, fontWeight: "700" },
  label: { marginTop: 20, marginBottom: 8, fontSize: 13 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12 },
  saveBtn: { marginTop: 24, paddingVertical: 14, borderRadius: 14 },
});
