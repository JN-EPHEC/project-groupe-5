import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, TouchableOpacity, ViewStyle } from "react-native";

type Props = {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  colors?: string[];
};

export const GradientButton: React.FC<Props> = ({ label, onPress, style, disabled, colors }) => {
  const gradient = colors ?? ["#90F7D5", "#38D793", "#23C37A"];
  const gradColors = (disabled ? ["#AABBB5", "#AABBB5"] : gradient) as any;
  return (
    <TouchableOpacity onPress={onPress} disabled={!!disabled} style={style} activeOpacity={0.85}>
      <LinearGradient
        colors={gradColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingVertical: 12, borderRadius: 18, alignItems: "center", justifyContent: "center" }}
      >
        <Text style={{ color: "#0F3327", fontWeight: "700" }}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};
