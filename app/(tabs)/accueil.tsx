// DEPRECATED FILE: this route is no longer used; use app/(tabs)/acceuil.tsx and components/ui/acceuil/*
// Legacy screen kept only to redirect to the unified "acceuil" route.
import { Redirect } from "expo-router";

export default function AccueilRedirect() {
  return <Redirect href="/(tabs)/acceuil" />;
}
