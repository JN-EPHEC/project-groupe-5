import { auth, db } from "@/firebaseConfig";
import { useThemeMode } from "@/hooks/theme-context";
import * as Linking from "expo-linking";
import { addDoc, collection, onSnapshot } from "firebase/firestore";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function DonationBanner() {
  const { colors } = useThemeMode();
  const [amount, setAmount] = useState<number>(10);
  const [editing, setEditing] = useState(false);

  const step = 5;
  const cycle = (delta: number) => setAmount((a) => Math.max(1, a + delta));

  const handleCustomChange = (txt: string) => {
    const v = parseInt(txt.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(v)) setAmount(Math.max(1, v));
  };

  const makeDonation = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Erreur", "Tu dois être connecté.");
      return;
    }

    try {
      console.log("🔥 Création du don dans Firestore…");

      const sessionRef = await addDoc(
        collection(db, "customers", user.uid, "checkout_sessions"),
        {
          // Utiliser Checkout web pour obtenir une URL à ouvrir
          client: "web",
          mode: "payment",
          amount: amount * 100, // montant en CENTIMES
          currency: "eur",
          success_url: "https://example.com/success",
          cancel_url: "https://example.com/cancel",
        }
      );

      const unsub = onSnapshot(sessionRef, (snap) => {
        const data = snap.data();
        if (!data) return;

        console.log("📡 Don Stripe ->", data);

        if (data.error) {
          Alert.alert("Erreur Stripe", data.error.message);
        }

        if (data.url) {
          console.log("🌍 Ouverture de Stripe Checkout :", data.url);
          Linking.openURL(data.url);
          unsub();
        }
      });
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Impossible de créer le don.");
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Soutenir des projets écologiques
      </Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>
        Chaque don finance directement les actions locales partenaires.
      </Text>

      <View style={styles.adjustRow}>
        <TouchableOpacity
          style={[styles.circleBtn, { borderColor: colors.surfaceAlt }]}
          onPress={() => cycle(-step)}
        >
          <Text style={[styles.circleText, { color: colors.text }]}>−</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setEditing(true)}>
          {editing ? (
            <TextInput
              autoFocus
              keyboardType="numeric"
              value={String(amount)}
              onChangeText={handleCustomChange}
              onBlur={() => setEditing(false)}
              style={[styles.amountInput, { color: colors.text }]}
            />
          ) : (
            <Text style={[styles.amountText, { color: colors.text }]}>
              {amount}€
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.circleBtn, { borderColor: colors.surfaceAlt }]}
          onPress={() => cycle(step)}
        >
          <Text style={[styles.circleText, { color: colors.text }]}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.donateBtn, { backgroundColor: colors.accent }]}
        onPress={makeDonation}
      >
        <Text style={styles.donateText}>Faire un don de {amount}€</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 12, marginTop: 12 },
  title: { fontSize: 18, fontWeight: "800", marginBottom: 6, textAlign: "center" },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  adjustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  circleText: { fontSize: 20, fontWeight: "700" },
  amountText: { fontSize: 26, fontWeight: "800" },
  amountInput: { fontSize: 26, fontWeight: "800", minWidth: 80, textAlign: "center" },
  donateBtn: { borderRadius: 18, paddingVertical: 10, alignItems: "center" },
  donateText: { fontSize: 16, fontWeight: "800", color: "#0F3327" },
});
