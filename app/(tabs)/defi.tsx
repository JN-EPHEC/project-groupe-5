import { useClub } from "@/hooks/club-context";
import { useFriends } from "@/hooks/friends-context";
import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { ChallengeCard } from "@/components/ui/defi/ChallengeCard";
import { TabSwitcher } from "@/components/ui/defi/TabSwitcher";
import { ValidationCard } from "@/components/ui/defi/ValidationCard";
import { useChallenges } from "@/hooks/challenges-context";
import * as ImagePicker from "expo-image-picker";

import { Challenge, TabKey } from "@/components/ui/defi/types";
import { db } from "@/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

type DefiDoc = {
  id: string;
  titre: string;
  description: string;
  categorie: "personnel" | "club";
  duree: number;
  points: number;
  statut: "inactive" | "rotation";
  difficulte: "facile" | "moyen" | "difficile";
  preuve?: string;
  createdAt?: { seconds: number; nanoseconds: number } | any;
};

export default function DefiScreen() {
  const router = useRouter();
  const { colors } = useThemeMode();
  const { friends } = useFriends();
  const { points } = usePoints();
  const { joinedClub, members } = useClub();
  const { user } = useUser();

  const myPoints = typeof points === "number" ? points : 0;

  const [activeTab, setActiveTab] = useState<TabKey>("perso");
  const [viewMode, setViewMode] = useState<"defis" | "classement">("defis");

  const {
    current,
    start,
    stop,
    canceledIds,
    reviewCompleted,
    reviewRequiredCount,
    incrementReview,
    setFeedback,
  } = useChallenges();

  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState<string>("");
  

  const [rotatingChallenges, setRotatingChallenges] = useState<Challenge[]>([]);
  const [validationQueue, setValidationQueue] = useState([
    {
      id: 101,
      title: "Recycler des bouteilles",
      description: "Preuve de recyclage",
      category: "Recyclage" as any,
      difficulty: "Facile" as const,
      points: 10,
      audience: "Membre" as const,
      timeLeft: "—",
      userName: "Alex",
      photoUrl:
        "https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 102,
      title: "Aller au marché local",
      description: "Panier local",
      category: "Local" as any,
      difficulty: "Moyen" as const,
      points: 20,
      audience: "Membre" as const,
      timeLeft: "—",
      userName: "Lina",
      photoUrl:
        "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 103,
      title: "Défi compost maison",
      description: "Compost",
      category: "Tri" as any,
      difficulty: "Difficile" as const,
      points: 30,
      audience: "Membre" as const,
      timeLeft: "—",
      userName: "Marie",
      photoUrl:
        "https://images.unsplash.com/photo-1615485737651-6f6c4110fc94?q=80&w=800&auto=format&fit=crop",
    },
  ]);

  // 🔥 Load 3 rotation challenges from Firestore (FIFO per difficulty)
  useEffect(() => {
    const loadRotatingDefis = async () => {
      const snap = await getDocs(collection(db, "defis"));
      const docs = snap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as any) } as DefiDoc)
      );

      // Only personal + rotation
      const personals = docs.filter(
        (d) => d.categorie === "personnel" && d.statut === "rotation"
      );

      // Sort FIFO by createdAt
      personals.sort((a, b) => {
        const aSec = (a.createdAt?.seconds ?? 0) as number;
        const bSec = (b.createdAt?.seconds ?? 0) as number;
        return aSec - bSec;
      });

      const byDiff = {
        facile: personals.filter((d) => d.difficulte === "facile"),
        moyen: personals.filter((d) => d.difficulte === "moyen"),
        difficile: personals.filter((d) => d.difficulte === "difficile"),
      };

      const selected: Challenge[] = [];
      let idCounter = 1;

      // Facile → Moyen → Difficile
      const pick = (diffKey: keyof typeof byDiff, label: Challenge["difficulty"]) => {
        const d = byDiff[diffKey][0];
        if (!d) return;
        selected.push({
          id: idCounter++,
          title: d.titre,
          description: d.description,
          category: "Recyclage" as any, // not really used anymore
          difficulty: label,
          points: d.points,
          audience: "Membre",
          timeLeft: "Aujourd'hui",
        });
      };

      pick("facile", "Facile");
      pick("moyen", "Moyen");
      pick("difficile", "Difficile");

      setRotatingChallenges(selected);
    };

    loadRotatingDefis();
  }, []);

  // If user already has an ongoing challenge, only show that one.
  const gatingActive =
    current?.status === "pendingValidation" &&
    reviewCompleted < reviewRequiredCount;

  const hideAfterFeedback =
    current?.status === "pendingValidation" &&
    reviewCompleted >= reviewRequiredCount &&
    current?.feedbackSubmitted;

  const challengesToDisplay = useMemo(() => {
    if (current && !gatingActive && !hideAfterFeedback) return [current];
    return rotatingChallenges;
  }, [current, rotatingChallenges, gatingActive, hideAfterFeedback]);

  // 🔁 Activate or cancel a challenge
  const toggleOngoing = (id: number) => {
    const challenge = rotatingChallenges.find((c) => c.id === id);
    if (!challenge) return;

    if (current && current.id === id) {
      stop(id);
      return;
    }

    start(challenge);
  };

  // 📷 Camera
  const openCamera = (challengeId: number) => {
    router.push({ pathname: "/camera", params: { id: String(challengeId) } });
  };

  // 🖼 Gallery picker (still here if we need later)
  const pickFromGallery = async (challengeId: number) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      router.push({
        pathname: "/camera",
        params: { id: String(challengeId), preset: res.assets[0].uri },
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER with toggle icon */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[styles.title, { color: colors.text }]}>{viewMode === 'defis' ? 'Défis' : 'Classement'}</Text>
        <TouchableOpacity
          onPress={() => setViewMode(viewMode === 'defis' ? 'classement' : 'defis')}
          style={{ padding: 8, borderRadius: 12, backgroundColor: colors.surface }}
        >
          <Ionicons name={viewMode === 'defis' ? 'trophy-outline' : 'flag-outline'} size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* TAB SWITCHER used both in Défis and Classement to toggle Perso/Club */}
      <TabSwitcher activeTab={activeTab} onChange={setActiveTab} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* PERSO TAB or Classement view */}
        {(activeTab === "perso" && viewMode === 'defis') && (
          <>
            {/* Votre preuve: retiré de cette étape. Pendant la phase "valider 3 défis",
                on n'affiche plus la preuve ici. Elle réapparaîtra intégrée dans la carte du défi
                (au-dessus de "En attente de validation") après cette étape. */}
            {/* Gating message */}
            {gatingActive && (
              <View
                style={{
                  backgroundColor: colors.surface,
                  padding: 20,
                  borderRadius: 24,
                  marginBottom: 18,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  Validation requise
                </Text>
                <Text style={{ color: colors.mutedText, marginTop: 8 }}>
                  Il vous faut maintenant valider 3 défis d&apos;autres membres avant que
                  votre propre défi soit examiné.
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 14,
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      height: 10,
                      backgroundColor: colors.surfaceAlt,
                      borderRadius: 6,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: `${(reviewCompleted / reviewRequiredCount) * 100}%`,
                        backgroundColor: colors.accent,
                        height: "100%",
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: "700",
                    }}
                  >
                    {reviewCompleted}/{reviewRequiredCount}
                  </Text>
                </View>
              </View>
            )}

            {/* Validation cards phase */}
            {gatingActive &&
              (validationQueue.length === 0 ? (
                <Text
                  style={[styles.emptyText, { color: colors.mutedText }]}
                >
                  Aucun défi à valider.
                </Text>
              ) : (
                validationQueue.map((item) => (
                  <ValidationCard
                    key={item.id}
                    item={item}
                    onValidate={() => {
                      setValidationQueue((q) =>
                        q.filter((x) => x.id !== item.id)
                      );
                      incrementReview();
                    }}
                    onReject={() => {
                      setValidationQueue((q) =>
                        q.filter((x) => x.id !== item.id)
                      );
                      incrementReview();
                    }}
                  />
                ))
              ))}

            {/* Normal challenge cards (3 rotation + maybe current) */}
            {!gatingActive &&
              challengesToDisplay.map((challenge: any) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  categorie="personnel"
                  isOngoing={current?.id === challenge.id}
                  status={
                    current?.id === challenge.id ? current?.status : undefined
                  }
                  onToggle={toggleOngoing}
                  onValidatePhoto={
                    current &&
                    current.id === challenge.id &&
                    current.status === "active"
                      ? () => openCamera(challenge.id)
                      : undefined
                  }
                />
              ))}

            {/* Feedback form when pending validation & reviews complete */}
            {current &&
              current.status === "pendingValidation" &&
              reviewCompleted >= reviewRequiredCount &&
              !current.feedbackSubmitted && (
                <View
                  style={{
                    backgroundColor: colors.surface,
                    padding: 20,
                    borderRadius: 24,
                    marginTop: 10,
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    Laisser un avis
                  </Text>
                  <Text
                    style={{ color: colors.mutedText, marginTop: 6 }}
                  >
                    Notez ce défi et laissez un commentaire pour aider la validation.
                  </Text>
                  <View style={{ flexDirection: "row", marginTop: 12 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <TouchableOpacity
                        key={n}
                        onPress={() => setFeedbackRating(n)}
                        style={{ marginRight: 8 }}
                      >
                        <Text style={{ fontSize: 24 }}>
                          {feedbackRating >= n ? "⭐" : "☆"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    value={feedbackComment}
                    onChangeText={setFeedbackComment}
                    placeholder="Votre commentaire"
                    multiline
                    numberOfLines={4}
                    style={{
                      marginTop: 12,
                      borderWidth: 1,
                      borderColor: "#2A3431",
                      backgroundColor: colors.surfaceAlt,
                      color: colors.text,
                      borderRadius: 12,
                      padding: 12,
                      textAlignVertical: "top",
                    }}
                  />
                  <TouchableOpacity
                    onPress={() =>
                      setFeedback(feedbackRating || 0, feedbackComment.trim())
                    }
                    disabled={feedbackRating === 0}
                    style={{
                      marginTop: 14,
                      borderRadius: 14,
                      paddingVertical: 12,
                      alignItems: "center",
                      backgroundColor:
                        feedbackRating === 0 ? "#2A3431" : colors.accent,
                    }}
                  >
                    <Text
                      style={{
                        color:
                          feedbackRating === 0 ? "#8AA39C" : "#0F3327",
                        fontWeight: "700",
                      }}
                    >
                      Envoyer l&apos;avis
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

            {/* Message après envoi de l'avis */}
            {hideAfterFeedback && (
              <View
                style={{
                  backgroundColor: colors.surface,
                  padding: 20,
                  borderRadius: 24,
                  marginTop: 10,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  Défi en cours de validation
                </Text>
                <Text
                  style={{ color: colors.mutedText, marginTop: 6 }}
                >
                  Merci pour votre avis. Votre défi sera examiné prochainement par
                  l&apos;équipe.
                </Text>
              </View>
            )}
          </>
        )}

        {viewMode === 'classement' && (
          <>
            {activeTab === 'perso' && (
              <View style={{ backgroundColor: colors.surface, padding: 20, borderRadius: 24, marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>Top 50 — Perso</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ backgroundColor: '#52D19233', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 }}>
                      <Text style={{ color: '#52D192', fontWeight: '700' }}>Amis</Text>
                    </View>
                    <View style={{ backgroundColor: '#6BCB3D33', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 }}>
                      <Text style={{ color: colors.accent, fontWeight: '700' }}>Points</Text>
                    </View>
                  </View>
                </View>
                {(() => {
                  const getDefaultAvatar = (seed: string) =>
                    `https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(seed || "GreenUp")}&backgroundColor=1F2A27&textColor=ffffff`;

                  const friendEntries = friends.map((f: any) => {
                    const name = f.name ?? "Ami";
                    const id = f.id ?? name;
                    const pts = typeof f.points === "number" ? f.points : 0;
                    const photoURL = f.photoURL && f.photoURL.length > 0 ? f.photoURL : getDefaultAvatar(name || id);
                    return { id, name, pts, photoURL };
                  });

                  const meId = user?.uid ?? "me";
                  const meName = user?.firstName
                    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
                    : user?.username || "Moi";
                  const mePhoto = user?.photoURL && user.photoURL.length > 0 ? user.photoURL : getDefaultAvatar(meName);

                  const existingIndex = friendEntries.findIndex((entry) => entry.id === meId);
                  if (existingIndex >= 0) {
                    friendEntries[existingIndex] = {
                      ...friendEntries[existingIndex],
                      name: meName,
                      pts: myPoints,
                      photoURL: mePhoto,
                    };
                  } else {
                    friendEntries.push({ id: meId, name: meName, pts: myPoints, photoURL: mePhoto });
                  }

                  const sortedEntries = [...friendEntries].sort((a, b) => b.pts - a.pts);
                  const myIndex = sortedEntries.findIndex((entry) => entry.id === meId);
                  const displayEntries = sortedEntries.slice(0, 50);

                  return (
                    <View style={{ marginTop: 12 }}>
                      {displayEntries.map((entry, idx) => {
                        const isMe = entry.id === meId;
                        const rankColor =
                          idx === 0
                            ? "#52D192"
                            : idx === 1
                            ? "#F6D365"
                            : idx === 2
                            ? "#F45B69"
                            : colors.surfaceAlt;
                        return (
                          <View
                            key={entry.id ?? idx}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingVertical: 10,
                              paddingHorizontal: 12,
                              borderRadius: 14,
                              marginBottom: 8,
                              backgroundColor: isMe ? "#1A2F28" : colors.surfaceAlt,
                            }}
                          >
                            <View
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                backgroundColor: rankColor,
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 10,
                              }}
                            >
                              <Text style={{ color: "#0F3327", fontWeight: "800" }}>{idx + 1}</Text>
                            </View>
                            <Image
                              source={{ uri: entry.photoURL || getDefaultAvatar(entry.name || entry.id || "Ami") }}
                              style={{ width: 28, height: 28, borderRadius: 14, marginRight: 10 }}
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: colors.text, fontWeight: isMe ? "800" : "600" }}>{entry.name}</Text>
                              {isMe && <Text style={{ color: colors.mutedText, fontSize: 12 }}>Ta position</Text>}
                            </View>
                            <View style={{ backgroundColor: "#D4F7E7", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}>
                              <Text style={{ color: "#0F3327", fontWeight: "800" }}>{entry.pts} pts</Text>
                            </View>
                          </View>
                        );
                      })}
                      <View style={{ marginTop: 8, borderTopWidth: 1, borderColor: colors.surfaceAlt, paddingTop: 8 }}>
                        <Text style={{ color: colors.text, fontWeight: "700" }}>
                          Ta position: {myIndex >= 0 ? myIndex + 1 : "—"}
                        </Text>
                      </View>
                    </View>
                  );
                })()}
              </View>
            )}

            {activeTab === 'club' && (
              <View style={{ backgroundColor: colors.surface, padding: 20, borderRadius: 24, marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>Top 50 — Clubs</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ backgroundColor: '#F6D36533', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 }}>
                      <Text style={{ color: '#F6D365', fontWeight: '700' }}>Clubs</Text>
                    </View>
                    <View style={{ backgroundColor: '#6BCB3D33', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 }}>
                      <Text style={{ color: colors.accent, fontWeight: '700' }}>Points</Text>
                    </View>
                  </View>
                </View>
                {(() => {
                  const clubs: Array<{ name: string; pts: number; isMine?: boolean; avatar: string }> = [];
                  if (joinedClub) {
                    const totalClubPts = members.reduce((sum, m: any) => sum + (m.points || 0), 0);
                    clubs.push({ name: joinedClub.name ?? 'Mon club', pts: totalClubPts, isMine: true, avatar: joinedClub.logo || 'https://api.dicebear.com/8.x/shapes/svg?seed=myclub' });
                  }
                  const mockClubNames = ['Les Écogardiens', 'Verte Équipe', 'Planète Propre', 'Zéro Déchet Squad', 'Les Tri-Héros', 'Green Sparks', 'Eco Runner', 'TerraFriends', 'BlueLeaf', 'GreenMinds'];
                  while (clubs.length < 50) {
                    const name = mockClubNames[(clubs.length) % mockClubNames.length] + ' ' + (Math.floor(Math.random()*90)+10);
                    const pts = Math.floor(Math.random()*5000) + 200;
                    const avatar = `https://api.dicebear.com/8.x/shapes/svg?seed=${encodeURIComponent(name)}`;
                    clubs.push({ name, pts, avatar });
                  }
                  const sorted = clubs.sort((a,b) => b.pts - a.pts).slice(0,50);
                  const myIndex = sorted.findIndex(c => c.isMine);
                  return (
                    <View style={{ marginTop: 12 }}>
                      {sorted.map((c, idx) => {
                        const isMine = c.isMine;
                        const rankColor = idx === 0 ? '#52D192' : idx === 1 ? '#F6D365' : idx === 2 ? '#F45B69' : colors.surfaceAlt;
                        return (
                          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, marginBottom: 8, backgroundColor: isMine ? '#1A2F28' : colors.surfaceAlt }}>
                            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: rankColor, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                              <Text style={{ color: '#0F3327', fontWeight: '800' }}>{idx+1}</Text>
                            </View>
                            <Image source={{ uri: c.avatar }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 10 }} />
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: colors.text, fontWeight: isMine ? '800' : '600' }}>{c.name}</Text>
                              {isMine && <Text style={{ color: colors.mutedText, fontSize: 12 }}>Ton club</Text>}
                            </View>
                            <View style={{ backgroundColor: '#D4F7E7', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}>
                              <Text style={{ color: '#0F3327', fontWeight: '800' }}>{c.pts} pts</Text>
                            </View>
                          </View>
                        );
                      })}
                      <View style={{ marginTop: 8, borderTopWidth: 1, borderColor: colors.surfaceAlt, paddingTop: 8 }}>
                        <Text style={{ color: colors.text, fontWeight: '700' }}>Position club: {myIndex >= 0 ? myIndex + 1 : '—'}</Text>
                      </View>
                    </View>
                  );
                })()}
              </View>
            )}
          </>
        )}

        {/* CLUB TAB – placeholder for now */}
        {activeTab === "club" && (
          <View style={{ paddingTop: 40 }}>
            <Text
              style={{ color: colors.mutedText, textAlign: "center" }}
            >
              Aucun défi de club pour le moment.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  title: { fontSize: 28, fontWeight: "700" },
  scroll: { marginTop: 12 },
  emptyText: { textAlign: "center", marginTop: 40, fontSize: 16 },
});
