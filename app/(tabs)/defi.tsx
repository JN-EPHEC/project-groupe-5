import { GradientButton } from "@/components/ui/common/GradientButton";
import { useThemeMode } from "@/hooks/theme-context";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { CategorySelector } from "@/components/ui/defi/CategorySelector";
import { ChallengeCard } from "@/components/ui/defi/ChallengeCard";
import { CHALLENGES } from "@/components/ui/defi/constants";
import { TabSwitcher } from "@/components/ui/defi/TabSwitcher";
import { CategoryKey, Challenge, TabKey } from "@/components/ui/defi/types";
import { ValidationCard } from "@/components/ui/defi/ValidationCard";

export default function DefiScreen() {
  const router = useRouter();
  const { colors } = useThemeMode();

  const [activeTab, setActiveTab] = useState<TabKey>("defis");
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("Tous");
  const [ongoingIds, setOngoingIds] = useState<number[]>([]);

  const filteredChallenges = useMemo(() => {
    if (selectedCategory === "Tous") return CHALLENGES;
    return CHALLENGES.filter((c) => c.category === selectedCategory);
  }, [selectedCategory]);

  const ongoingChallenges = useMemo(
    () => CHALLENGES.filter((c) => ongoingIds.includes(c.id)),
    [ongoingIds]
  );

  const toggleOngoing = (id: number) => {
    setOngoingIds((prev) =>
      prev.includes(id)
        ? prev.filter((challengeId) => challengeId !== id)
        : [...prev, id]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
  {/* HEADER -> titre + sous-titre inline ; cartes via components/ui/defi */}
      <Text style={[styles.title, { color: colors.text }]}>Défis</Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>
        Relevez des défis et gagnez des points
      </Text>

      <GradientButton label="Rejoindre un club" onPress={() => router.push("/social" as any)}
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
        {activeTab === "defis" && (
          <View style={{ backgroundColor: colors.background }}>
            <CategorySelector
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </View>
        )}

        {/* Challenge cards */}
        {activeTab === "defis" &&
          filteredChallenges.map((challenge: Challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              isOngoing={ongoingIds.includes(challenge.id)}
              onToggle={toggleOngoing}
            />
          ))}

        {/* Validation cards */}
        {activeTab === "validations" &&
          (validationQueue.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>
              Aucun défi à valider.
            </Text>
          ) : (
            ongoingChallenges.map((item) => (
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
