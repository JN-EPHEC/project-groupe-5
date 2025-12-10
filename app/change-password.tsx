import { useThemeMode } from "@/hooks/theme-context";
import { changePassword } from "@/services/auth";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export default function ChangePasswordScreen() {
  const { colors, mode } = useThemeMode();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordsMatch =
    newPassword.trim().length > 0 && newPassword.trim() === confirmPassword.trim();
  const canSubmit = useMemo(() => {
    const trimmedCurrent = currentPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    return (
      trimmedCurrent.length >= 6 &&
      trimmedNew.length >= 6 &&
      trimmedNew === trimmedConfirm
    );
  }, [currentPassword, newPassword, confirmPassword]);

  const heroBackground = mode === "light" ? "#0F3327" : colors.surfaceAlt;
  const accentDisabled = "rgba(88, 211, 140, 0.35)";
  const errorColor = mode === "light" ? "#D15353" : "#F26767";

  const inputBackground = mode === "light" ? "#FFFFFF" : colors.surfaceAlt;
  const inputBorder = mode === "light" ? "rgba(15,51,39,0.08)" : "rgba(88, 211, 140, 0.25)";
  const placeholderColor = mode === "light" ? "#799387" : "#616161";

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert("Succès", "Votre mot de passe a été mis à jour.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Erreur", error?.message ?? "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[styles.root, { backgroundColor: colors.background }]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View
            style={[styles.hero, { backgroundColor: heroBackground }]}
          >
            <Pressable
              onPress={() => router.back()}
              style={styles.heroBack}
              accessibilityRole="button"
              accessibilityLabel="Revenir"
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.heroTitle}>Modifier le mot de passe</Text>
            <Text style={styles.heroSubtitle}>
              Saisissez votre mot de passe actuel, puis choisissez un nouveau mot de passe sécurisé.
            </Text>
          </View>

          <View
            style={[styles.card, { backgroundColor: colors.surface }]}
          >
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: inputBackground,
                  borderColor: inputBorder,
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={mode === "light" ? "#5EA486" : "#6ADCA0"}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={[styles.inputField, { color: colors.text }]}
                placeholder="Mot de passe actuel"
                placeholderTextColor={placeholderColor}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                editable={!loading}
              />
            </View>

            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: inputBackground,
                  borderColor: inputBorder,
                },
              ]}
            >
              <Ionicons
                name="key-outline"
                size={18}
                color={mode === "light" ? "#5EA486" : "#6ADCA0"}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={[styles.inputField, { color: colors.text }]}
                placeholder="Nouveau mot de passe"
                placeholderTextColor={placeholderColor}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                editable={!loading}
              />
            </View>

            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: inputBackground,
                  borderColor: inputBorder,
                },
              ]}
            >
              <Ionicons
                name="key-outline"
                size={18}
                color={mode === "light" ? "#5EA486" : "#6ADCA0"}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={[styles.inputField, { color: colors.text }]}
                placeholder="Confirmer le nouveau mot de passe"
                placeholderTextColor={placeholderColor}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
              />
            </View>

            {newPassword.length > 0 && confirmPassword.length > 0 && !passwordsMatch && (
              <Text style={[styles.mismatchText, { color: errorColor }]}>Les mots de passe ne correspondent pas.</Text>
            )}

            <Pressable
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: canSubmit && !loading ? colors.accent : accentDisabled,
                },
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
            >
              <Text style={styles.primaryBtnText}>{loading ? "Mise à jour..." : "Modifier le mot de passe"}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 80,
  },
  hero: {
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 32,
    marginBottom: 24,
  },
  heroBack: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  heroSubtitle: {
    marginTop: 10,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    lineHeight: 20,
  },
  card: {
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(60, 167, 115, 0.15)",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  inputField: {
    flex: 1,
    fontWeight: "600",
  },
  mismatchText: {
    fontSize: 12,
    fontWeight: "600",
  },
  primaryBtn: {
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#00231A",
    textAlign: "center",
  },
});
