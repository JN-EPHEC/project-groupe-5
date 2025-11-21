export type BrandReward = {
  id: string;
  brand: string;
  title: string; // sous-titre
  badge: string; // catégorie
  costCoins: number;
  bg: string; // couleur de fond hero
  description: string; // texte explicatif pour le modal
};

// Données en TSX (pas de JSX ici, mais extension .tsx à la demande)
export const brandRewards: BrandReward[] = [
  {
    id: "paypal-20",
    brand: "PayPal",
    title: "Coupon de 20 $",
    badge: "Argent",
    costCoins: 50,
    bg: "#2B8ACB",
    description:
      "PayPal est un leader du paiement en ligne. Les coupons permettent d'encourager des actions écoresponsables en offrant une récompense utilisable partout où PayPal est accepté.",
  },
  {
    id: "nike-10",
    brand: "Nike",
    title: "Carte cadeau 10 $",
    badge: "Fitness",
    costCoins: 100,
    bg: "#FF6A00",
    description:
      "Nike investit dans l'innovation durable: matériaux recyclés, chaînes logistiques plus propres, et produits longue durée. La carte cadeau te permet de soutenir ces efforts.",
  },
  {
    id: "asadventure-10",
    brand: "AS Adventure",
    title: "Carte cadeau 10 €",
    badge: "Outdoor",
    costCoins: 80,
    bg: "#0C6A4C",
    description:
      "AS Adventure propose de l'équipement outdoor et met en avant des marques responsables. Idéal pour équiper tes activités en plein air de manière durable.",
  },
];
