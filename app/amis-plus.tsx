import { FontFamilies } from "@/constants/fonts";
import { auth, db } from "@/firebaseConfig";
import { useThemeMode } from "@/hooks/theme-context";
import { searchUsers, sendFriendRequest } from "@/services/friends";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 🎨 THEME AMIS+
const theme = {
    bgGradient: ["#DDF7E8", "#F4FDF9"] as const,
    glassCardBg: ["rgba(240, 253, 244, 0.95)", "rgba(255, 255, 255, 0.85)"] as const,
    glassBorder: "rgba(255, 255, 255, 0.6)",
    textMain: "#0A3F33",
    textMuted: "#4A665F",
    accentCoral: "#FF8C66",
};

export default function AmisPlusScreen() {
  const { colors, mode } = useThemeMode();
  const router = useRouter();
  const isLight = mode === "light";

  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [myFriendIds, setMyFriendIds] = useState<Record<string, true>>({});
  const [requested, setRequested] = useState<Record<string, true>>({});

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const unsub = onSnapshot(collection(db, "users", uid, "friends"), (snap) => {
      const ids: Record<string, true> = {};
      snap.docs.forEach((d) => { ids[d.id] = true; });
      setMyFriendIds(ids);
    });
    return () => unsub();
  }, []);

  async function handleSearch() {
    if (searchText.trim().length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const users = await searchUsers(searchText.trim());
      setResults(users);
    } catch (e) {
      console.log("search err", e);
      Alert.alert("Erreur", "Impossible de rechercher les utilisateurs.");
    }
    setLoading(false);
  }

  async function handleAddFriend(targetId: string) {
    try {
      await sendFriendRequest(targetId);
      Alert.alert("Demande envoyée !");
      setRequested((prev) => ({ ...prev, [targetId]: true }));
    } catch (e: any) {
      if (String(e?.message || "").includes("Demande déjà envoyée")) {
        setRequested((prev) => ({ ...prev, [targetId]: true }));
        Alert.alert("Info", "Demande déjà envoyée.");
      } else if (String(e?.message || "").includes("déjà amis")) {
        Alert.alert("Info", "Vous êtes déjà amis.");
      } else {
        Alert.alert("Erreur", e.message || "Impossible d’envoyer la demande.");
      }
    }
  }

  const BackgroundComponent = isLight ? LinearGradient : View;
  const bgProps = isLight 
    ? { colors: theme.bgGradient, style: StyleSheet.absoluteFill } 
    : { style: [StyleSheet.absoluteFill, { backgroundColor: "#021114" }] };

  return (
    <View style={{ flex: 1 }}>
      <BackgroundComponent {...(bgProps as any)} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={isLight ? theme.textMain : colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: isLight ? theme.textMain : colors.text }]}>Amis +</Text>
            </View>

            <Text style={{ color: isLight ? theme.textMuted : colors.mutedText, marginBottom: 14 }}>
                Invite tes amis ou découvre de nouveaux profils à suivre.
            </Text>

            {/* SEARCH BAR (Glassmorphism) */}
            <LinearGradient
                colors={isLight ? theme.glassCardBg : ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.searchContainer, { borderColor: isLight ? theme.glassBorder : "rgba(255,255,255,0.1)", borderWidth: 1 }]}
            >
                <TextInput
                    placeholder="Recherche..."
                    placeholderTextColor={isLight ? theme.textMuted : colors.mutedText}
                    value={searchText}
                    onChangeText={setSearchText}
                    style={[styles.searchInput, { color: isLight ? theme.textMain : colors.text }]}
                />
                <TouchableOpacity
                    onPress={handleSearch}
                    style={[styles.searchBtn, { backgroundColor: isLight ? theme.accentCoral : colors.accent }]}
                >
                    <Text style={{ color: "#FFF", fontWeight: "700" }}>Chercher</Text>
                </TouchableOpacity>
            </LinearGradient>

            {/* RESULTS */}
            {loading && <Text style={{ color: isLight ? theme.textMuted : colors.mutedText }}>Recherche en cours...</Text>}

            <FlatList
                style={{ marginTop: 10 }}
                data={results}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                    !loading ? (
                    <Text style={{ color: isLight ? theme.textMuted : colors.mutedText }}>Aucun utilisateur.</Text>
                    ) : null
                }
                renderItem={({ item }) => {
                    const isAdded = !!myFriendIds[item.id];
                    const isRequested = !!requested[item.id];
                    
                    return (
                    <LinearGradient
                        colors={isLight ? theme.glassCardBg : ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.02)"]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={[styles.resultRow, { borderColor: isLight ? theme.glassBorder : "transparent", borderWidth: 1 }]}
                    >
                        <View>
                            <Text style={{ color: isLight ? theme.textMain : colors.text, fontWeight: "700", fontSize: 16 }}>
                                {item.username || item.firstName || "Utilisateur"}
                            </Text>
                            <Text style={{ color: isLight ? theme.textMuted : colors.mutedText, fontSize: 12 }}>{item.email}</Text>
                        </View>

                        {item.id !== auth.currentUser?.uid && (
                        <TouchableOpacity
                            disabled={isAdded || isRequested}
                            onPress={() => handleAddFriend(item.id)}
                            style={[
                                styles.addBtn,
                                { backgroundColor: (isAdded || isRequested) ? (isLight ? "#E0F7EF" : colors.surfaceAlt) : (isLight ? "#008F6B" : colors.accent) },
                            ]}
                        >
                            <Text style={{ color: (isAdded || isRequested) ? (isLight ? theme.textMuted : colors.mutedText) : "#FFF", fontWeight: "700" }}>
                                {isAdded ? "Amis" : isRequested ? "Demandé" : "Ajouter"}
                            </Text>
                        </TouchableOpacity>
                        )}
                    </LinearGradient>
                    );
                }}
            />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "700", fontFamily: FontFamilies.heading, marginLeft: 10 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    borderRadius: 16,
    marginBottom: 10,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: "600", height: 40 },

  searchBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginLeft: 8,
  },

  resultRow: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  addBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
});