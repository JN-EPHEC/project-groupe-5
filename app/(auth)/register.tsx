import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
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
  const [birthDate, setBirthDate] = useState(""); // simple text input for now
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [policyAccepted, setPolicyAccepted] = useState(false);

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
    if (!canSubmit) {
      Alert.alert("Information", "Veuillez compléter tous les champs et accepter la politique de confidentialité.");
      return;
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
      Alert.alert("Erreur", e.message);
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
              source={require("../../assets/images/greenup-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardAlt }]}>
            <Text style={[styles.title, { color: colors.text }]}>Créer un compte</Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.cardAlt, color: colors.text }]}
              placeholder="Prénom"
              placeholderTextColor={colors.mutedText}
              value={firstName}
              onChangeText={setFirstName}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.cardAlt, color: colors.text }]}
              placeholder="Nom"
              placeholderTextColor={colors.mutedText}
              value={lastName}
              onChangeText={setLastName}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.cardAlt, color: colors.text }]}
              placeholder="Code postal"
              placeholderTextColor={colors.mutedText}
              keyboardType="numeric"
              value={postalCode}
              onChangeText={setPostalCode}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.cardAlt, color: colors.text }]}
              placeholder="Date de naissance (JJ/MM/AAAA)"
              placeholderTextColor={colors.mutedText}
              value={birthDate}
              onChangeText={setBirthDate}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.cardAlt, color: colors.text }]}
              placeholder="Email"
              placeholderTextColor={colors.mutedText}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.cardAlt, color: colors.text }]}
              placeholder="Mot de passe (min. 6 caractères)"
              placeholderTextColor={colors.mutedText}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
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
              disabled={!canSubmit}
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
});
