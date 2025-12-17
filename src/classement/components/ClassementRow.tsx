// src/classement/components/ClassementRow.tsx
import React from "react";
import { Image, Text, View } from "react-native";
import { ClassementUser } from "../types/classement";
import { CLASSEMENT_TIER_STYLES } from "../utils/classementTierColors";
import { getClassementTier } from "../utils/getClassementTier";
import { QualificationBadge } from "./QualificationBadge";
import { RewardPreview } from "./RewardPreview";


type Props = {
  user: ClassementUser;
};

export function ClassementRow({ user }: Props) {
  const tierKey = getClassementTier(user.rank ?? 50);
  const tierStyle = CLASSEMENT_TIER_STYLES[tierKey];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,

        backgroundColor: tierStyle.background,
        borderWidth: 1.5,
        borderColor: tierStyle.border,

        // keep highlight for current user
        ...(user.isCurrentUser && {
          shadowColor: tierStyle.border,
          shadowOpacity: 0.9,
          shadowRadius: 10,
          elevation: 4,
        }),
      }}
    >

      {/* Rank */}
      <Text style={{ width: 24, fontWeight: "800", color: "white" }}>
        {user.rank}
      </Text>

      {/* Avatar */}
      {user.avatarUrl && !user.isFake ? (
        <Image
          source={{ uri: user.avatarUrl }}
          style={{ width: 28, height: 28, borderRadius: 14, marginRight: 10 }}
        />
      ) : (
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            marginRight: 10,
            backgroundColor: "#1f2937",
          }}
        />
      )}

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
