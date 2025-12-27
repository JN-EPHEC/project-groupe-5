import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

export default function ProgressCircle({ done = 0, total = 7 }) {
  const { colors, mode } = useThemeMode();
  const isLight = mode === "light";

  const size = 80;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? (Math.min(done, total) / total) * circumference : 0;

  // Couleurs
  const trackColor = isLight ? "#E2E8F0" : "rgba(255,255,255,0.1)";
  const progressColor = isLight ? "#008F6B" : colors.accent; // Vert marque
  // ✅ CORRECTION : Texte en vert marque (#008F6B) pour matcher "Points gagnés"
  const textColor = isLight ? "#008F6B" : colors.text;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Circle
          stroke={trackColor}
          fill="none"
          cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={progressColor}
          fill="none"
          cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View style={styles.textContainer}>
        <Text style={[styles.progressText, { color: textColor }]}>
            {done || 0}/{total}
        </Text>
        <Text style={{ fontSize: 10, color: isLight ? "#64748B" : colors.mutedText, marginTop: -2 }}>
            Jours
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  textContainer: { position: "absolute", alignItems: 'center', justifyContent: 'center' },
  progressText: { fontFamily: FontFamilies.heading, fontSize: 18, fontWeight: 'bold' },
});