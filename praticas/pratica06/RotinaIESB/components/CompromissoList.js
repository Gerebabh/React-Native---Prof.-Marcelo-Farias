import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../styles/colors';

export default function CompromissoList({ itens, onDelete, onToggle, listaVazia }) {
  return (
    <FlatList
      style={styles.lista}
      data={itens}
      keyExtractor={item => item.id}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={<Text style={styles.vazia}>{listaVazia}</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={[styles.texto, item.concluido && styles.concluido]}>{item.texto}</Text>
          <Text style={styles.data}>Criado em: {new Date(item.criadoEm).toLocaleDateString('pt-BR')}</Text>
          <View style={styles.acoes}>
            <Pressable
              onPress={() => onToggle(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`${item.concluido ? 'Reabrir' : 'Concluir'} compromisso: ${item.texto}`}
              android_ripple={{ color: colors.gray[300] }}
              style={({ pressed }) => [styles.botao, styles.botaoConcluir, pressed && styles.pressionado]}
            >
              <Text style={styles.textoConcluir}>{item.concluido ? 'Reabrir' : 'Concluir'}</Text>
            </Pressable>
            <Pressable
              onPress={() => onDelete(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Remover compromisso: ${item.texto}`}
              android_ripple={{ color: colors.gray[300] }}
              style={({ pressed }) => [styles.botao, styles.botaoRemover, pressed && styles.pressionado]}
            >
              <Text style={styles.textoRemover}>Remover</Text>
            </Pressable>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  lista: {
    flex: 1,
  },
  vazia: {
    color: colors.gray[600],
    textAlign: 'center',
    marginTop: 20,
  },
  card: {
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[500],
    borderRadius: 8,
    backgroundColor: colors.gray[100],
  },
  texto: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.gray[900],
  },
  concluido: {
    textDecorationLine: 'line-through',
    color: colors.gray[500],
  },
  data: {
    fontSize: 12,
    color: colors.gray[600],
    marginTop: 6,
  },
  acoes: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  botao: {
    padding: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  botaoConcluir: {
    backgroundColor: colors.orange,
  },
  textoConcluir: {
    color: colors.gray[100],
  },
  botaoRemover: {
    backgroundColor: colors.black,
  },
  textoRemover: {
    color: colors.orange,
  },
  pressionado: {
    opacity: 0.6,
  },
});
