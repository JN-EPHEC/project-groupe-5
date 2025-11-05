import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function RecompensesScreen() {
  return (
    <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ThemedText type="title">Récompenses 🎁</ThemedText>
      <ThemedText>Échange tes points contre des cadeaux exclusifs !</ThemedText>
    </ThemedView>
  );
}
