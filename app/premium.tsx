import { PremiumCard } from "@/components/ui/recompenses/PremiumCard";
import { db } from "@/firebaseConfig";
import { useUser } from "@/hooks/user-context";
import * as Linking from 'expo-linking';
import { addDoc, collection, doc, getDocs, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

export default function PremiumScreen() {
  const { user, refreshUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  // 1. ÉCOUTE AUTOMATIQUE (Pour mettre à jour dès que le paiement arrive)
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "customers", user.uid, "payments"), 
      where("status", "==", "succeeded")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty) {
        console.log("✅ PAIEMENT DÉTECTÉ AUTOMATIQUEMENT");
        if (!user.isPremium) {
          setChecking(true);
          await activatePremium(snapshot.docs[0].id);
          setChecking(false);
        }
      }
    });

    return () => unsubscribe();
  }, [user?.uid, user?.isPremium]);

  // Fonction utilitaire pour activer le premium
  const activatePremium = async (paymentId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        isPremium: true,
        premiumSince: new Date().toISOString(),
        lastPaymentId: paymentId
      });
      if (refreshUser) await refreshUser();
      Alert.alert("Félicitations !", "Compte mis à jour en Premium.");
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubscribe = async () => {
    if (loading || !user) return;
    setLoading(true);

    console.log("👇 CLIC SUR S'ABONNER - DÉBUT DES VÉRIFICATIONS");

    // --- VÉRIFICATION DE SÉCURITÉ AVANT REDIRECTION ---

    // 1. Vérification locale
    if (user.isPremium) {
      console.log("🚫 STOP : Utilisateur déjà Premium (Local)");
      Alert.alert("Déjà abonné", "Vous êtes déjà membre Premium ! Pas besoin de payer à nouveau.");
      setLoading(false);
      return; // ON ARRÊTE TOUT ICI
    }

    // 2. Vérification Serveur (Double sécurité)
    try {
      console.log("🔍 Vérification en base de données...");
      const q = query(
        collection(db, "customers", user.uid, "payments"), 
        where("status", "==", "succeeded")
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        console.log("🚫 STOP : Paiement trouvé en base (Serveur)");
        // On a trouvé un paiement, on répare le compte au lieu de faire payer
        await activatePremium(snapshot.docs[0].id);
        Alert.alert("Déjà payé", "Nous avons retrouvé votre paiement. Votre compte a été restauré sans nouveau débit.");
        setLoading(false);
        return; // ON ARRÊTE TOUT ICI
      }
    } catch (e) {
      console.log("Erreur vérification pré-paiement (on continue quand même):", e);
    }

    console.log("🚀 AUCUN PAIEMENT TROUVÉ -> LANCEMENT DE STRIPE");

    // --- LANCEMENT DU PAIEMENT (Si on arrive ici, c'est qu'on n'est vraiment pas Premium) ---
    try {
      const docRef = await addDoc(collection(db, "customers", user.uid, "checkout_sessions"), {
        price: "price_1QXXXXXXXXXXXXXX", // 🔴 REMETTEZ VOTRE ID DE PRIX
        success_url: Linking.createURL("success"),
        cancel_url: Linking.createURL("cancel"),
        mode: "payment" 
      });

      onSnapshot(docRef, (snap) => {
        const { url, error } = snap.data() || {};
        if (error) {
          Alert.alert("Erreur", error.message);
          setLoading(false);
        }
        if (url) {
          console.log("🔗 Redirection vers :", url);
          Linking.openURL(url);
          setLoading(false);
        }
      });
    } catch (error: any) {
      console.error(error);
      Alert.alert("Erreur", "Impossible de lancer le paiement.");
      setLoading(false);
    }
  };

  // --- UI ---

  if (user?.isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.successCard}>
          <Text style={styles.emoji}>✨</Text>
          <Text style={styles.successTitle}>Vous êtes Premium !</Text>
          <Text style={styles.successText}>Merci pour votre soutien.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {checking && (
        <View style={{ marginBottom: 20, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#15803D" />
          <Text style={{ marginTop: 8, color: '#666' }}>Activation en cours...</Text>
        </View>
      )}
      <PremiumCard onSubscribe={handleSubscribe} />
      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, justifyContent: 'center' },
  successCard: { backgroundColor: '#DCFCE7', padding: 30, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: '#86EFAC' },
  emoji: { fontSize: 40, marginBottom: 10 },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: '#14532D', marginBottom: 10 },
  successText: { textAlign: 'center', color: '#166534', lineHeight: 20 }
});