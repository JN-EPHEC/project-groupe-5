import { useThemeMode } from "@/hooks/theme-context";
import { useMemo, useState } from "react";
import { Alert, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Composants UI
import { ChatView } from "@/components/ui/social/ChatView";
import { ClubCard } from "@/components/ui/social/ClubCard";
import { FriendCard } from "@/components/ui/social/FriendCard";

// Données statiques
import { ShareQRModal } from "@/components/ui/qr/ShareQRModal";
import { clubsData } from "@/components/ui/social/data";
import { useClub } from "@/hooks/club-context";
import { useFriends } from "@/hooks/friends-context";
import { usePoints } from "@/hooks/points-context";
import { useSubscriptions } from "@/hooks/subscriptions-context";
import { useUser } from "@/hooks/user-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";

export default function SocialScreen() {
  const { colors } = useThemeMode();
  const [selectedTab, setSelectedTab] = useState<"clubs" | "amis">("amis");
  const [view, setView] = useState<"main" | "chat" | "clubRanking" | "createClub">("main");
  const [editingClub, setEditingClub] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [input, setInput] = useState(""); // chat input
  // Nouveau club form states
  const [newClubName, setNewClubName] = useState("");
  const [newClubDesc, setNewClubDesc] = useState("");
  const [newClubVisibility, setNewClubVisibility] = useState<"public" | "private">("public");
  const [newClubPhoto, setNewClubPhoto] = useState<string>("");
  const [newClubCity, setNewClubCity] = useState<string>("");
  const [showClubQR, setShowClubQR] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [clubSearch, setClubSearch] = useState("");
  const [clubs, setClubs] = useState(clubsData);
  const { joinedClub, joinClub, leaveClub, members, createClub, promoteToOfficer, demoteOfficer, updateClub } = useClub();
  const { points } = usePoints();
  const { user } = useUser();
  const params = useLocalSearchParams();
  const router = useRouter();
  const { follow } = useSubscriptions();
  const { friends } = useFriends();
  // Modal de confirmation pour quitter le club
  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);

  useEffect(() => {
    const tabParam = (params?.tab as string) || "";
    if (tabParam === "amis" || tabParam === "clubs") {
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
  // plus d'onglet compétition

  const handleSend = () => {
    if (!input.trim()) return;
    if (editingId) {
      setMessages((prev) => prev.map((m) => (m.id === editingId ? { ...m, text: input } : m)));
      setEditingId(null);
      setInput("");
      return;
    }
    setMessages((prev) => [...prev, { id: Date.now().toString(), text: input, type: 'text', sender: "me" }]);
    setInput("");
  };

          
  const handleSendImage = (uri: string) => {
    setMessages((prev) => [...prev, { id: Date.now().toString(), imageUri: uri, type: 'image', sender: 'me' }]);
  };

  const clubRankingData = useMemo(() => {
    // Merge club members with current user for ranking
    const base = members.map((m) => ({ ...m, isMe: false }));
    const me = {
      id: "me",
      name: user?.firstName ?? "Utilisateur",
      avatar: user?.photoURL ?? null,
      isMe: true,
      points: points || 0,
    } as any;
    const all = [...base, me];
    return all.sort((a, b) => (b.points || 0) - (a.points || 0)).map((m, idx) => ({ ...m, rank: idx + 1 }));
  }, [members, points, user]);

  const clanTotalPoints = useMemo(() => {
    const membersSum = members.reduce((s, m) => s + (m.points || 0), 0);
    return membersSum + (points || 0);
  }, [members, points]);

  // no early return; keep tabs visible in all views

  const handleLeaveClub = () => {
    // update local list
    setClubs((prev) => prev.map((c) => (c.joined ? { ...c, joined: false, participants: Math.max(0, (c.participants || 1) - 1) } : c)));
    leaveClub();
    setView("main");
  };

  if (view === "createClub") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <TouchableOpacity onPress={() => setView("main")} style={{ marginBottom: 16 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700", marginBottom: 6 }}>{editingClub ? 'Modifier le club' : 'Créer un club'}</Text>
          {/* Avatar preview */}
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          {newClubPhoto ? (
            <Image source={{ uri: newClubPhoto }} style={{ width: 72, height: 72, borderRadius: 36 }} />
          ) : (
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 28 }}>🌿</Text>
            </View>
          )}
        </View>
        <Text style={{ color: colors.mutedText, marginBottom: 20 }}>Définis les informations de ton nouveau club.</Text>
        <View style={{ gap: 14 }}>
          <View>
            <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 6 }}>Ville</Text>
            <TextInput
              value={newClubCity}
              onChangeText={setNewClubCity}
              placeholder="Ex: Bruxelles"
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
          {/* Avatars prédéfinis (DiceBear) */}
          {(() => {
            const accentHex = (colors.accent || '#22C55E').replace('#', '');
            const seeds = ['eco','leaf','earth','water','forest','sun','star','recycle','planet','nature','green','club1','club2','club3','city','river'];
            return (
              <View>
                <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 8 }}>Choisir un avatar</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
                  {seeds.map((s) => {
                    const url = `https://api.dicebear.com/9.x/icons/png?seed=${encodeURIComponent(s)}&size=64&backgroundColor=${accentHex}`;
                    return (
                      <TouchableOpacity key={s} onPress={() => setNewClubPhoto(url)} style={{ marginRight: 10 }}>
                        <Image source={{ uri: url }} style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: colors.surfaceAlt }} />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            );
          })()}
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
              backgroundColor: (newClubName.trim() && newClubCity.trim()) ? colors.accent : colors.surfaceAlt,
              paddingVertical: 16,
              borderRadius: 18,
              alignItems: "center",
            }}
            disabled={!(newClubName.trim() && newClubCity.trim())}
            onPress={() => {
              if (!(newClubName.trim() && newClubCity.trim())) return;
              if (editingClub && joinedClub) {
                updateClub({ name: newClubName.trim(), desc: newClubDesc.trim(), visibility: newClubVisibility, photoUri: newClubPhoto || undefined, city: newClubCity.trim() });
                setClubs((prev: any) => prev.map((c: any) => c.id === joinedClub.id ? { ...c, name: newClubName.trim(), desc: newClubDesc.trim(), city: newClubCity.trim(), photoUri: newClubPhoto || c.photoUri } : c));
              } else {
                const created = createClub({ name: newClubName.trim(), desc: newClubDesc.trim(), visibility: newClubVisibility, photoUri: newClubPhoto || undefined, city: newClubCity.trim() });
                setClubs([{ id: created.id, name: created.name, desc: created.desc || "", participants: 1, joined: true, city: (created as any).city, emoji: (created as any).emoji, photoUri: (created as any).photoUri } as any, ...clubs as any]);
              }
              // reset form
              setEditingClub(false);
              setNewClubName("");
              setNewClubDesc("");
              setNewClubVisibility("public");
              setNewClubPhoto("");
              setNewClubCity("");
              setView("main");
            }}
          >
            <Text style={{ fontWeight: "700", color: newClubName.trim() ? "#0F3327" : colors.mutedText }}>{editingClub ? 'Enregistrer' : 'Créer le club'}</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.background },
      selectedTab === 'clubs' && joinedClub ? { paddingBottom: 0 } : null,
    ]}> 
      <Text style={[styles.title, { color: colors.text }]}>Social</Text>
      <View style={[styles.tabSwitcher, { backgroundColor: colors.surfaceAlt }]}>
        <TouchableOpacity
          style={[styles.switcherButton, selectedTab==='clubs' && { backgroundColor: colors.accent }]}
          onPress={() => setSelectedTab('clubs')}
        >
          <Text style={[styles.switcherText, { color: selectedTab==='clubs' ? '#0F3327' : colors.mutedText }]}>Club</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switcherButton, selectedTab==='amis' && { backgroundColor: colors.accent }]}
          onPress={() => setSelectedTab('amis')}
        >
          <Text style={[styles.switcherText, { color: selectedTab==='amis' ? '#0F3327' : colors.mutedText }]}>Amis</Text>
        </TouchableOpacity>
      </View>

      {/* CLUBS */}
      {selectedTab === "clubs" && (
        joinedClub ? (
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              onPress={() => setView("clubRanking")}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, padding: 12, marginBottom: 10, marginTop: 18 }}
            >
              {joinedClub?.photoUri ? (
                <Image source={{ uri: joinedClub.photoUri }} style={{ width: 30, height: 30, borderRadius: 15 }} />
              ) : (
                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.pill, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 16 }}>{joinedClub?.emoji || '🌿'}</Text>
                </View>
              )}
              <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8, flex: 1 }}>{joinedClub.name}</Text>
              <TouchableOpacity onPress={() => setShowClubQR(true)} style={{ marginRight: 10 }}>
                <Ionicons name="share-social-outline" size={18} color={colors.accent} />
              </TouchableOpacity>
              <Ionicons name="leaf-outline" size={16} color={colors.accent} />
              <Text style={{ color: colors.accent, fontWeight: '700', marginLeft: 6 }}>{clanTotalPoints} pts</Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <ChatView
                selectedChat={{ ...joinedClub, type: 'club' }}
                messages={messages}
                input={input}
                setInput={setInput}
                onSend={handleSend}
                onBack={() => {}}
                onDeleteMessage={(id) => setMessages((m) => m.filter((msg) => msg.id !== id))}
                onStartEditMessage={(id, text) => { setEditingId(id); setInput(text); }}
                onReactMessage={(id, emoji) => setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, reactions: [...(m.reactions || []), emoji] } : m)))}
                editingId={editingId}
                showBack={false}
                onSendImage={handleSendImage}
              />
            </View>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            <View style={[styles.searchContainer, { backgroundColor: colors.surfaceAlt, marginTop: 18 }]}> 
              <Ionicons name="search" size={18} color={colors.mutedText} />
              <TextInput
                value={clubSearch}
                onChangeText={setClubSearch}
                placeholder="Rechercher un club ou une ville..."
                placeholderTextColor={colors.mutedText}
                style={[styles.searchInput, { color: colors.text }]}
              />
            </View>
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
            {(clubs.some((c) => c.joined) ? clubs.filter((c) => c.joined) : clubs)
              .filter((c: any) => c.name.toLowerCase().includes(clubSearch.toLowerCase()) || ((c.city || "").toLowerCase().includes(clubSearch.toLowerCase())))
              .map((club, i) => (
                <ClubCard
                  key={club.id}
                  club={club}
                  onJoin={() => {
                    const updated = [...clubs];
                    const currentlyJoinedIndex = updated.findIndex((c) => c.joined);
                    if (!updated[i].joined) {
                      // trying to join
                      const ok = joinClub({ id: club.id, name: club.name, participants: updated[i].participants + 1, desc: club.desc, visibility: "public", city: (club as any).city });
                      if (!ok && (joinedClub && (joinedClub as any).id !== club.id)) {
                        Alert.alert("Information", "Vous faites déjà partie d'un club");
                        return;
                      }
                      // if joining, ensure only one club joined
                      if (currentlyJoinedIndex !== -1 && currentlyJoinedIndex !== i) {
                        updated[currentlyJoinedIndex].joined = false;
                      }
                      updated[i].joined = true;
                      updated[i].participants += 1;
                      // open chat immediately on join
                      setSelectedChat({ ...club, type: "club" });
                      setView("chat");
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
                  totalPoints={club.joined ? clanTotalPoints : undefined}
                />
              ))}
          </ScrollView>
        )
      )}

      {/* LISTE AMIS + RECHERCHE -> components/ui/social/FriendCard */}
      {selectedTab === "amis" && (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={[styles.searchContainer, { backgroundColor: colors.surfaceAlt, marginTop: 18 }]}> 
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher un ami..."
              placeholderTextColor={colors.mutedText}
              style={[styles.searchInput, { color: colors.text }]}
            />
            <TouchableOpacity onPress={() => router.push('/amis-plus')} style={{ backgroundColor: colors.accent, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginLeft: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="person-add-outline" size={16} color="#0F3327" />
              <Text style={{ color: '#0F3327', fontWeight: '700' }}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          {(() => {
            const me = { id: "me", name: user?.firstName ?? "Utilisateur", points, avatar: user?.photoURL ?? null, online: true } as any;
            const sorted = [...friends, me]
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
        </ScrollView>
      )}
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

      {/* Club ranking overlay below tabs */}
      {selectedTab === 'clubs' && view === 'clubRanking' && (
        <View style={{ position: 'absolute', top: 56, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <TouchableOpacity onPress={() => setView('main')} style={{ marginRight: 8 }}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            {joinedClub?.photoUri ? (
              <Image source={{ uri: joinedClub.photoUri }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }} />
            ) : (
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.pill, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                <Text style={{ fontSize: 16 }}>{joinedClub?.emoji || '🌿'}</Text>
              </View>
            )}
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', flex: 1 }}>{joinedClub?.name ?? ''}</Text>
            <TouchableOpacity onPress={() => setShowClubQR(true)} style={{ backgroundColor: colors.surfaceAlt, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginRight: 8 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>Partager</Text>
            </TouchableOpacity>
            {joinedClub?.ownerId === 'me' && (
              <TouchableOpacity onPress={() => {
                if (!joinedClub) return;
                setEditingClub(true);
                setNewClubName(joinedClub.name || '');
                setNewClubDesc(joinedClub.desc || '');
                setNewClubVisibility((joinedClub.visibility as any) || 'public');
                setNewClubPhoto(joinedClub.photoUri || '');
                setNewClubCity(joinedClub.city || '');
                setView('createClub');
              }} style={{ backgroundColor: colors.surfaceAlt, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginRight: 8 }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>Modifier</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setLeaveConfirmVisible(true)} style={{ backgroundColor: '#D93636', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Quitter</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={clubRankingData}
            keyExtractor={(item) => String(item.id) + String(item.rank)}
            renderItem={({ item }) => (
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12, backgroundColor: item.isMe ? colors.accent : 'transparent' }}>
                <Text style={{ width: 30, textAlign: 'center', color: item.isMe ? '#0F3327' : colors.text, fontWeight: '700' }}>{item.rank}</Text>
                <Image source={{ uri: item.isMe ? (user?.photoURL ?? undefined) : item.avatar }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10, borderWidth: 0 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: item.isMe ? '#0F3327' : colors.text, fontWeight: item.isMe ? '700' : '500' }}>{item.isMe ? (user?.firstName ?? "Utilisateur") : item.name}</Text>
                  {joinedClub && (
                    <Text style={{ color: item.isMe ? '#0F3327' : colors.mutedText, fontSize: 12 }}>
                      {joinedClub.ownerId === (item.isMe ? 'me' : item.id) ? 'Chef' : (joinedClub.officers || []).includes(item.isMe ? 'me' : item.id) ? 'Adjoint' : 'Membre'}
                    </Text>
                  )}
                </View>
                <Text style={{ color: item.isMe ? '#0F3327' : colors.accent, fontWeight: '700' }}>{item.points} pts</Text>
                {joinedClub?.ownerId === 'me' && !item.isMe && (
                  (joinedClub.officers || []).includes(item.id)
                    ? (
                      <TouchableOpacity onPress={() => demoteOfficer(item.id)} style={{ marginLeft: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.surfaceAlt }}>
                        <Text style={{ color: colors.text, fontSize: 12 }}>Rétrograder</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={() => promoteToOfficer(item.id)} style={{ marginLeft: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.surfaceAlt }}>
                        <Text style={{ color: colors.text, fontSize: 12 }}>Nommer adjoint</Text>
                      </TouchableOpacity>
                    )
                )}
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 140 }}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.surfaceAlt }} />}
          />
        </View>
      )}
      {leaveConfirmVisible && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Quitter le club</Text>
            <Text style={{ color: colors.mutedText, marginTop: 6 }}>Êtes-vous sûr de quitter le club ?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.accent }]} onPress={() => setLeaveConfirmVisible(false)}>
                <Text style={{ color: '#0F3327', fontWeight: '700' }}>Rester</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#D93636' }]}
                onPress={() => {
                  setLeaveConfirmVisible(false);
                  handleLeaveClub();
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Quitter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  title: { fontSize: 28, fontWeight: '700' },
  tabSwitcher: { flexDirection: 'row', borderRadius: 24, padding: 4, marginTop: 20 },
  switcherButton: { flex: 1, borderRadius: 20, paddingVertical: 10, alignItems: 'center' },
  switcherText: { fontWeight: '600' },
  searchContainer: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  searchInput: { marginLeft: 8, flex: 1 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 360, borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 10 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
});

// QR modal instance for club sharing is rendered at root of this screen
// Placed outside the component export in previous code would not work; ensure inside component
