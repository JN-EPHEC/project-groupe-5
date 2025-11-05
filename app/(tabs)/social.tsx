import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function SocialScreen() {
  return (
    <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ThemedText type="title">Social 💬</ThemedText>
      <ThemedText>Discute et partage avec la communauté !</ThemedText>
    </ThemedView>
  );
}
