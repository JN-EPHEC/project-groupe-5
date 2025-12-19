import { auth, db } from "@/firebaseConfig";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context"; // updateUser retiré ici
import { uploadProfilePhoto } from "@/services/profile";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
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

// Palette de couleurs
const PRESET_COLORS = [
  "#19D07D", // Vert Principal
  "#3B82F6", // Bleu
  "#6366F1", // Indigo
  "#EC4899", // Rose
  "#EF4444", // Rouge
  "#F59E0B", // Ambre
  "#1A1A1A", // Noir
  "#FFFFFF", // Blanc
  "#8B5CF6", // Violet
  "#10B981", // Émeraude
  "#06B6D4", // Cyan
  "#F97316", // Orange
];

export default function EditProfileScreen() {
  // 🚨 CORRECTION : On ne récupère PLUS updateUser ici car il n'existe pas dans le contexte
  const { user, loading } = useUser();
  const { colors, mode } = useThemeMode();
  const router = useRouter();
  const isLight = mode === "light";

  // --- ÉTATS ---
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [photoURL, setPhotoURL] = useState<string | null>(user?.photoURL ?? null);
  
  // Couleur : Récupère la couleur existante ou vert par défaut
  const [avatarColor, setAvatarColor] = useState<string>(
    (user as any)?.avatarColor ?? "#19D07D"
  );
  
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => !saving && !!auth.currentUser, [saving]);

  // Initiales dynamiques
  const getInitials = () => {
    const name = ([firstName, lastName].filter(Boolean).join(" ") || username || "Inconnu").trim();
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
    // Ajoute le # si l'utilisateur l'oublie et que c'est un hex valide
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

      // Upload si nouvelle image locale
      if (photoURL && !isRemoteUri(photoURL)) {
        nextPhotoURL = await uploadProfilePhoto(photoURL);
        setPhotoURL(nextPhotoURL);
      }

      // S'assure que la couleur est valide
      const finalColor = avatarColor.startsWith("#") ? avatarColor : `#${avatarColor}`;

      const payload = {
        firstName: firstName || null,
        lastName: lastName || null,
        username: username || null,
        bio: bio || null,
        photoURL: nextPhotoURL,
        avatarColor: finalColor,
      };

      // Sauvegarde dans Firebase
      await setDoc(userDocRef, payload, { merge: true });

      // 🚨 CORRECTION : On a retiré l'appel à updateUser(payload) qui causait le crash

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

  // --- APERÇU COULEUR & CONTRASTE ---
  const previewColor = avatarColor.startsWith("#") ? avatarColor : `#${avatarColor}`;
  const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(previewColor);
  const displayColor = isValidHex ? previewColor : "#19D07D";

  const isWhiteBg = ["#FFFFFF", "#fff", "#FFF"].includes(displayColor);
  const initialsColor = isWhiteBg ? "#1A1A1A" : "#FFFFFF";
  const borderColor = isWhiteBg ? "#E5E5E5" : "transparent";

  // Style Glassmorphism dynamique
  const glassStyle = {
    backgroundColor: isLight ? "rgba(255, 255, 255, 0.7)" : "rgba(30, 30, 30, 0.6)",
    borderColor: isLight ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.1)",
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Stack.Screen options={{ headerShown: false }} />

        {/* HEADER */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            Modifier mon profil
          </Text>
          <View style={{ width: 24 }} />
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
            <Text style={{ color: colors.accent, fontWeight: "600" }}>
              {photoURL ? "Changer la photo" : "Ajouter une photo"}
            </Text>
          </TouchableOpacity>

          {/* SÉLECTEUR DE COULEUR (Effet Glacé 🧊) */}
          {!photoURL && (
            <View style={[styles.colorPickerContainer, glassStyle]}>
              <Text style={{ color: colors.mutedText, fontSize: 12, marginBottom: 8, fontWeight: '600', letterSpacing: 0.5 }}>
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
                <Text style={{ color: colors.mutedText, marginRight: 8, fontWeight: 'bold' }}>#</Text>
                <TextInput
                  style={[
                    styles.hexInput,
                    { color: colors.text, borderColor: colors.surfaceAlt, backgroundColor: isLight ? "#fff" : "rgba(255,255,255,0.05)" },
                  ]}
                  value={avatarColor.replace("#", "")}
                  onChangeText={handleHexChange}
                  placeholder="FFFFFF"
                  placeholderTextColor={colors.mutedText}
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
            </View>
          )}
        </View>

        {/* FORMULAIRE */}
        {[
          ["Prénom", firstName, setFirstName],
          ["Nom", lastName, setLastName],
          ["Nom d'utilisateur", username, setUsername],
        ].map(([label, value, setter]: any, i) => (
          <View key={i} style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.mutedText }]}>
              {label}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.surfaceAlt,
                  backgroundColor: colors.surface,
                  color: colors.text,
                },
              ]}
              value={value}
              onChangeText={setter}
              placeholder={label}
              placeholderTextColor={colors.mutedText}
            />
          </View>
        ))}

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.mutedText }]}>Bio</Text>
          <TextInput
            style={[
              styles.input,
              {
                height: 100,
                textAlignVertical: "top",
                borderColor: colors.surfaceAlt,
                backgroundColor: colors.surface,
                color: colors.text,
              },
            ]}
            multiline
            value={bio}
            onChangeText={setBio}
            placeholder="Quelques mots sur vous..."
            placeholderTextColor={colors.mutedText}
          />
        </View>

        {/* BOUTONS */}
        <Pressable
          onPress={save}
          disabled={!canSave}
          style={[
            styles.saveBtn,
            { backgroundColor: colors.accent, opacity: canSave ? 1 : 0.6 },
          ]}
        >
          <Text style={{ color: "#0F3327", fontWeight: "700", fontSize: 16 }}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={[styles.saveBtn, { backgroundColor: colors.surface, marginTop: 12 }]}
        >
          <Text style={{ color: colors.text, fontWeight: "600" }}>
            Annuler
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: { fontSize: 20, fontWeight: "700" },

  avatarWrapper: { position: "relative" },
  avatarImage: { width: 110, height: 110, borderRadius: 55 },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { fontSize: 36, fontWeight: "bold" },
  editIconOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#0F3327",
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
  },
  removeBtn: { position: "absolute", top: 0, right: 0 },
  removeBtnBg: { backgroundColor: "#fff", borderRadius: 15 },

  // --- STYLE GLACE / LIQUIDE ---
  colorPickerContainer: {
    width: "100%",
    marginTop: 20,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    // Ombre douce pour l'effet de profondeur
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
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
    backgroundColor: "rgba(0,0,0,0.03)",
    padding: 4,
    borderRadius: 12,
  },
  hexInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: Platform.OS === 'ios' ? "Courier" : "monospace",
    fontSize: 14,
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
  input: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 16 },

  saveBtn: { paddingVertical: 16, borderRadius: 16, alignItems: "center" },
});