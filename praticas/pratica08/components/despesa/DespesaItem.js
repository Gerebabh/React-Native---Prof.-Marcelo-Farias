import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getDataFormatada } from '../../utils/data';
import { colors } from '../../styles/colors';

export default function DespesaItem({ item }) {
  const navigation = useNavigation();
  return <Pressable onPress={() => navigation.navigate('GerenciarDespesa', { despesaId: item.id })}
    style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}>
    <View style={styles.dados}>
      <Text style={styles.descricao}>{item.descricao}</Text>
      <Text>{getDataFormatada(item.data)}</Text>
      <Text style={styles.categoria}>{item.categoria}</Text>
    </View>
    <Text style={styles.valor}>R$ {item.valor.toFixed(2)}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', padding: 14, marginVertical: 6,
    borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.white },
  dados: { flex: 1, marginRight: 8 },
  descricao: { fontWeight: '600', fontSize: 16, marginBottom: 6 },
  categoria: { alignSelf: 'flex-start', backgroundColor: colors.gray, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4, marginTop: 6 },
  valor: { fontWeight: '700', color: colors.black },
});
