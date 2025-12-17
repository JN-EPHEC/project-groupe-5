// src/classement/components/ClassementRow.tsx
import React from "react";
import { Image, Text, View } from "react-native";
import { ClassementUser } from "../types/classement";
import { CLASSEMENT_TIER_STYLES } from "../utils/classementTierColors";
import { getClassementTier } from "../utils/getClassementTier";

type Props = {
  user: ClassementUser;
};

export function ClassementRow({ user }: Props) {
  const rank = user.rank ?? 50;
  const isCurrentUser = user.isCurrentUser;
  const isQualified = user.qualified === true;

  // 🎨 Rank → color identity
  const rankColor =
    rank === 1
      ? { bg: "#FACC15", text: "#3B2F00" } // gold
      : rank === 2
      ? { bg: "#CBD5E1", text: "#1F2933" } // silver
      : rank === 3
      ? { bg: "#D97706", text: "#3B1F00" } // bronze
      : null;

  const tierKey = getClassementTier(rank);
  const tierBorder = CLASSEMENT_TIER_STYLES[tierKey].borderColor;

  // ✅ FULL PLATE ONLY IF QUALIFIED
  const isFullPlate = isQualified;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 16,
        marginBottom: 10,

        // 🎨 Background logic
        backgroundColor: isFullPlate
          ? rankColor?.bg ?? tierBorder
          : `${tierBorder}14`,

        // ❌ No border when full plate
        borderWidth: isFullPlate ? 0 : 1.5,
        borderColor: tierBorder,

        // 🧱 Relief (neutral)
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 3,

        // 🌟 Extra emphasis for current user
        ...(isCurrentUser && {
          shadowColor: tierBorder,
          shadowOpacity: 0.8,
          shadowRadius: 8,
          elevation: 6,
        }),
      }}
    >
      {/* Rank */}
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: isFullPlate
            ? "rgba(0,0,0,0.15)"
            : tierBorder,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 10,
        }}
      >
        <Text
          style={{
            color: isFullPlate
              ? rankColor?.text ?? "#0F3327"
              : "#0F3327",
            fontWeight: "800",
          }}
        >
          {rank}
        </Text>
      </View>

      {/* Avatar */}
      <Image
        source={{
          uri:
            user.avatarUrl ??
            `https://i.pravatar.cc/100?u=${encodeURIComponent(
              user.displayName
            )}`,
        }}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          marginRight: 10,
        }}
      />

      {/* Name */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: isFullPlate
              ? rankColor?.text ?? "#FFFFFF"
              : "#E5E7EB",
            fontWeight: "800",
          }}
        >
          {user.displayName}
        </Text>

        {isCurrentUser && (
          <Text
            style={{
              fontSize: 12,
              color: isFullPlate
                ? rankColor?.text ?? "#94A3B8"
                : "#94A3B8",
            }}
          >
            Ta position
          </Text>
        )}
      </View>

      {/* Points */}
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.75)",
          borderRadius: 12,
          paddingHorizontal: 10,
          paddingVertical: 6,
        }}
      >
        <Text style={{ color: "#0F3327", fontWeight: "800" }}>
          {user.rankingPoints} pts
        </Text>
      </View>
    </View>
  );
}
