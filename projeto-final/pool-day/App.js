import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import VisitasLista from './components/VisitasLista';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

export default function App(props) {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.areaSegura}>
        <ConteudoApp {...props} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function ConteudoApp({ visitasIniciais = [] }) {
  const [cliente, setCliente] = useState('');
  const [endereco, setEndereco] = useState('');
  const [tipoPiscina, setTipoPiscina] = useState('');
  const [litragem, setLitragem] = useState('');
  const [residencia, setResidencia] = useState(null);
  const [localVisitaId, setLocalVisitaId] = useState('');
  const [visitas, setVisitas] = useState(visitasIniciais);
  const [dataVisita, setDataVisita] = useState(null);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [servico, setServico] = useState('');
  const [orientacao, setOrientacao] = useState('');

  function salvarResidencia() {
    if (!cliente.trim() || !endereco.trim() || !tipoPiscina || !litragem.trim()) {
      Alert.alert('Cadastro incompleto', 'Preencha todos os campos da residência e da piscina.');
      return;
    }

    const volume = Number(litragem.trim());

    if (!Number.isInteger(volume) || volume <= 0) {
      Alert.alert('Litragem inválida', 'Informe uma litragem inteira maior que zero.');
      return;
    }

    setResidencia({
      id: Date.now().toString(),
      cliente: cliente.trim(),
      endereco: endereco.trim(),
      tipoPiscina: tipoPiscina.trim(),
      litragem: volume,
    });
  }

  function adicionarVisita() {
    if (!residencia || !dataVisita || !localVisitaId || !servico) {
      Alert.alert('Cadastro incompleto', 'Preencha a data, o local e o tipo de serviço da visita.');
      return;
    }

    if (servico === 'Aplicar produtos' && !orientacao.trim()) {
      Alert.alert('Orientação necessária', 'Informe os produtos ou orientações desta visita.');
      return;
    }

    setVisitas((listaAtual) => [
      ...listaAtual,
      { id: Date.now().toString(), data: formatarData(dataVisita), local: `${residencia.cliente} — ${residencia.endereco}`, servico, orientacao: servico === 'Aplicar produtos' ? orientacao.trim() : '' },
    ]);
    setDataVisita(null);
    setServico('');
    setOrientacao('');
  }

  return (
    <KeyboardAvoidingView style={styles.teclado} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <StatusBar style="light" />

      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Pool Day</Text>
        <Text style={styles.subtitulo}>Tratamento e visitas programadas</Text>
      </View>

      <View style={styles.formulario}>
        <Text style={styles.tituloSecao}>Dados do local</Text>
        <TextInput accessibilityLabel="Cliente" style={styles.campo} placeholder="Cliente" value={cliente} onChangeText={setCliente} />
        <TextInput accessibilityLabel="Endereço" style={styles.campo} placeholder="Endereço" value={endereco} onChangeText={setEndereco} />
        <Text style={styles.rotulo}>Tipo de piscina</Text>
        <View style={styles.seletor}><Picker selectedValue={tipoPiscina} onValueChange={setTipoPiscina}><Picker.Item label="Selecione o tipo" value="" /><Picker.Item label="Fibra" value="Fibra" /><Picker.Item label="Vinil" value="Vinil" /><Picker.Item label="Alvenaria" value="Alvenaria" /><Picker.Item label="Outros" value="Outros" /></Picker></View>
        <TextInput accessibilityLabel="Litragem em litros (ex.: 13000)" style={styles.campo} placeholder="Litragem em litros (ex.: 13000)" keyboardType="numeric" value={litragem} onChangeText={setLitragem} />
        <Pressable accessibilityRole="button" onPress={salvarResidencia} style={({ pressed }) => [styles.botao, pressed && styles.botaoPressionado]} android_ripple={{ color: '#c65326' }}>
          <Text style={styles.textoBotao}>Salvar residência</Text>
        </Pressable>
      </View>

      {residencia && (
        <View style={styles.cartaoResidencia}>
          <Text style={styles.tituloCartao}>Residência cadastrada</Text>
          <Text style={styles.nomeResidencia}>{residencia.cliente}</Text>
          <Text style={styles.dadoResidencia}>Endereço: {residencia.endereco}</Text>
          <Text style={styles.dadoResidencia}>Piscina de {residencia.tipoPiscina} • {residencia.litragem} L</Text>
        </View>
      )}

      <View style={styles.secaoVisitas}>
        <Text style={styles.tituloSecao}>Próximas visitas</Text>
        <Text style={styles.rotulo}>Local / piscina</Text>
        <View style={styles.seletor}><Picker selectedValue={localVisitaId} onValueChange={setLocalVisitaId}><Picker.Item label={residencia ? 'Selecione o local' : 'Cadastre um local primeiro'} value="" />{residencia && <Picker.Item label={`${residencia.cliente} — ${residencia.endereco}`} value={residencia.id} />}</Picker></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Selecionar data da visita" onPress={() => setMostrarCalendario(true)} style={styles.campoData}>
          <Text style={dataVisita ? styles.textoData : styles.placeholderData}>{dataVisita ? formatarData(dataVisita) : 'Data da visita'}</Text>
        </Pressable>
        {mostrarCalendario && <DateTimePicker value={dataVisita || new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onValueChange={(_evento, dataSelecionada) => { setDataVisita(dataSelecionada); setMostrarCalendario(false); }} onDismiss={() => setMostrarCalendario(false)} />}
        <Text style={styles.rotulo}>Tipo de serviço</Text>
        <View style={styles.seletor}><Picker selectedValue={servico} onValueChange={setServico}><Picker.Item label="Selecione o serviço" value="" /><Picker.Item label="Aplicar produtos" value="Aplicar produtos" /><Picker.Item label="Aspiração - Liberar o uso" value="Aspiração - Liberar o uso" /><Picker.Item label="Inspeção" value="Inspeção" /></Picker></View>
        {servico === 'Aplicar produtos' && <TextInput style={styles.campo} placeholder="Orientação de produtos" value={orientacao} onChangeText={setOrientacao} />}
        <Pressable accessibilityRole="button" onPress={adicionarVisita} style={({ pressed }) => [styles.botao, pressed && styles.botaoPressionado]} android_ripple={{ color: '#c65326' }}>
          <Text style={styles.textoBotao}>Adicionar visita</Text>
        </Pressable>
        <VisitasLista visitas={visitas} />
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function formatarData(data) {
  return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
}

const styles = StyleSheet.create({
  areaSegura: { flex: 1, backgroundColor: '#f4f7f8' },
  teclado: { flex: 1 },
  container: { flexGrow: 1, backgroundColor: '#f4f7f8', padding: 20, paddingTop: 16 },
  cabecalho: { backgroundColor: '#123b4a', borderRadius: 14, marginBottom: 20, padding: 20 },
  titulo: { color: '#fff', fontSize: 30, fontWeight: '700' },
  subtitulo: { color: '#d5e5e9', fontSize: 15, marginTop: 6 },
  formulario: { backgroundColor: '#fff', borderRadius: 14, padding: 18 },
  tituloSecao: { color: '#123b4a', fontSize: 19, fontWeight: '600', marginBottom: 12 },
  rotulo: { color: '#526168', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  seletor: { backgroundColor: '#f7f9fa', borderColor: '#d5dfe2', borderRadius: 8, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  campo: { backgroundColor: '#f7f9fa', borderColor: '#d5dfe2', borderRadius: 8, borderWidth: 1, fontSize: 16, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 11 },
  campoData: { backgroundColor: '#f7f9fa', borderColor: '#d5dfe2', borderRadius: 8, borderWidth: 1, justifyContent: 'center', marginBottom: 12, minHeight: 46, paddingHorizontal: 12 },
  placeholderData: { color: '#808080', fontSize: 16 },
  textoData: { color: '#252d31', fontSize: 16 },
  botao: { alignItems: 'center', backgroundColor: '#e8703a', borderRadius: 8, marginTop: 4, overflow: 'hidden', padding: 14 },
  botaoPressionado: { opacity: 0.85 },
  textoBotao: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cartaoResidencia: { backgroundColor: '#fff', borderColor: '#d5dfe2', borderRadius: 14, borderWidth: 1, marginTop: 20, padding: 18 },
  tituloCartao: { color: '#123b4a', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  nomeResidencia: { color: '#252d31', fontSize: 17, fontWeight: '600', marginBottom: 4 },
  dadoResidencia: { color: '#526168', fontSize: 15, marginTop: 4 },
  secaoVisitas: { backgroundColor: '#fff', borderRadius: 14, marginTop: 24, padding: 18 },
  cartao: { backgroundColor: '#fff', borderRadius: 10, marginTop: 10, padding: 16 },
});
