import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
// On utilise votre hook de thème personnalisé
import { useThemeMode } from "@/hooks/theme-context";

// --- 1. DÉFINITION DES TYPES ---

interface MenuCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  isDark: boolean; // Ajout pour gérer le style interne
}

interface BottomTabItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress?: () => void;
  isDark: boolean; // Ajout pour gérer le style interne
}

export default function AdminPanel() {
  const router = useRouter();
  
  // Utilisation du hook de thème (plus fiable que useColorScheme système)
  const { theme } = useThemeMode();
  const isDark = theme === 'dark';

  // --- 2. COULEURS DYNAMIQUES ---
  const backgroundColor = isDark ? '#111827' : '#F8F9FA';
  const textColor = isDark ? '#F9FAFB' : '#0F172A';
  const subTextColor = isDark ? '#9CA3AF' : '#64748B';
  const bottomNavBg = isDark ? '#1F2937' : '#FFFFFF';
  const bottomNavBorder = isDark ? '#374151' : '#F1F5F9';

  // --- 3. CHEMINS D'IMAGES ---
  const logoSource: ImageSourcePropType = isDark
    ? require('../../assets/images/logo_fond_vert_degradé__1_-removebg-preview.png')
    : require('../../assets/images/logo_Green_UP_noir_degradé-removebg-preview.png');

  // --- FONCTIONS DE NAVIGATION ---
  const navToDefis = () => router.push('/(admin)/defis');
  const navToCoupons = () => router.push('/(admin)/coupons');
  const navToAvis = () => router.push('/(admin)/feedback');
  const navToSignalements = () => router.push('/(admin)/reports');

  return (
    // Application de la couleur de fond dynamique
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={styles.container}>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* HEADER */}
          <View style={styles.header}>
            <Image
              source={logoSource}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* TITRES */}
          <View style={styles.titleContainer}>
            <Text style={[styles.mainTitle, { color: textColor }]}>Panneau Admin</Text>
            <Text style={[styles.subTitle, { color: subTextColor }]}>Gérez le contenu et la communauté.</Text>
          </View>

          {/* LISTE DES CARTES */}
          <View style={styles.cardsContainer}>

            <MenuCard
              onPress={navToDefis}
              icon={<Ionicons name="trophy-outline" size={24} color="#2D6A4F" />}
              iconBg={isDark ? "rgba(45, 106, 79, 0.2)" : "#E8F5E9"} // Fond icône plus subtil en dark
              title="Défis"
              subtitle="Gérer le catalogue des défis"
              isDark={isDark}
            />

            <MenuCard
              onPress={navToCoupons}
              icon={<MaterialCommunityIcons name="ticket-percent-outline" size={24} color={isDark ? "#A5B4FC" : "#1D3557"} />}
              iconBg={isDark ? "rgba(29, 53, 87, 0.5)" : "#F1F5F9"}
              title="Gestion Coupons"
              subtitle="Récompenses & Stocks"
              isDark={isDark}
            />

            <MenuCard
              onPress={navToAvis}
              icon={<Ionicons name="chatbubble-ellipses-outline" size={24} color={isDark ? "#E5E7EB" : "#333"} />}
              iconBg={isDark ? "rgba(255, 255, 255, 0.1)" : "#F5F5F5"}
              title="Avis & Retours"
              subtitle="Feedback des utilisateurs"
              isDark={isDark}
            />

            <MenuCard
              onPress={navToSignalements}
              icon={<Feather name="shield" size={24} color="#E63946" />}
              iconBg={isDark ? "rgba(230, 57, 70, 0.2)" : "#FFEBEE"}
              title="Signalements"
              subtitle="Modération de la communauté"
              isDark={isDark}
            />

          </View>
        </ScrollView>

        {/* BARRE DE NAVIGATION */}
        <View style={[styles.bottomNav, { backgroundColor: bottomNavBg, borderTopColor: bottomNavBorder }]}>
          <BottomTabItem 
            icon="home-outline" 
            label="Accueil" 
            active={true} 
            onPress={() => {}} 
            isDark={isDark}
          />
          
          <BottomTabItem 
            icon="trophy-outline" 
            label="Défis" 
            onPress={navToDefis}
            isDark={isDark}
          />
          
          <BottomTabItem 
            icon="ticket-outline" 
            label="Coupons" 
            onPress={navToCoupons}
            isDark={isDark}
          />
          
          <BottomTabItem 
            icon="star-outline" 
            label="Avis" 
            onPress={navToAvis}
            isDark={isDark}
          />
          
          <BottomTabItem 
            icon="alert-circle-outline" 
            label="Alertes" 
            onPress={navToSignalements}
            isDark={isDark}
          />
        </View>

      </View>
    </SafeAreaView>
  );
}

// --- 3. COMPOSANTS TYPÉS ---

const MenuCard: React.FC<MenuCardProps> = ({ icon, iconBg, title, subtitle, onPress, isDark }) => {
  // Styles dynamiques pour la carte
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const titleColor = isDark ? '#F9FAFB' : '#1E293B';
  const subTitleColor = isDark ? '#9CA3AF' : '#94A3B8';
  const chevronColor = isDark ? '#4B5563' : '#C7C7CC';

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: cardBg }]} 
      onPress={onPress}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          {icon}
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.cardTitle, { color: titleColor }]}>{title}</Text>
          <Text style={[styles.cardSubtitle, { color: subTitleColor }]}>{subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={chevronColor} />
    </TouchableOpacity>
  );
};

const BottomTabItem: React.FC<BottomTabItemProps> = ({ icon, label, active = false, onPress, isDark }) => {
  const inactiveColor = isDark ? '#9CA3AF' : '#666';
  
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress}>
      <Ionicons name={icon} size={24} color={active ? "#2D6A4F" : inactiveColor} />
      <Text style={[styles.tabLabel, { color: active ? "#2D6A4F" : inactiveColor }]}>{label}</Text>
    </TouchableOpacity>
  );
};

// --- STYLES STATIQUES ---
// (Seules les valeurs de structure restent ici, les couleurs sont gérées en ligne)

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // backgroundColor géré dynamiquement
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Platform.OS === 'android' ? 10 : 0,
    marginBottom: 0,
  },
  logo: {
    width: 180,
    height: 100,
  },
  titleContainer: {
    marginBottom: 25,
    alignItems: 'center',
    marginTop: -10,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 5,
    textAlign: 'center',
    // color géré dynamiquement
  },
  subTitle: {
    fontSize: 15,
    textAlign: 'center',
    // color géré dynamiquement
  },
  cardsContainer: {
    gap: 15,
  },
  card: {
    // backgroundColor géré dynamiquement
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    // color géré dynamiquement
  },
  cardSubtitle: {
    fontSize: 13,
    // color géré dynamiquement
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // backgroundColor géré dynamiquement
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    borderTopWidth: 1,
    // borderTopColor géré dynamiquement
  },
  tabItem: {
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    // color géré dynamiquement
  },
  activeTabLabel: {
    fontWeight: 'bold',
  }
});