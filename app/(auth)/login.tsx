import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useMemo, useState } from "react";
import {
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
  const [rememberMe, setRememberMe] = useState(false);

  const canSubmit = useMemo(
    () => email.trim().length > 3 && password.length >= 6,
    [email, password]
  );

  async function handleLogin() {
    if (!canSubmit || loading) return;
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert("✅ Logged in", res.user?.email ?? "Succès");
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("❌ Login error", e?.code ?? e?.message ?? String(e));
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
              source={require("../../assets/images/greenup-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={[styles.inputRow, { backgroundColor: colors.surfaceAlt }]}>
              <Ionicons
                name="person-outline"
                size={18}
                color={colors.mutedText}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={[styles.inputField, { color: colors.text }]}
                placeholder="Email"
                placeholderTextColor={colors.mutedText}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>

            <View style={[styles.inputRow, { backgroundColor: colors.surfaceAlt }]}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={colors.mutedText}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={[styles.inputField, { color: colors.text }]}
                placeholder="Mot de passe"
                placeholderTextColor={colors.mutedText}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
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
  footerLink: {
    fontSize: 12,
    fontWeight: "700",
  },
});
