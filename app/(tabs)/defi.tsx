// app/(tabs)/defi.tsx
import { useClub } from "@/hooks/club-context";
import { useFriends } from "@/hooks/friends-context";
import { usePoints } from "@/hooks/points-context";
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { SafeAreaView } from "react-native-safe-area-context";

import { ChallengeCard } from "@/components/ui/defi/ChallengeCard";
import { TabSwitcher } from "@/components/ui/defi/TabSwitcher";
import { ValidationCard } from "@/components/ui/defi/ValidationCard";
import { useChallenges } from "@/hooks/challenges-context";
import { useValidationQueue } from "@/hooks/useValidationQueue";
import { voteOnProof } from "@/services/proofs";
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
  const params = useLocalSearchParams<{ view?: string }>();
  const { colors, mode } = useThemeMode();
  const { friends } = useFriends();
  const { points } = usePoints();
  const { joinedClub, members } = useClub();

  const isLight = mode === "light";
  const darkBg = "#021114";

  const [activeTab, setActiveTab] = useState<TabKey>("perso");
  const [viewMode, setViewMode] = useState<"defis" | "classement">("defis");
  const [persoRanking, setPersoRanking] = useState<any[] | null>(null);
  const {
    current,
    goToClassement,
    setGoToClassement,
    start,
    stop,
    canceledIds,
    reviewCompleted,
    reviewRequiredCount,
    validationPhaseDone,
    incrementReview,
    setFeedback,
  } = useChallenges();

  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState<string>("");
  

  const [rotatingChallenges, setRotatingChallenges] = useState<Challenge[]>([]);
  const difficultyKey = current
    ? (
        current.difficulty.toLowerCase() === "facile" ? "facile" :
        current.difficulty.toLowerCase() === "moyen" ? "moyen" :
        "difficile"
      )
    : null;
  const { queue: validationQueue, removeFromQueue } = useValidationQueue(
    difficultyKey as any
  );

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

      const pick = (diffKey: keyof typeof byDiff, label: Challenge["difficulty"]) => {
        const d = byDiff[diffKey][0];
        if (!d) return;
        selected.push({
          id: idCounter++,                // UI ID
          firestoreId: d.id,              // REAL Firestore ID from Firestore
          title: d.titre,
          description: d.description,
          category: "Recyclage" as any,
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

  // 👇 NEW: react to /defi?view=classement
  useEffect(() => {
    const raw = params.view;
    const v = Array.isArray(raw) ? raw[0] : raw;

    if (v === "classement") {
      setViewMode("classement");
    } else if (v === "defis") {
      setViewMode("defis");
    }
  }, [params.view]);

  useEffect(() => {
    if (goToClassement) {
      setViewMode("classement");
      setGoToClassement(false); // reset so it doesn't repeat
    }
  }, [goToClassement]);

  // 🏆 Build perso classement ONCE (avoid random changes on every render)
  useEffect(() => {
    if (persoRanking) return; // already built → do nothing

    const base: any[] = [];

    // 1️⃣ Friends
    friends.forEach((f: any) => {
      base.push({
        name: f.name ?? "Ami",
        pts: f.points || 0,
        avatar: f.avatar,
      });
    });

    // 2️⃣ Me
    base.push({
      name: "Aymeric",
      pts: points,
      avatar: "https://i.pravatar.cc/100?u=me",
    });

    // 3️⃣ Fill with fake users (only once)
    const mockNames = [
      "Arthur",
      "Camille",
      "Yanis",
      "Inès",
      "Léa",
      "Lucas",
      "Maël",
      "Nina",
      "Noah",
      "Sofia",
    ];

    while (base.length < 50) {
      const n =
        mockNames[base.length % mockNames.length] +
        " " +
        (Math.floor(Math.random() * 90) + 10);

      base.push({
        name: n,
        pts: Math.floor(Math.random() * 800),
        avatar: `https://i.pravatar.cc/100?u=${encodeURIComponent(n)}`,
      });
    }

    // 4️⃣ Sort once
    const sorted = base.sort((a, b) => b.pts - a.pts).slice(0, 50);

    setPersoRanking(sorted);
  }, [friends, points]);
  


  // If user already has an ongoing challenge, only show that one.
  const gatingActive =
    current?.status === "pendingValidation" &&
    reviewCompleted < reviewRequiredCount &&
    !validationPhaseDone;

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
  if (current && current.id === id) {
    stop(); // stop does not need the id
    return;
  }

  const challenge = rotatingChallenges.find((c) => c.id === id);
  if (!challenge) {
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
    <SafeAreaView style={[styles.container, { backgroundColor: isLight ? colors.background : darkBg }]}>
      {/* HEADER with toggle icon */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[styles.title, { color: colors.text }]}>{viewMode === 'defis' ? 'Défis' : 'Classement'}</Text>
        <TouchableOpacity
          onPress={() => setViewMode(viewMode === 'defis' ? 'classement' : 'defis')}
          style={{ padding: 8, borderRadius: 12, backgroundColor: isLight ? colors.surface : "rgba(0, 151, 178, 0.1)" }}
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
                  backgroundColor: colors.card,
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
                <Text style={[styles.emptyText, { color: colors.mutedText }]}>
                  Aucun défi à valider.
                </Text>
              ) : (
                validationQueue.map((p, index) => (
                  <ValidationCard
                    key={p.id}
                    item={{
                      // 🔢 purely UI id, numeric => TS happy
                      id: index + 1,
                      title: "Preuve à valider",
                      description: "",
                      category: "Recyclage",   // temporary placeholder
                      difficulty: current?.difficulty ?? "Facile",
                      points: typeof current?.points === "number" ? current.points : 10,
                      audience: "Membre",
                      timeLeft: "",
                      userName: "Utilisateur",
                      photoUrl: p.photoUrl,
                      comment: p.commentaire,
                    }}
                    onValidate={async () => {
                      await voteOnProof(p.id, true);
                      removeFromQueue(p.id);
                      incrementReview();
                    }}
                    onReject={async () => {
                      await voteOnProof(p.id, false);
                      removeFromQueue(p.id);
                      incrementReview();
                    }}
                  />
                ))
              ))}

            {/* Normal challenge cards (3 rotation + maybe current) */}
            {!gatingActive &&
              challengesToDisplay.map((challenge: any) => {
                return (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    categorie="personnel"
                    isOngoing={current?.id === challenge.id}
                    status={current?.id === challenge.id ? current?.status : undefined}
                    onToggle={toggleOngoing}
                    onValidatePhoto={
                      current &&
                      current.id === challenge.id &&
                      current.status === "active"
                        ? () => openCamera(challenge.id)
                        : undefined
                    }
                  />
                );
              })}


            {/* Feedback form when pending validation & reviews complete */}
            {current &&
              current.status === "pendingValidation" &&
              reviewCompleted >= reviewRequiredCount &&
              !current.feedbackSubmitted && (
                <View
                  style={{
                    backgroundColor: colors.card,
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
                  backgroundColor: colors.card,
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
                {persoRanking && (
                  <View style={{ marginTop: 12 }}>
                    {persoRanking.map((x, idx) => {
                      const isMe = x.name === "Aymeric";

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
                          key={idx}
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
                            <Text style={{ color: "#0F3327", fontWeight: "800" }}>
                              {idx + 1}
                            </Text>
                          </View>

                          <Image
                            source={{
                              uri:
                                x.avatar ||
                                `https://i.pravatar.cc/100?u=${encodeURIComponent(x.name)}`,
                            }}
                            style={{ width: 28, height: 28, borderRadius: 14, marginRight: 10 }}
                          />

                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                color: colors.text,
                                fontWeight: isMe ? "800" : "600",
                              }}
                            >
                              {x.name}
                            </Text>
                            {isMe && (
                              <Text style={{ color: colors.mutedText, fontSize: 12 }}>
                                Ta position
                              </Text>
                            )}
                          </View>

                          <View
                            style={{
                              backgroundColor: "#D4F7E7",
                              borderRadius: 12,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                            }}
                          >
                            <Text style={{ color: "#0F3327", fontWeight: "800" }}>
                              {x.pts} pts
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: "700" },
  scroll: { marginTop: 12 },
  emptyText: { textAlign: "center", marginTop: 40, fontSize: 16 },
});
