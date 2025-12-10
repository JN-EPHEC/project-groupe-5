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
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.root}>
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

          <View style={styles.card}>
            <View style={styles.inputRow}>
              <Ionicons
                name="person-outline"
                size={18}
                color={themes.icon}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={styles.inputField}
                placeholder="Email"
                placeholderTextColor={themes.placeholder}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>

            <View style={styles.inputRow}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={themes.icon}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={styles.inputField}
                placeholder="Mot de passe"
                placeholderTextColor={themes.placeholder}
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
                    rememberMe && { backgroundColor: themes.accent, borderColor: themes.accent },
                  ]}
                >
                  {rememberMe && <Ionicons name="checkmark" size={14} color="#00231A" />}
                </View>
                <Text style={styles.checkboxLabel}>Se souvenir de moi</Text>
              </TouchableOpacity>
              <Pressable
                onPress={() => router.push("/reset-password")}
              >
                <Text style={styles.linkMuted}>Mot de passe oublié ?</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.primaryBtn, (!canSubmit || loading) && styles.primaryBtnDisabled]}
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
    backgroundColor: "#000000",
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
    backgroundColor: "#121212",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderWidth: 1,
    borderColor: "#1F1F1F",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#101010",
    borderWidth: 1,
    borderColor: "#181818",
    marginBottom: 16,
  },
  inputField: {
    flex: 1,
    color: "#FFFFFF",
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
    borderColor: "#3A3A3A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: "transparent",
  },
  checkboxLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9B9B9B",
  },
  linkMuted: {
    color: "#8A8A8A",
    fontSize: 12,
    fontWeight: "600",
  },
  primaryBtn: {
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "#58D38C",
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
    color: "#6E6E6E",
    fontSize: 12,
  },
  footerLink: {
    color: "#58D38C",
    fontSize: 12,
    fontWeight: "700",
  },
});

const themes = {
  accent: "#58D38C",
  icon: "#6ADCA0",
  placeholder: "#616161",
};
