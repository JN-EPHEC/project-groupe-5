import { useFriends } from "@/hooks/friends-context";
import { useSubscriptions } from "@/hooks/subscriptions-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Suggestion = {
  id: string;
  name: string;
  handle: string;
  city: string;
};

const SUGGESTIONS: Suggestion[] = [
  { id: "s1", name: "Léa Martin", handle: "@leaverte", city: "Bruxelles" },
  { id: "s2", name: "Arthur Dubois", handle: "@arthurcycle", city: "Liège" },
  { id: "s3", name: "Inès B.", handle: "@ineszero", city: "Namur" },
  { id: "s4", name: "Yanis", handle: "@yanis.eco", city: "LLN" },
  { id: "s5", name: "Camille", handle: "@camille.green", city: "Charleroi" },
];

function avatarForSuggestion(id: string): string {
  const map: Record<string, string> = {
    s1: "https://randomuser.me/api/portraits/women/68.jpg",
    s2: "https://randomuser.me/api/portraits/men/75.jpg",
    s3: "https://randomuser.me/api/portraits/women/45.jpg",
    s4: "https://randomuser.me/api/portraits/men/40.jpg",
    s5: "https://randomuser.me/api/portraits/women/24.jpg",
  };
  return map[id] || "https://randomuser.me/api/portraits/lego/1.jpg";
}

export default function AmisPlusScreen() {
  const { colors } = useThemeMode();
  const router = useRouter();
  const { addFriend, isFriend } = useFriends();
  const { follow } = useSubscriptions();
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => SUGGESTIONS.filter((p) => `${p.name} ${p.handle}`.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>Amis +</Text>
      </View>

      <Text style={{ color: colors.mutedText, marginBottom: 12 }}>
        Inviter tes amis ou découvre de nouveaux profils à suivre.
      </Text>

      <View style={[styles.inputWrap, { borderColor: colors.accent }]}> 
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Nom ou @handle"
          placeholderTextColor={colors.mutedText}
          style={{ color: colors.text, paddingHorizontal: 12, paddingVertical: 10, flex: 1 }}
        />
      </View>

      <TouchableOpacity style={[styles.searchBtn, { backgroundColor: colors.accent }]} onPress={() => { /* no-op, live filter */ }}>
        <Text style={{ color: "#0F3327", fontWeight: "800" }}>Chercher</Text>
      </TouchableOpacity>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 160 }}
        renderItem={({ item }) => {
          const already = isFriend(item.id);
          return (
            <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.surfaceAlt }]}> 
              <Image source={{ uri: avatarForSuggestion(item.id) }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "700", marginBottom: 2 }}>{item.name}</Text>
                <Text style={{ color: colors.mutedText }}>{item.handle} • {item.city}</Text>
              </View>
              <TouchableOpacity
                disabled={already}
                onPress={() => {
                  addFriend({ id: item.id, name: item.name, points: 400 + Math.floor(Math.random() * 300), online: Math.random() > 0.5, avatar: avatarForSuggestion(item.id) });
                  follow({ id: item.id, name: item.name, avatar: avatarForSuggestion(item.id) });
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.accent,
                  opacity: already ? 0.6 : 1,
                }}
              >
                <Text style={{ color: colors.accent, fontWeight: "700" }}>{already ? "Ajouté" : "S'abonner"}</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  inputWrap: {
    borderWidth: 2,
    borderRadius: 18,
    marginTop: 6,
  },
  searchBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
    marginVertical: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
});
