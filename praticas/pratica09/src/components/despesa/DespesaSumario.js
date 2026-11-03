import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { themes } from '../../constants/theme';

export default function DespesaSumario({ despesas, periodo }) {
  const colors = themes[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const somaDespesas = despesas.reduce((total, item) => total + item.amount, 0);
  return <View style={[styles.container, { backgroundColor: colors.surface }]}>
    <View style={styles.details}>
      <Text style={{ color: colors.text }}>{periodo}</Text>
      <Text style={{ color: colors.secondary }}>{despesas.length} despesas</Text>
    </View>
    <Text style={[styles.total, { color: somaDespesas > 200 ? colors.error : colors.text }]}>R$ {somaDespesas.toFixed(2)}</Text>
  </View>;
}
const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 8, marginBottom: 12 },
  details: { flex: 1, marginRight: 8, gap: 4 },
  total: { fontSize: 18, fontWeight: '700' },
});
