import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Polygon, Stop } from "react-native-svg";

type Props = {
  style?: ViewStyle;
};

export function GreenUpLogo({ style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.green}>GREEN</Text>
      <Svg width={54} height={40} viewBox="0 0 54 40" style={styles.wedge}>
        <Defs>
          <LinearGradient id="wedgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#0FAEA6" />
            <Stop offset="100%" stopColor="#6FD05C" />
          </LinearGradient>
        </Defs>
        <Polygon points="0,40 54,0 54,40" fill="url(#wedgeGradient)" opacity={0.9} />
      </Svg>
      <Text style={styles.up}>UP</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  green: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 4,
  },
  up: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 4,
    marginLeft: 6,
  },
  wedge: {
    marginHorizontal: 6,
  },
});
