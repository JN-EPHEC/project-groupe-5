import { FontFamilies } from "@/constants/fonts";
import { useNotifications } from "@/hooks/notifications-context"; // ✅ On utilise le vrai hook
import { useThemeMode } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FlatList, GestureHandlerRootView, Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

// 🎨 THEME NOTIFICATIONS
const notifTheme = {
    bgGradient: ["#DDF7E8", "#F4FDF9"] as const,
    activeCardBg: "#FFFFFF",
    readCardBg: "rgba(255, 255, 255, 0.6)",
    textMain: "#0A3F33", 
    textMuted: "#4A665F",
    accent: "#008F6B",
    corail: "#FF8C66" // Pour le non-lu et le delete
};

export default function NotificationsScreen() {
  const { colors, mode } = useThemeMode();
  const router = useRouter();
  const { notifications, markAllAsRead, deleteNotification, loading } = useNotifications();
  const isLight = mode === "light";

  // ✅ REMETTRE LE COMPTEUR À ZERO QUAND ON ARRIVE SUR LA PAGE
  useFocusEffect(
    useCallback(() => {
      markAllAsRead();
    }, [])
  );

  // Wrapper Fond
  const BackgroundComponent = isLight ? LinearGradient : View;
  const bgProps = isLight 
    ? { colors: notifTheme.bgGradient, style: StyleSheet.absoluteFill } 
    : { style: [StyleSheet.absoluteFill, { backgroundColor: "#021114" }] };

  // --- ACTIONS SWIPE (SUPPRIMER) ---
  const renderRightActions = (progress: any, dragX: any, id: string) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity onPress={() => deleteNotification(id)} activeOpacity={0.8}>
        <View style={styles.deleteButton}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name="trash-outline" size={24} color="#FFF" />
          </Animated.View>
        </View>
      </TouchableOpacity>
    );
  };

  // --- RENDU D'UNE NOTIF ---
  const renderItem = ({ item }: { item: any }) => {
    // Si c'est une demande d'ami/club, on peut ajouter une logique de clic spécifique
    const handlePress = () => {
        if (item.data?.type === 'friend_request') router.push("/(tabs)/social");
        // Autres redirections possibles...
    };

    return (
      <Swipeable renderRightActions={(p, d) => renderRightActions(p, d, item.id)}>
        <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={handlePress}
            style={[
              styles.card, 
              { 
                backgroundColor: item.read 
                    ? (isLight ? notifTheme.readCardBg : "rgba(255,255,255,0.05)") 
                    : (isLight ? notifTheme.activeCardBg : "rgba(255,255,255,0.1)"),
                borderLeftColor: item.read ? "transparent" : notifTheme.corail,
                borderLeftWidth: item.read ? 0 : 4,
                opacity: item.read ? 0.8 : 1
              }
            ]}
        >
          <View style={styles.cardContent}>
              {/* Icône */}
              <View style={[styles.iconBox, { backgroundColor: isLight ? "#E0F7EF" : "rgba(255,255,255,0.1)" }]}>
                  <Ionicons 
                    name={item.type === 'alert' ? "warning" : "notifications"} 
                    size={20} 
                    color={isLight ? notifTheme.accent : "#FFF"} 
                  />
              </View>

              {/* Texte */}
              <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={[styles.title, { color: isLight ? notifTheme.textMain : "#FFF", fontWeight: item.read ? '600' : '800' }]}>
                          {item.title}
                      </Text>
                      <Text style={styles.date}>
                          {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : "À l'instant"}
                      </Text>
                  </View>
                  <Text style={[styles.body, { color: isLight ? notifTheme.textMuted : "#AAA" }]} numberOfLines={2}>
                      {item.body}
                  </Text>
              </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <BackgroundComponent {...(bgProps as any)} />

      <SafeAreaView style={styles.root}>
        {/* HEADER */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={isLight ? notifTheme.textMain : colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: isLight ? notifTheme.textMain : colors.text }]}>Notifications</Text>
            <View style={{ width: 40 }} />
        </View>

        {/* LISTE */}
        {notifications.length === 0 ? (
            <View style={styles.empty}>
                <Ionicons name="notifications-off-outline" size={64} color={isLight ? "#A0AEC0" : colors.mutedText} style={{ opacity: 0.5 }} />
                <Text style={[styles.emptyText, { color: isLight ? notifTheme.textMuted : colors.mutedText }]}>Aucune notification</Text>
            </View>
        ) : (
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 10, marginBottom: 10
  },
  backBtn: { padding: 8, borderRadius: 12 },
  headerTitle: { fontSize: 22, fontFamily: FontFamilies.heading, fontWeight: '700' },
  
  listContent: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 },
  
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FFF',
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    marginBottom: 0 // Géré par ItemSeparator
  },
  cardContent: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  
  iconBox: {
      width: 40, height: 40, borderRadius: 14, 
      alignItems: 'center', justifyContent: 'center'
  },
  title: { fontSize: 15, flex: 1, fontFamily: FontFamilies.heading },
  body: { fontSize: 13, lineHeight: 18, fontFamily: FontFamilies.body },
  date: { fontSize: 10, color: '#9CA3AF', marginLeft: 8, marginTop: 2 },

  // Delete Action
  deleteButton: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 16,
    marginLeft: 10 // Petit espace entre la carte et le bouton rouge
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -50 },
  emptyText: { fontSize: 16, marginTop: 16, fontFamily: FontFamilies.body }
});