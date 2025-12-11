import { FontFamilies } from "@/constants/fonts";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, TouchableOpacity, ViewStyle } from "react-native";

type Props = {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  colors?: readonly [string, string] | readonly [string, string, ...string[]];
};

export const GradientButton: React.FC<Props> = ({ label, onPress, style, disabled, colors }) => {
  const gradient = colors ?? ["#00D68F", "#00D68F"] as const;
  const disabledGradient = ["#AABBB5", "#AABBB5"] as const;
  const gradColors = disabled ? disabledGradient : gradient;
  return (
    <TouchableOpacity onPress={onPress} disabled={!!disabled} style={style} activeOpacity={0.85}>
      <LinearGradient
        colors={gradColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingVertical: 12, borderRadius: 18, alignItems: "center", justifyContent: "center" }}
      >
        <Text style={{ color: "#FFFFFF", fontFamily: FontFamilies.heading }}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};
