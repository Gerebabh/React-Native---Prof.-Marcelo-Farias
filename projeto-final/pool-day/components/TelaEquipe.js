import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { cores } from '../styles/colors';

export default function TelaEquipe({ nome, email, tratadores, enviando, onNome, onEmail, onConvidar }) {
  return (
    <View style={styles.container}>
      <View style={styles.formulario}>
        <Text style={styles.tituloSecao}>Equipe de tratadores</Text>
        <TextInput accessibilityLabel="Nome do tratador" style={styles.campo} placeholder="Nome do tratador" value={nome} onChangeText={onNome} />
        <TextInput accessibilityLabel="E-mail do tratador" style={styles.campo} placeholder="E-mail do tratador" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={onEmail} />
        <Pressable accessibilityRole="button" onPress={onConvidar} disabled={enviando} style={({ pressed }) => [styles.botao, pressed && styles.pressionado, enviando && styles.desativado]}>
          <Text style={styles.textoBotao}>{enviando ? 'Enviando convite...' : 'Convidar tratador'}</Text>
        </Pressable>
        {tratadores.length === 0 && <Text style={styles.vazio}>Nenhum tratador cadastrado.</Text>}
      </View>
      {tratadores.map((item) => (
        <View key={item.id} style={styles.cartao}>
          <Text style={styles.nome}>{item.nome || 'Tratador'}</Text>
          <Text style={styles.email}>{item.email}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20 },
  formulario: { backgroundColor: cores.branco, borderRadius: 14, padding: 18 },
  tituloSecao: { color: cores.azulEscuro, fontSize: 19, fontWeight: '600', marginBottom: 12 },
  campo: { backgroundColor: cores.fundoCartao, borderColor: cores.borda, borderRadius: 8, borderWidth: 1, fontSize: 16, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 11 },
  botao: { alignItems: 'center', backgroundColor: cores.azulPiscina, borderRadius: 8, marginTop: 4, overflow: 'hidden', padding: 14 },
  pressionado: { opacity: 0.85 },
  desativado: { opacity: 0.6 },
  textoBotao: { color: cores.branco, fontSize: 16, fontWeight: '600' },
  cartao: { backgroundColor: cores.branco, borderColor: cores.borda, borderRadius: 10, borderWidth: 1, marginTop: 10, padding: 14 },
  nome: { color: cores.texto, fontSize: 16, fontWeight: '600' },
  email: { color: cores.textoSecundario, fontSize: 14, marginTop: 3 },
  vazio: { color: cores.textoSecundario, fontSize: 14, marginTop: 12 },
});
