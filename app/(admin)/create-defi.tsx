import { AdminNav } from "@/components/ui/(admin)/AdminNav";
import { FontFamilies } from "@/constants/fonts";
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

// 🎨 THEME ADMIN FORM
const formTheme = {
    bgGradient: ["#F9FAFB", "#F3F4F6"] as const,
    glassCardBg: ["#FFFFFF", "rgba(255, 255, 255, 0.8)"] as const,
    borderColor: "rgba(0, 0, 0, 0.05)",
    textMain: "#111827",
    textMuted: "#6B7280",
    accent: "#008F6B",
    inputBg: "#F9FAFB",
};

export default function NewDefiScreen() {
  const { user } = useUser();
  const { colors, theme } = useThemeMode();
  const router = useRouter();
  const isDark = theme === "dark";

  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);

  // ✅ CORRECTION ICI : On vérifie d'abord si 'user' existe
  if (!user || !user.isAdmin) return <Redirect href="/acceuil" />;

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
        createdBy: user.uid, // TypeScript sait maintenant que user n'est pas null
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

  // Couleurs dynamiques
  const titleColor = isDark ? "#FFF" : formTheme.textMain;
  const mutedColor = isDark ? "#9CA3AF" : formTheme.textMuted;
  const cardBorder = isDark ? "rgba(255,255,255,0.1)" : formTheme.borderColor;
  const bgColors = isDark ? [colors.background, "#1F2937"] : formTheme.bgGradient;
  const inputBackground = isDark ? "rgba(255,255,255,0.05)" : formTheme.inputBg;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* FOND */}
      <LinearGradient
        colors={bgColors as any}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <View style={styles.headerContainer}>
        {/* Bouton retour personnalisé pour cohérence */}
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#FFF" }]}>
            <Ionicons name="arrow-back" size={20} color={titleColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: titleColor }]}>
          {isEditing ? "Modifier Défi" : "Nouveau Défi"}
        </Text>
        <View style={{ width: 40 }} /> 
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* CARD PRINCIPALE */}
          <View style={[styles.card, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFF", borderColor: cardBorder }]}>
            
            {/* TITRE */}
            <Text style={[styles.label, { color: mutedColor }]}>TITRE DU DÉFI</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, borderColor: cardBorder, color: titleColor }]}
              value={titre}
              onChangeText={setTitre}
              placeholder="Ex : Recycler des bouteilles"
              placeholderTextColor={mutedColor}
            />

            {/* DESCRIPTION */}
            <Text style={[styles.label, { color: mutedColor }]}>DESCRIPTION</Text>
            <TextInput
              style={[styles.input, styles.multiline, { backgroundColor: inputBackground, borderColor: cardBorder, color: titleColor }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Explique ce qu'il faut faire..."
              placeholderTextColor={mutedColor}
              multiline
            />

            {/* CATÉGORIE (TABS) */}
            <Text style={[styles.label, { color: mutedColor }]}>TYPE DE DÉFI</Text>
            <View style={styles.row}>
              {(["personnel", "club"] as const).map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => handleCategoryChange(c)}
                  style={[
                    styles.selector,
                    { 
                        backgroundColor: categorie === c ? formTheme.accent : inputBackground,
                        borderColor: categorie === c ? formTheme.accent : cardBorder
                    }
                  ]}
                >
                  <Text style={{ 
                    color: categorie === c ? "#fff" : mutedColor,
                    fontWeight: categorie === c ? "700" : "400",
                    fontSize: 13
                  }}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* INFO DURÉE AUTO */}
            <View style={[styles.infoBox, { backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "#F0FDF4" }]}>
               <Ionicons name="time-outline" size={16} color={formTheme.accent} />
               <Text style={{ color: formTheme.accent, fontSize: 12, fontWeight: '500' }}>
                 Durée : {duree === 1 ? "1 jour (Quotidien)" : "7 jours (Hebdomadaire)"}
               </Text>
            </View>

            {/* DIFFICULTÉ */}
            <Text style={[styles.label, { color: mutedColor, marginTop: 16 }]}>DIFFICULTÉ</Text>
            <View style={styles.row}>
              {(["facile", "moyen", "difficile"] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => handleDifficultyChange(d)}
                  style={[
                    styles.selector,
                    { 
                        backgroundColor: difficulte === d ? formTheme.accent : inputBackground,
                        borderColor: difficulte === d ? formTheme.accent : cardBorder
                    }
                  ]}
                >
                  <Text style={{ 
                    color: difficulte === d ? "#fff" : mutedColor,
                    fontWeight: difficulte === d ? "700" : "400",
                    fontSize: 12,
                    textTransform: 'capitalize'
                  }}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* POINTS & STATUT */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: mutedColor }]}>POINTS</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: inputBackground, borderColor: cardBorder, color: titleColor, textAlign: 'center', fontWeight: 'bold' }]}
                        value={points}
                        editable={false}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: mutedColor }]}>STATUT</Text>
                    <TouchableOpacity 
                        onPress={() => setStatut(statut === 'rotation' ? 'inactive' : 'rotation')}
                        style={[
                            styles.input, 
                            { 
                                justifyContent: 'center', alignItems: 'center', 
                                backgroundColor: statut === 'rotation' ? "#DCFCE7" : "#F3F4F6",
                                borderColor: statut === 'rotation' ? "#86EFAC" : cardBorder
                            }
                        ]}
                    >
                        <Text style={{ color: statut === 'rotation' ? '#15803D' : '#6B7280', fontWeight: '700', fontSize: 12, textTransform: 'uppercase' }}>
                            {statut === "rotation" ? "ACTIF" : "OFF"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* PREUVE */}
            <Text style={[styles.label, { color: mutedColor }]}>PREUVE REQUISE (Optionnel)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, borderColor: cardBorder, color: titleColor }]}
              value={preuve}
              onChangeText={setPreuve}
              placeholder="Ex : Photo avant/après"
              placeholderTextColor={mutedColor}
            />

          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: formTheme.accent }]}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitText}>
              {isEditing ? "ENREGISTRER" : "CRÉER LE DÉFI"}
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
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: FontFamilies.heading,
  },
  backBtn: {
      padding: 8,
      borderRadius: 12,
      shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
  },
  card: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontFamily: FontFamilies.body
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: FontFamilies.body
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
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  infoBox: {
    marginTop: 16,
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  submitButton: {
    marginTop: 30,
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  submitText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 1,
    fontFamily: FontFamilies.heading
  },
});