// components/ui/GlobalPopup.tsx
import type { PopupVariant } from "@/hooks/global-popup-context";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type GlobalPopupProps = {
  visible: boolean;
  title: string;
  description?: string;
  variant?: PopupVariant;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  onClose: () => void;
};

export function GlobalPopup({
  visible,
  title,
  description,
  variant = "info",
  primaryLabel = "OK",
  onPrimary,
  onClose,
}: GlobalPopupProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacity.setValue(0);
      scale.setValue(0.9);
    }
  }, [visible, opacity, scale]);

  const isSuccess = variant === "success";
  const isError = variant === "error";

  const accentColor = isSuccess
    ? "#16a34a" // green
    : isError
    ? "#dc2626" // red
    : "#22c55e"; // default GreenUp-ish

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale }], opacity },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: accentColor }]}>
            <Text style={styles.iconText}>
              {isSuccess ? "✔" : isError ? "✖" : "!"}
            </Text>
          </View>

          <Text style={styles.title}>{title}</Text>

          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}

          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.button, { backgroundColor: accentColor }]}
              onPress={() => {
                onPrimary?.();
                onClose();
              }}
            >
              <Text style={styles.buttonText}>{primaryLabel}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 20,
    backgroundColor: "#04131a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  iconText: {
    fontSize: 22,
    color: "white",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  secondaryButtonText: {
    color: "rgba(255,255,255,0.9)",
  },
});
