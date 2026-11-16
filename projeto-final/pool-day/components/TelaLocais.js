import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import { cores } from '../styles/colors';

export default function TelaLocais({ cliente, endereco, tipoPiscina, litragem, piscinas, clientes, mostrarFormulario, onMostrarFormulario, onCancelarFormulario, onCliente, onEndereco, onTipoPiscina, onLitragem, onSalvar, onAlternarCliente }) {
  const [busca, setBusca] = useState('');
  const termoBusca = busca.trim().toLocaleLowerCase('pt-BR');
  const clientesFiltrados = clientes.filter((item) => {
    const piscinasCliente = piscinas.filter((piscina) => piscina.clienteId === item.id);
    return !termoBusca
      || item.nome?.toLocaleLowerCase('pt-BR').includes(termoBusca)
      || piscinasCliente.some((piscina) => piscina.endereco?.toLocaleLowerCase('pt-BR').includes(termoBusca));
  });
  const piscinasSemCliente = piscinas.filter((piscina) => !clientes.some((item) => item.id === piscina.clienteId)
    && (!termoBusca
      || piscina.cliente?.toLocaleLowerCase('pt-BR').includes(termoBusca)
      || piscina.endereco?.toLocaleLowerCase('pt-BR').includes(termoBusca)));

  return (
    <View style={styles.container}>
      <Text style={styles.tituloSecao}>Clientes</Text>
      {mostrarFormulario ? (
        <View style={styles.formulario}>
          <Text style={styles.tituloFormulario}>Novo cliente e piscina</Text>
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
            <Text style={styles.textoBotao}>Salvar cliente</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onCancelarFormulario} style={styles.botaoCancelar}>
            <Text style={styles.textoCancelar}>Cancelar</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={onMostrarFormulario} style={({ pressed }) => [styles.botao, pressed && styles.pressionado]} android_ripple={{ color: cores.azulPiscinaPressionado }}>
          <Text style={styles.textoBotao}>Adicionar cliente</Text>
        </Pressable>
      )}

      <TextInput accessibilityLabel="Buscar cliente" style={styles.campoBusca} placeholder="Buscar cliente ou endereço" value={busca} onChangeText={setBusca} />

      {clientesFiltrados.map((item) => {
        const piscinasCliente = piscinas.filter((piscina) => piscina.clienteId === item.id);
        const ativo = item.ativo !== false;

        return (
          <View key={item.id} style={styles.cartaoResidencia}>
            <Text style={styles.tituloCartao}>Cliente</Text>
            <Text style={styles.nomeResidencia}>{item.nome}</Text>
            <Text style={styles.dadoResidencia}>Status: {ativo ? 'Ativo' : 'Inativo'}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${ativo ? 'Desativar' : 'Ativar'} cliente: ${item.nome}`}
              onPress={() => onAlternarCliente(item.id)}
              android_ripple={{ color: cores.azulClaro }}
              style={({ pressed }) => [styles.botaoStatus, pressed && styles.pressionado]}
            >
              <Text style={styles.textoBotaoStatus}>{ativo ? 'Desativar cliente' : 'Ativar cliente'}</Text>
            </Pressable>
            {piscinasCliente.map((piscina) => (
              <View key={piscina.id} style={styles.dadosPiscina}>
                <Text style={styles.tituloResidencia}>Residência cadastrada</Text>
                <Text style={styles.dadoResidencia}>Endereço: {piscina.endereco}</Text>
                <Text style={styles.dadoResidencia}>Piscina de {piscina.tipoPiscina} • {piscina.litragem} L</Text>
              </View>
            ))}
          </View>
        );
      })}
      {piscinasSemCliente.map((piscina) => (
        <View key={piscina.id} style={styles.cartaoResidencia}>
          <Text style={styles.tituloResidencia}>Residência cadastrada</Text>
          <Text style={styles.nomeResidencia}>{piscina.cliente}</Text>
          <Text style={styles.dadoResidencia}>Endereço: {piscina.endereco}</Text>
          <Text style={styles.dadoResidencia}>Piscina de {piscina.tipoPiscina} • {piscina.litragem} L</Text>
        </View>
      ))}
      {clientesFiltrados.length === 0 && piscinasSemCliente.length === 0 && (
        <Text style={styles.vazio}>{clientes.length === 0 && piscinas.length === 0 ? 'Nenhum cliente cadastrado.' : 'Nenhum cliente encontrado.'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20 },
  tituloSecao: { color: cores.azulEscuro, fontSize: 22, fontWeight: '700', marginBottom: 12 },
  formulario: { backgroundColor: cores.branco, borderRadius: 14, padding: 18 },
  tituloFormulario: { color: cores.azulEscuro, fontSize: 17, fontWeight: '600', marginBottom: 12 },
  rotulo: { color: cores.textoSecundario, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  seletor: { backgroundColor: cores.fundoCartao, borderColor: cores.borda, borderRadius: 8, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  campo: { backgroundColor: cores.fundoCartao, borderColor: cores.borda, borderRadius: 8, borderWidth: 1, fontSize: 16, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 11 },
  campoBusca: { backgroundColor: cores.branco, borderColor: cores.borda, borderRadius: 8, borderWidth: 1, fontSize: 15, marginTop: 14, paddingHorizontal: 12, paddingVertical: 11 },
  botao: { alignItems: 'center', backgroundColor: cores.azulPiscina, borderRadius: 8, marginTop: 4, overflow: 'hidden', padding: 14 },
  pressionado: { opacity: 0.85 },
  textoBotao: { color: cores.branco, fontSize: 16, fontWeight: '600' },
  botaoCancelar: { alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  textoCancelar: { color: cores.textoSecundario, fontSize: 15, fontWeight: '600' },
  cartaoResidencia: { backgroundColor: cores.branco, borderColor: cores.borda, borderRadius: 14, borderWidth: 1, marginTop: 16, padding: 18 },
  tituloCartao: { color: cores.azulEscuro, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  tituloResidencia: { color: cores.azulEscuro, fontSize: 15, fontWeight: '600', marginTop: 12 },
  nomeResidencia: { color: cores.texto, fontSize: 17, fontWeight: '600', marginBottom: 4 },
  dadoResidencia: { color: cores.textoSecundario, fontSize: 15, marginTop: 4 },
  dadosPiscina: { borderTopColor: cores.borda, borderTopWidth: 1, marginTop: 8, paddingTop: 4 },
  botaoStatus: { alignSelf: 'flex-start', borderColor: cores.borda, borderRadius: 7, borderWidth: 1, marginTop: 8, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 8 },
  textoBotaoStatus: { color: cores.azulEscuro, fontSize: 14, fontWeight: '600' },
  pressionado: { opacity: 0.75 },
  vazio: { color: cores.textoSecundario, fontSize: 15, marginTop: 12 },
});
