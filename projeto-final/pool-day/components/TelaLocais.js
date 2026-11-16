import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { cores } from '../styles/colors';

export default function TelaLocais({ cliente, endereco, tipoPiscina, litragem, piscinas, onCliente, onEndereco, onTipoPiscina, onLitragem, onSalvar }) {
  return (
    <View style={styles.container}>
      <View style={styles.formulario}>
        <Text style={styles.tituloSecao}>Dados do local</Text>
        <TextInput accessibilityLabel="Cliente" style={styles.campo} placeholder="Cliente" value={cliente} onChangeText={onCliente} />
        <TextInput accessibilityLabel="Endereço" style={styles.campo} placeholder="Endereço" value={endereco} onChangeText={onEndereco} />
        <Text style={styles.rotulo}>Tipo de piscina</Text>
        <View style={styles.seletor}>
          <Picker selectedValue={tipoPiscina} onValueChange={onTipoPiscina}>
            <Picker.Item label="Selecione o tipo" value="" />
            <Picker.Item label="Fibra" value="Fibra" />
            <Picker.Item label="Vinil" value="Vinil" />
            <Picker.Item label="Alvenaria" value="Alvenaria" />
            <Picker.Item label="Outros" value="Outros" />
          </Picker>
        </View>
        <TextInput accessibilityLabel="Litragem em litros (ex.: 13000)" style={styles.campo} placeholder="Litragem em litros (ex.: 13000)" keyboardType="numeric" value={litragem} onChangeText={onLitragem} />
        <Pressable accessibilityRole="button" onPress={onSalvar} style={({ pressed }) => [styles.botao, pressed && styles.pressionado]} android_ripple={{ color: cores.azulPiscinaPressionado }}>
          <Text style={styles.textoBotao}>Salvar residência</Text>
        </Pressable>
      </View>

      {piscinas.map((piscina) => (
        <View key={piscina.id} style={styles.cartaoResidencia}>
          <Text style={styles.tituloCartao}>Residência cadastrada</Text>
          <Text style={styles.nomeResidencia}>{piscina.cliente}</Text>
          <Text style={styles.dadoResidencia}>Endereço: {piscina.endereco}</Text>
          <Text style={styles.dadoResidencia}>Piscina de {piscina.tipoPiscina} • {piscina.litragem} L</Text>
        </View>
      ))}
      {piscinas.length === 0 && <Text style={styles.vazio}>Nenhuma residência cadastrada.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20 },
  formulario: { backgroundColor: cores.branco, borderRadius: 14, padding: 18 },
  tituloSecao: { color: cores.azulEscuro, fontSize: 19, fontWeight: '600', marginBottom: 12 },
  rotulo: { color: cores.textoSecundario, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  seletor: { backgroundColor: cores.fundoCartao, borderColor: cores.borda, borderRadius: 8, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  campo: { backgroundColor: cores.fundoCartao, borderColor: cores.borda, borderRadius: 8, borderWidth: 1, fontSize: 16, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 11 },
  botao: { alignItems: 'center', backgroundColor: cores.azulPiscina, borderRadius: 8, marginTop: 4, overflow: 'hidden', padding: 14 },
  pressionado: { opacity: 0.85 },
  textoBotao: { color: cores.branco, fontSize: 16, fontWeight: '600' },
  cartaoResidencia: { backgroundColor: cores.branco, borderColor: cores.borda, borderRadius: 14, borderWidth: 1, marginTop: 16, padding: 18 },
  tituloCartao: { color: cores.azulEscuro, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  nomeResidencia: { color: cores.texto, fontSize: 17, fontWeight: '600', marginBottom: 4 },
  dadoResidencia: { color: cores.textoSecundario, fontSize: 15, marginTop: 4 },
  vazio: { color: cores.textoSecundario, fontSize: 15, marginTop: 12 },
});
