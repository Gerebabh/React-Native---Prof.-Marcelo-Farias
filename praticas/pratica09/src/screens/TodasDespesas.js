import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View, useColorScheme } from 'react-native';
import { useExpenses } from '../store/expenses-context';
import { themes } from '../constants/theme';
import useDebounce from '../hooks/useDebounce';
import CategoriaFiltro from '../components/CategoriaFiltro';
import DespesaSaida from '../components/despesa/DespesaSaida';

export default function TodasDespesas() {
  const { expenses } = useExpenses();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todas');
  const debouncedQuery = useDebounce(query);
  const colors = themes[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const filtered = useMemo(() => {
    const term = debouncedQuery.trim().toLowerCase();
    return expenses.filter(item => item.description.toLowerCase().includes(term) &&
      (category === 'Todas' || item.category === category));
  }, [expenses, debouncedQuery, category]);

  return <View style={[styles.container, { backgroundColor: colors.background }]}>
    <TextInput value={query} onChangeText={setQuery} placeholder="Buscar despesa..."
      accessibilityLabel="Buscar por descrição" placeholderTextColor={colors.secondary}
      style={[styles.search, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} />
    <CategoriaFiltro category={category} onSelect={setCategory} />
    <DespesaSaida despesas={filtered} periodo="Total das despesas" />
  </View>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 20 }, search: { borderWidth: 1, borderRadius: 8, padding: 12 } });
