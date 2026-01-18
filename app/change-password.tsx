import { FontFamilies } from "@/constants/fonts";
import { auth } from "@/firebaseConfig"; // Assure-toi que auth est bien exporté de ta config
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import React, { useState } from "react";
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

// 🎨 THEME CHANGE PASSWORD
const passwordTheme = {
  bgGradient: ["#F9FAFB", "#F3F4F6"] as const,
  glassCardBg: ["#FFFFFF", "rgba(255, 255, 255, 0.8)"] as const,
  borderColor: "rgba(0, 0, 0, 0.05)",
  textMain: "#111827",
  textMuted: "#6B7280",
  accent: "#008F6B",
  inputBg: "#F9FAFB",
  error: "#EF4444",
};

export default function ChangePasswordScreen() {
  const { colors, mode } = useThemeMode();
  const router = useRouter();
  const isDark = mode === "dark";

  // --- ÉTATS ---
  const [step, setStep] = useState<1 | 2>(1); // Gestion des étapes
  const [loading, setLoading] = useState(false);
  const [errorField, setErrorField] = useState<"current" | "new" | "confirm" | null>(null);

  // Inputs
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- LOGIQUE ÉTAPE 1 : DÉVERROUILLAGE ---
  const handleUnlock = async () => {
    setErrorField(null);
    if (!currentPassword) {
      setErrorField("current");
      Alert.alert("Erreur", "Veuillez entrer votre mot de passe actuel.");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("Utilisateur non identifié.");

      // On crée les crédentials pour vérifier le mot de passe
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      
      // On tente de ré-authentifier l'utilisateur
      await reauthenticateWithCredential(user, credential);

      // Si ça passe, on va à l'étape 2
      setStep(2);
    } catch (error: any) {
      console.error(error);
      setErrorField("current"); // Met le champ en rouge
      Alert.alert("Accès refusé", "Le mot de passe actuel est incorrect.");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIQUE ÉTAPE 2 : CHANGEMENT ---
  const handleChangePassword = async () => {
    setErrorField(null);

    // Validations locales
    if (newPassword.length < 6) {
      setErrorField("new");
      Alert.alert("Sécurité", "Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorField("confirm"); // Ou les deux
      Alert.alert("Erreur", "Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    if (newPassword === currentPassword) {
        setErrorField("new");
        Alert.alert("Erreur", "Le nouveau mot de passe doit être différent de l'ancien.");
        return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Utilisateur introuvable.");

      // Mise à jour Firebase
      await updatePassword(user, newPassword);

      Alert.alert("Succès", "Votre mot de passe a été mis à jour avec succès.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Impossible de changer le mot de passe.");
    } finally {
      setLoading(false);
    }
  };

  // --- STYLES DYNAMIQUES ---
  const titleColor = isDark ? "#FFF" : passwordTheme.textMain;
  const mutedColor = isDark ? "#9CA3AF" : passwordTheme.textMuted;
  const cardBorder = isDark ? "rgba(255,255,255,0.1)" : passwordTheme.borderColor;
  const bgColors = isDark ? [colors.background, "#1F2937"] : passwordTheme.bgGradient;
  const inputBackground = isDark ? "rgba(255,255,255,0.05)" : passwordTheme.inputBg;

  // Helper pour la couleur de bordure des inputs
  const getBorderColor = (fieldName: "current" | "new" | "confirm") => {
    if (errorField === fieldName) return passwordTheme.error;
    return cardBorder;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />
        
        {/* FOND */}
        <LinearGradient
            colors={bgColors as any}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        />

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity 
                onPress={() => step === 1 ? router.back() : setStep(1)} 
                style={[styles.backBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#FFF" }]}
            >
              <Ionicons name="arrow-back" size={20} color={titleColor} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: titleColor }]}>
                {step === 1 ? "Vérification" : "Nouveau mot de passe"}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFF", borderColor: cardBorder }]}>
            
            {/* --- ÉTAPE 1 : DÉVERROUILLAGE --- */}
            {step === 1 && (
                <>
                    <View style={styles.iconHeader}>
                        <View style={[styles.iconCircle, { backgroundColor: "rgba(0,143,107,0.1)" }]}>
                            <Ionicons name="shield-checkmark-outline" size={32} color={passwordTheme.accent} />
                        </View>
                    </View>
                    <Text style={{ color: mutedColor, marginBottom: 24, textAlign: 'center', lineHeight: 22 }}>
                        Par mesure de sécurité, veuillez saisir votre mot de passe actuel pour continuer.
                    </Text>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: mutedColor }]}>MOT DE PASSE ACTUEL</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: inputBackground, borderColor: getBorderColor("current") }]}>
                            <Ionicons name="lock-closed-outline" size={18} color={mutedColor} style={{ marginRight: 10 }} />
                            <TextInput
                                style={[styles.inputField, { color: titleColor }]}
                                placeholder="••••••••"
                                placeholderTextColor={mutedColor}
                                secureTextEntry
                                value={currentPassword}
                                onChangeText={(text) => {
                                    setCurrentPassword(text);
                                    if(errorField === "current") setErrorField(null);
                                }}
                                editable={!loading}
                            />
                        </View>
                        {errorField === "current" && (
                            <Text style={styles.errorLabel}>Mot de passe incorrect</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.primaryBtn, { backgroundColor: passwordTheme.accent, opacity: loading ? 0.7 : 1 }]}
                        onPress={handleUnlock}
                        disabled={loading}
                    >
                        {loading ? (
                            <Text style={styles.primaryBtnText}>Vérification...</Text>
                        ) : (
                            <Text style={styles.primaryBtnText}>Continuer</Text>
                        )}
                    </TouchableOpacity>
                </>
            )}

            {/* --- ÉTAPE 2 : CHANGEMENT --- */}
            {step === 2 && (
                <>
                    <Text style={{ color: mutedColor, marginBottom: 24, textAlign: 'center', lineHeight: 22 }}>
                        Choisissez un nouveau mot de passe sécurisé d'au moins 6 caractères.
                    </Text>

                    {/* New Password */}
                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: mutedColor }]}>NOUVEAU MOT DE PASSE</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: inputBackground, borderColor: getBorderColor("new") }]}>
                            <Ionicons name="key-outline" size={18} color={mutedColor} style={{ marginRight: 10 }} />
                            <TextInput
                                style={[styles.inputField, { color: titleColor }]}
                                placeholder="Au moins 6 caractères"
                                placeholderTextColor={mutedColor}
                                secureTextEntry
                                value={newPassword}
                                onChangeText={(text) => {
                                    setNewPassword(text);
                                    if(errorField === "new") setErrorField(null);
                                }}
                                editable={!loading}
                            />
                        </View>
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: mutedColor }]}>CONFIRMER LE MOT DE PASSE</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: inputBackground, borderColor: getBorderColor("confirm") }]}>
                            <Ionicons name="checkmark-circle-outline" size={18} color={mutedColor} style={{ marginRight: 10 }} />
                            <TextInput
                                style={[styles.inputField, { color: titleColor }]}
                                placeholder="Répétez le mot de passe"
                                placeholderTextColor={mutedColor}
                                secureTextEntry
                                value={confirmPassword}
                                onChangeText={(text) => {
                                    setConfirmPassword(text);
                                    if(errorField === "confirm") setErrorField(null);
                                }}
                                editable={!loading}
                            />
                        </View>
                        {errorField === "confirm" && (
                            <Text style={styles.errorLabel}>Les mots de passe ne correspondent pas</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.primaryBtn, { backgroundColor: passwordTheme.accent, opacity: loading ? 0.7 : 1 }]}
                        onPress={handleChangePassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <Text style={styles.primaryBtnText}>Mise à jour...</Text>
                        ) : (
                            <Text style={styles.primaryBtnText}>Changer le mot de passe</Text>
                        )}
                    </TouchableOpacity>
                </>
            )}

          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 48, paddingTop: 60 },
  
  header: { 
      flexDirection: 'row', alignItems: 'center', marginBottom: 24 
  },
  backBtn: {
      padding: 10, borderRadius: 12, marginRight: 16,
      shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
  },
  headerTitle: { fontSize: 22, fontWeight: "800", fontFamily: FontFamilies.heading },

  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  iconHeader: {
      alignItems: 'center',
      marginBottom: 16
  },
  iconCircle: {
      width: 60, height: 60, borderRadius: 30,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 8
  },
  inputContainer: { marginBottom: 20 },
  label: {
      fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.5
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamilies.body,
    fontWeight: "600",
  },
  errorLabel: {
      color: "#EF4444",
      fontSize: 12,
      marginTop: 6,
      marginLeft: 4,
      fontWeight: "600"
  },
  primaryBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: FontFamilies.heading,
    color: "#FFF"
  },
});