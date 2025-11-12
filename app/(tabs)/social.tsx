import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SocialScreen() {
  const { colors } = useThemeMode();
  const [selectedTab, setSelectedTab] = useState<"clubs" | "amis" | "defis">("clubs");
  const [view, setView] = useState<"main" | "chat">("main");
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  // --- Données Clubs ---
  const [clubs, setClubs] = useState([
    { id: "1", name: "Les Jardiniers Urbains", desc: "Cultive des potagers partagés en ville 🌱", participants: 42, joined: false },
    { id: "2", name: "Cyclistes Solidaires", desc: "Promouvoir la mobilité douce 🚲", participants: 18, joined: false },
    { id: "3", name: "Zéro Déchet", desc: "Réduire les emballages à usage unique ♻️", participants: 25, joined: false },
    { id: "4", name: "Marche Verte", desc: "Organisation de marches écologiques 🌍", participants: 60, joined: false },
    { id: "5", name: "Les Abeilles Libres", desc: "Protection des pollinisateurs 🐝", participants: 34, joined: false },
  ]);

  // --- Données Défis ---
  const [defis, setDefis] = useState([
    { id: "1", name: "Défi Vélo", desc: "Utiliser ton vélo au lieu de ta voiture pendant 7 jours 🚴‍♂️", places: 6, mode: "solo", joined: false },
    { id: "2", name: "Semaine Sans Plastique", desc: "Évite le plastique à usage unique toute la semaine 🌊", places: 8, mode: "équipe", joined: false },
    { id: "3", name: "Défi Compost", desc: "Transforme tes déchets organiques en compost 🍂", places: 5, mode: "solo", joined: false },
    { id: "4", name: "Marche pour la Planète", desc: "Participe à une marche écologique 🏃‍♀️", places: 12, mode: "équipe", joined: false },
    { id: "5", name: "Zéro Énergie", desc: "Réduis ta consommation d’électricité pendant 3 jours 💡", places: 10, mode: "solo", joined: false },
  ]);

  // --- Données Amis avec avatar et classement ---
  const amis = [
    { id: "1", name: "Sophie", points: 620, online: true, avatar: "https://randomuser.me/api/portraits/women/68.jpg" },
    { id: "2", name: "Lucas", points: 580, online: false, avatar: "https://randomuser.me/api/portraits/men/75.jpg" },
    { id: "3", name: "Emma", points: 560, online: true, avatar: "https://randomuser.me/api/portraits/women/45.jpg" },
    { id: "4", name: "Noah", points: 530, online: true, avatar: "https://randomuser.me/api/portraits/men/40.jpg" },
    { id: "5", name: "Clara", points: 480, online: false, avatar: "https://randomuser.me/api/portraits/women/24.jpg" },
    { id: "6", name: "Léo", points: 460, online: true, avatar: "https://randomuser.me/api/portraits/men/36.jpg" },
    { id: "7", name: "Mila", points: 440, online: false, avatar: "https://randomuser.me/api/portraits/women/65.jpg" },
    { id: "8", name: "Nathan", points: 410, online: true, avatar: "https://randomuser.me/api/portraits/men/52.jpg" },
    { id: "9", name: "Lina", points: 390, online: false, avatar: "https://randomuser.me/api/portraits/women/55.jpg" },
    { id: "10", name: "Ethan", points: 370, online: true, avatar: "https://randomuser.me/api/portraits/men/60.jpg" },
  ];

  // --- Envoi message ---
  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text: input, sender: "me" },
    ]);
    setInput("");
    Keyboard.dismiss();
  };

  // --- Interface Chat ---
  const renderChat = () => {
    if (!selectedChat) return null;
    return (
      <KeyboardAvoidingView
        style={[styles.chatContainer, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity onPress={() => setView("main")} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.header, { color: colors.text }]}>
          {selectedChat?.type === "club"
            ? `Salon ${selectedChat.name}`
            : `Chat avec ${selectedChat.name}`}
        </Text>

        {messages.length === 0 && (
          <Text style={[styles.emptyChat, { color: colors.mutedText }]}>Commencez la discussion 🌿</Text>
        )}

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onLongPress={() =>
                setMessages((prev) => prev.filter((m) => m.id !== item.id))
              }
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.messageBubble,
                  {
                    backgroundColor: item.sender === "me" ? colors.accent : colors.surfaceAlt,
                    alignSelf: item.sender === "me" ? "flex-end" : "flex-start",
                  },
                ]}
              >
                <Text style={[styles.messageText, { color: colors.text }]}>{item.text}</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingVertical: 10 }}
        />

        <View style={styles.inputContainer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Écrire un message..."
            placeholderTextColor={colors.mutedText}
            style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
            multiline
            blurOnSubmit={false}
          />
          <TouchableOpacity onPress={sendMessage} style={[styles.sendBtn, { backgroundColor: colors.accent }]}>
            <Ionicons name="send" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  // --- Interface principale ---
  const renderMain = () => (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Onglets */}
      <View style={styles.tabs}>
  {["clubs", "amis", "defis"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, { backgroundColor: selectedTab === tab ? colors.accent : colors.surfaceAlt }]}
            onPress={() => setSelectedTab(tab as any)}
          >
            <Text style={[styles.tabText, { color: selectedTab === tab ? colors.text : colors.mutedText }] }>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
  ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* --- Clubs --- */}
        {selectedTab === "clubs" &&
          clubs.map((club, i) => (
            <View key={club.id} style={[styles.card, { backgroundColor: colors.surface }] }>
              <Text style={[styles.title, { color: colors.text }]}>{club.name}</Text>
              <Text style={[styles.desc, { color: colors.mutedText }]}>{club.desc}</Text>
              <Text style={[styles.participants, { color: colors.mutedText }] }>
                👥 {club.participants} membres
              </Text>
              <View style={styles.row}>
                <TouchableOpacity
                  onPress={() => {
                    const updated = [...clubs];
                    updated[i].joined = !updated[i].joined;
                    updated[i].participants += updated[i].joined ? 1 : -1;
                    setClubs(updated);
                  }}
                  style={[styles.joinBtn, { backgroundColor: club.joined ? '#D93636' : colors.accent } ]}
                >
                  <Text style={[styles.joinText, { color: colors.text }] }>
                    {club.joined ? "Quitter ❌" : "Rejoindre"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chatBtn, { borderColor: colors.accent, backgroundColor: colors.pill }]}
                  onPress={() => {
                    setSelectedChat({ ...club, type: "club" });
                    setView("chat");
                  }}
                >
                  <Ionicons name="chatbubbles-outline" size={18} color={colors.accent} />
                  <Text style={[styles.chatText, { color: colors.accent }]}>Discuter</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

        {/* --- Défis --- */}
        {selectedTab === "defis" &&
          defis.map((defi, i) => (
            <View key={defi.id} style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.title, { color: colors.text }]}>{defi.name}</Text>
              <Text style={[styles.desc, { color: colors.mutedText }]}>{defi.desc}</Text>
              <Text style={[styles.participants, { color: colors.mutedText }] }>
                🧍‍♂️ {defi.mode.toUpperCase()} • {defi.places} places restantes
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const updated = [...defis];
                  if (!updated[i].joined && updated[i].places > 0) {
                    updated[i].joined = true;
                    updated[i].places -= 1;
                  } else if (updated[i].joined) {
                    updated[i].joined = false;
                    updated[i].places += 1;
                  }
                  setDefis(updated);
                }}
                style={[styles.joinBtn, { backgroundColor: defi.joined ? colors.surfaceAlt : colors.accent } ]}
              >
                <Text style={[styles.joinText, { color: colors.text }] }>
                  {defi.joined ? "Rejoint ✅" : "Rejoindre"}
                </Text>
              </TouchableOpacity>
            </View>
          ))}

        {/* --- Amis avec classement --- */}
        {selectedTab === "amis" && (
          <>
            <View style={[styles.searchContainer, { backgroundColor: colors.surfaceAlt }] }>
              <Ionicons name="search" size={20} color={colors.mutedText} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Rechercher un utilisateur..."
                placeholderTextColor={colors.mutedText}
                style={[styles.searchInput, { color: colors.text }]}
              />
            </View>
            {amis
              .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
              .map((ami, index) => (
                <TouchableOpacity
                  key={ami.id}
                  onPress={() => {
                    setSelectedChat({ ...ami, type: "ami" });
                    setView("chat");
                  }}
                  style={[styles.friendCard, { backgroundColor: colors.surface }]}
                >
                  <View style={styles.friendLeft}>
                    <Text style={[styles.rank, { color: colors.accent }]}>#{index + 1}</Text>
                    <Image source={{ uri: ami.avatar }} style={styles.avatar} />
                    <Text style={[styles.friendName, { color: colors.text }]}>{ami.name}</Text>
                  </View>
                  <Text style={[styles.points, { color: colors.mutedText }]}>{ami.points} pts</Text>
                </TouchableOpacity>
              ))}
          </>
        )}
      </ScrollView>
    </View>
  );

  return view === "chat" ? renderChat() : renderMain();
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D1412", padding: 16 },
  chatContainer: { flex: 1, backgroundColor: "#0D1412", padding: 16 },
  tabs: { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  tab: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
  activeTab: { backgroundColor: "#00C389" },
  tabText: { color: "#999", fontWeight: "600" },
  activeTabText: { color: "#fff" },
  card: {
    backgroundColor: "#12201C",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  desc: { color: "#aaa", marginVertical: 6 },
  participants: { color: "#ccc", marginBottom: 10 },
  joinBtn: { padding: 10, borderRadius: 12, alignItems: "center", flex: 1 },
  joinText: { color: "#fff", fontWeight: "600" },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1412",
    borderWidth: 1,
    borderColor: "#00C389",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginLeft: 8,
  },
  chatText: { color: "#00C389", marginLeft: 6, fontWeight: "600" },
  row: { flexDirection: "row" },
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#12201C",
    borderRadius: 20,
    padding: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  searchInput: { color: "#fff", marginLeft: 8, flex: 1 },
  friendCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#12201C",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  friendLeft: { flexDirection: "row", alignItems: "center" },
  friendName: { color: "#fff", marginLeft: 10, fontSize: 15 },
  points: { color: "#aaa" },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  backBtn: { marginBottom: 10 },
  header: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 12,
    marginVertical: 4,
    maxWidth: "80%",
  },
  myMessage: { alignSelf: "flex-end", backgroundColor: "#00C389" },
  theirMessage: { alignSelf: "flex-start", backgroundColor: "#173B2F" },
  messageText: { color: "#fff" },
  emptyChat: { color: "#999", textAlign: "center", marginTop: 40 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#1C2A27",
    paddingTop: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#172420",
    color: "#fff",
    padding: 10,
    borderRadius: 20,
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: "#00C389",
    borderRadius: 20,
    padding: 10,
  },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  rank: { color: "#00C389", marginRight: 10, fontWeight: "bold" },
});
