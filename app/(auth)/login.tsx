import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; // ✅ AJOUT
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

// DEV autofill (local only)
const DEV_MODE = __DEV__;
let DEV_EMAIL = "";
let DEV_PASSWORD = "";
if (DEV_MODE) {
  try {
    const creds = require("../../devAuth.env.js");
    DEV_EMAIL = creds?.DEV_TEST_EMAIL ?? "";
    DEV_PASSWORD = creds?.DEV_TEST_PASSWORD ?? "";
  } catch (e) {}
}

// 🎨 THEME AUTH
const authTheme = {
    bgGradient: ["#DDF7E8", "#F4FDF9"] as const,
    glassCardBg: ["rgba(255, 255, 255, 0.85)", "rgba(255, 255, 255, 0.65)"] as const,
    glassBorder: "rgba(255, 255, 255, 0.8)",
    inputBg: "rgba(255, 255, 255, 0.6)",
    inputBorder: "rgba(0, 143, 107, 0.15)",
    textMain: "#0A3F33", 
    textMuted: "#4A665F",
    accent: "#008F6B", // Vert Marque
    error: "#EF4444",
};

export default function Login() {
  const router = useRouter();
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";

  const [email, setEmail] = useState(DEV_MODE ? DEV_EMAIL : "");
  const [password, setPassword] = useState(DEV_MODE ? DEV_PASSWORD : "");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const canSubmit = useMemo(
    () => email.trim().length >= 1 && password.length >= 1,
    [email, password]
  );

  async function handleLogin() {
    if (!canSubmit || loading) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      setEmailError(true);
      setPasswordError(true);
      setAuthErrorMessage("Adresse e‑mail ou mot de passe invalide.");
    } finally {
      setLoading(false);
    }
  }

  // Couleurs dynamiques
  const textColor = isLight ? authTheme.textMain : colors.text;
  const mutedColor = isLight ? authTheme.textMuted : colors.mutedText;
  const cardBg = isLight ? authTheme.glassCardBg : null; 

  const Wrapper = isLight ? LinearGradient : View;
  const wrapperProps = isLight 
    ? { colors: authTheme.bgGradient, style: styles.root } 
    : { style: [styles.root, { backgroundColor: "#021114" }] };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Wrapper {...(wrapperProps as any)}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* LOGO */}
          <View style={styles.logoRow}>
            <Image
              source={
                isLight
                  ? require("../../assets/images/logo_Green_UP_noir_degradé-removebg-preview.png")
                  : require("../../assets/images/logo_fond_vert_degradé__1_-removebg-preview.png")
              }
              style={{ width: 280, height: 120 }}
              resizeMode="contain"
            />
          </View>

          {/* CARD FORMULAIRE */}
          <LinearGradient
            colors={isLight ? authTheme.glassCardBg : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[
                styles.card, 
                { borderColor: isLight ? authTheme.glassBorder : "rgba(255,255,255,0.1)", borderWidth: 1 }
            ]}
          >
            <Text style={[styles.title, { color: textColor }]}>Se connecter </Text>
            
            {/* EMAIL */}
            <View style={[
                styles.inputRow, 
                { 
                    backgroundColor: isLight ? authTheme.inputBg : colors.surfaceAlt,
                    borderColor: emailError ? authTheme.error : (isLight ? authTheme.inputBorder : "transparent") 
                }
            ]}>
              <Ionicons name="mail-outline" size={20} color={mutedColor} style={{ marginRight: 10 }} />
              <TextInput
                style={[styles.inputField, { color: textColor }]}
                placeholder="Email"
                placeholderTextColor={mutedColor}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={(t) => { setEmail(t); if (emailError || passwordError) { setEmailError(false); setPasswordError(false); } if (authErrorMessage) setAuthErrorMessage(null); }}
                editable={!loading}
              />
            </View>

            {/* PASSWORD */}
            <View style={[
                styles.inputRow, 
                { 
                    backgroundColor: isLight ? authTheme.inputBg : colors.surfaceAlt,
                    borderColor: passwordError ? authTheme.error : (isLight ? authTheme.inputBorder : "transparent")
                }
            ]}>
              <Ionicons name="lock-closed-outline" size={20} color={mutedColor} style={{ marginRight: 10 }} />
              <TextInput
                style={[styles.inputField, { color: textColor }]}
                placeholder="Mot de passe"
                placeholderTextColor={mutedColor}
                secureTextEntry
                value={password}
                onChangeText={(t) => { setPassword(t); if (emailError || passwordError) { setEmailError(false); setPasswordError(false); } if (authErrorMessage) setAuthErrorMessage(null); }}
                editable={!loading}
              />
            </View>

            {/* OPTIONS (Remember Me / Forgot Pwd) */}
            <View style={styles.rowBetween}>
              <TouchableOpacity onPress={() => setRememberMe((r) => !r)} style={styles.checkboxRow}>
                <View style={[
                    styles.checkboxBox,
                    { borderColor: rememberMe ? authTheme.accent : mutedColor, backgroundColor: rememberMe ? authTheme.accent : "transparent" }
                ]}>
                  {rememberMe && <Ionicons name="checkmark" size={12} color="#FFF" />}
                </View>
                <Text style={[styles.checkboxLabel, { color: mutedColor }]}>Se souvenir de moi</Text>
              </TouchableOpacity>
              
              <Pressable onPress={() => router.push("/reset-password")}>
                <Text style={[styles.linkMuted, { color: isLight ? authTheme.accent : colors.accent }]}>Mot de passe oublié ?</Text>
              </Pressable>
            </View>

            {/* ERROR MESSAGE */}
            {authErrorMessage ? (
              <View style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", padding: 10, borderRadius: 12, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: authTheme.error }}>
                  <Text style={{ color: authTheme.error, fontWeight: "600", fontSize: 13 }}>{authErrorMessage}</Text>
              </View>
            ) : null}

            {/* LOGIN BUTTON */}
            <TouchableOpacity
              disabled={!canSubmit || loading}
              onPress={handleLogin}
              activeOpacity={0.9}
              // ✅ MODIFIÉ : Suppression des ombres / effet lumineux
              style={{ width: '100%' }}
            >
                <LinearGradient
                    colors={(!canSubmit || loading) ? ["#A0AEC0", "#CBD5E0"] : ["#008F6B", "#10B981"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.primaryBtn}
                >
                    <Text style={styles.primaryBtnText}>{loading ? "Connexion..." : "Se connecter"}</Text>
                    {!loading && <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />}
                </LinearGradient>
            </TouchableOpacity>

            {/* FOOTER LINK */}
            <View style={styles.footerRow}>
              <Text style={{ color: mutedColor, fontSize: 14 }}>Pas encore de compte ? </Text>
              <Pressable onPress={() => router.push("/register")}>
                <Text style={{ color: isLight ? authTheme.accent : colors.accent, fontWeight: "700", fontSize: 14 }}>Créer un compte</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </ScrollView>
      </Wrapper>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, justifyContent: 'center', minHeight: '100%' },
  logoRow: { alignItems: "center", marginBottom: 30, marginTop: 40 },
  card: {
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 36,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 20, elevation: 5
  },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 24, fontFamily: FontFamilies.heading, textAlign: 'center' },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, marginBottom: 16,
  },
  inputField: { flex: 1, fontWeight: "600", fontSize: 15 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  checkboxRow: { flexDirection: "row", alignItems: "center" },
  checkboxBox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginRight: 8 },
  checkboxLabel: { fontSize: 13, fontWeight: "600" },
  linkMuted: { fontSize: 13, fontWeight: "700" },
  primaryBtn: { borderRadius: 20, paddingVertical: 16, flexDirection: 'row', alignItems: "center", justifyContent: 'center' },
  primaryBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.5 },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
});