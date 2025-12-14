import { FontFamilies } from "@/constants/fonts";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

const ecoTechStyles = {
  vertVif: "#10B981",
  fondGris: "#F1F5F9",
  texteVertForet: "#15803D",
};

export default function ProgressCircle({ done = 0, total = 5 }) {
  const size = 80;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? (done / total) * circumference : 0;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Cercle de fond */}
        <Circle
          stroke={ecoTechStyles.fondGris}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />

        {/* Cercle progressif */}
        <Circle
          stroke={ecoTechStyles.vertVif}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <Text style={styles.progressText}>
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
    color: ecoTechStyles.texteVertForet,
    fontFamily: FontFamilies.heading,
    fontSize: 16,
  },
});
