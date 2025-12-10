import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, ViewStyle } from "react-native";

type AnimatedLeafProps = {
  size?: number;
  style?: ViewStyle;
  colorOverride?: string;
};

/**
 * Little breathing leaf badge to sprinkle playful eco feedback around the UI.
 * Keeps animation lightweight so it works across platforms without extra assets.
 */
export function AnimatedLeaf({ size = 22, style, colorOverride }: AnimatedLeafProps) {
  const { colors } = useThemeMode();
  const scale = useRef(new Animated.Value(0.9)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.05,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.9,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(translate, {
            toValue: -3,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(translate, {
            toValue: 3,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(rotate, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: -1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
      translate.setValue(0);
      rotate.setValue(0);
      scale.setValue(0.9);
    };
  }, [rotate, scale, translate]);

  const rotation = rotate.interpolate({ inputRange: [-1, 1], outputRange: ["-8deg", "8deg"] });

  return (
    <Animated.View
      style={[styles.leaf, style, { transform: [{ scale }, { translateY: translate }, { rotate: rotation }] }]}
    > 
      <Ionicons name="leaf" size={size} color={colorOverride || colors.accent} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  leaf: {
    justifyContent: "center",
    alignItems: "center",
  },
});
