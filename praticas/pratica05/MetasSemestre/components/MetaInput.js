import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../styles/colors';

export default function MetaInput({ value, onChangeText, onAdd }) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Digite sua meta de estudo"
        accessibilityLabel="Meta de estudo"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onAdd}
        returnKeyType="done"
      />
      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        android_ripple={{ color: colors.gray[400] }}
        style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}
      >
        <Text style={styles.textoBotao}>Adicionar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 7
  },
  input: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: colors.gray[500],
    borderRadius: 8,
    padding: 10
  },
  botao: {
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: colors.black,
    overflow: 'hidden'
  },
  pressionado: {
    opacity: 0.8
  },
  textoBotao: {
    color: colors.orange,
    fontWeight: '500'
  },
});
