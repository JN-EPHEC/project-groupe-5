import { Challenge } from "./types";

export const CATEGORY_CONFIG = {
  Tous: { icon: "earth-outline", label: "Tous" },
  Recyclage: { icon: "leaf-outline", label: "Recyclage" },
  Local: { icon: "storefront-outline", label: "Local" },
  Transports: { icon: "bicycle-outline", label: "Transports" },
  Tri: { icon: "trash-outline", label: "Tri" },
  Sensibilisation: { icon: "megaphone-outline", label: "Sensibilisation" },
} as const;

export const DIFFICULTY_COLORS: Record<Challenge["difficulty"], string> = {
  Facile: "#52D192",
  Moyen: "#F4C95D",
  Difficile: "#F45B69",
};

export const CHALLENGES: Challenge[] = [
  {
    id: 1,
    title: "Recycler 3 bouteilles plastiques",
    description: "Recyclez 3 bouteilles en plastique et partagez une photo de votre geste.",
    category: "Recyclage",
    difficulty: "Facile",
    points: 10,
    audience: "Membre",
    timeLeft: "14 h 25",
  },
  {
    id: 2,
    title: "Aller au marché local",
    description: "Achetez des produits locaux et montrez votre panier de fruits/légumes.",
    category: "Local",
    difficulty: "Moyen",
    points: 20,
    audience: "Membre",
    timeLeft: "2 j 03 h",
  },
  {
    id: 3,
    title: "Choisir le vélo pour se déplacer",
    description: "Faites un trajet de 5 km à vélo au lieu de prendre la voiture.",
    category: "Transports",
    difficulty: "Moyen",
    points: 20,
    audience: "Membre",
    timeLeft: "1 j 12 h",
  },
  {
    id: 4,
    title: "Défi compost maison",
    description: "Mettez en place un composteur domestique et partagez une photo.",
    category: "Tri",
    difficulty: "Difficile",
    points: 30,
    audience: "Membre",
    timeLeft: "4 j 05 h",
  },
  {
    id: 5,
    title: "Partager un conseil écologique",
    description: "Publiez un conseil zéro-déchet sur les réseaux sociaux.",
    category: "Sensibilisation",
    difficulty: "Facile",
    points: 10,
    audience: "Membre",
    timeLeft: "8 h 10",
  },
];
