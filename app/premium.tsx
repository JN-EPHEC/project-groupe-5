import { auth, db } from "@/firebaseConfig";
import * as Linking from "expo-linking";
import { addDoc, collection, onSnapshot } from "firebase/firestore";
import React from "react";
import { Alert, Button, View } from "react-native";

const PREMIUM_PRICE_ID = "price_1SZwHCCh6MpiIMZkbiSw63ty";

export default function PremiumScreen() {
  const startSubscription = async () => {
    console.log("👉 Bouton Premium pressé");

    const user = auth.currentUser;
    console.log("Utilisateur Firebase :", user?.uid);

    if (!user) {
      Alert.alert("Erreur", "Tu dois être connecté !");
      return;
    }

    try {
      console.log("📌 Création de checkout_sessions dans Firestore...");

      const sessionRef = await addDoc(
        collection(db, "customers", user.uid, "checkout_sessions"),
        {
          price: PREMIUM_PRICE_ID,
          mode: "subscription",
          success_url: "https://example.com/success",
          cancel_url: "https://example.com/cancel",
        }
      );

      console.log("🔥 Document Firestore créé :", sessionRef.id);

      onSnapshot(sessionRef, (snap) => {
        console.log("🔄 Snapshot Stripe :", snap.data());
        const data = snap.data();

        if (!data) return;

        if (data.error) {
          Alert.alert("Erreur Stripe", data.error.message);
        }

        if (data.url) {
          console.log("🌍 URL Checkout trouvée :", data.url);
          Linking.openURL(data.url);
        }
      });
    } catch (err: any) {
      console.error("💥 ERREUR :", err);
      Alert.alert("Erreur", err.message || "Une erreur est survenue.");
    }
  };

  return (
    <View style={{ marginTop: 40, padding: 20 }}>
      <Button title="Passer Premium (4,99€/mois)" onPress={startSubscription} />
    </View>
  );
}
