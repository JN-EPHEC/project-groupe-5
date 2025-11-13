import { useThemeMode } from "@/hooks/theme-context";
import React, { useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";

// Composants UI
import { ChatView } from "@/components/ui/social/ChatView";
import { ClubCard } from "@/components/ui/social/ClubCard";
import { DefiCard } from "@/components/ui/social/DefiCard";
import { FriendCard } from "@/components/ui/social/FriendCard";
import { TabsSwitcher } from "@/components/ui/social/TabsSwitcher";

// Données statiques
import { amisData, clubsData, defisData } from "@/components/ui/social/data";

export default function SocialScreen() {
  const { colors } = useThemeMode();
  const [selectedTab, setSelectedTab] = useState<"clubs" | "amis" | "defis">("clubs");
  const [view, setView] = useState<"main" | "chat">("main");
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [clubs, setClubs] = useState(clubsData);
  const [defis, setDefis] = useState(defisData);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now().toString(), text: input, sender: "me" }]);
    setInput("");
  };

  if (view === "chat") {
    // VUE CHAT -> components/ui/social/ChatView
    return (
      <ChatView
        selectedChat={selectedChat}
        messages={messages}
        input={input}
        setInput={setInput}
        onSend={handleSend}
        onBack={() => setView("main")}
        onDeleteMessage={(id) => setMessages((m) => m.filter((msg) => msg.id !== id))}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
  {/* ONGLETS -> components/ui/social/TabsSwitcher */}
      <TabsSwitcher selectedTab={selectedTab} onChange={setSelectedTab} />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
  {/* CARTES CLUBS -> components/ui/social/ClubCard */}
        {selectedTab === "clubs" &&
          clubs.map((club, i) => (
            <ClubCard
              key={club.id}
              club={club}
              onJoin={() => {
                const updated = [...clubs];
                updated[i].joined = !updated[i].joined;
                updated[i].participants += updated[i].joined ? 1 : -1;
                setClubs(updated);
              }}
              onChat={() => {
                setSelectedChat({ ...club, type: "club" });
                setView("chat");
              }}
            />
          ))}

  {/* CARTES DÉFIS -> components/ui/social/DefiCard */}
        {selectedTab === "defis" &&
          defis.map((defi, i) => (
            <DefiCard
              key={defi.id}
              defi={defi}
              onJoin={() => {
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
            />
          ))}

  {/* LISTE AMIS + RECHERCHE -> components/ui/social/FriendCard */}
        {selectedTab === "amis" && (
          <>
            <View style={[styles.searchContainer, { backgroundColor: colors.surfaceAlt }]}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Rechercher un utilisateur..."
                placeholderTextColor={colors.mutedText}
                style={[styles.searchInput, { color: colors.text }]}
              />
            </View>

            {amisData
              .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
              .map((ami, index) => (
                <FriendCard
                  key={ami.id}
                  friend={ami}
                  rank={index + 1}
                  onChat={() => {
                    setSelectedChat({ ...ami, type: "ami" });
                    setView("chat");
                  }}
                />
              ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  searchContainer: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  searchInput: { marginLeft: 8, flex: 1 },
});
