import { useState } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { useExpenses } from '../store/expenses-context';
import { themes } from '../constants/theme';
import { filterRecentExpenses } from '../utils/expenses';
import CategoriaFiltro from '../components/CategoriaFiltro';
import DespesaSaida from '../components/despesa/DespesaSaida';

export default function DespesasRecentes() {
  const { expenses } = useExpenses();
  const [category, setCategory] = useState('Todas');
  const colors = themes[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const filtered = filterRecentExpenses(expenses).filter(item => category === 'Todas' || item.category === category);
  return <View style={[styles.container, { backgroundColor: colors.background }]}>
    <CategoriaFiltro category={category} onSelect={setCategory} />
    <DespesaSaida despesas={filtered} periodo="Últimos 7 dias" />
  </View>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 20 } });
