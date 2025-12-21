import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; // ✅ AJOUT
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
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
import { auth, db } from "../../firebaseConfig";

// 🎨 THEME AUTH (Même que Login)
const authTheme = {
    bgGradient: ["#DDF7E8", "#F4FDF9"] as const,
    glassCardBg: ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"] as const,
    glassBorder: "rgba(255, 255, 255, 0.8)",
    inputBg: "rgba(255, 255, 255, 0.6)",
    inputBorder: "rgba(0, 143, 107, 0.15)",
    textMain: "#0A3F33", 
    textMuted: "#4A665F",
    accent: "#008F6B",
    error: "#EF4444",
};

export default function Register() {
  const router = useRouter();
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [postalErrorMessage, setPostalErrorMessage] = useState<string | null>(null);
  const [birthErrorMessage, setBirthErrorMessage] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: boolean }>({});
  const [emailErrorMessage, setEmailErrorMessage] = useState<string | null>(null);

  function setFieldError(field: string, value = true) {
    setErrors((s) => ({ ...s, [field]: value }));
  }

  function clearFieldError(field: string) {
    setErrors((s) => ({ ...s, [field]: false }));
  }

  function formatBirthInput(raw: string) {
    const digits = raw.replace(/[^0-9]/g, "");
    let out = digits.slice(0, 8);
    if (out.length >= 5) {
      out = `${out.slice(0,2)}/${out.slice(2,4)}/${out.slice(4)}`;
    } else if (out.length >= 3) {
      out = `${out.slice(0,2)}/${out.slice(2)}`;
    }
    return out;
  }

  function validateBirthDate(input: string) {
    const parts = input.split("/");
    if (parts.length !== 3) return false;
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    if (isNaN(d) || isNaN(m) || isNaN(y)) return false;
    if (y < 1900 || y > new Date().getFullYear()) return false;
    if (m < 1 || m > 12) return false;
    const maxDay = new Date(y, m, 0).getDate();
    if (d < 1 || d > maxDay) return false;
    const birth = new Date(y, m - 1, d);
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 13);
    if (birth > minDate) return false;
    return true;
  }

  function validateEmailDomain(addr: string) {
    if (!addr || typeof addr !== "string") return false;
    const match = addr.trim().toLowerCase().match(/^([a-z0-9._%+-]+)@([a-z0-9.-]+)$/i);
    if (!match) return false;
    const domain = match[2];
    const allowed = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"]; // Ajout icloud
    return allowed.includes(domain);
  }

  function validateBelgianPostal(code: string) {
    if (!code || typeof code !== "string") return false;
    const digits = code.trim();
    if (!/^\d{4}$/.test(digits)) return false;
    const n = parseInt(digits, 10);
    if (n < 1000 || n > 9999) return false;
    return true;
  }

  const canSubmit = useMemo(() => {
    return (
      firstName.trim().length > 1 &&
      lastName.trim().length > 1 &&
      postalCode.trim().length >= 4 &&
      birthDate.trim().length >= 4 &&
      email.trim().length > 3 &&
      password.length >= 6 &&
      policyAccepted
    );
  }, [firstName, lastName, postalCode, birthDate, email, password, policyAccepted]);

  async function handleRegister() {
    let hasError = false;
    setErrors({});
    let emailInvalid = false;

    if (!firstName || firstName.trim().length < 2) { setFieldError("firstName"); hasError = true; }
    if (!lastName || lastName.trim().length < 2) { setFieldError("lastName"); hasError = true; }
    if (!validateBelgianPostal(postalCode)) { setFieldError("postalCode"); hasError = true; setPostalErrorMessage("Format requis : 4 chiffres"); }
    if (!validateBirthDate(birthDate)) {
      setFieldError("birthDate");
      hasError = true;
      setBirthErrorMessage("Date invalide (JJ/MM/AAAA) ou < 13 ans");
    }
    if (!validateEmailDomain(email)) { setFieldError("email"); hasError = true; emailInvalid = true; setEmailErrorMessage("Domaine non autorisé (@gmail, @outlook...)"); }
    if (!password || password.length < 6) { setFieldError("password"); hasError = true; }
    if (!policyAccepted) { setFieldError("policy"); hasError = true; }

    if (hasError) {
      if (!emailInvalid && !postalErrorMessage && !birthErrorMessage) {
        Alert.alert("Oups !", "Veuillez corriger les champs en rouge.");
      }
      return;
    }

    try {
      const q = query(collection(db, "users"), where("email", "==", email.trim().toLowerCase()));
      const snaps = await getDocs(q);
      if (!snaps.empty) {
        setFieldError("email");
        setEmailErrorMessage("Compte déjà existant");
        return;
      }
    } catch (err) {
      console.warn("Erreur vérification email", err);
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = result.user.uid;

      await setDoc(doc(db, "users", uid), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        postalCode: postalCode.trim(),
        birthDate: birthDate.trim(),
        email: email.trim(),
        username: `${firstName.trim()} ${lastName.trim()}`.trim(),
        usernameLowercase: `${firstName.trim()} ${lastName.trim()}`.trim().toLowerCase(),
        points: 0,
        isAdmin: false,
        clubId: null,
        abonnementId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        friends: [],
        pendingSent: [],
        pendingReceived: [],
      });

      Alert.alert("Bienvenue !", "Votre compte a été créé avec succès.");
      router.replace("/acceuil");

    } catch (e: any) {
      const code = e?.code || "";
      if (code.includes("email-already-in-use")) {
        setFieldError("email");
        setEmailErrorMessage("Compte déjà existant");
      } else {
        Alert.alert("Erreur", e.message || String(e));
      }
    }
  }

  // Couleurs dynamiques
  const textColor = isLight ? authTheme.textMain : colors.text;
  const mutedColor = isLight ? authTheme.textMuted : colors.mutedText;
  const inputBg = isLight ? authTheme.inputBg : colors.surfaceAlt;
  const inputBorder = isLight ? authTheme.inputBorder : "transparent";

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
          {/* HEADER AVEC RETOUR */}
          <View style={styles.header}>
             <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={textColor} />
             </TouchableOpacity>
             <Text style={[styles.headerTitle, { color: textColor }]}>Créer un compte</Text>
             <View style={{ width: 40 }} />
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
            {/* PRÉNOM & NOM */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                    <TextInput
                        style={[styles.input, { backgroundColor: inputBg, borderColor: errors["firstName"] ? authTheme.error : inputBorder, color: textColor }]}
                        placeholder="Prénom"
                        placeholderTextColor={mutedColor}
                        value={firstName}
                        onChangeText={(t) => { setFirstName(t); if (errors["firstName"]) clearFieldError("firstName"); }}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <TextInput
                        style={[styles.input, { backgroundColor: inputBg, borderColor: errors["lastName"] ? authTheme.error : inputBorder, color: textColor }]}
                        placeholder="Nom"
                        placeholderTextColor={mutedColor}
                        value={lastName}
                        onChangeText={(t) => { setLastName(t); if (errors["lastName"]) clearFieldError("lastName"); }}
                    />
                </View>
            </View>

            {/* CODE POSTAL */}
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor: errors["postalCode"] ? authTheme.error : inputBorder, color: textColor }]}
              placeholder="Code postal (Belgique)"
              placeholderTextColor={mutedColor}
              keyboardType="numeric"
              maxLength={4}
              value={postalCode}
              onChangeText={(t) => { setPostalCode(t); if (errors["postalCode"]) clearFieldError("postalCode"); if (postalErrorMessage) setPostalErrorMessage(null); }}
            />
            {postalErrorMessage && <Text style={[styles.errorText, { color: authTheme.error }]}>{postalErrorMessage}</Text>}

            {/* DATE DE NAISSANCE */}
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor: errors["birthDate"] ? authTheme.error : inputBorder, color: textColor }]}
              placeholder="Date de naissance (JJ/MM/AAAA)"
              placeholderTextColor={mutedColor}
              keyboardType="numeric"
              maxLength={10}
              value={birthDate}
              onChangeText={(t) => {
                const f = formatBirthInput(t);
                setBirthDate(f);
                if (errors["birthDate"]) clearFieldError("birthDate");
                if (birthErrorMessage) setBirthErrorMessage(null);
              }}
            />
            {birthErrorMessage && <Text style={[styles.errorText, { color: authTheme.error }]}>{birthErrorMessage}</Text>}

            {/* EMAIL */}
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor: errors["email"] ? authTheme.error : inputBorder, color: textColor }]}
              placeholder="Email"
              placeholderTextColor={mutedColor}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={(t) => { setEmail(t); if (errors["email"]) clearFieldError("email"); if (emailErrorMessage) setEmailErrorMessage(null); }}
            />
            {emailErrorMessage && <Text style={[styles.errorText, { color: authTheme.error }]}>{emailErrorMessage}</Text>}

            {/* MOT DE PASSE */}
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor: errors["password"] ? authTheme.error : inputBorder, color: textColor }]}
              placeholder="Mot de passe (min. 6 caractères)"
              placeholderTextColor={mutedColor}
              secureTextEntry
              value={password}
              onChangeText={(t) => { setPassword(t); if (errors["password"]) clearFieldError("password"); }}
            />

            {/* CHECKBOX POLICY */}
            <TouchableOpacity onPress={() => setPolicyAccepted(!policyAccepted)} style={styles.policyRow}>
                <View style={[
                    styles.checkbox, 
                    { borderColor: errors["policy"] ? authTheme.error : (policyAccepted ? authTheme.accent : mutedColor), backgroundColor: policyAccepted ? authTheme.accent : "transparent" }
                ]}>
                  {policyAccepted && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
                <Text style={[styles.policyText, { color: mutedColor }]}>
                  J'accepte la <Text style={{ color: isLight ? authTheme.accent : colors.accent, fontWeight: "700" }} onPress={() => router.push("/politique-de-confidentialite")}>politique de confidentialité</Text> de GreenUp.
                </Text>
            </TouchableOpacity>

            {/* REGISTER BUTTON */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={!canSubmit}
              activeOpacity={0.9}
              style={{ shadowColor: authTheme.accent, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: {width: 0, height: 4}, elevation: 4, marginTop: 10 }}
            >
                <LinearGradient
                    colors={!canSubmit ? ["#A0AEC0", "#CBD5E0"] : ["#008F6B", "#10B981"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.primaryBtn}
                >
                    <Text style={styles.btnText}>Créer un compte</Text>
                    {canSubmit && <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />}
                </LinearGradient>
            </TouchableOpacity>

            {/* LOGIN LINK */}
            <TouchableOpacity onPress={() => router.push("/login")} style={{ marginTop: 20, alignItems: 'center' }}>
                <Text style={{ color: isLight ? authTheme.accent : colors.accent, fontWeight: "700", fontSize: 14 }}>Déjà un compte ? Se connecter</Text>
            </TouchableOpacity>

          </LinearGradient>
        </ScrollView>
      </Wrapper>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { padding: 8, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.05)" },
  headerTitle: { fontSize: 22, fontWeight: "800", fontFamily: FontFamilies.heading },
  card: {
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 30,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 20, elevation: 5
  },
  input: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 16,
  },
  primaryBtn: { borderRadius: 20, paddingVertical: 16, flexDirection: 'row', alignItems: "center", justifyContent: 'center' },
  btnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.5 },
  policyRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 20, marginTop: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 2 },
  policyText: { fontSize: 13, lineHeight: 20, flex: 1 },
  errorText: { fontSize: 12, fontWeight: "600", marginTop: -12, marginBottom: 12, marginLeft: 4 },
});