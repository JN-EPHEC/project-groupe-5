import { useThemeMode } from "@/hooks/theme-context";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const PRESETS = [5,10,20];

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
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>CHAQUE DON FINANCE DIRECTEMENT LES ACTIONS DES ASSOCIATIONS LOCALES PARTENAIRES.</Text>

      <View style={styles.presetsRow}>
        {PRESETS.map(p => (
          <TouchableOpacity
            key={p}
            onPress={() => setAmount(p)}
            style={[styles.pill, { backgroundColor: amount === p ? colors.accent : 'transparent', borderColor: colors.accent }]}
            activeOpacity={0.85}
          >
            <Text style={{ color: amount === p ? '#0F3327' : colors.text, fontWeight: '700' }}>{p}€</Text>
          </TouchableOpacity>
        ))}
      </View>

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
  card: { borderRadius: 22, padding: 16, marginTop: 24 },
  title: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  subtitle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4, lineHeight: 16, marginBottom: 16 },
  presetsRow: { flexDirection: 'row', alignItems: 'stretch', flexWrap: 'wrap', marginBottom: 18 },
  pill: { flexBasis: '22%', margin: 4, paddingVertical: 10, borderRadius: 18, borderWidth: 1, alignItems: 'center' },
  customBox: { display: 'none' },
  customInput: { display: 'none' },
  adjustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  circleBtn: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  circleText: { fontSize: 26, fontWeight: '700' },
  amountText: { fontSize: 30, fontWeight: '800' },
  amountInput: { fontSize: 30, fontWeight: '800', minWidth: 90, textAlign: 'center' },
  donateBtn: { borderRadius: 24, paddingVertical: 14, alignItems: 'center' },
  donateText: { fontSize: 16, fontWeight: '800', color: '#0F3327' },
});
