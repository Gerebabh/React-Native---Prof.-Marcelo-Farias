import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../styles/colors';

export default function DespesasRecentes() {
  return (
    <View style={styles.container}>
      <Text style={styles.texto}>Despesas Recentes</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.gray[100],
  },
  texto: {
    fontSize: 22,
    fontWeight: '500',
    color: colors.gray[800],
    textAlign: 'center',
  },
});
