import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../styles/colors';

export default function DespesaSumario({ despesas, periodo }) {
  const somaDespesas = despesas.reduce((acumulador, item) => acumulador + item.valor, 0);
  return <View style={styles.container}>
    <Text style={styles.periodo}>{periodo}</Text>
    <Text style={[styles.valor, somaDespesas > 200 && styles.alerta]}>R$ {somaDespesas.toFixed(2)}</Text>
  </View>;
}
const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.gray, padding: 14, borderRadius: 8, marginBottom: 12 },
  periodo: { flex: 1, marginRight: 8, color: colors.black },
  valor: { fontWeight: '700', fontSize: 18, color: colors.black },
  alerta: { color: colors.red },
});
