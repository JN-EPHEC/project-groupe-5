import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import { changePassword } from "@/services/auth";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

// 🎨 THEME CHANGE PASSWORD
const passwordTheme = {
    bgGradient: ["#F9FAFB", "#F3F4F6"] as const,
    glassCardBg: ["#FFFFFF", "rgba(255, 255, 255, 0.8)"] as const,
    borderColor: "rgba(0, 0, 0, 0.05)",
    textMain: "#111827",
    textMuted: "#6B7280",
    accent: "#008F6B",
    inputBg: "#F9FAFB",
    error: "#EF4444",
};

export default function ChangePasswordScreen() {
  const { colors, mode } = useThemeMode();
  const router = useRouter();
  const isDark = mode === "dark";

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

  // Couleurs dynamiques
  const titleColor = isDark ? "#FFF" : passwordTheme.textMain;
  const mutedColor = isDark ? "#9CA3AF" : passwordTheme.textMuted;
  const cardBorder = isDark ? "rgba(255,255,255,0.1)" : passwordTheme.borderColor;
  const bgColors = isDark ? [colors.background, "#1F2937"] : passwordTheme.bgGradient;
  const inputBackground = isDark ? "rgba(255,255,255,0.05)" : passwordTheme.inputBg;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />
        
        {/* FOND */}
        <LinearGradient
            colors={bgColors as any}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        />

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity 
                onPress={() => router.back()} 
                style={[styles.backBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#FFF" }]}
            >
              <Ionicons name="arrow-back" size={20} color={titleColor} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: titleColor }]}>Mot de passe</Text>
          </View>

          <View style={[styles.card, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFF", borderColor: cardBorder }]}>
            
            <Text style={{ color: mutedColor, marginBottom: 24, textAlign: 'center', lineHeight: 22 }}>
                Pour sécuriser votre compte, veuillez confirmer votre mot de passe actuel avant d'en choisir un nouveau.
            </Text>

            {/* Current Password */}
            <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: mutedColor }]}>MOT DE PASSE ACTUEL</Text>
                <View style={[styles.inputWrapper, { backgroundColor: inputBackground, borderColor: cardBorder }]}>
                    <Ionicons name="lock-closed-outline" size={18} color={mutedColor} style={{ marginRight: 10 }} />
                    <TextInput
                        style={[styles.inputField, { color: titleColor }]}
                        placeholder="••••••••"
                        placeholderTextColor={mutedColor}
                        secureTextEntry
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        editable={!loading}
                    />
                </View>
            </View>

            {/* New Password */}
            <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: mutedColor }]}>NOUVEAU MOT DE PASSE</Text>
                <View style={[styles.inputWrapper, { backgroundColor: inputBackground, borderColor: cardBorder }]}>
                    <Ionicons name="key-outline" size={18} color={mutedColor} style={{ marginRight: 10 }} />
                    <TextInput
                        style={[styles.inputField, { color: titleColor }]}
                        placeholder="Nouveau mot de passe"
                        placeholderTextColor={mutedColor}
                        secureTextEntry
                        value={newPassword}
                        onChangeText={setNewPassword}
                        editable={!loading}
                    />
                </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: mutedColor }]}>CONFIRMER</Text>
                <View style={[styles.inputWrapper, { backgroundColor: inputBackground, borderColor: cardBorder }]}>
                    <Ionicons name="checkmark-circle-outline" size={18} color={mutedColor} style={{ marginRight: 10 }} />
                    <TextInput
                        style={[styles.inputField, { color: titleColor }]}
                        placeholder="Répétez le mot de passe"
                        placeholderTextColor={mutedColor}
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        editable={!loading}
                    />
                </View>
            </View>

            {newPassword.length > 0 && confirmPassword.length > 0 && !passwordsMatch && (
              <View style={[styles.errorBox, { backgroundColor: isDark ? "rgba(239,68,68,0.2)" : "#FEF2F2" }]}>
                  <Ionicons name="alert-circle" size={16} color={passwordTheme.error} />
                  <Text style={[styles.errorText, { color: passwordTheme.error }]}>Les mots de passe ne correspondent pas.</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: canSubmit && !loading ? passwordTheme.accent : (isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"),
                },
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                  <Text style={[styles.primaryBtnText, { color: canSubmit ? "#FFF" : mutedColor }]}>Chargement...</Text>
              ) : (
                  <Text style={[styles.primaryBtnText, { color: canSubmit ? "#FFF" : mutedColor }]}>Mettre à jour</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 48, paddingTop: 60 },
  
  header: { 
      flexDirection: 'row', alignItems: 'center', marginBottom: 32 
  },
  backBtn: {
      padding: 10, borderRadius: 12, marginRight: 16,
      shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
  },
  headerTitle: { fontSize: 24, fontWeight: "800", fontFamily: FontFamilies.heading },

  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  inputContainer: { marginBottom: 20 },
  label: {
      fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.5
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamilies.body,
    fontWeight: "600",
  },
  errorBox: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      padding: 12, borderRadius: 12, marginBottom: 20
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
  },
  primaryBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: FontFamilies.heading
  },
});