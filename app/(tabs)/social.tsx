import { useThemeMode } from "@/hooks/theme-context";
import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// Trouve cette ligne (vers la ligne 3) et ajoute Modal
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
import { useSubscriptions } from "@/hooks/subscriptions-context";
import { useUser } from "@/hooks/user-context";
import { acceptJoinRequest, rejectJoinRequest, removeMember, requestJoinClub } from "@/services/clubs";
import { acceptFriendRequest, rejectFriendRequest, removeFriend, searchUsers, sendFriendRequest } from "@/services/friends";
import { notifyFriendRequest, sendClubRequestToAdminsList } from "@/services/notifications";
import { useClassement } from "@/src/classement/hooks/useClassement";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { useEffect } from "react";

// 👇 AJOUTE CE BLOC DE THÈME AVANT LA FONCTION SocialScreen
const THEME = {
    bgGradient: ["#DDF7E8", "#F4FDF9"] as const,
    glassCardBg: ["rgba(240, 253, 244, 0.95)", "rgba(255, 255, 255, 0.85)"] as const,
    glassBorder: "rgba(255, 255, 255, 0.6)",
    textMain: "#0A3F33", 
    textMuted: "#4A665F",
    accentCoral: "#FF8C66",
    searchBg: "rgba(255, 255, 255, 0.6)", // Pour les barres de recherche
};

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
  // ✅ LOGIQUE : Annuler une demande d'adhésion à un club
  const cancelClubRequest = async (clubId: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
        // Supprime le doc dans la sous-collection du club
        await deleteDoc(doc(db, "clubs", clubId, "joinRequests", uid));
        // Met à jour l'état local
        setRequestedClubIds((prev) => prev.filter((id) => id !== clubId));
        Alert.alert("Annulé", "Demande d'adhésion annulée.");
    } catch (e) {
        console.error(e);
        Alert.alert("Erreur", "Impossible d'annuler la demande.");
    }
  };

  // ✅ LOGIQUE : Annuler une demande d'ami envoyée
  const cancelFriendReq = async (targetId: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
        // Dans Firebase, la demande est stockée chez le destinataire
        // On doit trouver l'ID du doc de demande chez l'autre user où from == moi
        // C'est complexe sans l'ID direct.
        // SIMPLIFICATION : On utilise une Cloud Function normalement.
        // ICI : On suppose qu'on a accès en écriture (règles de sécu à vérifier) ou on utilise une logique connue.
        // Hack: On ne peut souvent pas annuler facilement sans stocker l'ID de la demande.
        // Si tu as accès à 'friendRequests' de l'autre :
        const q = query(collection(db, "users", targetId, "friendRequests"), where("from", "==", uid));
        const snap = await getDocs(q);
        snap.forEach(async (d) => {
            await deleteDoc(d.ref);
        });
        
        setSentRequestIds((prev) => prev.filter((id) => id !== targetId));
        Alert.alert("Annulé", "Demande d'ami annulée.");
    } catch (e) {
        Alert.alert("Erreur", "Impossible d'annuler.");
    }
  };

  // ✅ LOGIQUE : Nettoyage automatique des autres demandes quand on rejoint un club
  const cleanupOtherRequests = async (joinedClubId: string) => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      // On parcourt tous les clubs où on avait fait une demande (sauf celui qu'on rejoint)
      const toClean = requestedClubIds.filter(id => id !== joinedClubId);
      
      for (const clubId of toClean) {
          try {
              await deleteDoc(doc(db, "clubs", clubId, "joinRequests", uid));
          } catch (e) {
              console.log("Cleanup error for", clubId, e);
          }
      }
      // On vide la liste locale
      setRequestedClubIds([]);
  };

  // ✅ LOGIQUE : Correction de la hiérarchie de suppression
  const canDeleteMember = (actorId: string | null, targetId: string | undefined, club?: ClubInfo | null) => {
    if (!actorId || !targetId || !club) return false;
    if (actorId === targetId) return false; // On ne se supprime pas soi-même ici

    const ownerId = club.ownerId;
    const officers = club.officers || [];

    const actorIsOwner = ownerId === actorId;
    const actorIsOfficer = officers.includes(actorId);
    
    const targetIsOwner = ownerId === targetId;
    const targetIsOfficer = officers.includes(targetId);

    // Le Chef peut tout supprimer sauf lui-même (déjà géré)
    if (actorIsOwner) return true;

    // Un Officier peut supprimer un Membre, mais PAS un autre Officier ni le Chef
    if (actorIsOfficer) {
        return !targetIsOfficer && !targetIsOwner;
    }

    return false;
  };
  const { user } = useUser();

  // Utilise le classement global (défis validés)
  const { users: classementUsers } = useClassement();
  // Map pour accès rapide par id
  const classementPointsMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const user of classementUsers) {
      map.set(user.uid, user.rankingPoints);
    }
    return map;
  }, [classementUsers]);
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
  const [isLeaving, setIsLeaving] = useState(false);

  // ✅ FIX STABILITÉ : Cet effet ne doit se lancer QUE si les params changent, pas le club.
  // On utilise une ref pour suivre si on a déjà traité les params initiaux.
  const paramsProcessed = useRef(false);

  useEffect(() => {
    if (paramsProcessed.current) return; // Ne rien faire si déjà traité

    const viewParam = (params?.view as string) || "";
    const tabParam = (params?.tab as string) || "";

    if (tabParam === "clubs") setSelectedTab("clubs");
    if (tabParam === "amis") setSelectedTab("amis");

    if (viewParam === "clubRanking") {
        setSelectedTab("clubs");
        setView("clubRanking");
        paramsProcessed.current = true; // On marque comme traité
    }
  }, [params]); // On ne dépend PLUS de joinedClub ici

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
 
  
  // ✅ FIX: Cet effet ne se lance QUE si les paramètres de navigation changent
  // Il ne se lancera PLUS quand tu modifies le club ou promeus quelqu'un
  useEffect(() => {
    const viewParam = (params?.view as string) || "";
    // On ne force la vue que si le paramètre est présent ET qu'on n'y est pas déjà
    if (viewParam === "clubRanking" && view !== "clubRanking" && joinedClub) {
       setSelectedTab("clubs");
       setView("clubRanking");
    }
  }, [params?.view, joinedClub?.id]); // On ne dépend plus de tout l'objet joinedClub

  useEffect(() => {
    setInput("");
  }, [selectedChat?.id, joinedClub?.id]);

  // Chargement des membres du club sélectionné
  useEffect(() => {
    // Si on n'est pas sur la vue membres, on ne fait rien
    if (view !== "members") {
      return;
    }
    
    // Si on regarde notre propre club, on utilise les données du contexte (plus rapide/stable)
    if (selectedChat?.id && joinedClub?.id === selectedChat.id) {
        setMembersPreview(members);
        setMembersPreviewLoading(false);
        return;
    }

    // Sinon, logique de chargement existante...
    if (!selectedChat?.id) {
      setMembersPreview([]);
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

              // ✅ MODIF 1 : Prioriser le username, sinon prénom/nom
              const displayName = 
                profile.username || 
                [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() || 
                profile.usernameLowercase || 
                uid;

              const avatarUri =
                (typeof profile.photoURL === "string" && profile.photoURL.length > 0
                  ? profile.photoURL
                  : null);

              const pointsValue = classementPointsMap.get(uid) ?? 0;

              // ✅ MODIF 2 : Récupérer la couleur personnalisée
              return {
                id: uid,
                name: displayName,
                avatar: avatarUri,
                points: pointsValue,
                avatarColor: profile.avatarColor || "#19D07D", // Récupère la couleur ou vert par défaut
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
  }, [view, selectedChat?.id, joinedClub, members, classementPointsMap]);

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

  // ✅ FIX RE-APPLIED: TypeScript error "Expected 0 arguments, but got 1" resolved by ensuring the function correctly handles an optional argument.
  const promptLeaveClub = (targetClub?: ClubInfo) => {
    const clubToLeave = targetClub || joinedClub;
    
    if (!clubToLeave) {
        Alert.alert("Erreur", "Aucun club sélectionné.");
        return;
    }

    setPendingLeaveClub(clubToLeave);
    setNewOwnerId(null);

    const isOwner = clubToLeave.ownerId === auth.currentUser?.uid;
    // On vérifie le nombre de membres via le contexte si c'est notre club, sinon via l'info passée
    const memberCount = (clubToLeave.id === joinedClub?.id) ? members.length : clubToLeave.participants;

    let requiresTransfer = false;
    let shouldDelete = false;

    if (isOwner) {
      if (memberCount > 1) {
        requiresTransfer = true; // Il reste du monde, il faut un nouveau chef
      } else {
        shouldDelete = true; // Je suis tout seul, le club sera supprimé
      }
    }

    setRequireOwnerTransfer(requiresTransfer);
    setDeleteOnLeave(shouldDelete);
    setLeaveConfirmVisible(true);
  };

  const clubRankingData = useMemo(() => {
    const roster = (members || []).map((member) => {
      const isMe = member.id === currentUid;
      let name = member.name || '';
      let avatar = member.avatar || null;
      let avatarColor = '#19D07D';
      let username = '';
      let initials = '';
      let profile = isMe ? user : friendProfiles[member.id];
      if (profile) {
        username = profile.username || profile.firstName || profile.lastName || name || member.id;
        avatarColor = profile.avatarColor || '#19D07D';
        avatar = profile.photoURL || avatar;
        name = profile.username || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || name || member.id;
        initials = (profile.username || profile.firstName || profile.lastName || name || member.id)
          .split(' ')
          .map((n: string) => typeof n === 'string' ? n[0] : '')
          .join('').toUpperCase().slice(0, 2) || (isMe ? 'M' : '?');
      } else {
        initials = (name || member.id)
          .split(' ')
          .map((n: string) => typeof n === 'string' ? n[0] : '')
          .join('').toUpperCase().slice(0, 2) || (isMe ? 'M' : '?');
      }
      return {
        ...member,
        isMe,
        points: classementPointsMap.get(member.id) ?? 0,
        avatarColor,
        username,
        initials,
        name,
        avatar,
      };
    });

    if (currentUid && !roster.some((m) => m.id === currentUid)) {
      roster.push({
        id: currentUid,
        name: user?.username || user?.firstName || user?.lastName || 'Moi',
        avatar: user?.photoURL || null,
        avatarColor: user?.avatarColor || '#19D07D',
        username: user?.username || user?.firstName || user?.lastName || 'Moi',
        initials: (user?.username || user?.firstName || user?.lastName || 'Moi')
          .split(' ')
          .map((n: string) => n && typeof n === 'string' ? n[0] : '')
          .join('').toUpperCase().slice(0, 2) || 'M',
        points: classementPointsMap.get(currentUid) ?? 0,
        isMe: true,
      });
    }

    return roster
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .map((m, idx) => ({ ...m, rank: idx + 1 }));
  }, [members, user, currentUid, classementPointsMap]);

const clanTotalPoints = useMemo(() => {
    // ✅ NOUVEAU CODE SÉCURISÉ (Ajout de || [])
    return (members || []).reduce((sum, member) => sum + (classementPointsMap.get(member.id) ?? 0), 0);
  }, [members, classementPointsMap]);

  const handleLeaveClub = async () => {
    if (requireOwnerTransfer && !newOwnerId) {
      Alert.alert("Sélection requise", "Choisis un nouveau chef avant de quitter.");
      return;
    }

    if (!pendingLeaveClub?.id) return;

    // 1. On active le bouclier (écran de chargement)
    setIsLeaving(true);
    setLeaveConfirmVisible(false); 

    try {
      if (deleteOnLeave) {
        await deleteClub(pendingLeaveClub.id);
      } else {
        if (requireOwnerTransfer && newOwnerId) {
          await transferOwnership(newOwnerId, pendingLeaveClub.id);
        }
        await leaveClub(pendingLeaveClub.id);
      }setTimeout(() => {
          setPendingLeaveClub(null);
          setIsLeaving(false);
          setView("main"); // On force la vue liste
      }, 300);
      
    
  Alert.alert(
  "Succès",
  deleteOnLeave ? "Club supprimé." : "Tu as quitté le club.",
  [
    {
      text: "OK",
      onPress: () => {
        setPendingLeaveClub(null);
        setView("main");
      }
    }
  ]
);

// Remettre isLeaving à false juste après l’alert
setIsLeaving(false);

    } catch (error: any) {
      console.error(error);
      setIsLeaving(false); // En cas d'erreur, on enlève le bouclier
      Alert.alert("Erreur", error.message || "Impossible de quitter le club.");
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
      const username = user?.username || user?.firstName || 'Un utilisateur';
      await notifyFriendRequest(userId, username);
      Alert.alert("Demande envoyée !");
    } catch (e: any) {
      setSentRequestIds((prev) => prev.filter((id) => id !== userId));
      const message = typeof e?.message === "string" && e.message.length ? e.message : "Impossible d'envoyer la demande";
      Alert.alert("Erreur", message);
    }
  }

  // Définition du composant de fond
  const BackgroundComponent = isLight ? LinearGradient : View;
  const bgProps = isLight 
    ? { colors: THEME.bgGradient, style: StyleSheet.absoluteFill } 
    : { style: [StyleSheet.absoluteFill, { backgroundColor: "#021114" }] };

  return (
    <View style={{ flex: 1 }}>
      {/* Le Fond d'écran global */}
      <BackgroundComponent {...(bgProps as any)} />


   

   
      <SafeAreaView style={[styles.container, { backgroundColor: "transparent" }]}> 
      <Text style={[styles.title, { color: isLight ? THEME.textMain : colors.text }]}>Social</Text>
      
      {/* TAB SWITCHER GLASSMORPHISM */}
      <View style={{ marginTop: 20, marginBottom: 10 }}>
        <LinearGradient
            colors={isLight ? THEME.glassCardBg : ["rgba(0, 151, 178, 0.1)", "rgba(0, 151, 178, 0.05)"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ 
                flexDirection: 'row', 
                padding: 6, 
                borderRadius: 24, 
                borderWidth: 1, 
                borderColor: isLight ? THEME.glassBorder : "rgba(255,255,255,0.1)" 
            }}
        >
            <TouchableOpacity
                style={[
                    styles.switcherButton, 
                    selectedTab === 'clubs' && { 
                        backgroundColor: isLight ? "#008F6B" : colors.accent,
                        shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
                    }
                ]}
                onPress={() => setSelectedTab('clubs')}
            >
                <Text style={[
                    styles.switcherText, 
                    { color: selectedTab === 'clubs' ? '#FFFFFF' : (isLight ? THEME.textMuted : colors.mutedText) }
                ]}>
                    Club
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.switcherButton, 
                    selectedTab === 'amis' && { 
                        backgroundColor: isLight ? "#008F6B" : colors.accent,
                        shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
                    }
                ]}
                onPress={() => setSelectedTab('amis')}
            >
                <Text style={[
                    styles.switcherText, 
                    { color: selectedTab === 'amis' ? '#FFFFFF' : (isLight ? THEME.textMuted : colors.mutedText) }
                ]}>
                    Amis
                </Text>
            </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* CLUBS */}
      {selectedTab === "clubs" && (
        joinedClub ? (
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => setView("clubRanking")} activeOpacity={0.9}>
                <LinearGradient
                    colors={isLight ? THEME.glassCardBg : ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{
                        flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 10, marginTop: 10,
                        borderRadius: 20,
                        borderWidth: 1, borderColor: isLight ? THEME.glassBorder : "rgba(255,255,255,0.1)"
                    }}
                >
                    {joinedClub?.photoUri ? (
                        <Image source={{ uri: joinedClub.photoUri }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                    ) : (
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isLight ? "#E0F7EF" : colors.pill, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 20 }}>{joinedClub?.emoji || '🌿'}</Text>
                        </View>
                    )}
                    
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={{ color: isLight ? THEME.textMain : colors.text, fontFamily: FontFamilies.heading, fontSize: 18 }}>{joinedClub.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                            <Ionicons name="leaf" size={14} color={isLight ? "#008F6B" : colors.accent} />
                            <Text style={{ color: isLight ? "#008F6B" : colors.accent, fontFamily: FontFamilies.bodyStrong, marginLeft: 4 }}>{clanTotalPoints} pts</Text>
                        </View>
                    </View>

                    {/* Boutons d'action (Share / Requests) */}
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        {joinedClub && (joinedClub.ownerId === auth.currentUser?.uid || (joinedClub.officers || []).includes(auth.currentUser?.uid ?? "")) && (
                            <TouchableOpacity onPress={() => setView('joinRequests')} style={{ position: 'relative' }}>
                                <Ionicons name="person-add-outline" size={24} color={isLight ? THEME.textMuted : colors.text} />
                                {clubJoinRequests.length > 0 && (
                                    <View style={{ position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: 5, backgroundColor: THEME.accentCoral }} />
                                )}
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => setShowClubQR(true)}>
                            <Ionicons name="qr-code-outline" size={24} color={isLight ? THEME.textMuted : colors.text} />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={90}
                style={{ flex: 1 }}
              >
                <View style={{ flex: 1, paddingBottom: 100 }}>
                  <ChatView
                    selectedChat={{
                      ...joinedClub,
                      type: 'club',
                      name: joinedClub.ownerId === auth.currentUser?.uid ? 'Moi' : joinedClub.name,
                      username: joinedClub.ownerId === auth.currentUser?.uid ? 'Moi' : joinedClub.name,
                      avatarColor: joinedClub.ownerId === auth.currentUser?.uid ? (user?.avatarColor || '#19D07D') : '#19D07D',
                      initials: joinedClub.ownerId === auth.currentUser?.uid ? 'M' : (joinedClub.name ? joinedClub.name.charAt(0).toUpperCase() : 'C'),
                    }}
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
          {/* SEARCH CLUB */}
          <LinearGradient
            colors={isLight ? ["rgba(240, 253, 244, 0.95)", "rgba(255, 255, 255, 0.85)"] : ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"]}
            style={{ 
                flexDirection: 'row', alignItems: 'center', marginTop: 18, marginBottom: 12, 
                padding: 4, borderRadius: 18, borderWidth: 1, borderColor: isLight ? "rgba(255,255,255,0.6)" : "transparent"
            }}
          >
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
                <Ionicons name="search" size={20} color={colors.mutedText} />
                <TextInput
                    value={clubSearch}
                    onChangeText={setClubSearch}
                    placeholder="Trouver un club..."
                    placeholderTextColor={colors.mutedText}
                    style={{ flex: 1, marginLeft: 10, color: colors.text, height: 44, fontSize: 15 }}
                />
            </View>
          </LinearGradient>

          {/* CREATE BUTTON */}
          <TouchableOpacity onPress={() => setView("createClub")} activeOpacity={0.9}>
            <LinearGradient
                colors={isLight ? ["#FF9D7E", "#FF8C66"] : [colors.accent, colors.accent]}
                start={{x:0, y:0}} end={{x:1, y:0}}
                style={{ borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginBottom: 16, shadowColor: isLight ? "#FF8C66" : "#000", shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 }}
            >
                <Text style={{ fontFamily: FontFamilies.heading, color: "#FFF", fontSize: 16 }}>➕ Créer un club</Text>
            </LinearGradient>
          </TouchableOpacity>
              {(clubs.some((c) => c.joined) ? clubs.filter((c) => c.joined) : clubs)
              .filter((c: any) => c.name.toLowerCase().includes(clubSearch.toLowerCase()) || ((c.city || "").toLowerCase().includes(clubSearch.toLowerCase())))
              .map((club, i) => (
                <ClubCard
                  key={club.id}
                  club={{ ...club, requestPending: requestedClubIds.includes(club.id) }}
                  onJoin={async () => {
                    // CAS 1: ANNULATION DEMANDE
                    if (requestedClubIds.includes(club.id)) {
                        Alert.alert("Annuler", "Veux-tu annuler ta demande ?", [
                            { text: "Non", style: "cancel" },
                            { text: "Oui", style: "destructive", onPress: () => cancelClubRequest(club.id) }
                        ]);
                        return;
                    }

                    if (!club.joined) {
                      const privateFlag = (club.isPrivate === true) || (club.visibility === 'private');
                      if (privateFlag) {
                        // Demande pour club Privé
                        try {
                          await requestJoinClub(club.id);
                          setRequestedClubIds((s) => Array.from(new Set([...s, club.id])));
                          const adminIds = [...(club.officers || []), club.ownerId];
                          const username = user?.username || user?.firstName || 'Un utilisateur';
                          if(adminIds.length > 0) {
                            await sendClubRequestToAdminsList(adminIds, club.name, username);
                          }
                          Alert.alert('Envoyé', "Demande envoyée au chef.");
                        } catch (e) {
                          Alert.alert("Erreur", "Impossible d'envoyer la demande.");
                        }
                      } else {
                        // Rejoindre club Public
                        try {
                          await joinClub(club.id);
                          // ✅ AUTO-CANCEL : On nettoie les autres demandes
                          cleanupOtherRequests(club.id);
                          
                          setSelectedChat({ ...club, type: "club" });
                          setView("members");
                        } catch (e) {
                          Alert.alert('Erreur', 'Impossible de rejoindre.');
                        }
                      }
                    } else {
                      promptLeaveClub(club);
                    }
                  }}
                  // ... le reste des props (onMembers, onRanking...) reste identique
                  onMembers={() => { setSelectedChat({ ...club, type: "club" }); setView("members"); }}
                  onRanking={() => { if (club.joined) setView("clubRanking"); }}
                  totalPoints={club.joined ? clanTotalPoints : undefined}
                />
              ))}
          </ScrollView>
        )
      )}

      {/* LISTE AMIS + RECHERCHE */}
      {selectedTab === "amis" && (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={{ marginTop: 18, marginBottom: 12 }}>
            <LinearGradient
                colors={isLight ? THEME.glassCardBg : ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{
                    flexDirection: "row", alignItems: "center", padding: 4, borderRadius: 20,
                    borderWidth: 1, borderColor: isLight ? THEME.glassBorder : "rgba(255,255,255,0.1)"
                }}
            >
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
                    <Ionicons name="search" size={20} color={colors.mutedText} />
                    <TextInput
                        value={friendSearchText}
                        onChangeText={onFriendSearch}
                        placeholder="Rechercher un utilisateur..."
                        placeholderTextColor={colors.mutedText}
                        style={[styles.searchInput, { color: colors.text, height: 44 }]}
                    />
                </View>
                
                <TouchableOpacity onPress={() => setView('requests')} style={{ 
                    backgroundColor: isLight ? "#E0F7EF" : colors.accent, 
                    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16, 
                    flexDirection: 'row', alignItems: 'center', gap: 6, margin: 4
                }}>
                    <Ionicons name="mail-unread-outline" size={18} color={isLight ? "#008F6B" : colors.pillActive} />
                    {friendRequests.length > 0 && (
                        <View style={{ backgroundColor: '#FF8C66', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}>
                            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{friendRequests.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </LinearGradient>
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
                    <TouchableOpacity 
                        onPress={() => cancelFriendReq(u.id)}
                        style={[styles.statusBadge, { backgroundColor: "#FFE4E4", borderWidth: 1, borderColor: "#FFCDCD" }]}
                    >
                      <Ionicons name="close-circle" size={16} color="#D93636" />
                      <Text style={[styles.statusText, { color: "#D93636" }]}>Annuler</Text>
                    </TouchableOpacity>
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
                  <LinearGradient
                    key={u.id}
                    // MODIF: Couleurs ajustées pour le mode sombre (Effet Menthe Givrée Dark)
                    colors={isLight ? ["rgba(255,255,255,0.8)", "rgba(255,255,255,0.4)"] : ["rgba(0, 151, 178, 0.15)", "rgba(0, 151, 178, 0.05)"]}
                    style={[
                      styles.searchResultCard, 
                      { 
                        borderWidth: 1, 
                        // MODIF: Bordure bleutée en mode sombre
                        borderColor: isLight ? "rgba(255,255,255,0.6)" : "rgba(0, 151, 178, 0.3)" 
                      }
                    ]}
                  >
                    {avatarUri ? (
                      <Image source={{ uri: avatarUri }} style={styles.searchAvatar} />
                    ) : (
                      // ✅ MODIF 6 : Avatar recherche dynamique
                      (() => {
                        const avatarBg = u.avatarColor || "#19D07D"; // Couleur de la recherche
                        const isWhiteBg = ["#FFFFFF", "#ffffff", "#fff", "#FFF"].includes(avatarBg);
                        // Utilisation du username ou nom pour l'initiale
                        const nameForInitial = u.username || u.firstName || "?"; 
                        const initial = nameForInitial.charAt(0).toUpperCase();

                        return (
                          <View style={{ 
                            width: 42, height: 42, borderRadius: 21, marginRight: 12, 
                            backgroundColor: avatarBg, 
                            alignItems: "center", justifyContent: "center", overflow: "hidden",
                            borderWidth: 1, borderColor: isLight ? "rgba(0,0,0,0.1)" : "transparent"
                          }}>
                            <Text style={{ 
                              color: isWhiteBg ? "#1A1A1A" : "#fff", 
                              fontFamily: FontFamilies.heading, fontSize: 16 
                            }}>
                              {initial}
                            </Text>
                          </View>
                        )
                      })()
                    )}
                    {/* ✅ MODIF 7 : Afficher le Username en gros s'il existe */}
                    <View style={styles.searchNames}>
                      <Text style={{ color: isLight ? "#0A3F33" : colors.text, fontFamily: FontFamilies.heading }}>
                        {u.username || [u.firstName, u.lastName].filter(Boolean).join(" ") || "Inconnu"}
                      </Text>
                      {/* Affiche le prénom en petit si on a affiché le username en gros, ou inversement, selon ta préférence */}
                    </View>
                    {actionNode}
                  </LinearGradient>
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

            const items = Array.from(idSet).map((id) => {
              const profile = friendProfiles[id] as any;
              const fallback =
                primaryList.find((item: any) => item?.id === id) ||
                (friends as any[]).find((item: any) => item?.id === id) ||
                {};

              // Username harmonisé
              const username = profile?.username || fallback?.username || "";
              // Prénom/Nom harmonisé
              const firstName = profile?.firstName || fallback?.firstName || "";
              const lastName = profile?.lastName || fallback?.lastName || "";

              // Initiales harmonisées
              let initials = "";
              if (username) {
                initials = username
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
              } else if (firstName || lastName) {
                initials = [firstName, lastName]
                  .filter(Boolean)
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
              } else if (profile?.usernameLowercase) {
                initials = profile.usernameLowercase.substring(0, 2).toUpperCase();
              } else {
                initials = id.substring(0, 2).toUpperCase();
              }

              // Couleur avatar harmonisée
              const avatarColor = profile?.avatarColor || fallback?.avatarColor || "#19D07D";
              const isWhiteBg = ["#FFFFFF", "#ffffff", "#fff", "#FFF"].includes(avatarColor);

              // Nom affiché harmonisé
              const displayName = username || `${firstName} ${lastName}`.trim() || profile?.usernameLowercase || fallback?.name || id;

              const pointsValue = classementPointsMap.get(id) ?? 0;
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
                avatarColor,
                initials,
                isWhiteBg,
                username,
                online: isOnline,
              };
            });

            // Filtre de recherche
            const filtered = items.filter((friend) =>
              friend.name.toLowerCase().includes(friendSearchText.trim().toLowerCase())
            );

            // Tri par points du classement
            const sorted = filtered.sort((a, b) => (classementPointsMap.get(b.id) || 0) - (classementPointsMap.get(a.id) || 0));

            return sorted.map((friend, index) => (
              <FriendCard
                key={`${friend.id}-${index}`}
                friend={{
                  ...friend,
                  points: classementPointsMap.get(friend.id) || 0,
                  avatarColor: friend.avatarColor,
                  initials: friend.initials,
                  username: friend.id === currentUid ? "Moi" : friend.username,
                  name: friend.id === currentUid ? "Moi" : friend.name,
                  isWhiteBg: friend.isWhiteBg,
                }}
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
      {view === 'requests' && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 60 }}>
          <LinearGradient colors={isLight ? ["#DDF7E8", "#F4FDF9"] : [darkBg, darkBg]} style={StyleSheet.absoluteFill} />
          <SafeAreaView style={{ flex: 1, paddingHorizontal: 20 }}>
            <TouchableOpacity onPress={() => setView('main')} style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                <Ionicons name="arrow-back" size={24} color={isLight ? "#0A3F33" : colors.text} />
                <Text style={{ color: isLight ? "#0A3F33" : colors.text, fontSize: 22, fontFamily: FontFamilies.heading, marginLeft: 10 }}>Demandes d'amis</Text>
            </TouchableOpacity>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {friendRequests.length === 0 ? (
                    <View style={{ alignItems: 'center', marginTop: 100 }}>
                        <Ionicons name="mail-open-outline" size={60} color={isLight ? "rgba(0,143,107,0.2)" : colors.mutedText} />
                        <Text style={{ color: isLight ? "#4A665F" : colors.mutedText, marginTop: 16, fontSize: 16 }}>Aucune demande reçue.</Text>
                    </View>
                ) : (
                    friendRequests.map((r) => {
                        const senderProfile = r.from ? friendProfiles[r.from] : undefined;
                        const isMe = r.from === currentUid;
                        let username = '';
                        let avatarColor = '';
                        let initials = '';
                        let displayName = '';
                        if (isMe) {
                          username = user?.username || '';
                          avatarColor = user?.avatarColor || '#19D07D';
                          initials = (user?.username || user?.firstName || user?.lastName || 'Moi').split(' ').map((n) => n && typeof n === 'string' ? n[0] : '').join('').toUpperCase().slice(0, 2) || 'M';
                          displayName = 'Moi';
                        } else {
                          username = senderProfile?.username || senderProfile?.firstName || senderProfile?.lastName || r.fromName || r.from;
                          avatarColor = senderProfile?.avatarColor || '#19D07D';
                          initials = (senderProfile?.username || senderProfile?.firstName || senderProfile?.lastName || r.fromName || r.from)
                            .split(' ')
                            .map((n: string) => typeof n === 'string' ? n[0] : '')
                            .join('').toUpperCase().slice(0, 2) || '?';
                          displayName = senderProfile?.username || [senderProfile?.firstName, senderProfile?.lastName].filter(Boolean).join(' ') || r.fromName || r.from;
                        }
                        const avatarUri = r.fromAvatar || senderProfile?.photoURL || null;

                        return (
                          <LinearGradient
                            key={r.id}
                            colors={isLight ? ["rgba(255,255,255,0.9)", "rgba(255,255,255,0.6)"] : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
                            style={{ padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: isLight ? "rgba(255,255,255,0.6)" : "transparent" }}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                              {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12 }} />
                              ) : (
                                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: avatarColor, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                  <Text style={{ color: ["#FFFFFF", "#fff", "#ffffff", "#FFF"].includes(avatarColor) ? "#1A1A1A" : "#fff", fontSize: 20, fontWeight: 'bold' }}>{initials}</Text>
                                </View>
                              )}
                              <View>
                                <Text style={{ color: isLight ? "#0A3F33" : colors.text, fontSize: 17, fontFamily: FontFamilies.heading }}>{displayName}</Text>
                                <Text style={{ color: isLight ? "#4A665F" : colors.mutedText }}>veut être ton ami</Text>
                              </View>
                            </View>
                            <View style={{ flexDirection: "row", gap: 10 }}>
                              <GradientButton label="Accepter" onPress={() => handleAcceptRequest(r)} style={{ flex: 1, height: 44, borderRadius: 14 }} />
                              <TouchableOpacity onPress={() => handleRejectRequest(r)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: "#F45B69", borderRadius: 14, height: 44 }}>
                                <Text style={{ color: "#F45B69", fontWeight: "bold" }}>Refuser</Text>
                              </TouchableOpacity>
                            </View>
                          </LinearGradient>
                        );
                    })
                )}
            </ScrollView>
          </SafeAreaView>
        </View>
      )}

      {view === 'joinRequests' && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 60 }}>
          <LinearGradient colors={isLight ? ["#DDF7E8", "#F4FDF9"] : [darkBg, darkBg]} style={StyleSheet.absoluteFill} />
          <SafeAreaView style={{ flex: 1, paddingHorizontal: 20 }}>
            <TouchableOpacity onPress={() => setView('main')} style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                <Ionicons name="arrow-back" size={24} color={isLight ? "#0A3F33" : colors.text} />
                <Text style={{ color: isLight ? "#0A3F33" : colors.text, fontSize: 22, fontFamily: FontFamilies.heading, marginLeft: 10 }}>Adhésions Club</Text>
            </TouchableOpacity>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {clubJoinRequests.length === 0 ? (
                    <View style={{ alignItems: 'center', marginTop: 100 }}>
                        <Ionicons name="people-outline" size={60} color={isLight ? "rgba(0,143,107,0.2)" : colors.mutedText} />
                        <Text style={{ color: isLight ? "#4A665F" : colors.mutedText, marginTop: 16, fontSize: 16 }}>Aucune demande d'adhésion.</Text>
                    </View>
                ) : (
                    clubJoinRequests.map((r) => {
                        const sender = r.userProfile || {};
                        const isMe = r.userId === currentUid;
                        let username = '';
                        let avatarColor = '';
                        let initials = '';
                        let displayName = '';
                        if (isMe) {
                          username = user?.username || '';
                          avatarColor = user?.avatarColor || '#19D07D';
                          initials = (user?.username || user?.firstName || user?.lastName || 'Moi').split(' ').map((n) => n && typeof n === 'string' ? n[0] : '').join('').toUpperCase().slice(0, 2) || 'M';
                          displayName = 'Moi';
                        } else {
                          username = sender.username || sender.firstName || sender.lastName || r.userId;
                          avatarColor = sender.avatarColor || '#19D07D';
                          initials = (sender.username || sender.firstName || sender.lastName || r.userId)
                            .split(' ')
                            .map((n: string) => typeof n === 'string' ? n[0] : '')
                            .join('').toUpperCase().slice(0, 2) || '?';
                          displayName = sender.username || [sender.firstName, sender.lastName].filter(Boolean).join(' ') || r.userId;
                        }
                        const avatarUri = sender.photoURL || null;

                        return (
                          <LinearGradient
                            key={r.id}
                            colors={isLight ? ["rgba(255,255,255,0.9)", "rgba(255,255,255,0.6)"] : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
                            style={{ padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: isLight ? "rgba(255,255,255,0.6)" : "transparent" }}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                              {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12 }} />
                              ) : (
                                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: avatarColor, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                  <Text style={{ color: ["#FFFFFF", "#fff", "#ffffff", "#FFF"].includes(avatarColor) ? "#1A1A1A" : "#fff", fontSize: 20, fontWeight: 'bold' }}>{initials}</Text>
                                </View>
                              )}
                              <View>
                                <Text style={{ color: isLight ? "#0A3F33" : colors.text, fontSize: 17, fontFamily: FontFamilies.heading }}>{displayName}</Text>
                                <Text style={{ color: isLight ? "#4A665F" : colors.mutedText }}>veut rejoindre le club</Text>
                              </View>
                            </View>
                            <View style={{ flexDirection: "row", gap: 10 }}>
                              <GradientButton label="Accepter" onPress={() => handleAcceptClubRequest(r.userId)} style={{ flex: 1, height: 44, borderRadius: 14 }} />
                              <TouchableOpacity onPress={() => handleRejectClubRequest(r.userId)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: "#F45B69", borderRadius: 14, height: 44 }}>
                                <Text style={{ color: "#F45B69", fontWeight: "bold" }}>Refuser</Text>
                              </TouchableOpacity>
                            </View>
                          </LinearGradient>
                        );
                    })
                )}
            </ScrollView>
          </SafeAreaView>
        </View>
      )}

      {view === 'createClub' && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}>
          {/* Fond Dégradé */}
          <LinearGradient colors={isLight ? ["#F0FDF4", "#FFF"] : [darkBg, darkBg]} style={StyleSheet.absoluteFill} />
          
          {/* ✅ MAGIE ICI : On ferme le clavier si on touche le fond */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={{ flex: 1 }}>
                
                <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
                    <TouchableOpacity onPress={() => setView('main')} style={{ marginBottom: 16, width: 40 }}>
                        <Ionicons name="arrow-back" size={24} color={isLight ? "#0A3F33" : colors.text} />
                    </TouchableOpacity>
                    <Text style={{ color: isLight ? "#0A3F33" : colors.text, fontSize: 24, fontFamily: FontFamilies.heading, marginBottom: 20 }}>
                        {editingClub ? 'Modifier le club' : 'Créer un club'}
                    </Text>
                </View>

                {/* ✅ AJOUT : keyboardShouldPersistTaps="handled" permet de cliquer sur les boutons même clavier ouvert */}
                <ScrollView 
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} 
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* PHOTO */}
                    <View style={{ alignItems: 'center', marginBottom: 24 }}>
                        <TouchableOpacity onPress={async () => {
                            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                            if (perm.status !== 'granted') return;
                            const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
                            if (!res.canceled) setNewClubPhoto(res.assets[0].uri);
                        }}>
                            {newClubPhoto ? (
                                <Image source={{ uri: newClubPhoto }} style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: "#FFF" }} />
                            ) : (
                                <LinearGradient
                                    colors={isLight ? ["#D1FAE5", "#A7F3D0"] : [colors.surfaceAlt, colors.surface]}
                                    style={{ width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: isLight ? "#FFF" : "transparent" }}
                                >
                                    <Ionicons name="camera" size={40} color={isLight ? "#059669" : colors.mutedText} />
                                </LinearGradient>
                            )}
                            <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: isLight ? "#008F6B" : colors.accent, padding: 8, borderRadius: 20, borderWidth: 2, borderColor: "#FFF" }}>
                                <Ionicons name="pencil" size={14} color="#FFF" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* CHAMPS DE TEXTE */}
                    <View style={{ gap: 16 }}>
                        <View>
                            <Text style={{ color: isLight ? "#4A665F" : colors.mutedText, marginBottom: 6, fontWeight: '600' }}>Nom du club</Text>
                            <TextInput
                                value={newClubName}
                                onChangeText={setNewClubName}
                                placeholder="Ex: Les Éco-Warriors"
                                placeholderTextColor={colors.mutedText}
                                style={{ 
                                    backgroundColor: isLight ? "rgba(255,255,255,0.7)" : colors.surfaceAlt, 
                                    borderWidth: 1, borderColor: isLight ? "rgba(0,143,107,0.2)" : "transparent",
                                    borderRadius: 16, padding: 14, fontSize: 16, color: isLight ? "#0A3F33" : colors.text 
                                }}
                            />
                        </View>

                        <View>
                            <Text style={{ color: isLight ? "#4A665F" : colors.mutedText, marginBottom: 6, fontWeight: '600' }}>Ville</Text>
                            <TextInput
                                value={newClubCity}
                                onChangeText={setNewClubCity}
                                placeholder="Ex: Paris"
                                placeholderTextColor={colors.mutedText}
                                style={{ 
                                    backgroundColor: isLight ? "rgba(255,255,255,0.7)" : colors.surfaceAlt, 
                                    borderWidth: 1, borderColor: isLight ? "rgba(0,143,107,0.2)" : "transparent",
                                    borderRadius: 16, padding: 14, fontSize: 16, color: isLight ? "#0A3F33" : colors.text 
                                }}
                            />
                        </View>

                        <View>
                            <Text style={{ color: isLight ? "#4A665F" : colors.mutedText, marginBottom: 6, fontWeight: '600' }}>Description</Text>
                            <TextInput
                                value={newClubDesc}
                                onChangeText={setNewClubDesc}
                                placeholder="Décrivez votre mission..."
                                placeholderTextColor={colors.mutedText}
                                multiline
                                // blurOnSubmit={true} // Optionnel : ferme le clavier si on appuie sur Entrée (mais empêche les sauts de ligne)
                                style={{ 
                                    backgroundColor: isLight ? "rgba(255,255,255,0.7)" : colors.surfaceAlt, 
                                    borderWidth: 1, borderColor: isLight ? "rgba(0,143,107,0.2)" : "transparent",
                                    borderRadius: 16, padding: 14, fontSize: 16, color: isLight ? "#0A3F33" : colors.text,
                                    height: 100, textAlignVertical: 'top'
                                }}
                            />
                        </View>

                        {/* VISIBILITÉ */}
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                            {['public', 'private'].map((v) => (
                                <TouchableOpacity 
                                    key={v}
                                    onPress={() => setNewClubVisibility(v as any)}
                                    style={{ 
                                        flex: 1, padding: 14, borderRadius: 16, alignItems: 'center',
                                        backgroundColor: newClubVisibility === v ? (isLight ? "#008F6B" : colors.accent) : (isLight ? "rgba(255,255,255,0.5)" : colors.surfaceAlt),
                                        borderWidth: 1, borderColor: newClubVisibility === v ? "transparent" : (isLight ? "rgba(0,143,107,0.1)" : "transparent")
                                    }}
                                >
                                    <Text style={{ 
                                        color: newClubVisibility === v ? "#FFF" : (isLight ? "#4A665F" : colors.mutedText), 
                                        fontWeight: 'bold', textTransform: 'capitalize' 
                                    }}>{v === 'public' ? 'Public' : 'Privé'}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* BOUTON VALIDATION */}
                        <TouchableOpacity
                            style={{ 
                                marginTop: 20, backgroundColor: (newClubName.trim() && newClubCity.trim()) ? (isLight ? "#FF8C66" : colors.accent) : colors.surfaceAlt,
                                paddingVertical: 16, borderRadius: 20, alignItems: 'center',
                                shadowColor: isLight ? "#FF8C66" : "#000", shadowOpacity: 0.3, shadowOffset: {width: 0, height: 4}, shadowRadius: 8
                            }}
                            disabled={!(newClubName.trim() && newClubCity.trim())}
                            onPress={async () => {
                                if (!(newClubName.trim() && newClubCity.trim())) return;
                                if (editingClub && joinedClub) {
                                    await updateClub({ name: newClubName.trim(), desc: newClubDesc.trim(), visibility: newClubVisibility, photoUri: newClubPhoto || undefined, city: newClubCity.trim() });
                                    setClubs((prev: any) => prev.map((c: any) => c.id === joinedClub.id ? { ...c, name: newClubName.trim(), desc: newClubDesc.trim(), city: newClubCity.trim(), photoUri: newClubPhoto || c.photoUri } : c));
                                } else {
                                    await createClub({ name: newClubName.trim(), desc: newClubDesc.trim(), visibility: newClubVisibility, photoUri: newClubPhoto || undefined, city: newClubCity.trim() });
                                }
                                setEditingClub(false); setNewClubName(''); setNewClubDesc(''); setNewClubVisibility('public'); setNewClubPhoto(''); setNewClubCity(''); setView('main');
                            }}
                        >
                            <Text style={{ fontSize: 18, fontFamily: FontFamilies.heading, color: "#FFF" }}>
                                {editingClub ? 'Enregistrer les modifications' : 'Créer le club'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </View>
      )}
      {/* 👇 BLOC FOND OPAQUE (LOADER) 👇 */}
      {isLeaving && (
        <View style={{ 
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
          zIndex: 9999, 
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: isLight ? "#F0FDF4" : "#021114" 
        }}>
           <ActivityIndicator size="large" color={colors.accent} />
           <Text style={{ marginTop: 20, fontFamily: FontFamilies.heading, color: colors.text }}>
             Mise à jour en cours...
           </Text>
        </View>
      )}

      {/* 👇 MODALE CONFIRMATION QUITTER 👇 */}
      {leaveConfirmVisible && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 9998,
          backgroundColor: 'rgba(0,0,0,0.6)',
          alignItems: 'center', justifyContent: 'center',
          padding: 20
        }}>
          <View style={{
            backgroundColor: isLight ? '#fff' : '#1F2937', 
            borderRadius: 24,
            padding: 24,
            width: '100%',
            maxWidth: 320,
            borderWidth: 1,
            borderColor: isLight ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
            shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 10, elevation: 5
          }}>
            <Text style={{ 
                fontSize: 20, 
                fontFamily: FontFamilies.heading, 
                marginBottom: 12,
                color: isLight ? '#0A3F33' : '#F9FAFB', 
                textAlign: 'center'
            }}>
              Quitter le club ?
            </Text>
            
            <Text style={{ 
                marginBottom: 24, 
                color: isLight ? '#4A665F' : '#9CA3AF', 
                textAlign: 'center',
                lineHeight: 20,
                fontFamily: FontFamilies.body
            }}>
              Êtes-vous sûr de vouloir quitter ce club ? Vous ne pourrez plus participer aux défis d'équipe.
            </Text>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity 
                  onPress={() => setLeaveConfirmVisible(false)}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: isLight ? '#F0FDF4' : 'rgba(255,255,255,0.1)', alignItems: 'center' }}
              >
                <Text style={{ color: isLight ? '#008F6B' : '#FFF', fontFamily: FontFamilies.headingMedium }}>Rester</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                  onPress={handleLeaveClub}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: '#FF8C66', alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontFamily: FontFamilies.headingMedium }}>Quitter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* MODALE QR CODE (Déjà en bas normalement) */}
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

{/* VUE MEMBRES - STYLE MODERNE */}
      {selectedTab === 'clubs' && view === 'members' && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}>
          {/* 1. Fond Dégradé Global */}
          <LinearGradient colors={isLight ? ["#DDF7E8", "#F4FDF9"] : [darkBg, darkBg]} style={StyleSheet.absoluteFill} />
          
          <SafeAreaView style={{ flex: 1, paddingHorizontal: 20 }}>
            {/* 2. Header Moderne */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 }}>
              <TouchableOpacity onPress={() => setView('main')} style={{ marginRight: 12, padding: 4, borderRadius: 12, backgroundColor: isLight ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.1)" }}>
                <Ionicons name="arrow-back" size={24} color={isLight ? "#0A3F33" : colors.text} />
              </TouchableOpacity>
              <Text style={{ color: isLight ? "#0A3F33" : colors.text, fontSize: 24, fontFamily: FontFamilies.heading, flex: 1 }}>
                Membres
              </Text>
              
              {/* Bouton Demandes (Si Admin) */}
              {joinedClub && (joinedClub.ownerId === auth.currentUser?.uid || (joinedClub.officers || []).includes(auth.currentUser?.uid ?? "")) && ( 
                <TouchableOpacity 
                    style={{ backgroundColor: isLight ? "#E0F7EF" : colors.surfaceAlt, padding: 10, borderRadius: 14 }} 
                    onPress={() => setView('joinRequests')}
                >
                    <Ionicons name="person-add" size={20} color={isLight ? "#008F6B" : colors.accent} />
                    {clubJoinRequests.length > 0 && (
                        <View style={{ position: 'absolute', right: -2, top: -2, backgroundColor: '#FF8C66', borderRadius: 6, width: 10, height: 10, borderWidth: 1, borderColor: '#FFF' }} />
                    )}
                </TouchableOpacity>
              )}
            </View>

            {/* 3. Liste des Membres Stylisée */}
            {membersPreviewLoading ? (
              <ActivityIndicator size="large" color={isLight ? "#008F6B" : colors.accent} style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={membersPreview}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => {

                // --- ROLES & PERMISSIONS ---
                const targetIsOwner = joinedClub?.ownerId === item.id;
                const targetIsOfficer = (joinedClub?.officers || []).includes(item.id);
                const targetIsMember = !targetIsOwner && !targetIsOfficer;
                const roleLabel = targetIsOwner ? 'Chef' : targetIsOfficer ? 'Adjoint' : 'Membre';

                const myUid = auth.currentUser?.uid;
                const iAmOwner = joinedClub?.ownerId === myUid;
                const iAmOfficer = (joinedClub?.officers || []).includes(myUid ?? "");
                const isMe = item.id === myUid;
                const canManageUser = !isMe && (iAmOwner || (iAmOfficer && targetIsMember));

                // --- LOGIQUE HEADER POUR AVATAR/NOM (robuste) ---
                const displayName = (item.name ?? '').trim() || 'Utilisateur';
                const initials = displayName.split(' ').map((n: string) => n && typeof n === 'string' ? n[0] : '').join('').toUpperCase().slice(0, 2) || '?';
                // Optionally, generate a color from the id for variety
                const avatarColors = ['#19D07D', '#008F6B', '#FF8C66', '#FFD700', '#38BDF8', '#A78BFA'];
                const avatarBgColor = avatarColors[Math.abs(item.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % avatarColors.length];
                const isWhiteBg = ["#FFFFFF", "#ffffff", "#fff", "#FFF"].includes(avatarBgColor);
                const borderColor = isLight ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 151, 178, 0.3)";
                const textColor = isLight ? "#0A3F33" : colors.text;

                // --- PREMIUM/OWNER badge logic (optional, can be extended) ---
                // const isPremium = item.isPremium; // If available

                return (
                  <LinearGradient
                    colors={isLight 
                        ? (isMe ? ["#D1FAE5", "#E0F7EF"] : ["rgba(240, 253, 244, 0.9)", "rgba(255, 255, 255, 0.6)"]) 
                        : (isMe ? ["rgba(0, 143, 107, 0.2)", "rgba(0, 143, 107, 0.1)"] : ["rgba(0, 151, 178, 0.2)", "rgba(0, 151, 178, 0.05)"])
                    }
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ 
                        flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 10, borderRadius: 24,
                        borderWidth: 1, borderColor: isMe ? (isLight ? "#A7F3D0" : colors.accent) : borderColor,
                    }}
                  >
                    {/* 1. RANG (Badge style Header) */}
                    <View style={{ 
                        width: 32, height: 32, borderRadius: 12, 
                        backgroundColor: isMe ? (isLight ? "#FF8C66" : colors.accent) : (isLight ? "#FFF" : "rgba(255,255,255,0.1)"),
                        alignItems: 'center', justifyContent: 'center', marginRight: 12
                    }}>
                        <Text style={{ 
                            fontFamily: FontFamilies.heading, 
                            fontSize: 14, 
                            color: isMe ? (isLight ? "#FFF" : "#07321F") : textColor 
                        }}>
                            #{index + 1}
                        </Text>
                    </View>

                    {/* 2. AVATAR (Logique Header + étoile chef) */}
                    <View style={{ position: 'relative', marginHorizontal: 12 }}>
                      {item.avatar ? (
                        <Image 
                          source={{ uri: item.avatar }} 
                          style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: isLight ? "#FFF" : "rgba(255,255,255,0.1)" }} 
                        />
                      ) : (
                        <View style={{ 
                          width: 48, height: 48, borderRadius: 24, 
                          backgroundColor: avatarBgColor,
                          alignItems: 'center', justifyContent: 'center',
                          borderWidth: 2, borderColor: isLight ? "#FFF" : "rgba(255,255,255,0.1)"
                        }}>
                          <Text style={{ 
                            color: isWhiteBg ? "#1A1A1A" : "#FFFFFF", 
                            fontFamily: FontFamilies.heading, fontSize: 20 
                          }}>
                            {initials}
                          </Text>
                        </View>
                      )}
                      {/* Étoile chef */}
                      {targetIsOwner && (
                        <View style={{ position: 'absolute', right: -6, top: -6, backgroundColor: 'transparent' }}>
                          <Ionicons name="star" size={22} color="#FFD700" style={{ textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }} />
                        </View>
                      )}
                    </View>

                    {/* 3. NOM & ROLE (Typography Header) */}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ color: textColor, fontFamily: FontFamilies.heading, fontSize: 17 }} numberOfLines={1}>
                            {isMe ? "Moi" : displayName}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                            {!targetIsMember && (
                                <View style={{ backgroundColor: roleLabel === 'Chef' ? (isLight ? '#FFEFD5' : 'rgba(245, 158, 11, 0.2)') : (isLight ? '#E0F2FE' : 'rgba(56, 189, 248, 0.2)'), paddingHorizontal: 6, borderRadius: 6, marginRight: 6 }}>
                                    <Text style={{ fontSize: 10, fontFamily: FontFamilies.bodyStrong, color: roleLabel === 'Chef' ? (isLight ? '#B7791F' : '#FCD34D') : (isLight ? '#0284C7' : '#38BDF8') }}>
                                        {roleLabel.toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            <Text style={{ color: isLight ? "#4A665F" : colors.mutedText, fontFamily: FontFamilies.body, fontSize: 13 }}>
                                {classementPointsMap.get(item.id) || 0} pts
                            </Text>
                        </View>
                    </View>

                    {/* 4. ACTIONS (Icones épurées) */}
                    {canManageUser && (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {targetIsMember && (
                                <TouchableOpacity onPress={() => Alert.alert("Promouvoir", `Nommer ${displayName} Adjoint ?`, [{ text: "Annuler" }, { text: "Oui", onPress: () => promoteToOfficer(item.id) }])} 
                                    style={{ padding: 8, backgroundColor: isLight ? "#F0FDF4" : "rgba(0,143,107,0.2)", borderRadius: 12 }}>
                                    <Ionicons name="arrow-up" size={18} color="#008F6B" />
                                </TouchableOpacity>
                            )}
                            {targetIsOfficer && iAmOwner && (
                                <TouchableOpacity onPress={() => Alert.alert("Rétrograder", `Retirer le grade d'adjoint ?`, [{ text: "Annuler" }, { text: "Oui", onPress: () => demoteOfficer(item.id) }])} 
                                    style={{ padding: 8, backgroundColor: isLight ? "#FFFBEB" : "rgba(245, 158, 11, 0.2)", borderRadius: 12 }}>
                                    <Ionicons name="arrow-down" size={18} color="#F59E0B" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={() => Alert.alert("Exclure", `Retirer ${displayName} ?`, [{ text: "Annuler" }, { text: "Exclure", style: "destructive", onPress: () => handleRemoveMember(item.id) }])} 
                                style={{ padding: 8, backgroundColor: isLight ? "#FEF2F2" : "rgba(239, 68, 68, 0.2)", borderRadius: 12 }}>
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    )}
                  </LinearGradient>
                );
              }}
              />
            )}
          </SafeAreaView>
        </View>
      )}

      {selectedTab === 'clubs' && view === 'clubRanking' && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}>
          {/* FOND GLOBAL */}
          <LinearGradient colors={isLight ? ["#DDF7E8", "#F4FDF9"] : [darkBg, darkBg]} style={StyleSheet.absoluteFill} />
          
          <SafeAreaView style={{ flex: 1, paddingHorizontal: 20 }}>
            {/* HEADER */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 }}>
              <TouchableOpacity onPress={() => setView('main')} style={{ marginRight: 12, padding: 4 }}>
                <Ionicons name="arrow-back" size={24} color={isLight ? "#0A3F33" : colors.text} />
              </TouchableOpacity>
              
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                 {joinedClub?.photoUri ? (
                    <Image source={{ uri: joinedClub.photoUri }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }} />
                 ) : (
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isLight ? "#E0F7EF" : colors.pill, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                        <Text style={{ fontSize: 18 }}>{joinedClub?.emoji || '🌿'}</Text>
                    </View>
                 )}
                 <Text style={{ color: isLight ? "#0A3F33" : colors.text, fontSize: 20, fontFamily: FontFamilies.heading }} numberOfLines={1}>
                    {joinedClub?.name}
                 </Text>
              </View>
            </View>

            {/* BOUTONS ACTIONS (Logique Chef/Membre) */}
            <View style={{ flexDirection: 'row', marginBottom: 20, gap: 10 }}>
    {/* CHEF : MODIFIER */}
    {joinedClub?.ownerId === auth.currentUser?.uid ? (
        <TouchableOpacity 
            onPress={() => {
                if (!joinedClub) return;
                setEditingClub(true);
                setNewClubName(joinedClub.name || '');
                setNewClubDesc(joinedClub.desc || '');
                setNewClubVisibility((joinedClub.visibility as any) || 'public');
                setNewClubPhoto(joinedClub.photoUri || '');
                setNewClubCity(joinedClub.city || '');
                setView('createClub');
            }} 
            style={{ flex: 1, backgroundColor: isLight ? "rgba(255,255,255,0.6)" : "rgba(0, 151, 178, 0.15)", paddingVertical: 12, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: isLight ? "rgba(255,255,255,0.8)" : "rgba(0, 151, 178, 0.3)" }}
        >
            <Ionicons name="create-outline" size={20} color={isLight ? "#0A3F33" : "#fff"} />
            <Text style={{ color: isLight ? "#0A3F33" : "#fff", fontFamily: FontFamilies.headingMedium }}>Modifier</Text>
        </TouchableOpacity>
    ) : (
        // MEMBRE : PARTAGER
        <TouchableOpacity 
            onPress={() => setShowClubQR(true)} 
            style={{ flex: 1, backgroundColor: isLight ? "rgba(255,255,255,0.6)" : "rgba(0, 151, 178, 0.15)", paddingVertical: 12, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: isLight ? "rgba(255,255,255,0.8)" : "rgba(0, 151, 178, 0.3)" }}
        >
            <Ionicons name="share-social-outline" size={20} color={isLight ? "#0A3F33" : "#fff"} />
            <Text style={{ color: isLight ? "#0A3F33" : "#fff", fontFamily: FontFamilies.headingMedium }}>Partager</Text>
        </TouchableOpacity>
    )}

    {/* TOUT LE MONDE : QUITTER */}
    <TouchableOpacity
        onPress={() => {
            if (joinedClub) promptLeaveClub(joinedClub);
        }}
        style={{ 
            flex: 1, 
            backgroundColor: isLight ? "rgba(255,255,255,0.6)" : "rgba(0, 151, 178, 0.15)", 
            paddingVertical: 12, 
            borderRadius: 16, 
            alignItems: 'center', 
            borderWidth: 1, 
            borderColor: isLight ? "rgba(255,255,255,0.8)" : "rgba(0, 151, 178, 0.3)"
        }}
    >
        <Text style={{ color: isLight ? "#0A3F33" : "#fff", fontFamily: FontFamilies.headingMedium }}>Quitter</Text>
    </TouchableOpacity>
</View>

            {/* LISTE DES MEMBRES AVEC GESTION HIERARCHIQUE */}
            <FlatList
              data={clubRankingData}
              keyExtractor={(item) => String(item.id) + String(item.rank)}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {

                // --- 1. IDENTIFICATION DES RÔLES ---
                const targetIsOwner = joinedClub?.ownerId === item.id;
                const targetIsOfficer = (joinedClub?.officers || []).includes(item.id);
                const targetIsMember = !targetIsOwner && !targetIsOfficer;
                const roleLabel = targetIsOwner ? 'Chef' : targetIsOfficer ? 'Adjoint' : 'Membre';

                // --- 2. IDENTIFICATION DE "MOI" ---
                const myUid = auth.currentUser?.uid;
                const iAmOwner = joinedClub?.ownerId === myUid;
                const iAmOfficer = (joinedClub?.officers || []).includes(myUid ?? "");
                const isMe = item.id === myUid;
                const canManageUser = !isMe && (iAmOwner || (iAmOfficer && targetIsMember));

                // --- LOGIQUE HEADER POUR AVATAR/NOM (robuste et harmonisée) ---
                let displayName = (item.name ?? '').trim() || 'Utilisateur';
                let initials = '';
                let avatarBgColor = '';
                let username = '';
                if (isMe) {
                  displayName = user?.username || user?.firstName || user?.lastName || 'Moi';
                  username = user?.username || '';
                  avatarBgColor = user?.avatarColor || '#19D07D';
                  initials = (user?.username || user?.firstName || user?.lastName || 'Moi').split(' ').map((n) => n && typeof n === 'string' ? n[0] : '').join('').toUpperCase().slice(0, 2) || 'M';
                } else {
                  // Couleur calculée à partir de l'id (logique existante)
                  const avatarColors = ['#19D07D', '#008F6B', '#FF8C66', '#FFD700', '#38BDF8', '#A78BFA'];
                  avatarBgColor = avatarColors[Math.abs(item.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % avatarColors.length];
                  initials = displayName.split(' ').map((n) => n && typeof n === 'string' ? n[0] : '').join('').toUpperCase().slice(0, 2) || '?';
                }
                const isWhiteBg = ["#FFFFFF", "#ffffff", "#fff", "#FFF"].includes(avatarBgColor);
                const borderColor = isLight ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 151, 178, 0.3)";
                const textColor = isLight ? "#0A3F33" : colors.text;

                return (
                  <LinearGradient
                    colors={isLight 
                        ? (isMe ? ["#D1FAE5", "#E0F7EF"] : ["rgba(240, 253, 244, 0.9)", "rgba(255, 255, 255, 0.6)"]) 
                        : (isMe ? ["rgba(0, 143, 107, 0.2)", "rgba(0, 143, 107, 0.1)"] : ["rgba(0, 151, 178, 0.2)", "rgba(0, 151, 178, 0.05)"])
                    }
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ 
                        flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 10, borderRadius: 24,
                        borderWidth: 1, borderColor: isMe ? (isLight ? "#A7F3D0" : colors.accent) : borderColor,
                    }}
                  >
                    {/* 1. RANG (Badge style Header) */}
                    <View style={{ 
                        width: 32, height: 32, borderRadius: 12, 
                        backgroundColor: isMe ? (isLight ? "#FF8C66" : colors.accent) : (isLight ? "#FFF" : "rgba(255,255,255,0.1)"),
                        alignItems: 'center', justifyContent: 'center', marginRight: 12
                    }}>
                        <Text style={{ 
                            fontFamily: FontFamilies.heading, 
                            fontSize: 14, 
                            color: isMe ? (isLight ? "#FFF" : "#07321F") : textColor 
                        }}>
                            #{item.rank}
                        </Text>
                    </View>

                    {/* 2. AVATAR (Logique Header + étoile chef) */}
                    <View style={{ position: 'relative', marginHorizontal: 12 }}>
                      {item.avatar ? (
                        <Image 
                          source={{ uri: item.avatar }} 
                          style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: isLight ? "#FFF" : "rgba(255,255,255,0.1)" }} 
                        />
                      ) : (
                        <View style={{ 
                          width: 48, height: 48, borderRadius: 24, 
                          backgroundColor: avatarBgColor,
                          alignItems: 'center', justifyContent: 'center',
                          borderWidth: 2, borderColor: isLight ? "#FFF" : "rgba(255,255,255,0.1)"
                        }}>
                          <Text style={{ 
                            color: isWhiteBg ? "#1A1A1A" : "#FFFFFF", 
                            fontFamily: FontFamilies.heading, fontSize: 20 
                          }}>
                            {initials}
                          </Text>
                        </View>
                      )}
                      {/* Étoile chef */}
                      {targetIsOwner && (
                        <View style={{ position: 'absolute', right: -6, top: -6, backgroundColor: 'transparent' }}>
                          <Ionicons name="star" size={22} color="#FFD700" style={{ textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }} />
                        </View>
                      )}
                    </View>

                    {/* 3. NOM & ROLE (Typography Header) */}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ color: textColor, fontFamily: FontFamilies.heading, fontSize: 17 }} numberOfLines={1}>
                            {isMe ? "Moi" : displayName}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                            {!targetIsMember && (
                                <View style={{ backgroundColor: roleLabel === 'Chef' ? (isLight ? '#FFEFD5' : 'rgba(245, 158, 11, 0.2)') : (isLight ? '#E0F2FE' : 'rgba(56, 189, 248, 0.2)'), paddingHorizontal: 6, borderRadius: 6, marginRight: 6 }}>
                                    <Text style={{ fontSize: 10, fontFamily: FontFamilies.bodyStrong, color: roleLabel === 'Chef' ? (isLight ? '#B7791F' : '#FCD34D') : (isLight ? '#0284C7' : '#38BDF8') }}>
                                        {roleLabel.toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            <Text style={{ color: isLight ? "#4A665F" : colors.mutedText, fontFamily: FontFamilies.body, fontSize: 13 }}>
                                {classementPointsMap.get(item.id) || 0} pts
                            </Text>
                        </View>
                    </View>

                    {/* 4. ACTIONS (Icones épurées) */}
                    {canManageUser && (
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            {/* CAS 1 : CIBLE EST MEMBRE (Je peux le promouvoir) */}
                            {targetIsMember && (
                                <TouchableOpacity 
                                    onPress={() => Alert.alert("Promouvoir", `Nommer ${displayName} Adjoint ?`, [
                                        { text: "Annuler", style: "cancel" },
                                        { text: "Oui", onPress: () => promoteToOfficer(item.id) }
                                    ])}
                                >
                                    <Ionicons name="arrow-up-circle-outline" size={22} color="#008F6B" />
                                </TouchableOpacity>
                            )}

                            {/* NOUVEAU : CHEF PEUT PROMOUVOIR UN ADJOINT EN CHEF */}
                            {targetIsOfficer && iAmOwner && !isMe && (
                                <TouchableOpacity
                                    onPress={() =>
                                        Alert.alert(
                                            "Promouvoir Chef",
                                            `Promouvoir ${displayName} comme nouveau chef ?\nTu deviendras adjoint à la place.`,
                                            [
                                                { text: "Annuler", style: "cancel" },
                                                { text: "Oui", onPress: () => transferOwnership(item.id) }
                                            ]
                                        )
                                    }
                                >
                                    <Ionicons name="star-outline" size={22} color="#FFD700" />
                                </TouchableOpacity>
                            )}

                            {/* CAS 2 : CIBLE EST ADJOINT (Seul le CHEF peut rétrograder) */}
                            {targetIsOfficer && iAmOwner && (
                                <TouchableOpacity 
                                    onPress={() =>
                                        Alert.alert(
                                            "Rétrograder",
                                            `Retirer le grade d'adjoint à ${item.name} ?`,
                                            [
                                                { text: "Annuler", style: "cancel" },
                                                { text: "Oui", onPress: () => demoteOfficer(item.id) }
                                            ]
                                        )
                                    }
                                >
                                    <Ionicons name="arrow-down-circle-outline" size={22} color="#F59E0B" />
                                </TouchableOpacity>
                            )}

                            {/* SUPPRIMER (Possible pour Chef ou Adjoint sur Membre) */}
                            <TouchableOpacity 
                                onPress={() => Alert.alert("Exclure", `Retirer ${item.name} du club ?`, [
                                    { text: "Annuler", style: "cancel" },
                                    { text: "Exclure", style: "destructive", onPress: () => handleRemoveMember(item.id) }
                                ])}
                            >
                                <Ionicons name="trash-outline" size={22} color="#F45B69" />
                            </TouchableOpacity>
                        </View>
                    )}
                  </LinearGradient>
                );
              }}
            />
          </SafeAreaView>
        </View>
      )}
    </SafeAreaView>
  </View>
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
