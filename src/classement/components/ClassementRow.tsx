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
  const tierKey = getClassementTier(user.rank ?? 50);
  const tierStyle = CLASSEMENT_TIER_STYLES[tierKey];

  const isCurrentUser = user.isCurrentUser;

  const tierBorder = tierStyle.borderColor;

  // Subtle background tint (same for everyone)
  const tierBackground = `${tierBorder}14`; // ~8% opacity

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 14,
        marginBottom: 8,

        // ✅ Tier identity (everyone)
        backgroundColor: tierBackground,
        borderWidth: 1.5,
        borderColor: tierBorder,

        // ✅ Relief for everyone (soft, neutral)
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,

        // 🌟 EXTRA glow ONLY for current user
        ...(isCurrentUser && {
          shadowColor: tierBorder,
          shadowOpacity: 0.9,
          shadowRadius: 10,
          elevation: 6,
        }),
      }}
    >
      {/* Rank circle */}
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: user.isCurrentUser
            ? tierStyle.borderColor
            : "rgba(255,255,255,0.12)",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 10,
        }}
      >
        <Text style={{ color: "#0F3327", fontWeight: "800" }}>
          {user.rank}
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

      {/* Name + reserved subtitle space */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: isCurrentUser ? "#FFFFFF" : "#E5E7EB",
            fontWeight: isCurrentUser ? "800" : "600",
          }}
        >
          {user.displayName}
        </Text>

        {/* Always reserve height to avoid row jump */}
        <Text
          style={{
            height: 14,
            fontSize: 12,
            color: isCurrentUser ? "#94A3B8" : "transparent",
          }}
        >
          {isCurrentUser ? "Ta position" : "—"}
        </Text>
      </View>

      {/* Points pill (unchanged, intentional) */}
      <View
        style={{
          backgroundColor: "#D4F7E7",
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
