import { useThemeMode } from "@/hooks/theme-context";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Removed preset quick buttons per request

export default function DonationBanner() {
  const { colors } = useThemeMode();
  const [amount, setAmount] = useState<number>(10);
  const [editing, setEditing] = useState(false);

  const cycle = (delta: number) => setAmount(a => Math.max(1, a + delta));
  const step = 5;
  const handleCustomChange = (txt: string) => {
    const v = parseInt(txt.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(v)) setAmount(Math.max(1, v));
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}> 
      <Text style={[styles.title, { color: colors.text }]}>Soutenir des projets écologiques</Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>Chaque don finance directement les actions locales partenaires.</Text>

      <View style={styles.adjustRow}> 
        <TouchableOpacity style={[styles.circleBtn, { borderColor: colors.surfaceAlt }]} onPress={() => cycle(-step)}>
          <Text style={[styles.circleText, { color: colors.text }]}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setEditing(true)}>
          {editing ? (
            <TextInput
              autoFocus
              keyboardType="numeric"
              value={String(amount)}
              onChangeText={handleCustomChange}
              onBlur={() => setEditing(false)}
              style={[styles.amountInput, { color: colors.text }]}
            />
          ) : (
            <Text style={[styles.amountText, { color: colors.text }]}>{amount}€</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.circleBtn, { borderColor: colors.surfaceAlt }]} onPress={() => cycle(+step)}>
          <Text style={[styles.circleText, { color: colors.text }]}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.donateBtn, { backgroundColor: colors.accent }]} activeOpacity={0.9}>
        <Text style={styles.donateText}>Faire un don de {amount}€</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 12, marginTop: 12 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2, lineHeight: 16, marginBottom: 10, textAlign: 'center' },
  customBox: { display: 'none' },
  customInput: { display: 'none' },
  adjustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  circleBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  circleText: { fontSize: 20, fontWeight: '700' },
  amountText: { fontSize: 26, fontWeight: '800' },
  amountInput: { fontSize: 26, fontWeight: '800', minWidth: 80, textAlign: 'center' },
  donateBtn: { borderRadius: 18, paddingVertical: 10, alignItems: 'center' },
  donateText: { fontSize: 16, fontWeight: '800', color: '#0F3327' },
});
