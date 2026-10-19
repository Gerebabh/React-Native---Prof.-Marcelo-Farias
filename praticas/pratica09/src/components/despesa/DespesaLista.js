import { FlatList, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themes } from '../../constants/theme';
import DespesaItem from './DespesaItem';

export default function DespesaLista({ despesas, header }) {
  const colors = themes[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return <FlatList data={despesas} keyExtractor={item => item.id} ListHeaderComponent={header}
    keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}
    renderItem={({ item }) => <DespesaItem item={item} />}
    ListEmptyComponent={<View style={styles.empty}>
      <Ionicons name="wallet-outline" size={42} color={colors.primary} />
      <Text style={[styles.title, { color: colors.text }]}>Nenhuma despesa encontrada.</Text>
      <Text style={[styles.hint, { color: colors.secondary }]}>Toque em + para adicionar ou confira os filtros.</Text>
    </View>} />;
}
const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  empty: { alignItems: 'center', marginTop: 24, gap: 10, padding: 12 },
  title: { fontSize: 17, fontWeight: '500', textAlign: 'center' },
  hint: { textAlign: 'center' },
});
