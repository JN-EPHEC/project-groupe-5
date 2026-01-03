import { FontFamilies } from "@/constants/fonts";
import { auth, db } from "@/firebaseConfig";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { uploadProfilePhoto } from "@/services/profile";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Palette de couleurs
const PRESET_COLORS = [
  "#19D07D", "#3B82F6", "#6366F1", "#EC4899", "#EF4444", "#F59E0B",
  "#1A1A1A", "#FFFFFF", "#8B5CF6", "#10B981", "#06B6D4", "#F97316",
];

// 🎨 THEME EDIT
const editTheme = {
    bgGradient: ["#DDF7E8", "#F4FDF9"] as const,
    glassInput: "rgba(255, 255, 255, 0.6)",
    borderColor: "rgba(0, 143, 107, 0.15)",
    textMain: "#0A3F33",
    textMuted: "#4A665F",
    accent: "#008F6B",
};

export default function EditProfileScreen() {
  const { user, loading } = useUser();
  const { colors, mode } = useThemeMode();
  const router = useRouter();
  const isLight = mode === "light";

  // --- ÉTATS ---
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [photoURL, setPhotoURL] = useState<string | null>(user?.photoURL ?? null);

  // Utilisation de la couleur du user context ou fallback vert
  const [avatarColor, setAvatarColor] = useState<string>(
    user?.avatarColor ?? "#19D07D"
  );

  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => !saving && !!auth.currentUser, [saving]);

  // Initiales dynamiques
  const getInitials = () => {
    const name = (username || "Inconnu").trim();
    const parts = name.split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // --- GESTION COULEUR ---
  const handleSelectColor = (color: string) => {
    setAvatarColor(color);
  };

  const handleHexChange = (text: string) => {
    let newColor = text;
    if (!text.startsWith("#") && /^[0-9A-F]{6}$/i.test(text)) {
      newColor = "#" + text;
    }
    setAvatarColor(newColor);
  };

  // --- GESTION PHOTO ---
  const isRemoteUri = (uri: string | null) => Boolean(uri && /^https?:\/\//i.test(uri));

  async function pickImage() {
    try {
      if (Platform.OS !== "web") {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== "granted") return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!res.canceled && res.assets[0]?.uri) {
        setPhotoURL(res.assets[0].uri);
      }
    } catch {}
  }

  async function takePhoto() {
    try {
      if (Platform.OS !== "web") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== "granted") return;
      }
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!res.canceled && res.assets[0]?.uri) {
        setPhotoURL(res.assets[0].uri);
      }
    } catch {}
  }

  const removePhoto = () => {
    setPhotoURL(null);
  };

  // --- SAUVEGARDE ---
  async function save() {
    if (!canSave || !auth.currentUser) return;
    setSaving(true);

    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      let nextPhotoURL = photoURL;

      if (photoURL && !isRemoteUri(photoURL)) {
        nextPhotoURL = await uploadProfilePhoto(photoURL);
        setPhotoURL(nextPhotoURL);
      }

      // S'assurer que le format est bon
      const finalColor = avatarColor.startsWith("#") ? avatarColor : `#${avatarColor}`;

      const payload = {
        username: username || null,
        bio: bio || null,
        photoURL: nextPhotoURL,
        avatarColor: finalColor, // On force la sauvegarde de la couleur
      };

      await setDoc(userDocRef, payload, { merge: true });

      Alert.alert("Succès", "Profil mis à jour");
      router.back();
    } catch (e: any) {
      console.error(e);
      Alert.alert("Erreur", e?.message ?? "Impossible d'enregistrer");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const previewColor = avatarColor.startsWith("#") ? avatarColor : `#${avatarColor}`;
  const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(previewColor);
  const displayColor = isValidHex ? previewColor : "#19D07D";

  const isWhiteBg = ["#FFFFFF", "#fff", "#FFF"].includes(displayColor);
  const initialsColor = isWhiteBg ? "#1A1A1A" : "#FFFFFF";
  const borderColor = isWhiteBg ? "#E5E5E5" : "transparent";

  const titleColor = isLight ? editTheme.textMain : colors.text;
  const mutedColor = isLight ? editTheme.textMuted : colors.mutedText;
  const inputBg = isLight ? editTheme.glassInput : colors.surfaceAlt;
  const inputBorder = isLight ? editTheme.borderColor : "transparent";

  const BackgroundComponent = isLight ? LinearGradient : View;
  const bgProps = isLight
    ? { colors: editTheme.bgGradient, style: StyleSheet.absoluteFill }
    : { style: [StyleSheet.absoluteFill, { backgroundColor: "#021114" }] };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <BackgroundComponent {...(bgProps as any)} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* HEADER */}
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={titleColor} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: titleColor }]}>
                Modifier mon profil
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {/* AVATAR & PHOTO */}
            <View style={{ alignItems: "center", marginVertical: 24 }}>
              <Pressable onPress={takePhoto} style={styles.avatarWrapper}>
                {photoURL ? (
                  <View>
                    <Image source={{ uri: photoURL }} style={styles.avatarImage} />
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        removePhoto();
                      }}
                    >
                      <View style={styles.removeBtnBg}>
                        <Ionicons name="close-circle" size={28} color="#EF4444" />
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      { backgroundColor: displayColor, borderColor, borderWidth: 1 },
                    ]}
                  >
                    <Text style={[styles.initials, { color: initialsColor }]}>
                      {getInitials()}
                    </Text>
                    <View
                      style={[styles.editIconOverlay, { borderColor: displayColor }]}
                    >
                      <Ionicons name="camera" size={16} color="#fff" />
                    </View>
                  </View>
                )}
              </Pressable>

              <TouchableOpacity onPress={pickImage} style={{ marginTop: 12 }}>
                <Text style={{ color: editTheme.accent, fontWeight: "600" }}>
                  {photoURL ? "Changer la photo" : "Ajouter une photo"}
                </Text>
              </TouchableOpacity>

              {/* SÉLECTEUR DE COULEUR */}
              {!photoURL && (
                <LinearGradient
                    colors={isLight ? ["rgba(255,255,255,0.7)", "rgba(255,255,255,0.4)"] : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
                    style={styles.colorPickerContainer}
                >
                  <Text style={{ color: mutedColor, fontSize: 12, marginBottom: 8, fontWeight: '700', letterSpacing: 0.5 }}>
                    COULEUR DE FOND
                  </Text>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
                    {PRESET_COLORS.map((color) => (
                      <TouchableOpacity
                        key={color}
                        onPress={() => handleSelectColor(color)}
                        style={[
                          styles.colorCircle,
                          { backgroundColor: color },
                          avatarColor.toLowerCase() === color.toLowerCase() &&
                            styles.colorCircleSelected,
                        ]}
                      />
                    ))}
                  </ScrollView>

                  <View style={styles.hexInputRow}>
                    <Text style={{ color: mutedColor, marginRight: 8, fontWeight: 'bold' }}>#</Text>
                    <TextInput
                      style={[
                        styles.hexInput,
                        { color: titleColor, borderColor: inputBorder, backgroundColor: inputBg },
                      ]}
                      value={avatarColor.replace("#", "")}
                      onChangeText={handleHexChange}
                      placeholder="FFFFFF"
                      placeholderTextColor={mutedColor}
                      maxLength={6}
                      autoCapitalize="characters"
                    />
                    <View
                      style={[
                        styles.colorPreviewSmall,
                        { backgroundColor: displayColor },
                      ]}
                    />
                  </View>
                </LinearGradient>
              )}
            </View>

            {/* FORMULAIRE */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: mutedColor }]}>
                Nom d'utilisateur
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: inputBorder,
                    backgroundColor: inputBg,
                    color: titleColor,
                  },
                ]}
                value={username}
                onChangeText={setUsername}
                placeholder="Nom d'utilisateur"
                placeholderTextColor={mutedColor}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: mutedColor }]}>Bio</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    height: 100,
                    textAlignVertical: "top",
                    borderColor: inputBorder,
                    backgroundColor: inputBg,
                    color: titleColor,
                  },
                ]}
                multiline
                value={bio}
                onChangeText={setBio}
                placeholder="Quelques mots sur vous..."
                placeholderTextColor={mutedColor}
              />
            </View>

            {/* BOUTONS */}
            <TouchableOpacity
              onPress={save}
              disabled={!canSave}
              activeOpacity={0.9}
              style={{ shadowColor: editTheme.accent, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: {width: 0, height: 4}, elevation: 4 }}
            >
                <LinearGradient
                    colors={canSave ? ["#008F6B", "#10B981"] : ["#A0AEC0", "#CBD5E0"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.saveBtn}
                >
                    <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}>
                        {saving ? "Enregistrement..." : "Enregistrer"}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.cancelBtn, { borderColor: inputBorder, backgroundColor: isLight ? "rgba(255,255,255,0.5)" : "transparent" }]}
            >
              <Text style={{ color: titleColor, fontWeight: "600" }}>
                Annuler
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 10
  },
  backBtn: { padding: 8, borderRadius: 12 },
  title: { fontSize: 20, fontWeight: "700", fontFamily: FontFamilies.heading },

  avatarWrapper: { position: "relative", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  avatarImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: "#FFF" },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
  },
  initials: { fontSize: 36, fontWeight: "bold" },
  editIconOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#008F6B",
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#FFF"
  },
  removeBtn: { position: "absolute", top: 0, right: 0 },
  removeBtnBg: { backgroundColor: "#fff", borderRadius: 15 },

  colorPickerContainer: {
    width: "100%",
    marginTop: 20,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    overflow: "hidden",
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: "rgba(0,0,0,0.4)",
    transform: [{ scale: 1.15 }],
  },
  hexInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    padding: 4,
    borderRadius: 12,
  },
  hexInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Platform.OS === 'ios' ? "Courier" : "monospace",
    fontSize: 14,
    fontWeight: "600"
  },
  colorPreviewSmall: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },

  formGroup: { marginBottom: 16 },
  label: { marginBottom: 8, fontSize: 13, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 16, padding: 16, fontSize: 16 },

  saveBtn: { paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  cancelBtn: { paddingVertical: 16, borderRadius: 16, alignItems: "center", marginTop: 12, borderWidth: 1 },
});