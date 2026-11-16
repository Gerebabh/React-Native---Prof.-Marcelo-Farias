import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cores } from '../styles/colors';

export default function NavegacaoInferior({ abas, abaAtual, aoSelecionar }) {
  return (
    <View style={styles.navegacao}>
      {abas.map((aba) => (
        <Pressable
          key={aba.id}
          accessibilityRole="tab"
          accessibilityState={{ selected: abaAtual === aba.id }}
          onPress={() => aoSelecionar(aba.id)}
          android_ripple={{ color: cores.azulClaro }}
          style={({ pressed }) => [styles.aba, abaAtual === aba.id && styles.abaSelecionada, pressed && styles.pressionada]}
        >
          <Text style={[styles.textoAba, abaAtual === aba.id && styles.textoAbaSelecionada]}>{aba.titulo}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  navegacao: { backgroundColor: cores.branco, borderTopColor: cores.borda, borderTopWidth: 1, flexDirection: 'row', paddingHorizontal: 4, paddingVertical: 6 },
  aba: { alignItems: 'center', borderRadius: 8, flex: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 4, paddingVertical: 7 },
  abaSelecionada: { backgroundColor: cores.azulClaro },
  pressionada: { opacity: 0.75 },
  textoAba: { color: cores.textoSecundario, fontSize: 12, fontWeight: '500', textAlign: 'center' },
  textoAbaSelecionada: { color: cores.azulEscuro, fontWeight: '700' },
});
