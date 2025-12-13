// app/validation.tsx
/*
import { auth, db } from '@/firebaseConfig';
import { useChallenges } from "@/hooks/challenges-context";
import { useThemeMode } from '@/hooks/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ValidationScreen() {
  const { colors } = useThemeMode();
  const [items, setItems] = useState<any[]>([]);
  const { current } = useChallenges();

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Important: determine the user's current difficulty
    let difficulty = "facile"; // default
    if (current?.difficulty === "Moyen") difficulty = "moyen";
    if (current?.difficulty === "Difficile") difficulty = "difficile";

    const q = query(
      collection(db, "preuves"),
      where("status", "==", "pending"),
      where("difficulty", "==", difficulty)
    );

    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((p) => p.userId !== uid); // exclude own proof

      setItems(arr);
    });

    return unsub;
  }, [current]);


  const vote = async (id: string, approve: boolean) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await updateDoc(doc(db, 'preuves', id), { ["votes."+uid]: approve, status: approve ? 'validated' : 'rejected' } as any);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Impossible de voter.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: '700' }}>Validation</Text>
        {items.length === 0 ? (
          <Text style={{ color: colors.mutedText, marginTop: 20 }}>Aucune preuve à valider.</Text>
        ) : (
          items.map((p) => (
            <View key={p.id} style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 16, marginTop: 14 }}>
              <Image source={{ uri: p.photoUrl }} style={{ height: 180, borderRadius: 12 }} />
              {!!p.commentaire && <Text style={{ color: colors.text, marginTop: 8 }}>{p.commentaire}</Text>}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <TouchableOpacity onPress={() => vote(p.id, false)} style={{ flex: 1, backgroundColor: '#2A171A', borderWidth: 1, borderColor: '#F45B69', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}>
                  <Ionicons name='close' size={16} color='#F45B69' />
                  <Text style={{ color: '#F45B69', fontWeight: '700' }}>Rejeter</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => vote(p.id, true)} style={{ flex: 1, backgroundColor: '#D4F7E7', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}>
                  <Ionicons name='checkmark' size={16} color='#0F3327' />
                  <Text style={{ color: '#0F3327', fontWeight: '800' }}>Valider</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});*/
