import { FontFamilies } from "@/constants/fonts";
import { auth, db } from "@/firebaseConfig"; // Assure-toi que db est bien importé
import { useNotificationsSettings } from "@/hooks/notifications-context";
import { useThemeMode } from "@/hooks/theme-context";
import { useUser } from "@/hooks/user-context"; // Besoin de l'user pour l'ID
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 🎨 THEME NOTIFICATIONS
const notifTheme = {
    bgGradient: ["#DDF7E8", "#F4FDF9"] as const,
    glassCardBg: ["rgba(255, 255, 255, 0.85)", "rgba(255, 255, 255, 0.65)"] as const,
    glassBorder: "rgba(255, 255, 255, 0.8)",
    textMain: "#0A3F33", 
    textMuted: "#4A665F",
    accent: "#008F6B",
};

// Type pour nos notifications unifiées
type NotificationItem = {
    id: string;
    type: 'friend_request' | 'club_request' | 'info';
    title: string;
    body: string;
    date: Date;
    data?: any; // Pour stocker des IDs utiles (clubId, userId, etc.)
};

export default function NotificationsScreen() {
  const { colors, mode } = useThemeMode();
  const router = useRouter();
  const { resetUnread } = useNotificationsSettings();
  const { user } = useUser(); // On récupère l'utilisateur connecté
  const isLight = mode === "light";

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fonction pour charger les notifications
  const fetchNotifications = async () => {
    if (!user || !auth.currentUser) return;
    
    try {
        const notifs: NotificationItem[] = [];

        // 1. Récupérer les demandes d'amis (Friend Requests)
        // Suppose que les demandes sont dans users/{uid}/friendRequests
        const friendReqRef = collection(db, "users", auth.currentUser.uid, "friendRequests");
        const friendSnaps = await getDocs(friendReqRef);

        friendSnaps.forEach((doc) => {
            const data = doc.data();
            // On peut utiliser timestamp Firestore ou new Date()
            const date = data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date();
            
            notifs.push({
                id: `friend_${doc.id}`,
                type: 'friend_request',
                title: "Nouvelle demande d'ami",
                body: `${data.username || 'Un utilisateur'} souhaite vous ajouter en ami.`,
                date: date,
                data: { userId: doc.id }
            });
        });

        // 2. Récupérer les demandes d'adhésion Club (Si je suis admin)
        // On cherche d'abord les clubs où je suis admin
        const myClubsQuery = query(collection(db, "clubs"), where("admins", "array-contains", auth.currentUser.uid));
        const myClubsSnaps = await getDocs(myClubsQuery);

        // Pour chaque club, on va chercher ses requêtes
        for (const clubDoc of myClubsSnaps.docs) {
            const clubData = clubDoc.data();
            const requestsRef = collection(db, "clubs", clubDoc.id, "requests");
            const reqSnaps = await getDocs(requestsRef);

            reqSnaps.forEach((reqDoc) => {
                const rData = reqDoc.data();
                const date = rData.createdAt ? new Date(rData.createdAt.seconds * 1000) : new Date();

                notifs.push({
                    id: `club_${clubDoc.id}_${reqDoc.id}`,
                    type: 'club_request',
                    title: "Demande d'adhésion Club",
                    body: `${rData.username || 'Un utilisateur'} veut rejoindre "${clubData.name}".`,
                    date: date,
                    data: { clubId: clubDoc.id, userId: reqDoc.id }
                });
            });
        }

        // 3. Trier par date (plus récent en premier)
        notifs.sort((a, b) => b.date.getTime() - a.date.getTime());

        setItems(notifs);
    } catch (e) {
        console.error("Erreur chargement notifications:", e);
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Reset le badge "non lu" à l'ouverture
    (async () => {
      try { await resetUnread(); } catch {}
    })();
  }, [user]);

  const onRefresh = () => {
      setRefreshing(true);
      fetchNotifications();
  };

  // Couleurs dynamiques
  const titleColor = isLight ? notifTheme.textMain : colors.text;
  const textColor = isLight ? notifTheme.textMuted : colors.mutedText;
  const accentColor = isLight ? notifTheme.accent : colors.accent;

  // Wrapper Fond
  const BackgroundComponent = isLight ? LinearGradient : View;
  const bgProps = isLight 
    ? { colors: notifTheme.bgGradient, style: StyleSheet.absoluteFill } 
    : { style: [StyleSheet.absoluteFill, { backgroundColor: "#021114" }] };

  // Helper pour formater la date relative (ex: "Il y a 2h")
  const formatTime = (date: Date) => {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHrs / 24);

      if (diffDays > 0) return `Il y a ${diffDays}j`;
      if (diffHrs > 0) return `Il y a ${diffHrs}h`;
      return "À l'instant";
  };

  // Action au clic sur une notif
  const handlePressNotif = (item: NotificationItem) => {
      if (item.type === 'friend_request') {
          // Rediriger vers l'onglet social -> Amis -> Requetes (si implémenté)
          // Ou ouvrir une modale pour accepter/refuser
          router.push("/(tabs)/social"); 
      } else if (item.type === 'club_request') {
          // Rediriger vers la page du club
          // router.push(`/club/${item.data.clubId}/admin`);
          alert("Allez dans la gestion de votre club pour accepter.");
      }
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <BackgroundComponent {...(bgProps as any)} />

      <SafeAreaView style={styles.root}>
        {/* HEADER SIMPLE */}
        <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={titleColor} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: titleColor }]}>Notifications</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />}
        >
          {/* CARD CONTENU */}
          <LinearGradient
            colors={isLight ? notifTheme.glassCardBg : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[
                styles.card, 
                { borderColor: isLight ? notifTheme.glassBorder : "rgba(255,255,255,0.1)", borderWidth: 1 }
            ]}
          >
            {loading && !refreshing ? (
                <View style={styles.emptyRow}>
                    <ActivityIndicator size="small" color={accentColor} />
                </View>
            ) : items.length === 0 ? (
              <View style={styles.emptyRow}>
                <Ionicons name="notifications-off-outline" size={48} color={isLight ? "#A0AEC0" : colors.mutedText} style={{ marginBottom: 12, opacity: 0.5 }} />
                <Text style={[styles.emptyText, { color: textColor }]}>Aucune notification pour le moment.</Text>
              </View>
            ) : (
              items.map((it, index) => (
                <TouchableOpacity 
                    key={it.id} 
                    style={[
                        styles.section, 
                        index === items.length - 1 && { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }
                    ]}
                    onPress={() => handlePressNotif(it)}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
                        {/* Icone selon le type */}
                        <View style={[styles.iconBox, { backgroundColor: isLight ? "#E0F7EF" : "rgba(255,255,255,0.1)" }]}>
                            <Ionicons 
                                name={it.type === 'friend_request' ? "person-add" : "people"} 
                                size={20} 
                                color={accentColor} 
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.sectionTitle, { color: titleColor }]}>{it.title}</Text>
                            <Text style={[styles.sectionBody, { color: textColor }]}>{it.body}</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 11, color: isLight ? "#A0AEC0" : colors.mutedText, marginLeft: 8 }}>
                          {formatTime(it.date)}
                      </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 10, marginBottom: 10
  },
  backBtn: { padding: 8, borderRadius: 12 },
  headerTitle: { fontSize: 20, fontFamily: FontFamilies.heading, fontWeight: '700' },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    minHeight: 200, 
  },
  section: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)"
  },
  iconBox: {
      width: 40, height: 40, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center'
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
    fontFamily: FontFamilies.heading
  },
  sectionBody: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FontFamilies.body
  },
  emptyRow: { alignItems: "center", justifyContent: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, fontWeight: "500", fontFamily: FontFamilies.body },
});