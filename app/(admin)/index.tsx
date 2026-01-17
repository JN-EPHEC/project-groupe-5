import { AdminNav } from "@/components/ui/(admin)/AdminNav";
import { FontFamilies } from "@/constants/fonts";
import { useThemeMode } from "@/hooks/theme-context";
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminPanel() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, colors } = useThemeMode();
  const isDark = mode === 'dark';

  const accentColor = "#008F6B"; // Ton vert
  const subTextColor = isDark ? '#9CA3AF' : '#64748B';
  const bgColors = isDark ? [colors.background, "#1F2937"] : ["#F9FAFB", "#F3F4F6"];

  const logoSource = isDark
    ? require('../../assets/images/logo_fond_vert_degradé__1_-removebg-preview.png')
    : require('../../assets/images/logo_Green_UP_noir_degradé-removebg-preview.png');

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={bgColors as any} style={StyleSheet.absoluteFill} />

      {/* BOUTON QUITTER (Uniquement ici) */}
      <TouchableOpacity
        onPress={() => router.replace("/(tabs)/profil")}
        activeOpacity={0.8}
        style={[
          styles.backButton, 
          { top: Platform.OS === 'ios' ? insets.top + 10 : 20 }
        ]}
      >
        <View style={[styles.buttonContent, { backgroundColor: isDark ? "#1F2937" : "#FFF", borderColor: isDark ? "#374151" : "rgba(0,0,0,0.05)" }]}>
          <Ionicons name="arrow-back" size={22} color={isDark ? "#FFF" : "#111827"} />
        </View>
      </TouchableOpacity>

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* HEADER LOGO */}
          <View style={styles.header}>
            <Image 
              source={logoSource} 
              style={[styles.logo, !isDark && { tintColor: accentColor }]} 
              resizeMode="contain" 
            />
          </View>

          {/* TITRES - Vert Appliqué */}
          <View style={styles.titleContainer}>
            <Text style={[styles.mainTitle, { color: accentColor }]}>Panneau Admin</Text>
            <Text style={[styles.subTitle, { color: subTextColor }]}>Gérez le contenu et la communauté.</Text>
          </View>

          <View style={styles.cardsContainer}>
            <MenuCard
              title="Défis"
              subtitle="Gérer le catalogue des défis"
              icon={<Ionicons name="trophy-outline" size={24} color={accentColor} />}
              onPress={() => router.push('/(admin)/defis')}
              isDark={isDark}
            />
            <MenuCard
              title="Gestion Coupons"
              subtitle="Récompenses & Stocks"
              icon={<MaterialCommunityIcons name="ticket-percent-outline" size={24} color={accentColor} />}
              onPress={() => router.push('/(admin)/coupons')}
              isDark={isDark}
            />
            <MenuCard
              title="Avis & Retours"
              subtitle="Feedback des utilisateurs"
              icon={<Ionicons name="chatbubble-ellipses-outline" size={24} color={accentColor} />}
              onPress={() => router.push('/(admin)/feedback')}
              isDark={isDark}
            />
            <MenuCard
              title="Signalements"
              subtitle="Modération de la communauté"
              icon={<Feather name="shield" size={24} color="#EF4444" />}
              onPress={() => router.push('/(admin)/reports')}
              isDark={isDark}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      <AdminNav />
    </View>
  );
}

const MenuCard = ({ icon, title, subtitle, onPress, isDark }: any) => (
  <TouchableOpacity 
    style={[styles.card, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF', borderWidth: isDark ? 1 : 0, borderColor: '#374151' }]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.cardLeft}>
      <View style={[styles.iconContainer, { backgroundColor: isDark ? "rgba(0,143,107,0.15)" : "#E0F7EF" }]}>
        {icon}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#111827' }]}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  scrollContent: { padding: 24, paddingBottom: 120, paddingTop: 60 },
  backButton: { position: "absolute", left: 24, zIndex: 9999 },
  buttonContent: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center", borderWidth: 1, elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  header: { alignItems: 'center', marginBottom: 5 },
  logo: { width: 150, height: 80 },
  titleContainer: { marginBottom: 30, alignItems: 'center' },
  mainTitle: { fontSize: 28, fontFamily: FontFamilies.heading, fontWeight: '900' },
  subTitle: { fontSize: 15, textAlign: 'center', marginTop: 4 },
  cardsContainer: { gap: 16 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 24, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  textContainer: { justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
});