import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
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
    View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";
import { useThemeMode } from "../../hooks/theme-context";

export default function Register() {
  const router = useRouter();
  const { colors, mode } = useThemeMode();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [postalErrorMessage, setPostalErrorMessage] = useState<string | null>(null);
  const [birthErrorMessage, setBirthErrorMessage] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState(""); // dd/mm/yyyy
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
    // keep digits only and insert slashes dd/mm/yyyy
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
    // expect dd/mm/yyyy
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
    // age >= 13
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
    const allowed = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];
    return allowed.includes(domain);
  }

  function validateBelgianPostal(code: string) {
    if (!code || typeof code !== "string") return false;
    const digits = code.trim();
    if (!/^\d{4}$/.test(digits)) return false;
    const n = parseInt(digits, 10);
    // Belgian postal codes are four-digit numbers (typically 1000-9999)
    // Require between 1000 and 9999 to avoid leading-zero or too-small values.
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
    // validate fields and mark errors
    let hasError = false;
    setErrors({});
    let emailInvalid = false;

    if (!firstName || firstName.trim().length < 2) { setFieldError("firstName"); hasError = true; }
    if (!lastName || lastName.trim().length < 2) { setFieldError("lastName"); hasError = true; }
    if (!validateBelgianPostal(postalCode)) { setFieldError("postalCode"); hasError = true; setPostalErrorMessage("Format requis : 4 chiffres (code postal belge)"); }
    if (!validateBirthDate(birthDate)) {
      // Determine whether it's a format issue or the user is too young
      const parts = birthDate.split("/");
      let birthTooYoung = false;
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
          const birth = new Date(y, m - 1, d);
          const minDate = new Date();
          minDate.setFullYear(minDate.getFullYear() - 13);
          if (birth > minDate) birthTooYoung = true;
        }
      }
      setFieldError("birthDate");
      hasError = true;
      if (birthTooYoung) setBirthErrorMessage("Minimum 13 ans");
      else setBirthErrorMessage("Date invalide (JJ/MM/AAAA)");
    }
    if (!validateEmailDomain(email)) { setFieldError("email"); hasError = true; emailInvalid = true; setEmailErrorMessage("Format requis : @gmail.com, @hotmail.com, @yahoo.com ou @outlook.com"); }
    if (!password || password.length < 6) { setFieldError("password"); hasError = true; }
    if (!policyAccepted) { setFieldError("policy"); hasError = true; }

    if (hasError) {
      // If any inline error messages are set, avoid showing a blocking alert
      if (emailInvalid || postalErrorMessage || birthErrorMessage) {
        // inline messages will guide the user
      } else {
        Alert.alert("Informations invalides", "Veuillez corriger les champs en rouge.");
      }
      return;
    }

    // Check if email already exists in Firestore users collection
    try {
      const q = query(collection(db, "users"), where("email", "==", email.trim().toLowerCase()));
      const snaps = await getDocs(q);
      if (!snaps.empty) {
        setFieldError("email");
        setEmailErrorMessage("Compte déjà existant");
        return;
      }
    } catch (err) {
      console.warn("Erreur vérification email existant", err);
    }

    try {
      // 1️⃣ Create account in Firebase Auth
      const result = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const uid = result.user.uid;

      // 2️⃣ Create Firestore user profile (include friend system fields)
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

      Alert.alert("Compte créé", "Votre compte a été créé avec succès !");
      router.replace("/acceuil");

    } catch (e: any) {
      const code = e?.code || "";
      if (code.includes("email-already-in-use") || code.includes("auth/email-already-in-use")) {
        setFieldError("email");
        setEmailErrorMessage("Compte déjà existant");
      } else {
        Alert.alert("Erreur", e.message || String(e));
      }
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
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
                mode === "light"
                  ? require("../../assets/images/logo_Green_UP_noir_degradé-removebg-preview.png")
                  : require("../../assets/images/logo_fond_vert_degradé__1_-removebg-preview.png")
              }
              style={{ width: 340, height: 152 }}
              resizeMode="contain"
            />
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardAlt }]}>
            <Text style={[styles.title, { color: colors.text }]}>Créer un compte</Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.cardAlt, color: colors.text }, errors["firstName"] && { borderColor: "#FF4D4F" }]}
              placeholder="Prénom"
              placeholderTextColor={colors.mutedText}
              value={firstName}
              onChangeText={(t) => { setFirstName(t); if (errors["firstName"]) clearFieldError("firstName"); }}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.cardAlt, color: colors.text }, errors["lastName"] && { borderColor: "#FF4D4F" }]}
              placeholder="Nom"
              placeholderTextColor={colors.mutedText}
              value={lastName}
              onChangeText={(t) => { setLastName(t); if (errors["lastName"]) clearFieldError("lastName"); }}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.cardAlt, color: colors.text }, errors["postalCode"] && { borderColor: "#FF4D4F" }]}
              placeholder="Code postal"
              placeholderTextColor={colors.mutedText}
              keyboardType="numeric"
              value={postalCode}
              onChangeText={(t) => { setPostalCode(t); if (errors["postalCode"]) clearFieldError("postalCode"); if (postalErrorMessage) setPostalErrorMessage(null); }}
            />

            {postalErrorMessage ? (
              <Text style={[styles.errorTextInline, { color: "#FF4D4F", marginBottom: 10 }]}>{postalErrorMessage}</Text>
            ) : null}

            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.cardAlt, color: colors.text },
                errors["birthDate"] && { borderColor: "#FF4D4F" },
              ]}
              placeholder="Date de naissance (JJ/MM/AAAA)"
              placeholderTextColor={colors.mutedText}
              value={birthDate}
              onChangeText={(t) => {
                const f = formatBirthInput(t);
                setBirthDate(f);
                if (errors["birthDate"]) clearFieldError("birthDate");
                if (birthErrorMessage) setBirthErrorMessage(null);
              }}
            />

            {birthErrorMessage ? (
              <Text style={[styles.errorTextInline, { color: "#FF4D4F", marginBottom: 10 }]}>{birthErrorMessage}</Text>
            ) : null}

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.cardAlt, color: colors.text }, errors["email"] && { borderColor: "#FF4D4F" }]}
              placeholder="Email"
              placeholderTextColor={colors.mutedText}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={(t) => { setEmail(t); if (errors["email"]) clearFieldError("email"); if (emailErrorMessage) setEmailErrorMessage(null); }}
            />

            {emailErrorMessage ? (
              <Text style={[styles.errorTextInline, { color: "#FF4D4F", marginBottom: 10 }]}>{emailErrorMessage}</Text>
            ) : null}

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.cardAlt, color: colors.text }, errors["password"] && { borderColor: "#FF4D4F" }]}
              placeholder="Mot de passe (min. 6 caractères)"
              placeholderTextColor={colors.mutedText}
              secureTextEntry
              value={password}
              onChangeText={(t) => { setPassword(t); if (errors["password"]) clearFieldError("password"); }}
            />

            <View style={styles.policyRow}>
              <Pressable
                onPress={() => setPolicyAccepted((prev) => !prev)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: policyAccepted }}
              >
                <View style={[styles.checkbox, { borderColor: colors.accent, backgroundColor: policyAccepted ? colors.accent : "transparent" }]}>
                  {policyAccepted ? <Ionicons name="checkmark" size={16} color="#00231A" /> : null}
                </View>
              </Pressable>
              <Text style={[styles.policyText, { color: colors.mutedText }]}>
                J&apos;accepte la
                {" "}
                <Text
                  style={[styles.policyLink, { color: colors.accent }]}
                  onPress={() => router.push("/politique-de-confidentialite")}
                >
                  politique de confidentialité
                </Text>
                {" "}
                de GreenUp.
              </Text>
            </View>

            <Pressable
              style={[styles.btn, { backgroundColor: colors.accent }, !canSubmit && styles.btnDisabled]}
              onPress={handleRegister}
            >
              <Text style={styles.btnText}>Créer un compte</Text>
            </Pressable>

            <Pressable onPress={() => router.push("/login")}> 
              <Text style={[styles.link, { color: colors.accent }]}>Déjà un compte ? Se connecter</Text>
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
    paddingTop: 70,
  },
  logoRow: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 340,
    height: 152,
  },
  card: {
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    fontWeight: "600",
    marginBottom: 16,
  },
  btn: {
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: { color: "#00231A", fontWeight: "700", fontSize: 16 },
  policyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    // Handled dynamically
  },
  policyText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  policyLink: {
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  link: { marginTop: 18, textAlign: "center", fontWeight: "600" },
  inputError: {
    borderColor: "#FF4D4F",
  },
  errorTextInline: {
    fontSize: 13,
    fontWeight: "600",
  },
});
