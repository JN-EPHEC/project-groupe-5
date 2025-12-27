import { useThemeMode } from "@/hooks/theme-context";
import { Image, Text, View } from "react-native";
import { useClubClassement } from "../hooks/useClubClassement";

export function ClubClassementList() {
  const { colors } = useThemeMode();
  const clubs = useClubClassement();

  const myIndex = clubs.findIndex((c) => c.isMine);

  return (
    <View style={{ marginTop: 12 }}>
      {clubs.map((c, idx) => {
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
            key={c.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 14,
              marginBottom: 8,
              backgroundColor: c.isMine ? "#1A2F28" : colors.surfaceAlt,
            }}
          >
            {/* Rank bubble */}
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

            {/* Avatar */}
            <Image
              source={{ uri: c.avatar }}
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
                  color: colors.text,
                  fontWeight: c.isMine ? "800" : "600",
                }}
              >
                {c.name}
              </Text>

              {c.isMine && (
                <Text
                  style={{ color: colors.mutedText, fontSize: 12 }}
                >
                  Ton club
                </Text>
              )}
            </View>

            {/* Points pill */}
            <View
              style={{
                backgroundColor: "#D4F7E7",
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: "#0F3327", fontWeight: "800" }}>
                {c.pts} pts
              </Text>
            </View>
          </View>
        );
      })}

      {/* Footer / club position */}
      <View
        style={{
          marginTop: 8,
          borderTopWidth: 1,
          borderColor: colors.surfaceAlt,
          paddingTop: 8,
        }}
      >
        <Text style={{ color: colors.text, fontWeight: "700" }}>
          Position club: {myIndex >= 0 ? myIndex + 1 : "—"}
        </Text>
      </View>
    </View>
  );
}
