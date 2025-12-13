import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { auth } from "../../firebaseConfig";

// DEV autofill (local only, safe if file doesn't exist)
const DEV_MODE = __DEV__;

let DEV_EMAIL = "";
let DEV_PASSWORD = "";

if (DEV_MODE) {
  try {
    // devAuth.env.js is gitignored (local only)
    // If it doesn't exist on someone else's machine, app won't crash.
    const creds = require("../../devAuth.env.js");
    DEV_EMAIL = creds?.DEV_TEST_EMAIL ?? "";
    DEV_PASSWORD = creds?.DEV_TEST_PASSWORD ?? "";
  } catch (e) {
    // No devAuth.env.js found (fine). Leave empty.
  }
}

export default function Login() {
  const router = useRouter();
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";

  // ✅ Autofill only in DEV, only if local file exists
  const [email, setEmail] = useState(DEV_MODE ? DEV_EMAIL : "");
  const [password, setPassword] = useState(DEV_MODE ? DEV_PASSWORD : "");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const canSubmit = useMemo(
    // button enabled as soon as both fields contain at least one character
    () => email.trim().length >= 1 && password.length >= 1,
    [email, password]
  );

  async function handleLogin() {
    if (!canSubmit || loading) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // The redirect is now handled by the AuthLayout guard.
    } catch (e: any) {
      // On any auth failure, mark both fields invalid and show inline message
      setEmailError(true);
      setPasswordError(true);
      setAuthErrorMessage("Adresse e‑mail ou mot de passe invalide.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoRow}>
            <Image
              source={
                isLight
                  ? require("../../assets/images/logo_Green_UP_noir_degradé-removebg-preview.png")
                  : require("../../assets/images/logo_fond_vert_degradé__1_-removebg-preview.png")
              }
              style={{ width: 340, height: 152 }}
              resizeMode="contain"
            />
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={[styles.inputRow, { backgroundColor: colors.surfaceAlt }, emailError && { borderColor: "#FF4D4F", backgroundColor: "rgba(255,77,79,0.06)" }]}>
              <Ionicons
                name="person-outline"
                size={18}
                color={colors.mutedText}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={[
                  styles.inputField,
                  { color: isLight ? colors.text : "#FFFFFF" },
                  // Remove inner-field red border to avoid duplicate highlighting
                  // when the whole input row is already marked in error.
                ]}
                placeholder="Email"
                placeholderTextColor={colors.mutedText}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={(t) => { setEmail(t); if (emailError || passwordError) { setEmailError(false); setPasswordError(false); } if (authErrorMessage) setAuthErrorMessage(null); }}
                editable={!loading}
              />
            </View>

            <View style={[styles.inputRow, { backgroundColor: colors.surfaceAlt }, passwordError && { borderColor: "#FF4D4F", backgroundColor: "rgba(255,77,79,0.06)" }]}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={colors.mutedText}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={[
                  styles.inputField,
                  { color: isLight ? colors.text : "#FFFFFF" },
                  // Inner field should not show its own red border; the
                  // parent `inputRow` handles the error styling.
                ]}
                placeholder="Mot de passe"
                placeholderTextColor={colors.mutedText}
                secureTextEntry
                value={password}
                onChangeText={(t) => { setPassword(t); if (emailError || passwordError) { setEmailError(false); setPasswordError(false); } if (authErrorMessage) setAuthErrorMessage(null); }}
                editable={!loading}
              />
            </View>

            <View style={styles.rowBetween}>
              <TouchableOpacity
                onPress={() => setRememberMe((r) => !r)}
                style={styles.checkboxRow}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    { borderColor: colors.mutedText },
                    rememberMe && { backgroundColor: colors.accent, borderColor: colors.accent },
                  ]}
                >
                  {rememberMe && <Ionicons name="checkmark" size={14} color="#00231A" />}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.mutedText }]}>Se souvenir de moi</Text>
              </TouchableOpacity>
              <Pressable
                onPress={() => router.push("/reset-password")}
              >
                <Text style={[styles.linkMuted, { color: colors.mutedText }]}>Mot de passe oublié ?</Text>
              </Pressable>
            </View>

            {authErrorMessage ? (
              <Text style={[styles.errorText, { color: "#FF4D4F", marginBottom: 10 }]}>{authErrorMessage}</Text>
            ) : null}

            <Pressable
              style={[styles.primaryBtn, { backgroundColor: colors.accent }, (!canSubmit || loading) && styles.primaryBtnDisabled]}
              onPress={handleLogin}
              disabled={!canSubmit || loading}
            >
              <Text style={styles.primaryBtnText}>{loading ? "..." : "Se connecter"}</Text>
            </Pressable>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Vous n'avez pas encore de compte ? </Text>
              <Pressable onPress={() => router.push("/register")}>
                <Text style={styles.footerLink}>Créer un compte</Text>
              </Pressable>
            </View>
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
    paddingTop: 110,
  },
  logoRow: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 390,
    height: 174,
  },
  card: {
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderWidth: 1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  inputField: {
    flex: 1,
    fontWeight: "600",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 16,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: "transparent",
  },
  checkboxLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  linkMuted: {
    fontSize: 12,
    fontWeight: "600",
  },
  primaryBtn: {
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#00231A",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 12,
  },
  footerText: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
  },
  footerLink: {
    fontSize: 12,
    fontWeight: "700",
  },
});
