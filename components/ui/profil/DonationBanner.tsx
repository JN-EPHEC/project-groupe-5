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
  card: { borderRadius: 16, padding: 12, marginTop: 16 },
  title: { fontSize: 14, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3, lineHeight: 14, marginBottom: 12, textAlign: 'center' },
  presetsRow: { flexDirection: 'row', alignItems: 'stretch', flexWrap: 'wrap', marginBottom: 12 },
  pill: { flexBasis: '22%', margin: 4, paddingVertical: 8, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  customBox: { display: 'none' },
  customInput: { display: 'none' },
  adjustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  circleBtn: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  circleText: { fontSize: 22, fontWeight: '700' },
  amountText: { fontSize: 24, fontWeight: '800' },
  amountInput: { fontSize: 24, fontWeight: '800', minWidth: 80, textAlign: 'center' },
  donateBtn: { borderRadius: 20, paddingVertical: 12, alignItems: 'center' },
  donateText: { fontSize: 15, fontWeight: '800', color: '#0F3327' },
});
