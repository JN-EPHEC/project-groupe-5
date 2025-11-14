import { useThemeMode } from "@/hooks/theme-context";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

export default function ProgressCircle({ done = 0, total = 5 }) {
  const { colors } = useThemeMode();
  const size = 80;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (done / total) * circumference;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Cercle de fond */}
        <Circle
          stroke="#1C2A27"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
        />

        {/* Cercle progressif */}
        <Circle
          stroke="#00C389"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <Text style={[styles.progressText, { color: colors.text }]}>
        {done}/{total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    position: "absolute",
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
