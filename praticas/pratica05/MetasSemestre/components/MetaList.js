import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../styles/colors';

export default function MetaList({ metas, onDelete, onToggle }) {
  return (
    <FlatList
      style={styles.lista}
      data={metas}
      keyExtractor={item => item.id}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={<Text style={styles.vazia}>Nenhuma meta cadastrada. Adicione sua primeira meta!</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={[styles.texto, item.concluida && styles.concluida]}>{item.texto}</Text>
          <Text style={styles.data}>Criada em: {new Date(item.criadaEm).toLocaleDateString('pt-BR')}</Text>
          <View style={styles.acoes}>
            <Pressable
              onPress={() => onToggle(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`${item.concluida ? 'Reabrir' : 'Concluir'} meta: ${item.texto}`}
              android_ripple={{ color: colors.gray[300] }}
              style={({ pressed }) => [styles.botao, styles.botaoCheck, pressed && styles.pressionado]}
            >
              <Text style={styles.textCheck}>{item.concluida ? 'Reabrir' : 'Concluir'}</Text>
            </Pressable>
            <Pressable
              onPress={() => onDelete(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Remover meta: ${item.texto}`}
              android_ripple={{ color: colors.gray[300] }}
              style={({ pressed }) => [styles.botao, styles.botaoRemove, pressed && styles.pressionado]}
            >
              <Text style={styles.textRemover}>Remover</Text>
            </Pressable>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  lista: { 
    flex: 1
  },
  vazia: {
    color: colors.gray[600],
    textAlign: 'center',
    marginTop: 20
  },
  card: {
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[500],
    borderRadius: 8,
    backgroundColor: colors.gray[100]
  },
  texto: {
    fontSize: 17,
    fontWeight: 600,
    color: colors.gray[900]
  },
  concluida: {
    textDecorationLine: 'line-through',
    color: colors.gray[500]
  },
  data: {
    fontSize: 12,
    color: colors.gray[600],
    marginTop: 6
  },
  acoes: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10
  },
  botao: {
    padding: 10,
    borderRadius: 8,
    overflow: 'hidden'
  },
  textCheck: {
    color: colors.gray[100]
  },
  botaoCheck: {
    backgroundColor: colors.orange,
  },
  textRemover: {
    color: colors.orange,
  },
  botaoRemove: {
    backgroundColor: colors.black,
    borderColor: '#4A4A4A',
  },
  pressionado: {
    opacity: 0.6
  }
});
