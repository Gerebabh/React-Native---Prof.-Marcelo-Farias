import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../styles/colors';

export default function CompromissoInput({ value, onChangeText, onAdd, placeholder, botaoAdicionar }) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        accessibilityLabel="Compromisso"
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
        <Text style={styles.textoBotao}>{botaoAdicionar}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 7,
  },
  input: {
    width: '68%',
    borderWidth: 1,
    borderColor: colors.gray[500],
    borderRadius: 8,
    padding: 10,
  },
  botao: {
    width: '30%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.black,
    overflow: 'hidden',
  },
  pressionado: {
    opacity: 0.8,
  },
  textoBotao: {
    color: colors.orange,
    fontWeight: '500',
  },
});
