import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function RewardsScreen() {
  const { colors } = useThemeMode();
  const [points, setPoints] = useState(320);

  const rewards = [
    {
      id: "1",
      name: "Gourde Écologique",
      cost: 150,
      image:
        "https://cdn-icons-png.flaticon.com/512/4150/4150911.png",
    },
    {
      id: "2",
      name: "T-shirt Recyclé",
      cost: 250,
      image:
        "https://cdn-icons-png.flaticon.com/512/892/892458.png",
    },
    {
      id: "3",
      name: "Sac en Toile",
      cost: 300,
      image:
        "https://cdn-icons-png.flaticon.com/512/2906/2906873.png",
    },
    {
      id: "4",
      name: "Plante Verte",
      cost: 400,
      image:
        "https://cdn-icons-png.flaticon.com/512/616/616408.png",
    },
    {
      id: "5",
      name: "Bon d'achat Bio",
      cost: 500,
      image:
        "https://cdn-icons-png.flaticon.com/512/7759/7759301.png",
    },
  ];

  const renderReward = ({ item }: { item: any }) => (
    <View style={[styles.rewardCard, { backgroundColor: colors.surface }] }>
      <Image source={{ uri: item.image }} style={styles.rewardImage} />
      <Text style={[styles.rewardName, { color: colors.text }]}>{item.name}</Text>
      <Text style={[styles.rewardCost, { color: colors.mutedText }]}>{item.cost} pts</Text>
      <TouchableOpacity
        style={[
          styles.rewardButton,
          { backgroundColor: points >= item.cost ? colors.accent : colors.surfaceAlt },
        ]}
        disabled={points < item.cost}
        onPress={() => setPoints(points - item.cost)}
      >
        <Text style={[styles.rewardButtonText, { color: points >= item.cost ? colors.text : colors.mutedText }]}>
          {points >= item.cost ? "Obtenir" : "Insuffisant"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      {/* HEADER */}
  <Text style={[styles.header, { color: colors.text }]}>🎁 Récompenses</Text>

      {/* MES POINTS */}
      <View style={[styles.pointsCard, { backgroundColor: colors.surface }]}>
        <Ionicons name="leaf" size={22} color={colors.accent} />
        <Text style={[styles.pointsLabel, { color: colors.mutedText }]}>Mes points</Text>
        <Text style={[styles.pointsValue, { color: colors.accent }]}>{points}</Text>
      </View>

      {/* SECTION - Récompenses disponibles */}
  <Text style={[styles.sectionTitle, { color: colors.text }]}>Récompenses disponibles</Text>
      <FlatList
        data={rewards}
        renderItem={renderReward}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 20 }}
      />

      {/* SECTION - Gagner plus de points */}
  <Text style={[styles.sectionTitle, { color: colors.text }]}>Gagner plus de points</Text>

      <TouchableOpacity
  style={[styles.adButton, { backgroundColor: colors.surfaceAlt }]}
        onPress={() => setPoints(points + 10)}
      >
  <Ionicons name="play-circle-outline" size={24} color={colors.text} />
        <View style={{ marginLeft: 10 }}>
          <Text style={[styles.adText, { color: colors.text }]}>Regarder une publicité</Text>
          <Text style={[styles.adPoints, { color: colors.accent }]}>+10 points</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
  style={[styles.adButton, { backgroundColor: colors.surfaceAlt }]}
        onPress={() => setPoints(points + 50)}
      >
  <Ionicons name="share-social-outline" size={24} color={colors.text} />
        <View style={{ marginLeft: 10 }}>
          <Text style={[styles.adText, { color: colors.text }]}>Partager l'application</Text>
          <Text style={[styles.adPoints, { color: colors.accent }]}>+50 points</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D1412",
    padding: 16,
  },
  header: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  pointsCard: {
    backgroundColor: "#12201C",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  pointsLabel: { color: "#ccc", fontSize: 14, marginTop: 5 },
  pointsValue: { color: "#00C389", fontSize: 32, fontWeight: "bold" },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  rewardCard: {
    backgroundColor: "#12201C",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    width: 150,
    marginRight: 12,
  },
  rewardImage: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  rewardName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  rewardCost: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 8,
  },
  rewardButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  rewardButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  adButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#173B2F",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  adText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  adPoints: {
    color: "#7EE081",
    fontSize: 12,
  },
});
