import { AdminNav } from "@/components/ui/(admin)/AdminNav";
import { db } from "@/firebaseConfig";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function NewDefiScreen() {
  const { user } = useUser();
  const { colors } = useThemeMode();
  const router = useRouter();

  const { id } = useLocalSearchParams<{ id?: string }>(); // ← Detect edit mode
  const isEditing = Boolean(id);

  // 🛡️ Block non-admin
  if (!user.isAdmin) return <Redirect href="/acceuil" />;

  // FORM STATE
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [categorie, setCategorie] = useState<"personnel" | "club">("personnel");
  const [duree, setDuree] = useState<1 | 7>(1);
  const [points, setPoints] = useState("");
  const [statut, setStatut] = useState<"inactive" | "rotation">("inactive");
  const [preuve, setPreuve] = useState("");
  const [difficulte, setDifficulte] = useState<"facile" | "moyen" | "difficile">("facile");

  // 🟦 Auto rules
  const handleCategoryChange = (c: "personnel" | "club") => {
    setCategorie(c);
    setDuree(c === "personnel" ? 1 : 7);
  };

  const handleDifficultyChange = (d: "facile" | "moyen" | "difficile") => {
    setDifficulte(d);
    setPoints(d === "facile" ? "25" : d === "moyen" ? "50" : "100");
  };

  // 🟩 LOAD DATA WHEN EDITING
  const loadForEdit = async () => {
    if (!id) return;
    const ref = doc(db, "defis", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();

    setTitre(data.titre);
    setDescription(data.description);
    setCategorie(data.categorie);
    setDuree(data.duree);
    setPoints(String(data.points));
    setStatut(data.statut);
    setPreuve(data.preuve || "");
    setDifficulte(data.difficulte || "facile");
  };

  useEffect(() => {
    if (isEditing) loadForEdit();
  }, [id]);

  // 🟩 SUBMIT
  const handleSubmit = async () => {
    try {
      const payload = {
        titre,
        description,
        categorie,
        duree,
        points: Number(points),
        statut,
        preuve,
        difficulte,
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
      };

      if (isEditing && id) {
        // UPDATE MODE
        await updateDoc(doc(db, "defis", id), payload);
      } else {
        // CREATE MODE
        await addDoc(collection(db, "defis"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      router.push("/(admin)/list-defis");
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 140,
        }}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          {isEditing ? "Modifier le défi" : "Créer un nouveau défi"}
        </Text>

        {/* Titre */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.label, { color: colors.mutedText }]}>Titre du défi</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.mutedText }]}
            value={titre}
            onChangeText={setTitre}
            placeholder="Ex : Recycler des bouteilles"
            placeholderTextColor={colors.mutedText}
          />

          {/* Description */}
          <Text style={[styles.label, { color: colors.mutedText }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline, { color: colors.text, borderColor: colors.mutedText }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Décris le défi"
            placeholderTextColor={colors.mutedText}
            multiline
          />

          {/* Catégorie */}
          <Text style={[styles.label, { color: colors.mutedText }]}>Catégorie</Text>
          <View style={styles.row}>
            {(["personnel", "club"] as const).map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => handleCategoryChange(c)}
                style={[
                  styles.selector,
                  {
                    backgroundColor: categorie === c ? colors.accent : "transparent",
                    borderColor: colors.accent,
                  },
                ]}
              >
                <Text style={{ color: categorie === c ? "#fff" : colors.mutedText }}>
                  {c === "personnel" ? "Personnel" : "Club"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Durée */}
          <Text style={[styles.label, { color: colors.mutedText }]}>Durée</Text>
          <View style={[styles.selectorDisabled, { borderColor: colors.mutedText + "55" }]}>
            <Text style={{ color: colors.mutedText }}>
              {duree === 1 ? "1 jour" : "7 jours (club)"}
            </Text>
          </View>

          {/* Difficulté */}
          <Text style={[styles.label, { color: colors.mutedText }]}>Difficulté</Text>
          <View style={styles.row}>
            {(["facile", "moyen", "difficile"] as const).map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => handleDifficultyChange(d)}
                style={[
                  styles.selector,
                  {
                    backgroundColor: difficulte === d ? colors.accent : "transparent",
                    borderColor: colors.accent,
                  },
                ]}
              >
                <Text style={{ color: difficulte === d ? "#fff" : colors.mutedText }}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Points */}
          <Text style={[styles.label, { color: colors.mutedText }]}>Points</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.mutedText }]}
            value={points}
            editable={false}
          />

          {/* Statut */}
          <Text style={[styles.label, { color: colors.mutedText }]}>Statut</Text>
          <View style={styles.row}>
            {(["inactive", "rotation"] as const).map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setStatut(s)}
                style={[
                  styles.selector,
                  {
                    backgroundColor: statut === s ? colors.accent : "transparent",
                    borderColor: colors.accent,
                  },
                ]}
              >
                <Text style={{ color: statut === s ? "#fff" : colors.mutedText }}>
                  {s === "inactive" ? "Inactif" : "En rotation"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Preuve */}
          <Text style={[styles.label, { color: colors.mutedText }]}>Instruction pour la preuve</Text>
          <TextInput
            style={[styles.input, styles.multiline, { color: colors.text, borderColor: colors.mutedText }]}
            value={preuve}
            onChangeText={setPreuve}
            multiline
            placeholder="Ex : Photo des bouteilles triées"
            placeholderTextColor={colors.mutedText}
          />
        </View>

        {/* SUBMIT */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent }]}
          onPress={handleSubmit}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
            {isEditing ? "Modifier le défi" : "Créer le défi"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <AdminNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: "700" },
  label: { marginTop: 16, marginBottom: 4, fontWeight: "600" },
  card: { padding: 18, borderRadius: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 12 },
  selector: { flex: 1, padding: 12, borderWidth: 1, borderRadius: 12, alignItems: "center" },
  selectorDisabled: { padding: 12, borderWidth: 1, borderRadius: 12 },
  button: { marginTop: 20, padding: 16, borderRadius: 14, alignItems: "center" },
});
