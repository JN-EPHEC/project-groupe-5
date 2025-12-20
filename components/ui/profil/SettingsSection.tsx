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

  const gradientColors = isLight
    ? ([colors.glass, colors.glass] as const)
    : (["rgba(0, 151, 178, 0.2)", "rgba(0, 151, 178, 0.05)"] as const);
  const cardBackground = isLight ? colors.glass : "rgba(0, 151, 178, 0.1)";
  const titleColor = isLight ? colors.cardText : colors.text;
  const mutedColor = isLight ? colors.cardMuted : colors.mutedText;
  const dividerColor = isLight ? colors.glassBorder : "rgba(0, 151, 178, 0.2)";

  return (
    <View
      style={[styles.gradientWrapper, { shadowColor: colors.accent }]}
    >
      <View
        style={[styles.container, { backgroundColor: cardBackground, borderColor: dividerColor, borderWidth: 1 }]}
      >
        {/* (Notifications section removed per request) */}

        {/* Device permissions */}
        <TouchableOpacity style={[styles.row, { borderColor: dividerColor }]} onPress={() => setShowDevicePermissions(!showDevicePermissions)} activeOpacity={0.85}>
          <Ionicons name="shield-checkmark-outline" size={22} color={titleColor} />
          <Text style={[styles.text, { color: titleColor }]}>Autorisations de l'appareil</Text>
          <Ionicons
            name={showDevicePermissions ? "chevron-down" : "chevron-forward"}
            size={18}
            color={mutedColor}
          />
        </TouchableOpacity>

        {showDevicePermissions && (
          <View style={[styles.subMenu, { backgroundColor: isLight ? colors.cardAlt : colors.cardAlt }]}>
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
                    if (status === 'granted') {
                      setCameraEnabled(true);
                    } else {
                      setCameraEnabled(false);
                      Alert.alert(
                        'Permission caméra',
                        "Autorise l'accès à la caméra dans les réglages de ton appareil pour utiliser cette fonctionnalité.",
                        [
                          { text: 'Ouvrir réglages', onPress: () => Linking.openSettings() },
                          { text: 'Fermer', style: 'cancel' },
                        ]
                      );
                    }
                  } else {
                    // Cannot programmatically revoke; guide user to settings
                    setCameraEnabled(false);
                    Alert.alert(
                      'Désactiver la caméra',
                      "Pour révoquer l'accès à la caméra, ouvre les réglages de ton appareil.",
                      [
                        { text: 'Ouvrir réglages', onPress: () => Linking.openSettings() },
                        { text: 'Fermer', style: 'cancel' },
                      ]
                    );
                  }
                } catch (err) {
                  console.warn('Camera permission error', err);
                } finally {
                  setCameraLoading(false);
                }
              }}
              disabled={cameraLoading}
            />
          </View>
        )}
        {/* Theme */}
        <View style={[styles.row, { borderColor: dividerColor }]}>
          <Ionicons name="moon-outline" size={22} color={titleColor} />
          <Text style={[styles.text, { color: titleColor }]}>Thème sombre</Text>
          <Switch
            value={mode === "dark"}
            onValueChange={toggle}
            thumbColor={mode === "dark" ? "#f5f5f5" : "#f3f4f6"}
            trackColor={{ false: isLight ? "rgba(255,255,255,0.25)" : "#3f3f46", true: colors.accent }}
          />
        </View>


        {/* Settings */}
        <TouchableOpacity style={[styles.row, { borderColor: dividerColor }]} onPress={() => setShowSettings(!showSettings)} activeOpacity={0.85}>
          <Ionicons name="settings-outline" size={22} color={titleColor} />
          <Text style={[styles.text, { color: titleColor }]}>Paramètres</Text>
          <Ionicons
            name={showSettings ? "chevron-down" : "chevron-forward"}
            size={18}
            color={mutedColor}
          />
        </TouchableOpacity>

        {showSettings && (
          <View
            style={[
              styles.subMenu,
              { backgroundColor: isLight ? colors.cardAlt : colors.cardAlt },
            ]}
          >
            <TouchableOpacity style={styles.subRow} activeOpacity={0.8} onPress={() => setShowAccountDetails(!showAccountDetails)}>
              <View style={styles.subRowLeft}>
                <Ionicons name="person-circle-outline" size={20} color={mutedColor} style={{ marginRight: 10 }} />
                <Text style={[styles.subText, { color: titleColor }]}>Compte</Text>
              </View>
              <Ionicons name={showAccountDetails ? "chevron-down" : "chevron-forward"} size={16} color={mutedColor} />
            </TouchableOpacity>

            {showAccountDetails && (
              <View style={{ paddingLeft: 8, paddingVertical: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 }}>
                  <Text style={[{ fontSize: 15, fontFamily: FontFamilies.heading, marginBottom: 6, color: titleColor }]}>Informations personnelles</Text>
                  {!accountEditing ? (
                    <TouchableOpacity onPress={() => setAccountEditing(true)} style={{ padding: 6 }}>
                      <Text style={{ color: colors.accent, fontFamily: FontFamilies.bodyStrong }}>Modifier</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => setAccountEditing(false)} style={{ padding: 6 }}>
                      <Text style={{ color: colors.mutedText, fontFamily: FontFamilies.body }}>Annuler</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={{ paddingHorizontal: 8, marginTop: 6 }}>
                  {!accountEditing ? (
                    <View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                        <Text style={{ color: mutedColor }}>Nom</Text>
                        <Text style={{ color: titleColor }}>{user?.lastName ?? ""}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                        <Text style={{ color: mutedColor }}>Prénom</Text>
                        <Text style={{ color: titleColor }}>{user?.firstName ?? ""}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                        <Text style={{ color: mutedColor }}>Date de naissance</Text>
                        <Text style={{ color: titleColor }}>{user?.birthDate ?? ""}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                        <Text style={{ color: mutedColor }}>Code postal</Text>
                        <Text style={{ color: titleColor }}>{user?.postalCode ?? ""}</Text>
                      </View>
                    </View>
                  ) : (
                    <View>
                      <Text style={[styles.fieldLabel, { color: titleColor }]}>Nom</Text>
                      <TextInput
                        value={editingLastName}
                        onChangeText={(t) => { setEditingLastName(t); setFieldErrors((s) => ({ ...s, lastName: false })); }}
                        style={[styles.inputInline, fieldErrors.lastName && { borderColor: "#FF4D4F" }]}
                        placeholder="Nom"
                        placeholderTextColor={isLight ? colors.cardMuted : colors.mutedText}
                      />

                      <Text style={[styles.fieldLabel, { color: titleColor, marginTop: 8 }]}>Prénom</Text>
                      <TextInput
                        value={editingFirstName}
                        onChangeText={(t) => { setEditingFirstName(t); setFieldErrors((s) => ({ ...s, firstName: false })); }}
                        style={[styles.inputInline, fieldErrors.firstName && { borderColor: "#FF4D4F" }]}
                        placeholder="Prénom"
                        placeholderTextColor={isLight ? colors.cardMuted : colors.mutedText}
                      />

                      <Text style={[styles.fieldLabel, { color: titleColor, marginTop: 8 }]}>Date de naissance (JJ/MM/AAAA)</Text>
                      <TextInput
                        value={editingBirth}
                        onChangeText={(t) => { const f = formatBirthInput(t); setEditingBirth(f); setFieldErrors((s) => ({ ...s, birthDate: false })); }}
                        style={[styles.inputInline, fieldErrors.birthDate && { borderColor: "#FF4D4F" }]}
                        placeholder="JJ/MM/AAAA"
                        placeholderTextColor={isLight ? colors.cardMuted : colors.mutedText}
                        keyboardType="numeric"
                      />

                      <Text style={[styles.fieldLabel, { color: titleColor, marginTop: 8 }]}>Code postal</Text>
                      <TextInput
                        value={editingPostal}
                        onChangeText={(t) => { setEditingPostal(t); setFieldErrors((s) => ({ ...s, postal: false })); }}
                        style={[styles.inputInline, fieldErrors.postal && { borderColor: "#FF4D4F" }]}
                        placeholder="Code postal"
                        placeholderTextColor={isLight ? colors.cardMuted : colors.mutedText}
                        keyboardType="numeric"
                      />

                      <View style={{ marginTop: 12, flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={saveAccountChanges} disabled={savingAccount}>
                          {savingAccount ? <ActivityIndicator color="#fff" /> : <Text style={[styles.saveBtnText]}>Enregistrer</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.cancelBtn]} onPress={() => {
                          // revert
                          setEditingFirstName(user?.firstName ?? "");
                          setEditingLastName(user?.lastName ?? "");
                          setEditingPostal(user?.postalCode ?? "");
                          setEditingBirth(user?.birthDate ?? "");
                          setFieldErrors({});
                          setAccountEditing(false);
                        }}>
                          <Text style={[styles.cancelBtnText]}>Annuler</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>

                <TouchableOpacity style={styles.subRow} activeOpacity={0.8} onPress={() => router.push("/change-password")}>
                  <View style={styles.subRowLeft}>
                    <Text style={[styles.subText, { color: titleColor }]}>Modifier mot de passe</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={mutedColor} />
                </TouchableOpacity>
                {accountDeleteVisible && (
                  <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: colors.surface }]}> 
                      <Text style={[styles.modalTitle, { color: colors.text }]}>Supprimer mon compte</Text>
                      <Text style={{ color: colors.mutedText, marginTop: 6 }}>
                        Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.
                      </Text>
                      <View style={styles.modalButtons}>
                        <TouchableOpacity
                          style={[styles.modalBtn, { backgroundColor: colors.accent }]}
                          onPress={() => setAccountDeleteVisible(false)}
                        >
                          <Text style={{ color: '#0F3327', fontFamily: FontFamilies.heading }}>Rester</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.modalBtn, { backgroundColor: '#D93636' }]}
                          onPress={performDeleteAccount}
                        >
                          <Text style={{ color: '#fff', fontFamily: FontFamilies.heading }}>Supprimer</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                <TouchableOpacity style={styles.subRow} activeOpacity={0.8} onPress={() => setAccountDeleteVisible(true)}>
                  <View style={styles.subRowLeft}>
                    <Text style={[styles.subText, { color: "#F26767" }]}>Supprimer mon compte</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* --- DÉBUT SECTION ABONNEMENT --- */}
            <TouchableOpacity 
              style={styles.subRow} 
              activeOpacity={0.8} 
              onPress={() => setShowSubscriptionDetails(!showSubscriptionDetails)}
            >
              <View style={styles.subRowLeft}>
                <Ionicons name="card-outline" size={20} color={mutedColor} style={{ marginRight: 10 }} />
                <Text style={[styles.subText, { color: titleColor }]}>Abonnement</Text>
              </View>
              <Ionicons name={showSubscriptionDetails ? "chevron-down" : "chevron-forward"} size={16} color={mutedColor} />
            </TouchableOpacity>

            {showSubscriptionDetails && (
              <View style={{ paddingLeft: 16, paddingRight: 8, paddingVertical: 12, borderLeftWidth: 2, borderLeftColor: colors.accent, marginLeft: 10, marginBottom: 10 }}>
                {loadingSubscription ? (
                  <ActivityIndicator color={colors.accent} size="small" />
                ) : subscription ? (
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ color: mutedColor, fontFamily: FontFamilies.body }}>Statut</Text>
                        <Text style={{ color: colors.accent, fontFamily: FontFamilies.bodyStrong, textTransform: 'capitalize' }}>
                            {subscription.status === 'trialing' ? 'Essai Gratuit' : 'Actif'}
                        </Text>
                    </View>
                    
                    {subscription.cancel_at_period_end ? (
                        <Text style={{ color: '#F26767', fontSize: 13, marginBottom: 10, fontFamily: FontFamilies.body, fontStyle: 'italic' }}>
                            Arrêt prévu le {formatDate(subscription.current_period_end)}
                        </Text>
                    ) : (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                            <Text style={{ color: mutedColor, fontFamily: FontFamilies.body }}>Renouvellement</Text>
                            <Text style={{ color: titleColor, fontFamily: FontFamilies.body }}>
                                {formatDate(subscription.current_period_end)}
                            </Text>
                        </View>
                    )}

                    {!subscription.cancel_at_period_end && (
                        <TouchableOpacity 
                            style={{ backgroundColor: 'rgba(242, 103, 103, 0.1)', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 4, borderWidth: 1, borderColor: 'rgba(242, 103, 103, 0.3)' }}
                            onPress={handleManageSubscription}
                        >
                            <Text style={{ color: '#F26767', fontFamily: FontFamilies.bodyStrong, fontSize: 14 }}>
                                Annuler l'abonnement
                            </Text>
                        </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View>
                    <Text style={{ color: mutedColor, fontFamily: FontFamilies.body, fontStyle: 'italic' }}>Aucun abonnement actif.</Text>
                  </View>
                )}
              </View>
            )}
            {/* --- FIN SECTION ABONNEMENT --- */}

            <TouchableOpacity style={styles.subRow} activeOpacity={0.8} onPress={() => router.push("/conditions-generales")}>
              <View style={styles.subRowLeft}>
                <Ionicons name="document-text-outline" size={20} color={mutedColor} style={{ marginRight: 10 }} />
                <Text style={[styles.subText, { color: titleColor }]}>Conditions Générales</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={mutedColor} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.subRow} activeOpacity={0.8} onPress={() => router.push("/mentions-legales")}>
              <View style={styles.subRowLeft}>
                <Ionicons name="information-circle-outline" size={20} color={mutedColor} style={{ marginRight: 10 }} />
                <Text style={[styles.subText, { color: titleColor }]}>Mentions Légales</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={mutedColor} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.subRow} activeOpacity={0.8} onPress={() => router.push("/politique-de-confidentialite")}>
              <View style={styles.subRowLeft}>
                <Ionicons name="shield-checkmark-outline" size={20} color={mutedColor} style={{ marginRight: 10 }} />
                <Text style={[styles.subText, { color: titleColor }]}>Politique de confidentialité</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={mutedColor} />
            </TouchableOpacity>
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity
          style={[styles.row, styles.logoutRow]}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Ionicons name="exit-outline" size={22} color="#F26767" />
          <Text style={[styles.text, { color: "#F26767" }]}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gradientWrapper: {
    marginTop: 12,
    borderRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  container: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    paddingBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: "transparent",
  },
  text: { marginLeft: 10, flex: 1, fontFamily: FontFamilies.headingMedium, fontSize: 16 },
  subMenu: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  subRowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  langOption: { paddingVertical: 6 },
  langText: { fontSize: 14, fontFamily: FontFamilies.bodyRegular },
  subText: { fontSize: 14, fontFamily: FontFamilies.body },
  logoutRow: { borderBottomWidth: 0 },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  inputInline: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6, fontFamily: FontFamilies.body },
  saveBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#ccc', marginLeft: 8 },
  cancelBtnText: { fontWeight: '700' },
  modalOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '88%', borderRadius: 14, padding: 16 },
  modalTitle: { fontSize: 18, fontFamily: FontFamilies.heading, marginBottom: 8 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 10 },
  modalBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
});
