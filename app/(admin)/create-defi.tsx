import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function NewDefiScreen() {
  const { user } = useUser();
  const { colors } = useThemeMode();
  const router = useRouter();

  // 🛡️ Block non-admin users
  if (!user.isAdmin) return <Redirect href="/acceuil" />;

  // 🧩 FORM STATE
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [categorie, setCategorie] = useState<"personnel" | "club">("personnel");
  const [duree, setDuree] = useState<"1d" | "7d">("1d"); // auto-updated
  const [points, setPoints] = useState("");
  const [statut, setStatut] = useState<"inactive" | "rotation">("inactive");
  const [preuve, setPreuve] = useState("");

  // Auto-update duration when category changes
  const handleCategoryChange = (c: "personnel" | "club") => {
    setCategorie(c);
    if (c === "personnel") setDuree("1d");
    if (c === "club") setDuree("7d");
  };

  // ✔ For now: UI only — submit does nothing (no Firestore yet)
  const handleSubmit = () => {
    console.log("Défi créé:", {
      titre,
      description,
      categorie,
      duree,
      points: Number(points),
      statut,
      preuve,
    });

    alert("Défi (UI) créé ! (backend pas encore connecté)");
    router.push("/(admin)/list-defis");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text style={[styles.title, { color: colors.text }]}>Créer un nouveau défi</Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>
        Configurez un défi que les utilisateurs pourront relever.
      </Text>

      {/* 🟩 Titre */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.label, { color: colors.mutedText }]}>Titre du défi</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.mutedText }]}
          placeholder="ex: Recycler 3 bouteilles"
          placeholderTextColor={colors.mutedText}
          value={titre}
          onChangeText={setTitre}
        />

        {/* 🟩 Description */}
        <Text style={[styles.label, { color: colors.mutedText }]}>Description</Text>
        <TextInput
          style={[
            styles.input,
            styles.multiline,
            { color: colors.text, borderColor: colors.mutedText },
          ]}
          placeholder="ex: Prenez une photo de votre geste"
          placeholderTextColor={colors.mutedText}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        {/* 🟩 Catégorie */}
        <Text style={[styles.label, { color: colors.mutedText }]}>Catégorie</Text>
        <View style={styles.row}>
          <TouchableOpacity
            onPress={() => handleCategoryChange("personnel")}
            style={[
              styles.selector,
              {
                backgroundColor:
                  categorie === "personnel" ? colors.accent : "transparent",
                borderColor: colors.accent,
              },
            ]}
          >
            <Text
              style={{
                color: categorie === "personnel" ? "#fff" : colors.mutedText,
              }}
            >
              Personnel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleCategoryChange("club")}
            style={[
              styles.selector,
              {
                backgroundColor:
                  categorie === "club" ? colors.accent : "transparent",
                borderColor: colors.accent,
              },
            ]}
          >
            <Text
              style={{
                color: categorie === "club" ? "#fff" : colors.mutedText,
              }}
            >
              Club
            </Text>
          </TouchableOpacity>
        </View>

        {/* 🟩 Durée (auto) */}
        <Text style={[styles.label, { color: colors.mutedText }]}>Durée</Text>
        <View
          style={[
            styles.selectorDisabled,
            { borderColor: colors.mutedText + "55" },
          ]}
        >
          <Text style={{ color: colors.mutedText }}>
            {duree === "1d" ? "1 jour" : "7 jours (club)"}
          </Text>
        </View>

        {/* 🟩 Points */}
        <Text style={[styles.label, { color: colors.mutedText }]}>Points</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.mutedText }]}
          keyboardType="numeric"
          value={points}
          onChangeText={setPoints}
          placeholder="ex: 20"
          placeholderTextColor={colors.mutedText}
        />

        {/* 🟩 Statut */}
        <Text style={[styles.label, { color: colors.mutedText }]}>Statut</Text>
        <View style={styles.row}>
          <TouchableOpacity
            onPress={() => setStatut("inactive")}
            style={[
              styles.selector,
              {
                backgroundColor:
                  statut === "inactive" ? colors.accent : "transparent",
                borderColor: colors.accent,
              },
            ]}
          >
            <Text
              style={{
                color: statut === "inactive" ? "#fff" : colors.mutedText,
              }}
            >
              Inactif
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setStatut("rotation")}
            style={[
              styles.selector,
              {
                backgroundColor:
                  statut === "rotation" ? colors.accent : "transparent",
                borderColor: colors.accent,
              },
            ]}
          >
            <Text
              style={{
                color: statut === "rotation" ? "#fff" : colors.mutedText,
              }}
            >
              En rotation
            </Text>
          </TouchableOpacity>
        </View>

        {/* 🟩 Preuve requise */}
        <Text style={[styles.label, { color: colors.mutedText }]}>
          Instruction pour la preuve
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.multiline,
            { color: colors.text, borderColor: colors.mutedText },
          ]}
          placeholder="ex: Photo montrant les bouteilles triées"
          placeholderTextColor={colors.mutedText}
          multiline
          value={preuve}
          onChangeText={setPreuve}
        />
      </View>

      {/* 🟩 Create button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.accent }]}
        onPress={handleSubmit}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
          Créer le défi
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { marginTop: 6, marginBottom: 20 },
  label: { marginTop: 16, marginBottom: 4, fontWeight: "600" },
  card: { padding: 18, borderRadius: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  row: { flexDirection: "row", gap: 12 },
  selector: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
  },
  selectorDisabled: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  button: {
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
});
