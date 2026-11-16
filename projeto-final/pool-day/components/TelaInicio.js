import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cores } from '../styles/colors';

export default function TelaInicio({ nome, empresa, aoAbrirVisitas }) {
  return (
    <View style={styles.conteudo}>
      <Text style={styles.titulo}>Olá, {nome}</Text>
      <Text style={styles.subtitulo}>{empresa}</Text>
      <View style={styles.cartao}>
        <Text style={styles.textoCartao}>Acompanhe seus atendimentos e organize a rotina da piscina.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={aoAbrirVisitas}
          android_ripple={{ color: cores.azulPiscinaPressionado }}
          style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}
        >
          <Text style={styles.textoBotao}>Ver visitas</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conteudo: { flexGrow: 1, padding: 20, paddingTop: 22 },
  titulo: { color: cores.azulEscuro, fontSize: 24, fontWeight: '700' },
  subtitulo: { color: cores.textoSecundario, fontSize: 15, marginTop: 5 },
  cartao: { backgroundColor: cores.branco, borderRadius: 14, marginTop: 22, padding: 18 },
  textoCartao: { color: cores.texto, fontSize: 16, lineHeight: 23 },
  botao: { alignItems: 'center', backgroundColor: cores.azulPiscina, borderRadius: 8, marginTop: 16, overflow: 'hidden', padding: 13 },
  pressionado: { opacity: 0.85 },
  textoBotao: { color: cores.branco, fontSize: 15, fontWeight: '600' },
});
