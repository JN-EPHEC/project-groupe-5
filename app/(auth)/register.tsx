import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
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
import { auth, db } from "../../firebaseConfig";

export default function Register() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [birthDate, setBirthDate] = useState(""); // simple text input for now
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const canSubmit = useMemo(() => {
    return (
      firstName.trim().length > 1 &&
      lastName.trim().length > 1 &&
      postalCode.trim().length >= 4 &&
      birthDate.trim().length >= 4 &&
      email.trim().length > 3 &&
      password.length >= 6
    );
  }, [firstName, lastName, postalCode, birthDate, email, password]);

  async function handleRegister() {
    if (!canSubmit) return;

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
      <View style={styles.container}>
        <Text style={styles.title}>Créer un compte</Text>

        <TextInput
          style={styles.input}
          placeholder="Prénom"
          value={firstName}
          onChangeText={setFirstName}
        />

        <TextInput
          style={styles.input}
          placeholder="Nom"
          value={lastName}
          onChangeText={setLastName}
        />

        <TextInput
          style={styles.input}
          placeholder="Code postal"
          keyboardType="numeric"
          value={postalCode}
          onChangeText={setPostalCode}
        />

        <TextInput
          style={styles.input}
          placeholder="Date de naissance (JJ/MM/AAAA)"
          value={birthDate}
          onChangeText={setBirthDate}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe (min. 6 caractères)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          style={[styles.btn, !canSubmit && { opacity: 0.5 }]}
          onPress={handleRegister}
          disabled={!canSubmit}
        >
          <Text style={styles.btnText}>Créer un compte</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/login")}>
          <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", gap: 12 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 12,
  },
  btn: {
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "600" },
  link: { marginTop: 10, color: "#333", textAlign: "center" },
});
