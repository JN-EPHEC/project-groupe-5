import { FontFamilies } from "@/constants/fonts";
import { useNotificationsSettings } from "@/hooks/notifications-context";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { Ionicons } from "@expo/vector-icons";
import { Camera } from "expo-camera";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where, limit } from "firebase/firestore";
import { deleteObject, ref as storageRef } from "firebase/storage";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db, storage } from "../../../firebaseConfig";
import { SettingSwitch } from "./SettingSwitch";
import { LinearGradient } from "expo-linear-gradient";

// 🎨 AJOUTER CE THÈME AVANT LE COMPOSANT
const settingsTheme = {
    glassBg: ["rgba(255, 255, 255, 0.85)", "rgba(255, 255, 255, 0.65)"] as const,
    borderColor: "rgba(255, 255, 255, 0.6)",
    textMain: "#0A3F33", 
    textMuted: "#4A665F",
    accent: "#008F6B",
    danger: "#EF4444",
};

export const SettingsSection = () => {
  const { colors, mode, toggle } = useThemeMode();
  const isLight = mode === "light";
  const { enabled: pushEnabled, setEnabled: setPushEnabled, loading: notificationsLoading } = useNotificationsSettings();
  const router = useRouter();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showDevicePermissions, setShowDevicePermissions] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const { user } = useUser();
  const [accountEditing, setAccountEditing] = useState(false);
  const [accountDeleteVisible, setAccountDeleteVisible] = useState(false);

  // --- DÉBUT AJOUT ABONNEMENT ---
  const [showSubscriptionDetails, setShowSubscriptionDetails] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  // Charger l'abonnement quand l'utilisateur est détecté
  useEffect(() => {
    if (user) fetchSubscription();
  }, [user]);

  async function fetchSubscription() {
    if (!user) return;
    setLoadingSubscription(true);
    try {
      // On cherche un abonnement actif ou en essai
      const q = query(
        collection(db, "customers", user.uid, "subscriptions"),
        where("status", "in", ["active", "trialing"]),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const subData = querySnapshot.docs[0].data();
        setSubscription(subData);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.log("Erreur chargement abonnement:", error);
    } finally {
      setLoadingSubscription(false);
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    // Conversion du timestamp Firestore en date lisible
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("fr-FR");
  };

  const handleManageSubscription = () => {
    // Lien vers le portail client Stripe (Remplacez par votre lien si vous en avez un fixe, sinon redirige vers Stripe global)
    // Idéalement, utilisez votre lien "Customer Portal" trouvable dans le Dashboard Stripe > Paramètres > Portail client
    const portalUrl = "https://billing.stripe.com/p/login/test"; 
    
    Alert.alert(
      "Gérer l'abonnement",
      "Pour annuler ou modifier votre abonnement, vous devez accéder au portail sécurisé Stripe.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Accéder au portail", onPress: () => Linking.openURL(portalUrl) }
      ]
    );
  };
  // --- FIN AJOUT ABONNEMENT ---

  // Account edit states
  const [editingFirstName, setEditingFirstName] = useState("");
  const [editingLastName, setEditingLastName] = useState("");
  const [editingPostal, setEditingPostal] = useState("");
  const [editingBirth, setEditingBirth] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [k: string]: boolean }>({});

  useEffect(() => {
    if (!user) return;
    setEditingFirstName(user.firstName ?? "");
    setEditingLastName(user.lastName ?? "");
    setEditingPostal(user.postalCode ?? "");
    setEditingBirth(user.birthDate ?? "");
  }, [user]);

  function validateBelgianPostal(code: string) {
    if (!code || typeof code !== "string") return false;
    const digits = code.trim();
    if (!/^\d{4}$/.test(digits)) return false;
    const n = parseInt(digits, 10);
    if (n < 1000 || n > 9999) return false;
    return true;
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

  async function saveAccountChanges() {
    if (!user) return;
    const errors: { [k: string]: boolean } = {};
    if (!editingFirstName || editingFirstName.trim().length < 2) errors.firstName = true;
    if (!editingLastName || editingLastName.trim().length < 2) errors.lastName = true;
    if (!validateBelgianPostal(editingPostal)) errors.postal = true;
    if (!validateBirthDate(editingBirth)) errors.birthDate = true;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingAccount(true);
    try {
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, {
        firstName: editingFirstName.trim(),
        lastName: editingLastName.trim(),
        postalCode: editingPostal.trim(),
        birthDate: editingBirth.trim(),
        updatedAt: new Date(),
      });
      Alert.alert("Profil mis à jour", "Vos informations ont été enregistrées.");
      setAccountEditing(false);
      setShowAccountDetails(false);
    } catch (err) {
      console.warn("Failed to update profile", err);
      Alert.alert("Erreur", "Impossible de mettre à jour le profil. Réessayez plus tard.");
    } finally {
      setSavingAccount(false);
    }
  }

  async function handleDeleteAccount() {
    // Open modal confirmation (handled below)
    setAccountDeleteVisible(true);
  }

  async function performDeleteAccount() {
    if (!auth.currentUser || !user) {
      Alert.alert("Erreur", "Utilisateur non connecté.");
      return;
    }

    const uid = user.uid;
    try {
      // 1) Delete user's proofs (storage + firestore)
      try {
        const pq = query(collection(db, "preuves"), where("userId", "==", uid));
        const ps = await getDocs(pq);
        for (const d of ps.docs) {
          const pid = d.id;
          try {
            const imgRef = storageRef(storage, `preuves/${pid}/image.jpg`);
            await deleteObject(imgRef);
          } catch (e) {
            // ignore missing files
          }
          try { await deleteDoc(doc(db, "preuves", pid)); } catch(e) { /* ignore */ }
        }
      } catch (e) {
        console.warn("Error deleting proofs:", e);
      }

      // 2) Delete user's subcollections: friends, friendRequests
      try {
        const friendsSnap = await getDocs(collection(db, "users", uid, "friends"));
        for (const f of friendsSnap.docs) {
          try { await deleteDoc(doc(db, "users", uid, "friends", f.id)); } catch (e) {}
        }
      } catch (e) {}
      try {
        const reqSnap = await getDocs(collection(db, "users", uid, "friendRequests"));
        for (const r of reqSnap.docs) {
          try { await deleteDoc(doc(db, "users", uid, "friendRequests", r.id)); } catch (e) {}
        }
      } catch (e) {}

      // 3) Delete customer checkout sessions under customers/{uid}/checkout_sessions
      try {
        const csSnap = await getDocs(collection(db, "customers", uid, "checkout_sessions"));
        for (const s of csSnap.docs) {
          try { await deleteDoc(doc(db, "customers", uid, "checkout_sessions", s.id)); } catch (e) {}
        }
      } catch (e) {}

      // 4) Delete user document
      try { await deleteDoc(doc(db, "users", uid)); } catch (e) { console.warn("delete user doc", e); }

      // 5) Delete Firebase Auth user
      try {
        await auth.currentUser.delete();
      } catch (err: any) {
        console.warn("Auth deletion error", err);
        if (err && err.code && err.code.includes("requires-recent-login")) {
          Alert.alert("Action requise", "Pour supprimer votre compte, reconnectez-vous puis réessayez. Réauthentifiez-vous et réessayez la suppression.");
          return;
        } else {
          Alert.alert("Erreur", "Impossible de supprimer l'utilisateur. Contactez contact@greenup-app.com");
          return;
        }
      }

      try { await auth.signOut(); } catch(e){}
      Alert.alert("Compte supprimé", "Votre compte et vos données ont été supprimés.");
      try { router.replace("/login"); } catch(e){}
    } catch (e) {
      console.error("Account deletion failed", e);
      Alert.alert("Erreur", "La suppression a échoué. Réessayez plus tard.");
    } finally {
      setAccountDeleteVisible(false);
    }
  }

  const [email, setEmail] = useState(false);
  const [sound, setSound] = useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const perm = await Camera.getCameraPermissionsAsync();
        if (!mounted) return;
        setCameraEnabled(perm.status === "granted");
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      Alert.alert("Error", "Could not log out. Please try again.");
    }
  };

  // Couleurs dynamiques pour le rendu
  const titleColor = isLight ? settingsTheme.textMain : colors.text;
  const mutedColor = isLight ? settingsTheme.textMuted : colors.mutedText;
  const accentColor = isLight ? settingsTheme.accent : colors.accent;

  // Wrapper conditionnel (Gradient si Light, View si Dark)
  const Wrapper = isLight ? LinearGradient : View;
  const wrapperProps = isLight 
    ? { 
        colors: settingsTheme.glassBg, 
        start: { x: 0, y: 0 }, 
        end: { x: 1, y: 1 }, 
        style: [styles.container, styles.glassEffect] 
      }
    : { 
        style: [styles.container, { backgroundColor: "rgba(0, 151, 178, 0.1)", borderColor: "rgba(0,151,178,0.2)", borderWidth: 1 }] 
      };

  return (
    <View style={styles.gradientWrapper}>
      <Wrapper {...(wrapperProps as any)}>
        
        {/* --- AUTORISATIONS --- */}
        <TouchableOpacity style={styles.row} onPress={() => setShowDevicePermissions(!showDevicePermissions)} activeOpacity={0.7}>
          <View style={[styles.iconBox, { backgroundColor: isLight ? "#E0F7EF" : "rgba(255,255,255,0.1)" }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={accentColor} />
          </View>
          <Text style={[styles.text, { color: titleColor }]}>Autorisations de l'appareil</Text>
          <Ionicons name={showDevicePermissions ? "chevron-down" : "chevron-forward"} size={18} color={mutedColor} />
        </TouchableOpacity>

        {showDevicePermissions && (
          <View style={styles.subMenu}>
            <SettingSwitch
              label="Notifications (système)"
              value={pushEnabled}
              onValueChange={async (next) => {
                await setPushEnabled(next); 
              }}
              disabled={notificationsLoading}
            />
            <SettingSwitch
              label="Caméra"
              value={cameraEnabled}
              onValueChange={async (next) => {
                setCameraLoading(true);
                try {
                  if (next) {
                    const { status } = await Camera.requestCameraPermissionsAsync();
                    if (status === 'granted') setCameraEnabled(true);
                    else Alert.alert('Permission requise', "Activez la caméra dans les réglages.", [{ text: 'Réglages', onPress: () => Linking.openSettings() }, { text: 'OK' }]);
                  } else {
                    setCameraEnabled(false);
                    Alert.alert('Info', "Désactivez la caméra dans les réglages.", [{ text: 'Réglages', onPress: () => Linking.openSettings() }, { text: 'OK' }]);
                  }
                } catch (err) { console.warn(err); } finally { setCameraLoading(false); }
              }}
              disabled={cameraLoading}
            />
          </View>
        )}

        {/* --- THEME --- */}
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: isLight ? "#E0F7EF" : "rgba(255,255,255,0.1)" }]}>
            <Ionicons name="moon-outline" size={20} color={accentColor} />
          </View>
          <Text style={[styles.text, { color: titleColor }]}>Thème sombre</Text>
          <Switch
            value={mode === "dark"}
            onValueChange={toggle}
            thumbColor={mode === "dark" ? "#f5f5f5" : "#fff"}
            trackColor={{ false: "#E2E8F0", true: accentColor }}
          />
        </View>

        {/* --- PARAMETRES --- */}
        <TouchableOpacity style={styles.row} onPress={() => setShowSettings(!showSettings)} activeOpacity={0.7}>
          <View style={[styles.iconBox, { backgroundColor: isLight ? "#E0F7EF" : "rgba(255,255,255,0.1)" }]}>
            <Ionicons name="settings-outline" size={20} color={accentColor} />
          </View>
          <Text style={[styles.text, { color: titleColor }]}>Paramètres</Text>
          <Ionicons name={showSettings ? "chevron-down" : "chevron-forward"} size={18} color={mutedColor} />
        </TouchableOpacity>

        {showSettings && (
          <View style={styles.subMenu}>
            {/* 1. COMPTE */}
            <TouchableOpacity style={styles.subRow} activeOpacity={0.8} onPress={() => setShowAccountDetails(!showAccountDetails)}>
              <View style={styles.subRowLeft}>
                <Text style={[styles.subText, { color: titleColor }]}>Compte</Text>
              </View>
              <Ionicons name={showAccountDetails ? "chevron-down" : "chevron-forward"} size={16} color={mutedColor} />
            </TouchableOpacity>

            {showAccountDetails && (
              <View style={styles.detailsContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ fontSize: 14, fontFamily: FontFamilies.heading, color: titleColor }}>Infos personnelles</Text>
                  <TouchableOpacity onPress={() => setAccountEditing(!accountEditing)}>
                    <Text style={{ color: accentColor, fontWeight: '700', fontSize: 13 }}>{accountEditing ? "Annuler" : "Modifier"}</Text>
                  </TouchableOpacity>
                </View>

                {!accountEditing ? (
                  // VUE LECTURE
                  <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: mutedColor, fontSize: 13 }}>Nom</Text>
                        <Text style={{ color: titleColor, fontWeight: '600', fontSize: 13 }}>{user?.lastName} {user?.firstName}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: mutedColor, fontSize: 13 }}>Né(e) le</Text>
                        <Text style={{ color: titleColor, fontWeight: '600', fontSize: 13 }}>{user?.birthDate}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: mutedColor, fontSize: 13 }}>Code postal</Text>
                        <Text style={{ color: titleColor, fontWeight: '600', fontSize: 13 }}>{user?.postalCode}</Text>
                    </View>
                  </View>
                ) : (
                  // VUE EDITION
                  <View style={{ gap: 10 }}>
                    <TextInput 
                        value={editingLastName} onChangeText={setEditingLastName} placeholder="Nom" 
                        style={[styles.inputInline, { color: titleColor, backgroundColor: isLight ? "#FFF" : "rgba(0,0,0,0.2)" }]} placeholderTextColor={mutedColor} 
                    />
                    <TextInput 
                        value={editingFirstName} onChangeText={setEditingFirstName} placeholder="Prénom" 
                        style={[styles.inputInline, { color: titleColor, backgroundColor: isLight ? "#FFF" : "rgba(0,0,0,0.2)" }]} placeholderTextColor={mutedColor} 
                    />
                    <TextInput 
                        value={editingBirth} onChangeText={(t) => setEditingBirth(formatBirthInput(t))} placeholder="JJ/MM/AAAA" keyboardType="numeric" maxLength={10}
                        style={[styles.inputInline, { color: titleColor, backgroundColor: isLight ? "#FFF" : "rgba(0,0,0,0.2)" }]} placeholderTextColor={mutedColor} 
                    />
                    <TextInput 
                        value={editingPostal} onChangeText={setEditingPostal} placeholder="Code postal" keyboardType="numeric" maxLength={4}
                        style={[styles.inputInline, { color: titleColor, backgroundColor: isLight ? "#FFF" : "rgba(0,0,0,0.2)" }]} placeholderTextColor={mutedColor} 
                    />
                    
                    <TouchableOpacity onPress={saveAccountChanges} style={[styles.saveBtn, { backgroundColor: accentColor }]}>
                        {savingAccount ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveBtnText}>Enregistrer</Text>}
                    </TouchableOpacity>
                  </View>
                )}

                <View style={{ height: 1, backgroundColor: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.1)", marginVertical: 12 }} />

                <TouchableOpacity onPress={() => router.push("/change-password")} style={{ paddingVertical: 6 }}>
                    <Text style={{ color: titleColor, fontSize: 13 }}>Modifier mot de passe</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setAccountDeleteVisible(true)} style={{ paddingVertical: 6 }}>
                    <Text style={{ color: settingsTheme.danger, fontSize: 13 }}>Supprimer mon compte</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 2. ABONNEMENT */}
            <TouchableOpacity style={styles.subRow} activeOpacity={0.8} onPress={() => setShowSubscriptionDetails(!showSubscriptionDetails)}>
              <View style={styles.subRowLeft}>
                <Text style={[styles.subText, { color: titleColor }]}>Abonnement</Text>
              </View>
              <Ionicons name={showSubscriptionDetails ? "chevron-down" : "chevron-forward"} size={16} color={mutedColor} />
            </TouchableOpacity>

            {showSubscriptionDetails && (
              <View style={styles.detailsContainer}>
                {loadingSubscription ? (
                  <ActivityIndicator color={accentColor} size="small" />
                ) : subscription ? (
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ color: mutedColor, fontSize: 13 }}>Statut</Text>
                        <Text style={{ color: accentColor, fontWeight: '700', fontSize: 13, textTransform: 'capitalize' }}>
                            {subscription.status === 'trialing' ? 'Essai Gratuit' : 'Actif'}
                        </Text>
                    </View>
                    {subscription.cancel_at_period_end ? (
                        <Text style={{ color: settingsTheme.danger, fontSize: 12, fontStyle: 'italic' }}>Arrêt prévu le {formatDate(subscription.current_period_end)}</Text>
                    ) : (
                        <TouchableOpacity onPress={handleManageSubscription} style={{ marginTop: 8 }}>
                            <Text style={{ color: settingsTheme.danger, fontSize: 13, textDecorationLine: 'underline' }}>Gérer / Annuler</Text>
                        </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <Text style={{ color: mutedColor, fontSize: 13, fontStyle: 'italic' }}>Aucun abonnement actif.</Text>
                )}
              </View>
            )}

            {/* 3. LIENS LEGAUX */}
            <TouchableOpacity style={styles.subRow} onPress={() => router.push("/conditions-generales")}>
              <Text style={[styles.subText, { color: titleColor }]}>Conditions Générales</Text>
              <Ionicons name="chevron-forward" size={16} color={mutedColor} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.subRow} onPress={() => router.push("/mentions-legales")}>
              <Text style={[styles.subText, { color: titleColor }]}>Mentions Légales</Text>
              <Ionicons name="chevron-forward" size={16} color={mutedColor} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.subRow} onPress={() => router.push("/politique-de-confidentialite")}>
              <Text style={[styles.subText, { color: titleColor }]}>Politique de confidentialité</Text>
              <Ionicons name="chevron-forward" size={16} color={mutedColor} />
            </TouchableOpacity>
          </View>
        )}

        {/* --- LOGOUT --- */}
        <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={handleLogout} activeOpacity={0.7}>
          <View style={[styles.iconBox, { backgroundColor: isLight ? "#FEF2F2" : "rgba(239,68,68,0.1)" }]}>
            <Ionicons name="log-out-outline" size={20} color={settingsTheme.danger} />
          </View>
          <Text style={[styles.text, { color: settingsTheme.danger }]}>Se déconnecter</Text>
        </TouchableOpacity>
      </Wrapper>

      {/* --- MODAL SUPPRESSION COMPTE --- */}
      {accountDeleteVisible && (
        <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: isLight ? "#FFF" : colors.surface }]}> 
                <Text style={[styles.modalTitle, { color: titleColor }]}>Supprimer mon compte</Text>
                <Text style={{ color: mutedColor, marginTop: 6, marginBottom: 20 }}>
                Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.
                </Text>
                <View style={styles.modalButtons}>
                <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: isLight ? "#F3F4F6" : "#333" }]}
                    onPress={() => setAccountDeleteVisible(false)}
                >
                    <Text style={{ color: titleColor, fontWeight: '700' }}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: settingsTheme.danger }]}
                    onPress={performDeleteAccount}
                >
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Supprimer</Text>
                </TouchableOpacity>
                </View>
            </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  gradientWrapper: {
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20
  },
  container: {
    borderRadius: 24,
    overflow: "hidden",
    paddingVertical: 4
  },
  glassEffect: {
    borderWidth: 1,
    borderColor: settingsTheme.borderColor,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  iconBox: {
      width: 36, height: 36, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center',
      marginRight: 12
  },
  text: { flex: 1, fontWeight: "600", fontSize: 15, fontFamily: FontFamilies.headingMedium },
  
  // Sous-menus
  subMenu: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: "rgba(0,0,0,0.02)"
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)"
  },
  subRowLeft: { flexDirection: "row", alignItems: "center" },
  subText: { fontSize: 14, fontFamily: FontFamilies.body, marginLeft: 4, fontWeight: '500' },
  
  // Containers détails (Abo / Compte)
  detailsContainer: {
      padding: 14,
      backgroundColor: "rgba(0,0,0,0.03)",
      borderRadius: 16,
      marginTop: 4,
      marginBottom: 8
  },
  inputInline: {
      borderWidth: 1, borderColor: "rgba(0,0,0,0.1)",
      borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
      fontSize: 13, fontFamily: FontFamilies.body
  },
  saveBtn: {
      paddingVertical: 10, borderRadius: 12, alignItems: 'center', marginTop: 4
  },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  // Modal
  modalOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  modalCard: { width: '85%', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontFamily: FontFamilies.heading, fontWeight: '700' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
});
