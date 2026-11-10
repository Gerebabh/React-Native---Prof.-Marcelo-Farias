import { Alert, FlatList, Share, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useExpenses } from '../../store/expenses-context';
import { themes } from '../../constants/theme';
import ActionButton from '../../components/ActionButton';

export default function Wallet() {
  const { expenses } = useExpenses();
  const colors = themes[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  async function handleShare() {
    try {
      await Share.share({ message: `Gastei R$ ${total.toFixed(2)} neste semestre.` });
    } catch {
      Alert.alert('Compartilhar', 'Não foi possível compartilhar o resumo. Tente novamente.');
    }
  }

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <View style={[styles.summary, { backgroundColor: colors.surface }]}>
      <Text style={{ color: colors.secondary }}>Total de despesas do semestre</Text>
      <Text style={[styles.total, { color: colors.text }]}>R$ {total.toFixed(2)}</Text>
      <Text style={{ color: colors.secondary }}>{expenses.length} despesas</Text>
    </View>
    <ActionButton title="Compartilhar resumo" onPress={handleShare} />
    <FlatList data={expenses} keyExtractor={item => item.id} contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={{ color: colors.secondary }}>Nenhuma despesa registrada.</Text>}
      renderItem={({ item }) => <View style={[styles.item, { borderColor: colors.border }]}>
        <Text style={{ color: colors.text }}>{item.description}</Text>
        <Text style={{ color: colors.secondary }}>R$ {item.amount.toFixed(2)}</Text>
      </View>} />
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, gap: 16 },
  summary: { padding: 20, borderRadius: 8, gap: 8 },
  total: { fontSize: 30, fontWeight: '600' },
  list: { paddingBottom: 20 },
  item: { paddingVertical: 12, borderBottomWidth: 1, gap: 6 },
});
