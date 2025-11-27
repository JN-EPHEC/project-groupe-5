import { db } from "@/firebaseConfig";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Defi = {
  id: string;
  titre: string;
  description: string;
  categorie: string;
  points: number;
  duree: number;
  statut: string;
};

export default function ListDefisScreen() {
  const { colors } = useThemeMode();
  const [defis, setDefis] = useState<Defi[]>([]);

  const loadData = async () => {
    const snap = await getDocs(collection(db, "defis"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Defi[];
    setDefis(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleStatut = async (id: string, statut: string) => {
    const newStatut =
      statut === "inactive" ? "rotation" : statut === "rotation" ? "active" : "inactive";

    await updateDoc(doc(db, "defis", id), { statut: newStatut });
    loadData();
  };

  const removeDefi = async (id: string) => {
    Alert.alert("Supprimer", "Voulez-vous vraiment supprimer ce défi ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "defis", id));
          loadData();
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Liste des défis</Text>

      {defis.map((d) => (
        <View key={d.id} style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{d.titre}</Text>
          <Text style={{ color: colors.mutedText }}>{d.categorie} • {d.points} pts</Text>
          <Text style={{ color: colors.mutedText }}>Statut : {d.statut}</Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.accent }]}
              onPress={() => toggleStatut(d.id, d.statut)}
            >
              <Ionicons name="sync-outline" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#B00020" }]}
              onPress={() => removeDefi(d.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 20 },
  card: {
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  row: { flexDirection: "row", marginTop: 14 },
  btn: {
    padding: 10,
    borderRadius: 12,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 45,
  },
});
