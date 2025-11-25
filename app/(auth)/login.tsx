import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
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

  const canSubmit = useMemo(
    () => email.trim().length > 3 && password.length >= 6,
    [email, password]
  );

  async function handleLogin() {
    if (!canSubmit || loading) return;
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert("✅ Logged in", res.user?.email ?? "Success");
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
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />

        <Pressable
          style={[styles.btn, (!canSubmit || loading) && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={!canSubmit || loading}
        >
          <Text style={styles.btnText}>{loading ? "..." : "Login"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", gap: 12 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 12, padding: 12 },
  btn: { backgroundColor: "#111", padding: 14, borderRadius: 12, alignItems: "center" },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "white", fontWeight: "600" },
});
