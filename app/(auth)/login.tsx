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
  const { colors } = useThemeMode();

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
      <View style={[styles.root, { backgroundColor: colors.background }]}> 
        {/* Top branding section */}
        <View style={[styles.brandTop, { backgroundColor: colors.mode === 'dark' ? '#111F1B' : '#ECECEC' }]}> 
          <Image source={require("../../assets/images/icon.png")} style={styles.logo} />
          <Text style={[styles.appName, { color: colors.text }]}>GREEN UP</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}> 
          {/* Email */}
          <View style={[styles.inputRow, { backgroundColor: colors.surfaceAlt }]}> 
            <Ionicons name="person-outline" size={18} color={colors.text} style={{ marginRight: 8 }} />
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

          {/* Password */}
            <View style={[styles.inputRow, { backgroundColor: colors.surfaceAlt }]}> 
              <Ionicons name="lock-closed-outline" size={18} color={colors.text} style={{ marginRight: 8 }} />
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

          {/* Row: remember + forgot password */}
          <View style={styles.rowBetween}> 
            <TouchableOpacity onPress={() => setRememberMe((r) => !r)} style={styles.checkboxRow}>
              <View style={[styles.checkboxBox, { borderColor: colors.mutedText, backgroundColor: rememberMe ? colors.accent : 'transparent' }]}>
                {rememberMe && <Ionicons name="checkmark" size={14} color="#0F3327" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.mutedText }]}>Se souvenir de moi</Text>
            </TouchableOpacity>
            <Pressable onPress={() => { /* TODO: route to reset */ }}>
              <Text style={{ color: colors.mutedText, fontSize: 12, fontWeight: '600' }}>Mot de passe oublié ?</Text>
            </Pressable>
          </View>

          {/* Login button */}
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: colors.text }, (!canSubmit || loading) && { opacity: 0.5 } ]}
            onPress={handleLogin}
            disabled={!canSubmit || loading}
          >
            <Text style={[styles.primaryBtnText, { color: colors.background }]}>{loading ? '...' : 'Se connecter'}</Text>
          </Pressable>

          {/* Google button (UI only) */}
          <TouchableOpacity style={[styles.googleBtn, { backgroundColor: colors.surfaceAlt }]} disabled={loading}> 
            <Image source={require('../../assets/images/favicon.png')} style={{ width: 16, height: 16, marginRight: 8 }} />
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}>Continuez avec Google</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={{ marginTop: 14, flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Text style={{ color: colors.mutedText, fontSize: 12 }}>Vous n'avez pas encore de compte ? </Text>
            <Pressable onPress={() => router.push('/register')}>
              <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700' }}>Créer un compte</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  brandTop: { width: '100%', paddingTop: 100, alignItems: 'center', paddingBottom: 40 },
  logo: { width: 120, height: 120, resizeMode: 'contain', marginBottom: 12 },
  appName: { fontSize: 32, fontWeight: '700', letterSpacing: 1 },
  card: { marginHorizontal: 16, marginTop: -40, borderRadius: 24, padding: 24, elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, gap: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12 },
  inputField: { flex: 1, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  checkboxBox: { width: 18, height: 18, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  checkboxLabel: { fontSize: 12, fontWeight: '600' },
  primaryBtn: { borderRadius: 24, paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { fontSize: 16, fontWeight: '700' },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 18, paddingVertical: 12 },
});
