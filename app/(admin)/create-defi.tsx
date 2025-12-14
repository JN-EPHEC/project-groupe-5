import { AdminNav } from "@/components/ui/(admin)/AdminNav";
import { db } from "@/firebaseConfig";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function NewDefiScreen() {
  const { user } = useUser();
  const { colors, theme } = useThemeMode();
  const router = useRouter();
  const isDark = theme === "dark";

  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);

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

  // LOGIC
  const handleCategoryChange = (c: "personnel" | "club") => {
    setCategorie(c);
    setDuree(c === "personnel" ? 1 : 7);
  };

  const handleDifficultyChange = (d: "facile" | "moyen" | "difficile") => {
    setDifficulte(d);
    setPoints(d === "facile" ? "25" : d === "moyen" ? "50" : "100");
  };

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
        await updateDoc(doc(db, "defis", id), payload);
      } else {
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

  // STYLES DYNAMIQUES
  const glassInputStyle = {
    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)",
    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.4)",
    color: colors.text
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* 🟢 BACKGROUND LIQUIDE */}
      <LinearGradient
        colors={isDark ? [colors.background, "#0f2027", "#203a43"] : ["#d1fae5", "#cffafe", "#ffffff"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEditing ? "Modifier" : "Nouveau Défi"}
        </Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* CARD PRINCIPALE */}
          <View style={[styles.glassCard, { 
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.5)" 
          }]}>
            
            {/* TITRE */}
            <Text style={[styles.label, { color: colors.mutedText }]}>TITRE DU DÉFI</Text>
            <TextInput
              style={[styles.input, glassInputStyle]}
              value={titre}
              onChangeText={setTitre}
              placeholder="Ex : Recycler des bouteilles"
              placeholderTextColor={colors.mutedText}
            />

            {/* DESCRIPTION */}
            <Text style={[styles.label, { color: colors.mutedText }]}>DESCRIPTION</Text>
            <TextInput
              style={[styles.input, styles.multiline, glassInputStyle]}
              value={description}
              onChangeText={setDescription}
              placeholder="Explique ce qu'il faut faire..."
              placeholderTextColor={colors.mutedText}
              multiline
            />

            {/* CATÉGORIE (TABS) */}
            <Text style={[styles.label, { color: colors.mutedText }]}>TYPE DE DÉFI</Text>
            <View style={styles.row}>
              {(["personnel", "club"] as const).map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => handleCategoryChange(c)}
                  style={[
                    styles.selector,
                    categorie === c ? { backgroundColor: colors.accent, borderColor: colors.accent } : glassInputStyle
                  ]}
                >
                  <Text style={{ 
                    color: categorie === c ? "#fff" : colors.mutedText,
                    fontWeight: categorie === c ? "700" : "400"
                  }}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* INFO DURÉE AUTO */}
            <View style={[styles.infoBox, { backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.03)" }]}>
               <Ionicons name="time-outline" size={16} color={colors.mutedText} />
               <Text style={{ color: colors.mutedText, fontSize: 12 }}>
                 Durée automatique : {duree === 1 ? "1 jour (Quotidien)" : "7 jours (Hebdomadaire)"}
               </Text>
            </View>

            {/* DIFFICULTÉ */}
            <Text style={[styles.label, { color: colors.mutedText, marginTop: 16 }]}>DIFFICULTÉ</Text>
            <View style={styles.row}>
              {(["facile", "moyen", "difficile"] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => handleDifficultyChange(d)}
                  style={[
                    styles.selector,
                    difficulte === d ? { backgroundColor: colors.accent, borderColor: colors.accent } : glassInputStyle
                  ]}
                >
                  <Text style={{ 
                    color: difficulte === d ? "#fff" : colors.mutedText,
                    fontWeight: difficulte === d ? "700" : "400",
                    fontSize: 12
                  }}>
                    {d.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* POINTS & PREUVE */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: colors.mutedText }]}>POINTS</Text>
                    <TextInput
                        style={[styles.input, glassInputStyle, { textAlign: 'center', fontWeight: 'bold' }]}
                        value={points}
                        editable={false}
                    />
                </View>
                <View style={{ flex: 2 }}>
                    <Text style={[styles.label, { color: colors.mutedText }]}>STATUT</Text>
                     <View style={styles.row}>
                        <TouchableOpacity 
                            onPress={() => setStatut(statut === 'rotation' ? 'inactive' : 'rotation')}
                            style={[
                                styles.input, 
                                glassInputStyle, 
                                { justifyContent: 'center', alignItems: 'center', backgroundColor: statut === 'rotation' ? colors.accent : glassInputStyle.backgroundColor }
                            ]}
                        >
                            <Text style={{ color: statut === 'rotation' ? '#fff' : colors.mutedText, fontWeight: '600' }}>
                                {statut === "rotation" ? "En Ligne" : "Inactif"}
                            </Text>
                        </TouchableOpacity>
                     </View>
                </View>
            </View>

            {/* PREUVE */}
            <Text style={[styles.label, { color: colors.mutedText }]}>PREUVE REQUISE</Text>
            <TextInput
              style={[styles.input, glassInputStyle]}
              value={preuve}
              onChangeText={setPreuve}
              placeholder="Ex : Photo avant/après"
              placeholderTextColor={colors.mutedText}
            />

          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.accent }]}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitText}>
              {isEditing ? "ENREGISTRER LES MODIFICATIONS" : "CRÉER LE DÉFI"}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      <AdminNav />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  glassCard: {
    padding: 24,
    borderRadius: 30,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.2)", // Base glass opacity
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  selector: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  infoBox: {
    marginTop: 10,
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    padding: 10,
    borderRadius: 12,
  },
  submitButton: {
    marginTop: 30,
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 1,
  },
});