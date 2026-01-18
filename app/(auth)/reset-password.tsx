import { useThemeMode } from "@/hooks/theme-context";
import { resetPassword } from "@/services/auth";
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

export default function ResetPasswordScreen() {
  const { colors, mode } = useThemeMode();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 3, [email]);
  const heroBackground = mode === "light" ? "#0F3327" : colors.surfaceAlt;

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;

    setLoading(true);
    try {
      const message = await resetPassword(email);
      Alert.alert("Succès", message, [
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
      <View style={[styles.root, { backgroundColor: colors.background }]}> 
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.hero, { backgroundColor: heroBackground }]}> 
            <Pressable
              onPress={() => router.back()}
              style={styles.heroBack}
              accessibilityRole="button"
              accessibilityLabel="Revenir"
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.heroTitle}>Réinitialiser le mot de passe</Text>
            <Text style={styles.heroSubtitle}>
              Entrez l'adresse email associée à votre compte GreenUp.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface }]}> 
            <View style={[styles.inputRow, { backgroundColor: colors.surfaceAlt }]}> 
              <Ionicons
                name="mail-outline"
                size={18}
                color={mode === "light" ? "#8BC8AE" : "#6ADCA0"}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={[styles.inputField, { color: colors.text }]}
                placeholder="Adresse email"
                placeholderTextColor={mode === "light" ? "#799387" : "#616161"}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>

            <Pressable
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.accent },
                (!canSubmit || loading) && styles.primaryBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
              </Text>
            </Pressable>

            <Pressable style={styles.secondaryLink} onPress={() => router.replace("/login")}> 
              <Text style={[styles.secondaryLinkText, { color: colors.mutedText }]}>Retour à la connexion</Text>
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
    borderColor: "rgba(88, 211, 140, 0.25)",
  },
  inputField: {
    flex: 1,
    fontWeight: "600",
  },
  primaryBtn: {
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#00231A",
    textAlign: "center",
  },
  secondaryLink: {
    alignItems: "center",
    marginTop: 6,
  },
  secondaryLinkText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
