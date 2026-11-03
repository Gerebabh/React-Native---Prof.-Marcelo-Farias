import { Platform, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { themes } from '../../constants/theme';
import { getDataFormatada } from '../../utils/expenses';

export default function DespesaItem({ item }) {
  const navigation = useNavigation();
  const colors = themes[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return <Pressable onPress={() => navigation.navigate('GerenciarDespesa', { expenseId: item.id })}
    accessibilityRole="button" accessibilityLabel={'Editar ' + item.description}
    style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border }, pressed && { opacity: 0.7 }]}>
    <View style={styles.details}>
      <Text style={[styles.description, { color: colors.text }]}>{item.description}</Text>
      <Text style={{ color: colors.secondary }}>{getDataFormatada(item.date)}</Text>
      <Text style={[styles.category, { backgroundColor: colors.surface, color: colors.text }]}>{item.category}</Text>
    </View>
    <Text style={[styles.amount, { color: colors.text }]}>R$ {item.amount.toFixed(2)}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, marginVertical: 6,
    borderWidth: 1, borderRadius: 8,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 3 } }) },
  details: { flex: 1, marginRight: 8 },
  description: { fontWeight: '600', fontSize: 16, marginBottom: 6 },
  category: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginTop: 6 },
  amount: { fontWeight: '700' },
});
