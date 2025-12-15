// src/classement/components/ClassementRow.tsx
import React from "react";
import { Image, Text, View } from "react-native";
import { ClassementUser } from "../types/classement";
import { QualificationBadge } from "./QualificationBadge";
import { RewardPreview } from "./RewardPreview";

type Props = {
  user: ClassementUser;
};

export function ClassementRow({ user }: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
        backgroundColor: user.isCurrentUser ? "#1A2F28" : "#0b1f26",
      }}
    >
      {/* Rank */}
      <Text style={{ width: 24, fontWeight: "800", color: "white" }}>
        {user.rank}
      </Text>

      {/* Avatar */}
      <Image
        source={{ uri: user.avatarUrl }}
        style={{ width: 28, height: 28, borderRadius: 14, marginRight: 10 }}
      />

      {/* Name */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: "white", fontWeight: "600" }}>
          {user.displayName}
        </Text>
        <QualificationBadge qualified={user.qualified} />
      </View>

      {/* Points + reward */}
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontWeight: "800", color: "#22c55e" }}>
          {user.rankingPoints} pts
        </Text>
        <RewardPreview
          greenies={user.greeniesEarned ?? 0}
          qualified={user.qualified}
        />
      </View>
    </View>
  );
}
