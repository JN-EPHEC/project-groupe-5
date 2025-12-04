import { auth, db } from "@/firebaseConfig";
import { useThemeMode } from "@/hooks/theme-context";
import { searchUsers, sendFriendRequest } from "@/services/friends";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function AmisPlusScreen() {
  const { colors } = useThemeMode();
  const router = useRouter();

  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [myFriendIds, setMyFriendIds] = useState<Record<string, true>>({});
  const [requested, setRequested] = useState<Record<string, true>>({});

  // Live friends to disable the button when already friends
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
      console.log(e);
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Amis +</Text>
      </View>

      <Text style={{ color: colors.mutedText, marginBottom: 14 }}>
        Invite tes amis ou découvre de nouveaux profils à suivre.
      </Text>

      {/* SEARCH BAR */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surfaceAlt }]}>
        <TextInput
          placeholder="Recherche..."
          placeholderTextColor={colors.mutedText}
          value={searchText}
          onChangeText={setSearchText}
          style={[styles.searchInput, { color: colors.text }]}
        />
        <TouchableOpacity
          onPress={handleSearch}
          style={[styles.searchBtn, { backgroundColor: colors.accent }]}
        >
          <Text style={{ color: "#0F3327", fontWeight: "700" }}>Chercher</Text>
        </TouchableOpacity>
      </View>

      {/* RESULTS */}
      {loading && <Text style={{ color: colors.mutedText }}>Recherche en cours...</Text>}

      <FlatList
        style={{ marginTop: 10 }}
        data={results}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ color: colors.mutedText }}>Aucun utilisateur.</Text>
          ) : null
        }
        renderItem={({ item }) => {
          return (
            <View
              style={[
                styles.resultRow,
                { backgroundColor: colors.surface },
              ]}
            >
              <View>
                <Text style={{ color: colors.text, fontWeight: "700" }}>
                  {item.username || item.firstName || "Utilisateur"}
                </Text>
                <Text style={{ color: colors.mutedText }}>{item.email}</Text>
              </View>

              {item.id !== auth.currentUser?.uid && (
                <TouchableOpacity
                  disabled={!!myFriendIds[item.id] || !!requested[item.id]}
                  onPress={() => handleAddFriend(item.id)}
                  style={[
                    styles.addBtn,
                    { backgroundColor: (!!myFriendIds[item.id] || !!requested[item.id]) ? colors.surfaceAlt : colors.accent },
                  ]}
                >
                  <Text style={{ color: (!!myFriendIds[item.id] || !!requested[item.id]) ? colors.mutedText : "#0F3327", fontWeight: "700" }}>
                    {myFriendIds[item.id] ? "Amis" : requested[item.id] ? "Demandé" : "Ajouter"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "700" },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 16,
    marginBottom: 10,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, fontWeight: "600" },

  searchBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginLeft: 8,
  },

  resultRow: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  addBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
});
