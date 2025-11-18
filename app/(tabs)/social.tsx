import { useThemeMode } from "@/hooks/theme-context";
import React, { useMemo, useState } from "react";
import { Alert, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Composants UI
import { ChatView } from "@/components/ui/social/ChatView";
import { ClubCard } from "@/components/ui/social/ClubCard";
import { DefiCard } from "@/components/ui/social/DefiCard";
import { FriendCard } from "@/components/ui/social/FriendCard";
import { TabsSwitcher } from "@/components/ui/social/TabsSwitcher";

// Données statiques
import { ShareQRModal } from "@/components/ui/qr/ShareQRModal";
import { amisData, clubsData, defisData } from "@/components/ui/social/data";
import { useClub } from "@/hooks/club-context";
import { usePoints } from "@/hooks/points-context";
import { useUser } from "@/hooks/user-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";

export default function SocialScreen() {
  const { colors } = useThemeMode();
  const [selectedTab, setSelectedTab] = useState<"clubs" | "amis" | "defis">("clubs");
  const [view, setView] = useState<"main" | "chat" | "clubRanking" | "createClub">("main");
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [input, setInput] = useState(""); // chat input
  // Nouveau club form states
  const [newClubName, setNewClubName] = useState("");
  const [newClubDesc, setNewClubDesc] = useState("");
  const [newClubVisibility, setNewClubVisibility] = useState<"public" | "private">("public");
  const [newClubEmoji, setNewClubEmoji] = useState<string>("");
  const [newClubPhoto, setNewClubPhoto] = useState<string>("");
  const [showClubQR, setShowClubQR] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [clubs, setClubs] = useState(clubsData);
  const { joinedClub, joinClub, leaveClub, members, createClub } = useClub();
  const { points } = usePoints();
  const { user } = useUser();
  const params = useLocalSearchParams();

  useEffect(() => {
    const tabParam = (params?.tab as string) || "";
    if (tabParam === "amis" || tabParam === "clubs" || tabParam === "defis") {
      setSelectedTab(tabParam as any);
    }
  }, [params]);
  
  // Support deep-link to club ranking: /social?tab=clubs&view=clubRanking
  useEffect(() => {
    const viewParam = (params?.view as string) || "";
    if (viewParam === "clubRanking") {
      setSelectedTab("clubs");
      if (joinedClub) setView("clubRanking");
    }
  }, [params, joinedClub]);
  const [defis, setDefis] = useState(defisData);

  const handleSend = () => {
    if (!input.trim()) return;
    if (editingId) {
      setMessages((prev) => prev.map((m) => (m.id === editingId ? { ...m, text: input } : m)));
      setEditingId(null);
      setInput("");
      return;
    }
    setMessages((prev) => [...prev, { id: Date.now().toString(), text: input, sender: "me" }]);
    setInput("");
  };

  const clubRankingData = useMemo(() => {
    // Merge club members with current user for ranking
    const base = members.map((m) => ({ ...m, isMe: false }));
    const me = { id: "me", name: user.name, avatar: user.avatar, points, isMe: true } as any;
    const all = [...base, me];
    return all.sort((a, b) => b.points - a.points).map((m, idx) => ({ ...m, rank: idx + 1 }));
  }, [members, points]);

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
        onStartEditMessage={(id, text) => { setEditingId(id); setInput(text); }}
        onReactMessage={(id, emoji) => setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, reactions: [...(m.reactions || []), emoji] } : m)))}
        editingId={editingId}
      />
    );
  }

  if (view === "clubRanking") {
    // VUE CLASSEMENT CLUB -> construit à partir de ClubContext + PointsContext
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <TouchableOpacity onPress={() => setView("main")} style={{ marginRight: 8 }}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
            Classement du club {joinedClub?.name ?? ""}
          </Text>
        </View>
        <FlatList
          data={clubRankingData}
          keyExtractor={(item) => String(item.id) + String(item.rank)}
          renderItem={({ item }) => (
            <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12, backgroundColor: item.isMe ? colors.accent : "transparent" }}>
              <Text style={{ width: 30, textAlign: "center", color: item.isMe ? "#0F3327" : colors.text, fontWeight: "700" }}>{item.rank}</Text>
              <Image source={{ uri: item.isMe ? user.avatar : item.avatar }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10, borderWidth: 0 }} />
              <Text style={{ flex: 1, color: item.isMe ? "#0F3327" : colors.text, fontWeight: item.isMe ? "700" : "500" }}>{item.isMe ? user.name : item.name}</Text>
              <Text style={{ color: item.isMe ? "#0F3327" : colors.accent, fontWeight: "700" }}>{item.points} pts</Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 140 }}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.surfaceAlt }} />}
        />
      </View>
    );
  }

  if (view === "createClub") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <TouchableOpacity onPress={() => setView("main")} style={{ marginBottom: 16 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700", marginBottom: 6 }}>Créer un club</Text>
        <Text style={{ color: colors.mutedText, marginBottom: 20 }}>Définis les informations de ton nouveau club.</Text>
        <View style={{ gap: 14 }}>
          <View>
            <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 6 }}>Nom du club</Text>
            <TextInput
              value={newClubName}
              onChangeText={setNewClubName}
              placeholder="Ex: Eco Warriors"
              placeholderTextColor={colors.mutedText}
              style={{
                backgroundColor: colors.surfaceAlt,
                color: colors.text,
                padding: 14,
                borderRadius: 14,
                fontWeight: "600",
              }}
            />
          </View>
          <View>
            <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 6 }}>Emoji (optionnel)</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {['♻️','🌿','🌍','💧','🔥','⭐'].map((e) => (
                <TouchableOpacity key={e} onPress={() => setNewClubEmoji(e === newClubEmoji ? '' : e)} style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: newClubEmoji === e ? colors.accent : colors.surfaceAlt }}>
                  <Text style={{ fontSize: 18 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View>
            <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 6 }}>Description</Text>
            <TextInput
              multiline
              value={newClubDesc}
              onChangeText={setNewClubDesc}
              numberOfLines={4}
              style={{
                backgroundColor: colors.surfaceAlt,
                color: colors.text,
                padding: 14,
                borderRadius: 14,
                minHeight: 110,
                textAlignVertical: "top",
              }}
              placeholder="Décris ton club..."
              placeholderTextColor={colors.mutedText}
            />
          </View>
          <View>
            <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 6 }}>Photo (optionnel)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {newClubPhoto ? (
                <>
                  <Image source={{ uri: newClubPhoto }} style={{ width: 56, height: 56, borderRadius: 12 }} />
                  <TouchableOpacity
                    onPress={async () => {
                      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (perm.status !== 'granted') return;
                      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
                      if (!res.canceled) setNewClubPhoto(res.assets[0].uri);
                    }}
                    style={{ backgroundColor: colors.surfaceAlt, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 }}
                  >
                    <Text style={{ color: colors.text }}>Changer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setNewClubPhoto('')} style={{ backgroundColor: colors.surfaceAlt, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 }}>
                    <Text style={{ color: colors.text }}>Retirer</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={async () => {
                    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (perm.status !== 'granted') return;
                    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
                    if (!res.canceled) setNewClubPhoto(res.assets[0].uri);
                  }}
                  style={{ backgroundColor: colors.surfaceAlt, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 }}
                >
                  <Text style={{ color: colors.text }}>Ajouter une photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View>
            <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 10 }}>Visibilité</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: newClubVisibility === "public" ? colors.accent : colors.surfaceAlt,
                  padding: 14,
                  borderRadius: 14,
                  alignItems: "center",
                }}
                onPress={() => setNewClubVisibility("public")}
              >
                <Text style={{ color: newClubVisibility === "public" ? "#0F3327" : colors.text, fontWeight: "600" }}>Public</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: newClubVisibility === "private" ? colors.accent : colors.surfaceAlt,
                  padding: 14,
                  borderRadius: 14,
                  alignItems: "center",
                }}
                onPress={() => setNewClubVisibility("private")}
              >
                <Text style={{ color: newClubVisibility === "private" ? "#0F3327" : colors.text, fontWeight: "600" }}>Privé</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: newClubName.trim() ? colors.accent : colors.surfaceAlt,
              paddingVertical: 16,
              borderRadius: 18,
              alignItems: "center",
            }}
            disabled={!newClubName.trim()}
            onPress={() => {
              if (!newClubName.trim()) return;
              const created = createClub({ name: newClubName.trim(), desc: newClubDesc.trim(), visibility: newClubVisibility, emoji: newClubEmoji || undefined, photoUri: newClubPhoto || undefined });
              setClubs([{ id: created.id, name: created.name, desc: created.desc || "", participants: 1, joined: true }, ...clubs]);
              // reset form
              setNewClubName("");
              setNewClubDesc("");
              setNewClubVisibility("public");
              setNewClubEmoji("");
              setNewClubPhoto("");
              setView("main");
            }}
          >
            <Text style={{ fontWeight: "700", color: newClubName.trim() ? "#0F3327" : colors.mutedText }}>Créer le club</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
  {/* ONGLETS -> components/ui/social/TabsSwitcher */}
      <TabsSwitcher selectedTab={selectedTab} onChange={setSelectedTab} />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
  {/* CARTES CLUBS -> components/ui/social/ClubCard */}
        {selectedTab === "clubs" && (
          <>
            <TouchableOpacity
              style={{
                backgroundColor: colors.accent,
                paddingVertical: 14,
                borderRadius: 18,
                alignItems: "center",
                marginBottom: 16,
              }}
              onPress={() => setView("createClub")}
            >
              <Text style={{ fontWeight: "700", color: "#0F3327" }}>➕ Créer un club</Text>
            </TouchableOpacity>
            {joinedClub && (
              <TouchableOpacity
                style={{ backgroundColor: colors.surfaceAlt, paddingVertical: 12, borderRadius: 14, alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: colors.surfaceAlt }}
                onPress={() => setShowClubQR(true)}
              >
                <Text style={{ color: colors.text, fontWeight: "600" }}>📱 Partager mon club (QR)</Text>
              </TouchableOpacity>
            )}
            {clubs.map((club, i) => (
            <ClubCard
              key={club.id}
              club={club}
              onJoin={() => {
                const updated = [...clubs];
                const currentlyJoinedIndex = updated.findIndex((c) => c.joined);
                if (!updated[i].joined) {
                  // trying to join
                    const ok = joinClub({ id: club.id, name: club.name, participants: updated[i].participants + 1, desc: club.desc, visibility: "public" });
                  if (!ok && (joinedClub && joinedClub.id !== club.id)) {
                    Alert.alert("Information", "Vous faites déjà partie d'un club");
                    return;
                  }
                  // if joining, ensure only one club joined
                  if (currentlyJoinedIndex !== -1 && currentlyJoinedIndex !== i) {
                    updated[currentlyJoinedIndex].joined = false;
                  }
                  updated[i].joined = true;
                  updated[i].participants += 1;
                } else {
                  // leaving club
                  leaveClub();
                  updated[i].joined = false;
                  updated[i].participants = Math.max(0, updated[i].participants - 1);
                }
                setClubs(updated);
              }}
              onChat={() => {
                setSelectedChat({ ...club, type: "club" });
                setView("chat");
              }}
              onRanking={() => {
                if (club.joined) setView("clubRanking");
              }}
            />
            ))}
          </>
        )}

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

            {(() => {
              const me = { id: "me", name: user.name, points, avatar: user.avatar, online: true } as any;
              const sorted = [...amisData, me]
                .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
                .sort((a, b) => b.points - a.points);

              return sorted.map((ami, index) => (
                <FriendCard
                  key={`${ami.id}-${index}`}
                  friend={ami}
                  rank={index + 1}
                  isMe={ami.id === "me"}
                  onChat={() => {
                    if (ami.id === "me") return;
                    setSelectedChat({ ...ami, type: "ami" });
                    setView("chat");
                  }}
                />
              ));
            })()}
          </>
        )}
      </ScrollView>
      {joinedClub && (
        <ShareQRModal
          visible={showClubQR}
          onClose={() => setShowClubQR(false)}
          title={`Partager ${joinedClub?.name}`}
          subtitle="Scanne pour rejoindre notre club"
          qrValue={`app://club/${joinedClub?.id ?? ''}`}
          shareText={`Rejoins mon club ${joinedClub?.name} sur l'app ! app://club/${joinedClub?.id ?? ''}`}
          accentColor={colors.accent}
        />
      )}
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

// QR modal instance for club sharing is rendered at root of this screen
// Placed outside the component export in previous code would not work; ensure inside component
