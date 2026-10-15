import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../styles/colors';

const categorias = ['Alimentação', 'Transporte', 'Lazer', 'Contas'];

export default function CategoriaSeletor({ categoria, onSelect, filtro = false }) {
  const opcoes = filtro ? ['Todas', ...categorias] : categorias;
  return <View style={styles.container}>
    {opcoes.map(item => <Pressable key={item} onPress={() => onSelect(item)}
      accessibilityRole="button" accessibilityState={{ selected: categoria === item }}
      style={[styles.botao, categoria === item && styles.selecionado]}>
      <Text style={categoria === item ? styles.textoSelecionado : styles.texto}>{item}</Text>
    </Pressable>)}
  </View>;
}
const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 },
  botao: { backgroundColor: colors.gray, padding: 10, borderRadius: 8 },
  selecionado: { backgroundColor: colors.black },
  texto: { color: colors.black },
  textoSelecionado: { color: colors.orange, fontWeight: '500' },
});
