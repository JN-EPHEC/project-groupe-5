import { useThemeMode } from "@/hooks/theme-context";
import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
  
// Composants UI
import { GradientButton } from "@/components/ui/common/GradientButton";
import { ChatView } from "@/components/ui/social/ChatView";
import { ClubCard } from "@/components/ui/social/ClubCard";
import { FriendCard } from "@/components/ui/social/FriendCard";

// Données statiques
import { ShareQRModal } from "@/components/ui/qr/ShareQRModal";
// clubsData removed; clubs list now comes from Firestore
import { FontFamilies } from "@/constants/fonts";
import { auth, db } from "@/firebaseConfig";
import type { ClubInfo, ClubMember } from "@/hooks/club-context";
import { useClub } from "@/hooks/club-context";
import { useFriends } from "@/hooks/friends-context";
import { usePoints } from "@/hooks/points-context";
import { useSubscriptions } from "@/hooks/subscriptions-context";
import { useUser } from "@/hooks/user-context";
import { acceptJoinRequest, rejectJoinRequest, requestJoinClub, removeMember } from "@/services/clubs";
import { acceptFriendRequest, rejectFriendRequest, removeFriend, searchUsers, sendFriendRequest } from "@/services/friends";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { useEffect } from "react";

export default function SocialScreen() {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";
  const darkBg = "#021114";

  const [selectedTab, setSelectedTab] = useState<"clubs" | "amis">("amis");
  const [view, setView] = useState<"main" | "chat" | "clubRanking" | "createClub" | "requests" | "joinRequests" | "members">("main");
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
  const [friendSearchText, setFriendSearchText] = useState("");
  const [friendSearchResults, setFriendSearchResults] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [friendsLive, setFriendsLive] = useState<any[]>([]);
  const [friendProfiles, setFriendProfiles] = useState<Record<string, any>>({});
  const [sentRequestIds, setSentRequestIds] = useState<string[]>([]);
  const [clubSearch, setClubSearch] = useState("");
  const [clubs, setClubs] = useState<any[]>([]);
  const [membersPreview, setMembersPreview] = useState<ClubMember[]>([]);
  const [membersPreviewLoading, setMembersPreviewLoading] = useState(false);
  const { joinedClub, joinClub, leaveClub, members, createClub, promoteToOfficer, demoteOfficer, updateClub, transferOwnership, deleteClub } = useClub();
  const [clubJoinRequests, setClubJoinRequests] = useState<any[]>([]);
  const [joinRequestsVisible, setJoinRequestsVisible] = useState(false);
  const [requestedClubIds, setRequestedClubIds] = useState<string[]>([]);

  

  // On mount / clubs change: detect existing joinRequests by current user
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !clubs || clubs.length === 0) return;
    (async () => {
      try {
        const found: string[] = [];
        await Promise.all(clubs.map(async (c: any) => {
          try {
            const snap = await getDoc(doc(db, "clubs", c.id, "joinRequests", uid));
            if (snap.exists()) found.push(c.id);
          } catch (e) {}
        }));
        setRequestedClubIds(found);
      } catch (e) {}
    })();
  }, [clubs]);

  const handleDemoteMember = async (memberId: string) => {
    if (!joinedClub) return;
    try {
      await demoteOfficer(memberId);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de rétrograder ce membre');
    }
  };
  useEffect(() => {
    let unsub: (() => void) | null = null;
    if (!joinedClub) {
      setClubJoinRequests([]);
      return;
    }
    const isAdmin = joinedClub.ownerId === auth.currentUser?.uid || (joinedClub.officers || []).includes(auth.currentUser?.uid ?? "");
    if (!isAdmin) {
      setClubJoinRequests([]);
      return;
    }

    const rqColl = collection(db, "clubs", joinedClub.id, "joinRequests");
    unsub = onSnapshot(rqColl, async (snap) => {
      const docs = snap.docs;
      const arr: any[] = [];
      for (const d of docs) {
        const data: any = d.data();
        const userId = data.userId;
        let profile: any = null;
        try {
          const userSnap = await getDoc(doc(db, "users", userId));
          profile = userSnap.exists() ? userSnap.data() : null;
        } catch (e) {}
        arr.push({ id: d.id, userId, createdAt: data.createdAt, userProfile: profile });
      }
      setClubJoinRequests(arr);
    });

    return () => { if (unsub) unsub(); };
  }, [joinedClub]);

  const handleAcceptClubRequest = async (userId: string) => {
    if (!joinedClub) return;
    try {
      await acceptJoinRequest(joinedClub.id, userId);
      setClubJoinRequests((prev) => prev.filter((r) => r.userId !== userId));
      setRequestedClubIds((prev) => prev.filter((id) => id !== joinedClub.id));
    } catch (e) {
      console.warn('acceptJoinRequest error', e);
      Alert.alert('Erreur', 'Impossible d\'accepter la demande pour le moment.');
    }
  };

  const handleRejectClubRequest = async (userId: string) => {
    if (!joinedClub) return;
    try {
      await rejectJoinRequest(joinedClub.id, userId);
      setClubJoinRequests((prev) => prev.filter((r) => r.userId !== userId));
    } catch (e) {
      console.warn('rejectJoinRequest error', e);
      Alert.alert('Erreur', 'Impossible de refuser la demande pour le moment.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const clubId = joinedClub?.id || selectedChat?.id;
    if (!clubId) return;
    try {
      await removeMember(clubId, memberId);
      setMembersPreview((prev) => prev.filter((m) => m.id !== memberId));
    } catch (e) {
      console.warn('removeMember error', e);
      Alert.alert('Erreur', 'Impossible de supprimer ce membre pour le moment.');
    }
  };

  // Hierarchical deletion rules: who can delete whom
  const canDeleteMember = (actorId: string | null, targetId: string | undefined, club?: ClubInfo | null) => {
    if (!actorId || !targetId || !club) return false;
    if (actorId === targetId) return false; // cannot delete self
    const ownerId = club.ownerId ?? null;
    const officers = Array.isArray(club.officers) ? club.officers : [];

    const actorIsOwner = ownerId === actorId;
    const actorIsOfficer = officers.includes(actorId);
    const targetIsOwner = ownerId === targetId;
    const targetIsOfficer = officers.includes(targetId);

    if (actorIsOwner) {
      // owner can delete anyone except themself (already prevented)
      return !targetIsOwner;
    }

    if (actorIsOfficer) {
      // officer can delete plain members only
      return !targetIsOfficer && !targetIsOwner;
    }

    // regular members cannot delete anyone
    return false;
  };
  const { points } = usePoints();
  const { user } = useUser();
  const params = useLocalSearchParams();
  const router = useRouter();
  const { follow } = useSubscriptions();
  const { friends } = useFriends();
  // Modal de confirmation pour quitter le club
  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);
  const [requireOwnerTransfer, setRequireOwnerTransfer] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState<string | null>(null);
  const [pendingLeaveClub, setPendingLeaveClub] = useState<ClubInfo | null>(null);
  const [deleteOnLeave, setDeleteOnLeave] = useState(false);

  const initFromParams = useRef(false);
  useEffect(() => {
    if (initFromParams.current) return;
    const tabParam = (params?.tab as string) || "";
    if (tabParam === "amis" || tabParam === "clubs") {
      setSelectedTab(tabParam as any);
    }
    initFromParams.current = true;
  }, [params]);

  // Realtime clubs listing from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "clubs"), (snap) => {
      const firebaseClubs = snap.docs.map((doc) => {
        const d: any = doc.data();
        return {
          id: doc.id,
          name: d.name,
          desc: d.description ?? d.desc,
          city: d.city,
          photoUri: d.photoUrl,
          emoji: "🌿",
          participants: (d.members || []).length,
          joined: (d.members || []).includes(auth.currentUser?.uid || ""),
          isPrivate: !!d.isPrivate,
          visibility: d.isPrivate ? 'private' : 'public',
          ownerId: d.ownerId,
          officers: d.officers || [],
        };
      });
      setClubs(firebaseClubs);
    });
    return () => unsub();
  }, []);
 
  
  // Support deep-link to club ranking: /social?tab=clubs&view=clubRanking
  useEffect(() => {
    const viewParam = (params?.view as string) || "";
    if (viewParam === "clubRanking") {
      setSelectedTab("clubs");
      if (joinedClub) setView("clubRanking");
    }
  }, [params, joinedClub]);

  useEffect(() => {
    setInput("");
  }, [selectedChat?.id, joinedClub?.id]);

  useEffect(() => {
    if (
      view !== "members" ||
      selectedTab !== "clubs" ||
      !selectedChat?.id
    ) {
      return;
    }

    if (joinedClub?.id === selectedChat.id) {
      setMembersPreview(members);
      setMembersPreviewLoading(false);
      return;
    }

    let active = true;
    setMembersPreview([]);
    setMembersPreviewLoading(true);

    const loadMembers = async () => {
      try {
        const clubSnap = await getDoc(doc(db, "clubs", selectedChat.id));
        if (!clubSnap.exists()) {
          if (active) {
            setMembersPreview([]);
          }
          return;
        }

        const data: any = clubSnap.data();
        const rawIds: string[] = Array.isArray(data.members) ? data.members : [];
        const memberIds = Array.from(
          new Set(
            rawIds.filter((id) => typeof id === "string" && id.trim().length > 0)
          )
        );

        if (memberIds.length === 0) {
          if (active) {
            setMembersPreview([]);
          }
          return;
        }

        const fetched = await Promise.all(
          memberIds.map(async (uid) => {
            try {
              const snap = await getDoc(doc(db, "users", uid));
              if (!snap.exists()) {
                return {
                  id: uid,
                  name: uid,
                  avatar: null,
                  points: 0,
                } as ClubMember;
              }

              const profile: any = snap.data();
              const displayName =
                [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
                profile.username ||
                profile.usernameLowercase ||
                uid;
              const avatarUri =
                (typeof profile.photoURL === "string" && profile.photoURL.length > 0
                  ? profile.photoURL
                  : null) ||
                (typeof profile.avatar === "string" && profile.avatar.length > 0
                  ? profile.avatar
                  : null);
              const pointsValue = typeof profile.points === "number" ? profile.points : 0;

              return {
                id: uid,
                name: displayName,
                avatar: avatarUri,
                points: pointsValue,
              } as ClubMember;
            } catch {
              return {
                id: uid,
                name: uid,
                avatar: null,
                points: 0,
              } as ClubMember;
            }
          })
        );

        if (!active) return;

        const sorted = fetched
          .filter((entry): entry is ClubMember => Boolean(entry))
          .sort((a, b) => (b.points || 0) - (a.points || 0));

        setMembersPreview(sorted);
      } catch (error) {
        console.warn("[Social] load club members", error);
        if (active) {
          setMembersPreview([]);
        }
      } finally {
        if (active) {
          setMembersPreviewLoading(false);
        }
      }
    };

    loadMembers();

    return () => {
      active = false;
    };
  }, [view, selectedTab, selectedChat?.id, joinedClub?.id]);

  useEffect(() => {
    if (
      view === "members" &&
      selectedTab === "clubs" &&
      selectedChat?.id &&
      joinedClub?.id === selectedChat.id
    ) {
      setMembersPreview(members);
      setMembersPreviewLoading(false);
    }
  }, [members, view, selectedTab, selectedChat?.id, joinedClub?.id]);

  useEffect(() => {
    if (view !== "members") {
      setMembersPreview([]);
      setMembersPreviewLoading(false);
    }
  }, [view]);
  // plus d'onglet compétition

  const handleRemoveFriend = (friendId: string, friendName: string) => {
    Alert.alert(
      "Supprimer cet ami ?",
      `Tu ne verras plus ${friendName} dans ta liste d'amis.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFriend(friendId);
              setFriendsLive((prev) => prev.filter((entry) => entry.id !== friendId));
              setFriendProfiles((prev) => {
                if (!(friendId in prev)) return prev;
                const next = { ...prev };
                delete next[friendId];
                return next;
              });
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer cet ami pour le moment.");
            }
          },
        },
      ]
    );
  };

  const handleAcceptRequest = async (request: any) => {
    if (!currentUid) return;
    try {
      await acceptFriendRequest(currentUid, request.id, request.from);
    } catch (error) {
      console.warn("acceptFriendRequest error", error);
      Alert.alert("Erreur", "Impossible d'accepter la demande pour le moment.");
    }
  };

  const handleRejectRequest = async (request: any) => {
    if (!currentUid) return;
    try {
      await rejectFriendRequest(currentUid, request.id);
    } catch (error) {
      console.warn("rejectFriendRequest error", error);
      Alert.alert("Erreur", "Impossible de refuser la demande pour le moment.");
    }
  };

  const currentUid = auth.currentUser?.uid;

  const promptLeaveClub = (target?: Partial<ClubInfo> & { id: string }) => {
    const referenceClub = joinedClub ?? (target ? ({
      id: target.id,
      participants: target.participants ?? 0,
      name: target.name ?? "",
      desc: target.desc,
      visibility: target.visibility,
      emoji: target.emoji,
      photoUri: target.photoUri,
      city: target.city,
      ownerId: target.ownerId,
      officers: target.officers,
      logo: target.logo,
    } as ClubInfo) : null);

    if (!referenceClub) return;

    setPendingLeaveClub(referenceClub);
    setNewOwnerId(null);

    const ownerId = referenceClub.ownerId ?? joinedClub?.ownerId ?? null;

    let requiresTransfer = false;
    let shouldDelete = false;

    if (ownerId && ownerId === currentUid) {
      const candidates = members.filter((member) => member.id !== currentUid);
      if (candidates.length > 0) {
        requiresTransfer = true;
      } else {
        shouldDelete = true;
      }
    }

    setRequireOwnerTransfer(requiresTransfer);
    setDeleteOnLeave(shouldDelete);
    setLeaveConfirmVisible(true);
  };

  const clubRankingData = useMemo(() => {
    const roster = members.map((member) => ({
      ...member,
      isMe: member.id === currentUid,
    }));

    if (currentUid && !roster.some((m) => m.id === currentUid)) {
      roster.push({
        id: currentUid,
        name: user?.firstName ?? "Utilisateur",
        avatar: user?.photoURL ?? null,
        points: points || 0,
        isMe: true,
      } as any);
    }

    return roster
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .map((m, idx) => ({ ...m, rank: idx + 1 }));
  }, [members, points, user, currentUid]);

  const clanTotalPoints = useMemo(() => {
    const total = members.reduce((sum, member) => sum + (member.points || 0), 0);
    if (currentUid && members.some((member) => member.id === currentUid)) {
      return total;
    }
    return total + (points || 0);
  }, [members, points, currentUid]);

  // no early return; keep tabs visible in all views

  const handleLeaveClub = async () => {
    if (requireOwnerTransfer && !newOwnerId) {
      Alert.alert("Sélection requise", "Choisis un nouveau chef avant de quitter.");
      return;
    }

    setLeaveConfirmVisible(false);
    try {
      if (deleteOnLeave) {
        await deleteClub(pendingLeaveClub?.id);
      } else {
        if (requireOwnerTransfer && newOwnerId) {
          await transferOwnership(newOwnerId, pendingLeaveClub?.id);
        }
        await leaveClub(pendingLeaveClub?.id);
      }
      setView("main");
    } catch (error) {
      Alert.alert("Erreur", deleteOnLeave ? "Impossible de supprimer le club pour le moment." : "Impossible de quitter le club pour le moment.");
    } finally {
      setRequireOwnerTransfer(false);
      setDeleteOnLeave(false);
      setNewOwnerId(null);
      setPendingLeaveClub(null);
    }
  };

  // removed early return to keep hooks order stable

  // Friends: live requests and list
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const unsubReq = onSnapshot(collection(db, "users", uid, "friendRequests"), (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFriendRequests(arr);
    });
    const unsubFriends = onSnapshot(collection(db, "users", uid, "friends"), (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFriendsLive(arr);
    });
    return () => { unsubReq(); unsubFriends(); };
  }, []);

  useEffect(() => {
    if (!sentRequestIds.length) return;
    setSentRequestIds((prev) => {
      const filtered = prev.filter((id) => {
        const isFriend = friendsLive.some((f) => f.id === id) || friends.some((f) => f.id === id);
        const hasIncoming = friendRequests.some((req) => req.from === id);
        return !isFriend && !hasIncoming;
      });
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [friendsLive, friends, friendRequests]);

  // Load friend profile display info (usernameLowercase/username/firstName)
  useEffect(() => {
    const baseList = (friendsLive.length ? friendsLive : friends) as any[];
    const relevantIds = new Set<string>();
    baseList.forEach((entry) => {
      if (entry?.id) relevantIds.add(entry.id);
    });
    friendRequests.forEach((req) => {
      if (req?.from) relevantIds.add(req.from);
    });

    setFriendProfiles((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (!relevantIds.has(key)) {
          delete next[key];
        }
      });
      return next;
    });

    const ids = Array.from(relevantIds);
    if (!ids.length) return;
    const unsubs = ids.map((fid) =>
      onSnapshot(doc(db, "users", fid), (snap) => {
        const d = snap.data();
        setFriendProfiles((prev) => ({ ...prev, [fid]: { id: fid, ...d } }));
      })
    );
    return () => { unsubs.forEach((u) => u()); };
  }, [friendsLive, friends, friendRequests]);

  async function onFriendSearch(text: string) {
    setFriendSearchText(text);
    if (text.length < 2) return setFriendSearchResults([]);
    try {
      const users = await searchUsers(text);
      setFriendSearchResults(users);
    } catch (e) {
      console.warn("searchUsers error", e);
    }
  }

  async function onAddFriend(userId: string) {
    const alreadyFriend = friendsLive.some((f) => f.id === userId) || friends.some((f) => f.id === userId);
    if (alreadyFriend) {
      Alert.alert("Information", "Vous êtes déjà amis.");
      return;
    }

    if (sentRequestIds.includes(userId)) {
      Alert.alert("Demande envoyée", "En attente de réponse.");
      return;
    }

    const pendingIncoming = friendRequests.find((req) => req.from === userId);
    if (pendingIncoming) {
      Alert.alert("Demande reçue", "Cette personne t'a déjà envoyé une demande.");
      return;
    }

    setSentRequestIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    try {
      await sendFriendRequest(userId);
      Alert.alert("Demande envoyée !");
    } catch (e: any) {
      setSentRequestIds((prev) => prev.filter((id) => id !== userId));
      const message = typeof e?.message === "string" && e.message.length ? e.message : "Impossible d'envoyer la demande";
      Alert.alert("Erreur", message);
    }
  }

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isLight ? colors.background : darkBg },
    ]}> 
      <Text style={[styles.title, { color: colors.text }]}>Social</Text>
      <View style={[styles.tabSwitcher, { backgroundColor: isLight ? colors.surfaceAlt : "rgba(0, 151, 178, 0.1)" }]}>
        <TouchableOpacity
          style={[styles.switcherButton, selectedTab==='clubs' && { backgroundColor: colors.accent }]}
          onPress={() => setSelectedTab('clubs')}
        >
          <Text style={[styles.switcherText, { color: selectedTab==='clubs' ? colors.pillActive : colors.mutedText }]}>Club</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switcherButton, selectedTab==='amis' && { backgroundColor: colors.accent }]}
          onPress={() => setSelectedTab('amis')}
        >
          <Text style={[styles.switcherText, { color: selectedTab==='amis' ? colors.pillActive : colors.mutedText }]}>Amis</Text>
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
              <Text style={{ color: colors.text, fontFamily: FontFamilies.headingMedium, marginLeft: 8, flex: 1 }}>{joinedClub.name}</Text>
              <TouchableOpacity onPress={() => setShowClubQR(true)} style={{ marginRight: 10 }}>
                <Ionicons name="share-social-outline" size={18} color={colors.accent} />
              </TouchableOpacity>
              {joinedClub && (joinedClub.ownerId === auth.currentUser?.uid || (joinedClub.officers || []).includes(auth.currentUser?.uid ?? "")) && (
                <TouchableOpacity onPress={() => setView('joinRequests')} style={{ marginRight: 10 }}>
                  <Ionicons name="person-add" size={18} color={colors.accent} />
                  {clubJoinRequests.length > 0 && (
                    <View style={{ position: 'absolute', right: -6, top: -6, backgroundColor: '#D93636', borderRadius: 8, minWidth: 16, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 10 }}>{clubJoinRequests.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              <Ionicons name="leaf-outline" size={16} color={colors.accent} />
              <Text style={{ color: colors.accent, fontFamily: FontFamilies.bodyStrong, marginLeft: 6 }}>{clanTotalPoints} pts</Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={90}
                style={{ flex: 1 }}
              >
                <View style={{ flex: 1, paddingBottom: 100 }}>
                  <ChatView
                    selectedChat={{ ...joinedClub, type: 'club' }}
                    input={input}
                    setInput={setInput}
                    onBack={() => {}}
                    showBack={false}
                  />
                </View>
              </KeyboardAvoidingView>
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
              <Text style={{ fontFamily: FontFamilies.heading, color: "#0F3327" }}>➕ Créer un club</Text>
            </TouchableOpacity>
              {(clubs.some((c) => c.joined) ? clubs.filter((c) => c.joined) : clubs)
              .filter((c: any) => c.name.toLowerCase().includes(clubSearch.toLowerCase()) || ((c.city || "").toLowerCase().includes(clubSearch.toLowerCase())))
              .map((club, i) => (
                <ClubCard
                  key={club.id}
                  club={{ ...club, requestPending: requestedClubIds.includes(club.id) }}
                  onJoin={async () => {
                    if (!club.joined) {
                      const privateFlag = (club.isPrivate === true) || (club.visibility === 'private');
                      if (privateFlag) {
                        // send join request only, do NOT navigate to members view
                        try {
                          await requestJoinClub(club.id);
                          setRequestedClubIds((s) => Array.from(new Set([...s, club.id])));
                          Alert.alert('Demande envoyée', "Ta demande a été envoyée au chef du club.");
                        } catch (e) {
                          Alert.alert("Erreur", "Impossible d'envoyer la demande.");
                        }
                      } else {
                        // public club: add to members
                        try {
                          await joinClub(club.id);
                          // navigate to members/chat view
                          setSelectedChat({ ...club, type: "club" });
                          setView("members");
                        } catch (e) {
                          Alert.alert('Erreur', 'Impossible de rejoindre le club pour le moment.');
                        }
                      }
                    } else {
                      promptLeaveClub(club);
                    }
                  }}
                  onMembers={() => {
                    setSelectedChat({ ...club, type: "club" });
                    setView("members");
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

      {/* LISTE AMIS + RECHERCHE */}
      {selectedTab === "amis" && (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={[styles.searchContainer, { backgroundColor: colors.surfaceAlt, marginTop: 18 }]}> 
            <TextInput
              value={friendSearchText}
              onChangeText={onFriendSearch}
              placeholder="Rechercher un utilisateur..."
              placeholderTextColor={colors.mutedText}
              style={[styles.searchInput, { color: colors.text }]}
            />
            <TouchableOpacity onPress={() => setView('requests')} style={{ backgroundColor: colors.accent, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginLeft: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="mail-unread-outline" size={16} color={colors.pillActive} />
              <Text style={{ color: colors.pillActive, fontFamily: FontFamilies.heading }}>Demandes</Text>
              {friendRequests.length > 0 && (
                <View style={{ backgroundColor: '#E45353', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{friendRequests.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Search results with add friend */}
          {friendSearchResults.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: colors.text, fontFamily: FontFamilies.heading, marginBottom: 8 }}>Résultats</Text>
              {friendSearchResults.map((u) => {
                const profileName =
                  [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                  u.username ||
                  u.usernameLowercase ||
                  u.id;

                const usernameTag = u.usernameLowercase || u.username || null;
                const avatarUri =
                  (typeof u.photoURL === "string" && u.photoURL.length > 0 && u.photoURL) ||
                  (typeof u.avatar === "string" && u.avatar.length > 0 && u.avatar) ||
                  (typeof u.photoUri === "string" && u.photoUri.length > 0 && u.photoUri) ||
                  null;

                const initial = profileName.charAt(0).toUpperCase();
                const isFriend = friendsLive.some((f) => f.id === u.id) || friends.some((f) => f.id === u.id);
                const incomingRequest = friendRequests.find((req) => req.from === u.id);
                const hasSentRequest = sentRequestIds.includes(u.id);

                let actionNode: React.ReactNode | null = null;

                if (isFriend) {
                  actionNode = (
                    <View style={[styles.statusBadge, { backgroundColor: colors.surfaceAlt }]}> 
                      <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                      <Text style={[styles.statusText, { color: colors.text }]}>Ami</Text>
                    </View>
                  );
                } else if (incomingRequest) {
                  actionNode = (
                    <GradientButton
                      label="Accepter"
                      onPress={() => handleAcceptRequest(incomingRequest)}
                      style={{ minWidth: 120, flexShrink: 0 }}
                    />
                  );
                } else if (hasSentRequest) {
                  actionNode = (
                    <View style={[styles.statusBadge, { backgroundColor: colors.surfaceAlt }]}> 
                      <Ionicons name="hourglass" size={16} color={colors.mutedText} />
                      <Text style={[styles.statusText, { color: colors.mutedText }]}>Demandé</Text>
                    </View>
                  );
                } else {
                  actionNode = (
                    <GradientButton
                      label="Ajouter"
                      onPress={() => onAddFriend(u.id)}
                      style={{ minWidth: 120, flexShrink: 0 }}
                    />
                  );
                }

                return (
                  <View key={u.id} style={[styles.searchResultCard, { backgroundColor: colors.surface }]}> 
                    {avatarUri ? (
                      <Image source={{ uri: avatarUri }} style={styles.searchAvatar} />
                    ) : (
                      <View style={[styles.searchAvatar, styles.searchAvatarFallback]}> 
                        <Text style={styles.searchInitial}>{initial}</Text>
                      </View>
                    )}
                    <View style={styles.searchNames}>
                      <Text style={{ color: colors.text, fontFamily: FontFamilies.heading }}>{profileName}</Text>
                      {usernameTag ? (
                        <Text style={[styles.searchUsername, { color: colors.mutedText }]}>@{usernameTag}</Text>
                      ) : null}
                    </View>
                    {actionNode}
                  </View>
                );
              })}
            </View>
          )}
          {friendSearchText.length >= 2 && friendSearchResults.length === 0 && (
            <Text style={{ color: colors.mutedText, marginTop: 12 }}>Aucun résultat pour cette recherche.</Text>
          )}

          {/* Pending friend requests - REMOVED from here, moved to separate view */}

          {(() => {
            const primaryList = (friendsLive.length ? friendsLive : friends) as any[];
            const idSet = new Set<string>();
            primaryList.forEach((entry) => {
              if (entry?.id) idSet.add(entry.id);
            });
            Object.keys(friendProfiles).forEach((id) => idSet.add(id));

            const items = Array.from(idSet).map((id) => {
              const profile = friendProfiles[id] as any;
              const fallback =
                primaryList.find((item: any) => item?.id === id) ||
                (friends as any[]).find((item: any) => item?.id === id) ||
                {};

              const displayName =
                profile?.firstName ||
                profile?.username ||
                profile?.usernameLowercase ||
                fallback?.name ||
                id;

              const pointsValue =
                typeof profile?.points === 'number'
                  ? profile.points
                  : typeof fallback?.points === 'number'
                  ? fallback.points
                  : 0;

              const photoURL =
                typeof profile?.photoURL === 'string' && profile.photoURL.length > 0
                  ? profile.photoURL
                  : typeof fallback?.photoURL === 'string' && fallback.photoURL.length > 0
                  ? fallback.photoURL
                  : typeof fallback?.avatar === 'string' && fallback.avatar.length > 0
                  ? fallback.avatar
                  : '';

              const isOnline = Boolean(
                profile?.online !== undefined ? profile.online : fallback?.online
              );

              return {
                id,
                name: String(displayName),
                points: pointsValue,
                avatar: photoURL || null,
                online: isOnline,
              };
            });

            const filtered = items.filter((friend) =>
              friend.name.toLowerCase().includes(friendSearchText.trim().toLowerCase())
            );

            const sorted = filtered.sort((a, b) => (b.points || 0) - (a.points || 0));

            return sorted.map((friend, index) => (
              <FriendCard
                key={`${friend.id}-${index}`}
                friend={friend}
                rank={index + 1}
                isMe={friend.id === currentUid}
                onChat={() => {
                  setSelectedChat({ ...friend, type: "ami" });
                  setView("chat");
                }}
                actionIcon="trash-outline"
                onAction={() => handleRemoveFriend(friend.id, friend.name)}
              />
            ));
          })()}
        </ScrollView>
      )}
      {/* Friend Requests View */}
      {view === 'requests' && (
        <View style={{ position: 'absolute', top: 56, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, padding: 16 }}>
          <TouchableOpacity onPress={() => setView('main')} style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
            <Text style={{ color: colors.text, fontSize: 20, fontFamily: FontFamilies.heading, marginLeft: 10 }}>Demandes d'amis</Text>
          </TouchableOpacity>
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            {friendRequests.length === 0 ? (
              <View style={{ alignItems: 'center', marginTop: 50 }}>
                <Ionicons name="mail-open-outline" size={64} color={colors.mutedText} />
                <Text style={{ color: colors.mutedText, marginTop: 16, fontSize: 16 }}>Aucune demande reçue pour le moment.</Text>
              </View>
            ) : (
              friendRequests.map((r) => {
                const senderProfile = r.from ? friendProfiles[r.from] : undefined;
                const displayName =
                  r.fromName ||
                  [senderProfile?.firstName, senderProfile?.lastName].filter(Boolean).join(" ") ||
                  senderProfile?.username ||
                  senderProfile?.usernameLowercase ||
                  r.from;

                const avatarUri =
                  r.fromAvatar ||
                  senderProfile?.photoURL ||
                  senderProfile?.avatar ||
                  senderProfile?.photoUri ||
                  null;

                const initials = displayName ? displayName.charAt(0).toUpperCase() : "?";

                return (
                  <View key={r.id} style={[styles.requestCard, { backgroundColor: colors.surface, marginBottom: 12 }]}> 
                    <View style={styles.requestInfo}>
                      {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={styles.requestAvatar} />
                      ) : (
                        <View style={[styles.requestAvatar, { backgroundColor: colors.pill }]}> 
                          <Text style={[styles.requestInitial, { color: colors.text }]}>{initials}</Text>
                        </View>
                      )}
                      <View>
                        <Text style={[styles.requestName, { color: colors.text }]}>{displayName}</Text>
                        <Text style={[styles.requestMeta, { color: colors.mutedText }]}>souhaite devenir ton ami</Text>
                      </View>
                    </View>
                    <View style={styles.requestActions}>
                      <GradientButton
                        label="Accepter"
                        onPress={() => handleAcceptRequest(r)}
                        style={{ flex: 1 }}
                      />
                      <TouchableOpacity
                        onPress={() => handleRejectRequest(r)}
                        style={[styles.rejectBtn, { borderColor: "#F06262", backgroundColor: "transparent" }]}
                      >
                        <Text style={[styles.rejectText, { color: "#F06262" }]}>Refuser</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

      {/* Club join requests full-page view (for owners/officers) */}
      {view === 'joinRequests' && (
        <View style={{ position: 'absolute', top: 56, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, padding: 16 }}>
          <TouchableOpacity onPress={() => setView('main')} style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
            <Text style={{ color: colors.text, fontSize: 20, fontFamily: FontFamilies.heading, marginLeft: 10 }}>Demandes d'adhésion</Text>
          </TouchableOpacity>
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            {clubJoinRequests.length === 0 ? (
              <View style={{ alignItems: 'center', marginTop: 50 }}>
                <Ionicons name="person-add-outline" size={64} color={colors.mutedText} />
                <Text style={{ color: colors.mutedText, marginTop: 16, fontSize: 16 }}>Aucune demande pour le moment.</Text>
              </View>
            ) : (
              clubJoinRequests.map((r) => {
                const sender = r.userProfile || {};
                const displayName = (sender.firstName || sender.username || sender.usernameLowercase) ? ([sender.firstName, sender.lastName].filter(Boolean).join(' ').trim() || sender.username || sender.usernameLowercase) : r.userId;
                const avatarUri = sender.photoURL || sender.avatar || null;
                return (
                  <View key={r.id} style={[styles.requestCard, { backgroundColor: colors.surface, marginBottom: 12 }]}> 
                    <View style={styles.requestInfo}>
                      {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={styles.requestAvatar} />
                      ) : (
                        <View style={[styles.requestAvatar, { backgroundColor: colors.pill }]}> 
                          <Text style={[styles.requestInitial, { color: colors.text }]}>{(displayName || '?').charAt(0)}</Text>
                        </View>
                      )}
                      <View>
                        <Text style={[styles.requestName, { color: colors.text }]}>{displayName}</Text>
                        <Text style={[styles.requestMeta, { color: colors.mutedText }]}>souhaite rejoindre votre club</Text>
                      </View>
                    </View>
                    <View style={styles.requestActions}>
                      <GradientButton
                        label="Accepter"
                        onPress={() => handleAcceptClubRequest(r.userId)}
                        style={{ flex: 1 }}
                      />
                      <TouchableOpacity
                        onPress={() => handleRejectClubRequest(r.userId)}
                        style={[styles.rejectBtn, { borderColor: "#F06262", backgroundColor: "transparent" }]}
                      >
                        <Text style={[styles.rejectText, { color: "#F06262" }]}>Refuser</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

      {/* Create Club overlay */}
      {view === 'createClub' && (
        <View style={{ position: 'absolute', top: 56, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, padding: 16 }}>
          <TouchableOpacity onPress={() => setView('main')} style={{ marginBottom: 16 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            <Text style={{ color: colors.text, fontSize: 22, fontFamily: FontFamilies.heading, marginBottom: 6 }}>{editingClub ? 'Modifier le club' : 'Créer un club'}</Text>
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
                <Text style={{ color: colors.text, fontFamily: FontFamilies.bodyStrong, marginBottom: 6 }}>Ville</Text>
                <TextInput
                  value={newClubCity}
                  onChangeText={setNewClubCity}
                  placeholder="Ex: Bruxelles"
                  placeholderTextColor={colors.mutedText}
                  style={{ backgroundColor: colors.surfaceAlt, color: colors.text, padding: 14, borderRadius: 14, fontFamily: FontFamilies.bodyStrong }}
                />
              </View>
              <View>
                <Text style={{ color: colors.text, fontFamily: FontFamilies.bodyStrong, marginBottom: 6 }}>Nom du club</Text>
                <TextInput
                  value={newClubName}
                  onChangeText={setNewClubName}
                  placeholder="Ex: Eco Warriors"
                  placeholderTextColor={colors.mutedText}
                  style={{ backgroundColor: colors.surfaceAlt, color: colors.text, padding: 14, borderRadius: 14, fontFamily: FontFamilies.bodyStrong }}
                />
              </View>
              <View>
                <Text style={{ color: colors.text, fontFamily: FontFamilies.bodyStrong, marginBottom: 6 }}>Description</Text>
                <TextInput
                  multiline
                  value={newClubDesc}
                  onChangeText={setNewClubDesc}
                  numberOfLines={4}
                  style={{ backgroundColor: colors.surfaceAlt, color: colors.text, padding: 14, borderRadius: 14, minHeight: 110, textAlignVertical: 'top' }}
                  placeholder="Décris ton club..."
                  placeholderTextColor={colors.mutedText}
                />
              </View>
              <View>
                <Text style={{ color: colors.text, fontFamily: FontFamilies.bodyStrong, marginBottom: 6 }}>Photo (optionnel)</Text>
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
              {(() => {
                const accentHex = (colors.accent || '#22C55E').replace('#', '');
                const seeds = ['eco','leaf','earth','water','forest','sun','star','recycle','planet','nature','green','club1','club2','club3','city','river'];
                return (
                  <View>
                    <Text style={{ color: colors.text, fontFamily: FontFamilies.bodyStrong, marginBottom: 8 }}>Choisir un avatar</Text>
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
                <Text style={{ color: colors.text, fontFamily: FontFamilies.bodyStrong, marginBottom: 10 }}>Visibilité</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: newClubVisibility === 'public' ? colors.accent : colors.surfaceAlt, padding: 14, borderRadius: 14, alignItems: 'center' }}
                    onPress={() => setNewClubVisibility('public')}
                  >
                    <Text style={{ color: newClubVisibility === 'public' ? '#0F3327' : colors.text, fontFamily: FontFamilies.heading }}>Public</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: newClubVisibility === 'private' ? colors.accent : colors.surfaceAlt, padding: 14, borderRadius: 14, alignItems: 'center' }}
                    onPress={() => setNewClubVisibility('private')}
                  >
                    <Text style={{ color: newClubVisibility === 'private' ? '#0F3327' : colors.text, fontFamily: FontFamilies.heading }}>Privé</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={{ backgroundColor: (newClubName.trim() && newClubCity.trim()) ? colors.accent : colors.surfaceAlt, paddingVertical: 16, borderRadius: 18, alignItems: 'center' }}
                disabled={!(newClubName.trim() && newClubCity.trim())}
                onPress={async () => {
                  if (!(newClubName.trim() && newClubCity.trim())) return;
                  if (editingClub && joinedClub) {
                    await updateClub({ name: newClubName.trim(), desc: newClubDesc.trim(), visibility: newClubVisibility, photoUri: newClubPhoto || undefined, city: newClubCity.trim() });
                    setClubs((prev: any) => prev.map((c: any) => c.id === joinedClub.id ? { ...c, name: newClubName.trim(), desc: newClubDesc.trim(), city: newClubCity.trim(), photoUri: newClubPhoto || c.photoUri } : c));
                  } else {
                    await createClub({ name: newClubName.trim(), desc: newClubDesc.trim(), visibility: newClubVisibility, photoUri: newClubPhoto || undefined, city: newClubCity.trim() });
                  }
                  setEditingClub(false);
                  setNewClubName('');
                  setNewClubDesc('');
                  setNewClubVisibility('public');
                  setNewClubPhoto('');
                  setNewClubCity('');
                  setView('main');
                }}
              >
                <Text style={{ fontFamily: FontFamilies.heading, color: newClubName.trim() ? '#0F3327' : colors.mutedText }}>{editingClub ? 'Enregistrer' : 'Créer le club'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
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

      {/* Members overlay below tabs */}
      {selectedTab === 'clubs' && view === 'members' && (
        <View style={{ position: 'absolute', top: 56, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <TouchableOpacity onPress={() => setView('main')} style={{ marginRight: 8 }}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={{ color: colors.text, fontSize: 18, fontFamily: FontFamilies.heading, flex: 1 }}>
              Membres {selectedChat?.name ? `de ${selectedChat.name}` : 'du club'}
            </Text>
            {/* Show join requests icon only for owner or officers */}
              {joinedClub && (joinedClub.ownerId === auth.currentUser?.uid || (joinedClub.officers || []).includes(auth.currentUser?.uid ?? "")) && ( 
                <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => setView('joinRequests')}>
                <Ionicons name="person-add" size={20} color={colors.accent} />
                {clubJoinRequests.length > 0 && (
                  <View style={{ position: 'absolute', right: -6, top: -6, backgroundColor: '#D93636', borderRadius: 8, minWidth: 16, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 10 }}>{clubJoinRequests.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
          {membersPreviewLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : (
            <FlatList
              data={membersPreview}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item, index }) => {
                const role = joinedClub?.ownerId === item.id 
                  ? 'Chef' 
                  : (joinedClub?.officers || []).includes(item.id) 
                  ? 'Adjoint' 
                  : 'Membre';
                const canDelete = canDeleteMember(currentUid || null, item.id, joinedClub ?? null);

                return (
                  <View style={{
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    padding: 12,
                    marginBottom: 10,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}>
                    <Text style={{
                      fontFamily: FontFamilies.heading,
                      fontSize: 16,
                      color: colors.mutedText,
                      marginRight: 12,
                      width: 32,
                      textAlign: 'center',
                    }}>
                      #{index + 1}
                    </Text>

                    {item.avatar ? (
                      <Image
                        source={{ uri: item.avatar }}
                        style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
                      />
                    ) : (
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        marginRight: 12,
                        backgroundColor: colors.pill,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Text style={{ color: colors.text, fontFamily: FontFamilies.heading }}>
                          {(item.name || '?').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text
                        style={{
                          color: colors.text,
                          fontFamily: FontFamilies.headingMedium,
                          fontSize: 15,
                        }}
                        numberOfLines={1}
                      >
                        {item.name || item.id}
                      </Text>
                      <Text style={{
                        color: colors.mutedText,
                        fontSize: 12,
                        marginTop: 2
                      }}>
                        {role}
                      </Text>
                    </View>

                    <Text style={{
                      color: colors.accent,
                      fontFamily: FontFamilies.bodyStrong,
                      fontSize: 14,
                      marginRight: canDelete ? 8 : 0,
                    }}>
                      {item.points || 0} pts
                    </Text>
                    
                    {canDelete && (
                      <TouchableOpacity 
                        onPress={() => {
                          Alert.alert('Supprimer le membre', 'Êtes-vous sûr de vouloir supprimer ce membre ?', [
                            { text: 'Annuler', style: 'cancel' },
                            { text: 'Supprimer', style: 'destructive', onPress: () => handleRemoveMember(item.id) },
                          ]);
                        }} 
                        style={{ padding: 4 }}
                      >
                        <Ionicons name="trash-outline" size={20} color="#D93636" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
              contentContainerStyle={{ paddingBottom: 140 }}
              ListEmptyComponent={(
                <Text style={{ color: colors.mutedText, textAlign: 'center', marginTop: 24 }}>
                  Aucun membre à afficher.
                </Text>
              )}
            />
          )}
          {/* Global join requests modal (accessible from club header or members view) */}
          {joinRequestsVisible && (
            <View style={styles.modalOverlay}>
              <View style={[styles.modalCard, { backgroundColor: colors.surface }]}> 
                <Text style={[styles.modalTitle, { color: colors.text }]}>Demandes d'adhésion</Text>
                <View style={{ marginTop: 8 }}>
                  {clubJoinRequests.length === 0 ? (
                    <Text style={{ color: colors.mutedText, marginTop: 12 }}>Aucune demande.</Text>
                  ) : clubJoinRequests.map((r) => (
                    <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {r.userProfile?.photoURL ? (
                          <Image source={{ uri: r.userProfile.photoURL }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }} />
                        ) : (
                          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.pill, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                            <Text style={{ color: '#fff' }}>{(r.userProfile?.firstName || 'U').charAt(0)}</Text>
                          </View>
                        )}
                        <Text style={{ color: colors.text }}>{r.userProfile?.firstName || r.userId}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity onPress={() => handleAcceptClubRequest(r.userId)} style={[styles.modalBtn, { backgroundColor: colors.accent }]}> 
                          <Text style={{ color: '#0F3327' }}>Accepter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleRejectClubRequest(r.userId)} style={[styles.modalBtn, { backgroundColor: '#D93636' }]}> 
                          <Text style={{ color: '#fff' }}>Refuser</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.surfaceAlt }]} onPress={() => setJoinRequestsVisible(false)}>
                    <Text style={{ color: colors.text }}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          {/* duplicate join-requests modal removed (handlers already defined above) */}
        </View>
      )}

      {/* Club ranking overlay below tabs */}
      {selectedTab === 'clubs' && view === 'clubRanking' && (
        <View style={{ position: 'absolute', top: 56, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <TouchableOpacity onPress={() => setView('main')} style={{ marginRight: 8 }}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {joinedClub?.photoUri ? (
                  <Image source={{ uri: joinedClub.photoUri }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }} />
                ) : (
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.pill, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <Text style={{ fontSize: 16 }}>{joinedClub?.emoji || '🌿'}</Text>
                  </View>
                )}
                <Text style={{ color: colors.text, fontSize: 18, fontFamily: FontFamilies.heading, flex: 1 }}>{joinedClub?.name ?? ''}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
              <TouchableOpacity onPress={() => setShowClubQR(true)} style={{ backgroundColor: colors.surfaceAlt, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginRight: 8 }}>
                <Text style={{ color: colors.text, fontFamily: FontFamilies.bodyStrong }}>Partager</Text>
              </TouchableOpacity>
              {joinedClub?.ownerId === auth.currentUser?.uid && (
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
                <Text style={{ color: colors.text, fontFamily: FontFamilies.bodyStrong }}>Modifier</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => promptLeaveClub(joinedClub ?? undefined)}
              style={{ backgroundColor: '#D93636', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 }}
            >
              <Text style={{ color: '#fff', fontFamily: FontFamilies.heading }}>Quitter</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={clubRankingData}
            keyExtractor={(item) => String(item.id) + String(item.rank)}
            renderItem={({ item }) => (
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12, backgroundColor: item.isMe ? colors.accent : 'transparent' }}>
                <Text style={{ width: 30, textAlign: 'center', color: item.isMe ? '#0F3327' : colors.text, fontFamily: FontFamilies.heading }}>{item.rank}</Text>
                {(() => {
                  const avatarUri = item.isMe ? (user?.photoURL ?? null) : (item.avatar ?? null);
                  const displayLabel = item.isMe
                    ? (user?.firstName || user?.username || auth.currentUser?.email || "Moi")
                    : item.name || item.id;
                  const initials = displayLabel ? String(displayLabel).charAt(0).toUpperCase() : "?";
                  if (avatarUri) {
                    return (
                      <Image source={{ uri: avatarUri }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }} />
                    );
                  }
                  return (
                    <View style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pill }}>
                      <Text style={{ color: item.isMe ? '#0F3327' : colors.text, fontFamily: FontFamilies.heading }}>{initials}</Text>
                    </View>
                  );
                })()}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: item.isMe ? '#0F3327' : colors.text, fontFamily: item.isMe ? FontFamilies.heading : FontFamilies.body }}>{item.isMe ? (user?.firstName ?? "Utilisateur") : item.name}</Text>
                  {joinedClub && (
                    <Text style={{ color: item.isMe ? '#0F3327' : colors.mutedText, fontSize: 12 }}>
                      {joinedClub.ownerId === item.id
                        ? 'Chef'
                        : (joinedClub.officers || []).includes(item.id)
                          ? 'Adjoint'
                          : 'Membre'}
                    </Text>
                  )}
                </View>
                <Text style={{ color: item.isMe ? '#0F3327' : colors.accent, fontFamily: FontFamilies.bodyStrong }}>{item.points} pts</Text>
                {joinedClub?.ownerId === auth.currentUser?.uid && !item.isMe && (
                  (joinedClub?.officers || []).includes(item.id)
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {requireOwnerTransfer ? "Nommer un nouveau chef" : deleteOnLeave ? "Supprimer le club ?" : "Quitter le club"}
            </Text>
            {requireOwnerTransfer ? (
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: colors.mutedText, marginBottom: 10 }}>
                  Choisis le membre qui deviendra chef avant ton départ.
                </Text>
                {members
                  .filter((member) => member.id !== currentUid)
                  .map((member) => {
                    const selected = newOwnerId === member.id;
                    return (
                      <TouchableOpacity
                        key={member.id}
                        onPress={() => setNewOwnerId(member.id)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 12,
                          borderRadius: 12,
                          marginBottom: 8,
                          backgroundColor: selected ? colors.accent : colors.surfaceAlt,
                        }}
                      >
                        <Text style={{ color: selected ? '#0F3327' : colors.text, fontFamily: FontFamilies.headingMedium }}>{member.name}</Text>
                        <Text style={{ color: selected ? '#0F3327' : colors.mutedText }}>{member.points || 0} pts</Text>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            ) : (
              <Text style={{ color: colors.mutedText, marginTop: 6 }}>
                {deleteOnLeave
                  ? "Êtes-vous sûr de quitter ce club ? Cela entraînera sa suppression définitive."
                  : "Êtes-vous sûr de quitter le club ?"}
              </Text>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.accent }]}
                onPress={() => {
                  setLeaveConfirmVisible(false);
                  setRequireOwnerTransfer(false);
                  setDeleteOnLeave(false);
                  setNewOwnerId(null);
                  setPendingLeaveClub(null);
                }}
              >
                <Text style={{ color: '#0F3327', fontFamily: FontFamilies.heading }}>Rester</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#D93636' }]}
                disabled={requireOwnerTransfer && !newOwnerId}
                onPress={handleLeaveClub}
              >
                <Text style={{ color: '#fff', fontFamily: FontFamilies.heading, opacity: requireOwnerTransfer && !newOwnerId ? 0.5 : 1 }}>Quitter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 30, fontFamily: FontFamilies.display },
  tabSwitcher: { flexDirection: 'row', borderRadius: 24, padding: 4, marginTop: 20 },
  switcherButton: { flex: 1, borderRadius: 20, paddingVertical: 10, alignItems: 'center' },
  switcherText: { fontFamily: FontFamilies.headingMedium, fontSize: 15 },
  searchContainer: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  searchInput: { marginLeft: 8, flex: 1 },
  requestToggle: { marginBottom: 12, alignSelf: 'stretch' },
  requestCard: { borderRadius: 20, padding: 16, marginBottom: 12 },
  requestInfo: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  requestAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  requestInitial: { fontSize: 18, fontFamily: FontFamilies.heading },
  requestName: { fontSize: 16, fontFamily: FontFamilies.heading },
  requestMeta: { fontSize: 12, marginTop: 2 },
  requestActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  rejectBtn: { borderRadius: 18, paddingVertical: 12, paddingHorizontal: 18, borderWidth: 1 },
  rejectText: { fontFamily: FontFamilies.bodyStrong },
  searchResultCard: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 18, marginBottom: 10 },
  searchAvatar: { width: 42, height: 42, borderRadius: 21, marginRight: 12, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  searchAvatarFallback: { backgroundColor: "#23332D" },
  searchInitial: { color: "#fff", fontFamily: FontFamilies.heading, fontSize: 16 },
  searchNames: { flex: 1 },
  searchUsername: { fontSize: 12 },
  statusBadge: { borderRadius: 18, paddingVertical: 8, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 },
  statusText: { fontFamily: FontFamilies.bodyStrong },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 360, borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 18, fontFamily: FontFamilies.heading },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 10 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  memberCard: { borderRadius: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', padding: 12 },
  memberCardInner: { flexDirection: 'row', alignItems: 'center' },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, marginLeft: 8 },
  memberAvatarFallback: { width: 44, height: 44, borderRadius: 22, marginLeft: 8, alignItems: 'center', justifyContent: 'center' },
  memberInitial: { color: '#fff', fontFamily: FontFamilies.heading },
  memberName: { fontSize: 15, fontFamily: FontFamilies.headingMedium, color: '#0F3327' },
  memberPointsBadge: { backgroundColor: 'rgba(15, 51, 39, 0.08)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 14 },
  memberPoints: { fontSize: 12, fontFamily: FontFamilies.bodyStrong, color: '#0F3327' },
});

// QR modal instance for club sharing is rendered at root of this screen
// Placed outside the component export in previous code would not work; ensure inside component
