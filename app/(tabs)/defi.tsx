import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function DefiScreen() {
  return (
    <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ThemedText type="title">Défis du jour 🎯</ThemedText>
      <ThemedText>Participe à des défis pour gagner des points !</ThemedText>
    </ThemedView>
  );
}
