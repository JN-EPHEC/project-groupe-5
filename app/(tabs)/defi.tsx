import { GradientButton } from "@/components/ui/common/GradientButton";
import { useThemeMode } from "@/hooks/theme-context";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { CategorySelector } from "@/components/ui/defi/CategorySelector";
import { ChallengeCard } from "@/components/ui/defi/ChallengeCard";
import { CHALLENGES } from "@/components/ui/defi/constants";
import { TabSwitcher } from "@/components/ui/defi/TabSwitcher";
import { CategoryKey, TabKey } from "@/components/ui/defi/types";
import { ValidationCard } from "@/components/ui/defi/ValidationCard";
import { useChallenges } from "@/hooks/challenges-context";
import * as ImagePicker from 'expo-image-picker';

export default function DefiScreen() {
  const router = useRouter();
  const { colors } = useThemeMode();

  const [activeTab, setActiveTab] = useState<TabKey>("defis");
  const [selectedCategories, setSelectedCategories] = useState<CategoryKey[]>(["Tous"]);
  const { current, start, stop, canceledIds } = useChallenges();
  const [validationQueue, setValidationQueue] = useState([
    {
      id: 101,
      title: "Recycler des bouteilles",
      description: "Preuve de recyclage",
      category: "Recyclage" as const,
      difficulty: "Facile" as const,
      points: 10,
      audience: "Membre" as const,
      timeLeft: "—",
      userName: "Alex",
      photoUrl: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 102,
      title: "Aller au marché local",
      description: "Panier local",
      category: "Local" as const,
      difficulty: "Moyen" as const,
      points: 20,
      audience: "Membre" as const,
      timeLeft: "—",
      userName: "Lina",
      photoUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 103,
      title: "Défi compost maison",
      description: "Compost",
      category: "Tri" as const,
      difficulty: "Difficile" as const,
      points: 30,
      audience: "Membre" as const,
      timeLeft: "—",
      userName: "Marie",
      photoUrl: "https://images.unsplash.com/photo-1615485737651-6f6c4110fc94?q=80&w=800&auto=format&fit=crop",
    },
  ]);

  const filteredChallenges = useMemo(() => {
    if (selectedCategories.includes("Tous") || selectedCategories.length === 0) return CHALLENGES;
    const set = new Set(selectedCategories.filter((c) => c !== "Tous") as any);
    return CHALLENGES.filter((c) => set.has(c.category));
  }, [selectedCategories]);

  // Exclude canceled challenges from display
  const availableChallenges = useMemo(() => {
    if (!canceledIds.length) return filteredChallenges;
    const canceled = new Set(canceledIds);
    return filteredChallenges.filter((c) => !canceled.has(c.id));
  }, [filteredChallenges, canceledIds]);

  const ongoingChallenges = useMemo(
    () => (current ? [current] : []),
    [current]
  );

  const challengesToDisplay = useMemo(() => {
    // If we have a current challenge in pendingValidation or validated state, still show only that one
    return current ? [current] : availableChallenges;
  }, [current, availableChallenges]);

  const toggleOngoing = (id: number) => {
    const challenge = CHALLENGES.find((c) => c.id === id);
    if (!challenge) return;
    if (current && current.id === id) {
      stop(id);
    } else {
      start(challenge);
    }
  };

  const openCamera = (challengeId: number) => {
    router.push({ pathname: '/camera', params: { id: String(challengeId) } });
  };

  const pickFromGallery = async (challengeId: number) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled && res.assets[0]?.uri) {
      // Re-use camera flow by navigating with a param? Simpler: push camera with temp param and rely on manual retake not needed.
      // For simplicity we can navigate to camera to confirm, or extend context directly; keep camera for consistency.
      router.push({ pathname: '/camera', params: { id: String(challengeId), preset: res.assets[0].uri } });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
  {/* HEADER -> titre + sous-titre inline ; cartes via components/ui/defi */}
      <Text style={[styles.title, { color: colors.text }]}>Défis</Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>
        Relevez des défis et gagnez des points
      </Text>

      <GradientButton label="Rejoindre un club" onPress={() => router.push({ pathname: "/social", params: { tab: "clubs" } })}
        style={{ alignSelf: "flex-start", marginTop: 16, width: 180 }} />

  {/* SWITCHER -> components/ui/defi/TabSwitcher */}
      <TabSwitcher activeTab={activeTab} onChange={setActiveTab} />


  {/* CONTENU -> components/ui/defi/ChallengeCard & ValidationCard */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        stickyHeaderIndices={[0]} // Make the first child sticky
      >
        {/* Sticky header */}
        {activeTab === "defis" && !current && (
          <View style={{ backgroundColor: colors.background }}>
            <CategorySelector
              selected={selectedCategories}
              onToggle={(key) => {
                if (key === "Tous") {
                  setSelectedCategories(["Tous"]);
                  return;
                }
                setSelectedCategories((prev) => {
                  // If "Tous" was selected, replace with the key
                  const withoutTous = prev.filter((k) => k !== "Tous");
                  const exists = withoutTous.includes(key);
                  const next = exists
                    ? withoutTous.filter((k) => k !== key)
                    : [...withoutTous, key];
                  return next.length === 0 ? ["Tous"] : (next as CategoryKey[]);
                });
              }}
            />
          </View>
        )}

        {/* Challenge cards */}
        {activeTab === "defis" &&
          challengesToDisplay.map((challenge: any) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              isOngoing={current?.id === challenge.id}
              status={current?.id === challenge.id ? current?.status : undefined}
              onToggle={toggleOngoing}
              onValidatePhoto={
                current && current.id === challenge.id && current.status === "active"
                  ? () => openCamera(challenge.id)
                  : undefined
              }
            />
          ))}

        {/* Validation cards */}
        {activeTab === "validations" &&
          (validationQueue.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>
              Aucun défi à valider.
            </Text>
          ) : (
            validationQueue.map((item) => (
              <ValidationCard
                key={item.id}
                item={item}
                onValidate={() =>
                  setValidationQueue((q) => q.filter((x) => x.id !== item.id))
                }
                onReject={() =>
                  setValidationQueue((q) => q.filter((x) => x.id !== item.id))
                }
              />
            ))
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { marginTop: 6, fontSize: 14 },
  clubButton: {
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 8,
    alignSelf: "flex-start",
    marginTop: 16,
  },
  clubButtonText: { color: "#0F3327", fontWeight: "600" },
  scroll: { marginTop: 12 },
  emptyText: { textAlign: "center", marginTop: 40, fontSize: 16 },
});
