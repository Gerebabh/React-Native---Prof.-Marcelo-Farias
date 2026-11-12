import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import VisitasLista from './components/VisitasLista';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import Autenticacao from './components/Autenticacao';
import {
  atualizarVisita,
  convidarTratador,
  observarPiscinas,
  observarTratadores,
  observarVisitas,
  salvarPiscina,
  salvarVisita,
} from './services/firebase';

export default function App(props) {
  return (
    <SafeAreaProvider>
      <Autenticacao>
        {({ usuario, perfil, aoSair }) => (
          <SafeAreaView style={styles.areaSegura}>
            <ConteudoApp {...props} usuario={usuario} perfil={perfil} aoSair={aoSair} />
          </SafeAreaView>
        )}
      </Autenticacao>
    </SafeAreaProvider>
  );
}

function ConteudoApp({ visitasIniciais = [], usuario, perfil, aoSair }) {
  const responsavel = perfil.papel === 'responsavel';
  const [cliente, setCliente] = useState('');
  const [endereco, setEndereco] = useState('');
  const [tipoPiscina, setTipoPiscina] = useState('');
  const [litragem, setLitragem] = useState('');
  const [residencia, setResidencia] = useState(null);
  const [piscinas, setPiscinas] = useState([]);
  const [tratadores, setTratadores] = useState([]);
  const [tratadorUid, setTratadorUid] = useState('');
  const [nomeTratador, setNomeTratador] = useState('');
  const [emailTratador, setEmailTratador] = useState('');
  const [enviandoConvite, setEnviandoConvite] = useState(false);
  const [localVisitaId, setLocalVisitaId] = useState('');
  const [visitas, setVisitas] = useState(visitasIniciais);
  const [dataVisita, setDataVisita] = useState(null);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [servico, setServico] = useState('');
  const [orientacao, setOrientacao] = useState('');

  useEffect(() => {
    if (!perfil.empresaId) return undefined;

    const cancelarPiscinas = observarPiscinas(perfil.empresaId, (lista) => {
      setPiscinas(lista);
      setResidencia((atual) => atual || lista[0] || null);
    }, () => Alert.alert('Erro', 'Não foi possível carregar os locais da empresa.'));
    const cancelarVisitas = observarVisitas(
      perfil.empresaId,
      usuario.uid,
      perfil.papel,
      (lista) => setVisitas(lista),
      () => Alert.alert('Erro', 'Não foi possível carregar as visitas da empresa.')
    );
    const cancelarTratadores = responsavel
      ? observarTratadores(perfil.empresaId, (lista) => {
        setTratadores(lista);
        setTratadorUid((atual) => atual || lista[0]?.id || '');
      }, () => Alert.alert('Erro', 'Não foi possível carregar a equipe.'))
      : undefined;

    return () => {
      cancelarPiscinas?.();
      cancelarVisitas?.();
      cancelarTratadores?.();
    };
  }, [perfil.empresaId, perfil.papel, responsavel, usuario.uid]);

  async function salvarResidencia() {
    if (!cliente.trim() || !endereco.trim() || !tipoPiscina || !litragem.trim()) {
      Alert.alert('Cadastro incompleto', 'Preencha todos os campos da residência e da piscina.');
      return;
    }

    const volume = Number(litragem.trim());

    if (!Number.isInteger(volume) || volume <= 0) {
      Alert.alert('Litragem inválida', 'Informe uma litragem inteira maior que zero.');
      return;
    }

    const dadosPiscina = {
      cliente: cliente.trim(),
      endereco: endereco.trim(),
      tipoPiscina: tipoPiscina.trim(),
      litragem: volume,
    };

    try {
      const piscina = await salvarPiscina(perfil.empresaId, usuario.uid, dadosPiscina);
      setPiscinas((lista) => lista.some((item) => item.id === piscina.id) ? lista : [...lista, piscina]);
      setResidencia(piscina);
      setLocalVisitaId(piscina.id);
    } catch (erro) {
      Alert.alert('Não foi possível salvar', 'Confira sua conexão e tente salvar o local novamente.');
    }
  }

  async function adicionarVisita() {
    const piscina = piscinas.find((item) => item.id === localVisitaId);
    if (!piscina || !dataVisita || !servico) {
      Alert.alert('Cadastro incompleto', 'Preencha a data, o local e o tipo de serviço da visita.');
      return;
    }

    if (!tratadorUid) {
      Alert.alert('Tratador necessário', 'Selecione o tratador responsável por esta visita.');
      return;
    }

    if (inicioDoDia(dataVisita) < inicioDoDia(new Date())) {
      Alert.alert('Data inválida', 'A data da visita não pode ser anterior a hoje.');
      return;
    }

    if (servico === 'Aplicar produtos' && !orientacao.trim()) {
      Alert.alert('Orientação necessária', 'Informe os produtos ou orientações desta visita.');
      return;
    }

    const tratador = tratadores.find((item) => item.id === tratadorUid);
    const visita = {
      data: formatarData(dataVisita),
      localId: piscina.localId,
      piscinaId: piscina.id,
      clienteId: piscina.clienteId,
      local: `${piscina.cliente} — ${piscina.endereco}`,
      tipoPiscina: piscina.tipoPiscina,
      litragem: piscina.litragem,
      servico,
      orientacao: servico === 'Aplicar produtos' ? orientacao.trim() : '',
      tratadorUid,
      tratadorNome: tratador?.nome || tratador?.email || '',
      criadaPorUid: usuario.uid,
      status: 'Pendente',
      justificativa: '',
    };

    try {
      const id = await salvarVisita(perfil.empresaId, visita);
      setVisitas((listaAtual) => listaAtual.some((item) => item.id === id)
        ? listaAtual
        : [...listaAtual, { ...visita, id }]);
    } catch (erro) {
      Alert.alert('Não foi possível agendar', 'Confira sua conexão e tente adicionar a visita novamente.');
      return;
    }
    setDataVisita(null);
    setServico('');
    setOrientacao('');
    setTratadorUid('');
  }

  async function atualizarDadosVisita(id, dados) {
    try {
      await atualizarVisita(perfil.empresaId, id, dados);
      setVisitas((listaAtual) => listaAtual.map((visita) => visita.id === id ? { ...visita, ...dados } : visita));
    } catch (erro) {
      Alert.alert('Não foi possível atualizar', 'Confira sua conexão e tente novamente.');
    }
  }

  function alterarStatusVisita(id, status) {
    setVisitas((listaAtual) => listaAtual.map((visita) =>
      visita.id === id ? { ...visita, status } : visita
    ));
    atualizarDadosVisita(id, { status });
  }

  function confirmarConclusaoVisita(id) {
    Alert.alert(
      'Deseja concluir a visita?',
      'A visita será movida para Visitas concluídas e não poderá ser alterada.',
      [
        { text: 'Não', style: 'cancel', onPress: () => {} },
        { text: 'Sim', onPress: () => alterarStatusVisita(id, 'Executada') },
      ]
    );
  }

  function alterarJustificativaVisita(id, justificativa) {
    atualizarDadosVisita(id, { justificativa });
  }

  async function enviarConvite() {
    if (!nomeTratador.trim() || !emailTratador.trim()) {
      Alert.alert('Cadastro incompleto', 'Informe o nome e o e-mail do tratador.');
      return;
    }

    setEnviandoConvite(true);
    try {
      await convidarTratador(nomeTratador.trim(), emailTratador.trim());
      setNomeTratador('');
      setEmailTratador('');
      Alert.alert('Convite enviado', 'O tratador receberá um e-mail para definir a senha e acessar a empresa.');
    } catch (erro) {
      Alert.alert(
        erro.conviteCriado ? 'Conta criada' : 'Não foi possível enviar o convite',
        erro.conviteCriado
          ? 'A conta foi criada, mas o e-mail não foi enviado. Confira o endereço e tente novamente pelo Firebase.'
          : erro.code === 'functions/already-exists'
            ? 'Já existe uma conta com esse e-mail.'
            : 'Confira o nome, o e-mail e sua conexão. Tente novamente.'
      );
    } finally {
      setEnviandoConvite(false);
    }
  }

  async function registrarChegada(id) {
    try {
      const servicosAtivos = await Location.hasServicesEnabledAsync();

      if (!servicosAtivos) {
        Alert.alert('Localização desativada', 'Ative o serviço de localização do aparelho e tente novamente.');
        return;
      }

      const permissaoAtual = await Location.getForegroundPermissionsAsync();

      if (permissaoAtual.status !== 'granted') {
        Alert.alert(
          'Acesso à localização',
          'Para registrar a chegada, o Pool Day precisa usar o GPS do aparelho.',
          [
            { text: 'Agora não', style: 'cancel', onPress: () => {} },
            { text: 'Continuar', onPress: () => solicitarPermissaoLocalizacao(id) },
          ]
        );
        return;
      }

      await salvarHorarioChegada(id);
    } catch (erro) {
      Alert.alert('Localização indisponível', 'Não foi possível obter sua localização. Verifique o GPS e tente novamente.');
    }
  }

  async function solicitarPermissaoLocalizacao(id) {
    try {
      const permissao = await Location.requestForegroundPermissionsAsync();

      if (permissao.status !== 'granted') {
        Alert.alert('Permissão necessária', 'Permita o acesso à localização para registrar sua chegada.');
        return;
      }

      await salvarHorarioChegada(id);
    } catch (erro) {
      Alert.alert('Localização indisponível', 'Não foi possível obter sua localização. Verifique o GPS e tente novamente.');
    }
  }

  async function salvarHorarioChegada(id) {
    try {
      const localizacao = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const enderecoChegada = await obterEndereco(localizacao.coords);
      const chegada = {
        horarioChegada: new Date().toISOString(),
        latitude: localizacao.coords.latitude,
        longitude: localizacao.coords.longitude,
        enderecoChegada: enderecoChegada || `${localizacao.coords.latitude.toFixed(2)}, ${localizacao.coords.longitude.toFixed(2)}`,
      };

      await atualizarDadosVisita(id, chegada);
    } catch (erro) {
      Alert.alert('Localização indisponível', 'Não foi possível obter sua localização. Verifique o GPS e tente novamente.');
    }
  }

  async function obterEndereco(coordenadas) {
    try {
      const enderecos = await Location.reverseGeocodeAsync({
        latitude: coordenadas.latitude,
        longitude: coordenadas.longitude,
      });
      const endereco = enderecos[0];

      if (!endereco) return '';

      const rua = [endereco.street, endereco.streetNumber].filter(Boolean).join(', ');
      const cidade = [endereco.city || endereco.subregion, endereco.region].filter(Boolean).join(' - ');
      return [rua, endereco.district, cidade].filter(Boolean).join(' - ');
    } catch (erro) {
      return '';
    }
  }

  async function registrarSaida(id) {
    const visita = visitas.find((item) => item.id === id);

    if (visita?.servico === 'Aspiração - Liberar o uso' && !visita.fotoDepois) {
      Alert.alert('Foto depois obrigatória', 'Anexe a foto depois da aspiração antes de registrar a saída.');
      return;
    }

    const horarioSaida = new Date().toISOString();
    await atualizarDadosVisita(id, { horarioSaida });
  }

  function adicionarFoto(id, campoFoto) {
    const etapa = campoFoto === 'fotoAntes' ? 'antes' : 'depois';
    Alert.alert(
      `Foto ${etapa} do atendimento`,
      'Escolha como deseja adicionar a foto.',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        { text: 'Galeria', onPress: () => escolherFotoGaleria(id, campoFoto) },
        { text: 'Câmera', onPress: () => tirarFoto(id, campoFoto) },
      ]
    );
  }

  async function escolherFotoGaleria(id, campoFoto) {
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!resultado.canceled && resultado.assets?.[0]?.uri) {
        salvarFotoVisita(id, campoFoto, resultado.assets[0].uri);
      }
    } catch (erro) {
      Alert.alert('Não foi possível adicionar a foto', 'Tente escolher outra imagem da galeria.');
    }
  }

  async function tirarFoto(id, campoFoto) {
    try {
      const permissao = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissao.granted) {
        Alert.alert('Permissão necessária', 'Permita o acesso à câmera para tirar a foto do atendimento.');
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!resultado.canceled && resultado.assets?.[0]?.uri) {
        salvarFotoVisita(id, campoFoto, resultado.assets[0].uri);
      }
    } catch (erro) {
      Alert.alert('Não foi possível tirar a foto', 'Verifique a câmera do aparelho e tente novamente.');
    }
  }

  function salvarFotoVisita(id, campoFoto, uri) {
    atualizarDadosVisita(id, { [campoFoto]: uri });
  }

  return (
    <KeyboardAvoidingView style={styles.teclado} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <StatusBar style="light" />

      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Pool Day</Text>
        <Text style={styles.subtitulo}>Tratamento e visitas programadas</Text>
        <Text style={styles.infoConta}>{perfil.nomeEmpresa} • {perfil.nome || usuario.email}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Sair da conta" onPress={aoSair} style={styles.botaoSair}>
          <Text style={styles.textoBotaoSair}>Sair da conta</Text>
        </Pressable>
      </View>

      {responsavel && (
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
      )}

      {responsavel && residencia && (
        <View style={styles.cartaoResidencia}>
          <Text style={styles.tituloCartao}>Residência cadastrada</Text>
          <Text style={styles.nomeResidencia}>{residencia.cliente}</Text>
          <Text style={styles.dadoResidencia}>Endereço: {residencia.endereco}</Text>
          <Text style={styles.dadoResidencia}>Piscina de {residencia.tipoPiscina} • {residencia.litragem} L</Text>
        </View>
      )}

      {responsavel && (
        <View style={styles.formulario}>
          <Text style={styles.tituloSecao}>Equipe de tratadores</Text>
          <TextInput accessibilityLabel="Nome do tratador" style={styles.campo} placeholder="Nome do tratador" value={nomeTratador} onChangeText={setNomeTratador} />
          <TextInput accessibilityLabel="E-mail do tratador" style={styles.campo} placeholder="E-mail do tratador" keyboardType="email-address" autoCapitalize="none" value={emailTratador} onChangeText={setEmailTratador} />
          <Pressable accessibilityRole="button" onPress={enviarConvite} disabled={enviandoConvite} style={({ pressed }) => [styles.botao, pressed && styles.botaoPressionado, enviandoConvite && styles.botaoDesativado]}>
            <Text style={styles.textoBotao}>{enviandoConvite ? 'Enviando convite...' : 'Convidar tratador'}</Text>
          </Pressable>
          {tratadores.map((item) => <Text key={item.id} style={styles.dadoResidencia}>{item.nome} • {item.email}</Text>)}
          {tratadores.length === 0 && <Text style={styles.dadoResidencia}>Nenhum tratador cadastrado.</Text>}
        </View>
      )}

      <View style={styles.secaoVisitas}>
        <Text style={styles.tituloSecao}>{responsavel ? 'Próximas visitas' : 'Minhas visitas'}</Text>
        {responsavel && (
          <>
            <Text style={styles.rotulo}>Local / piscina</Text>
            <View style={styles.seletor}>
              <Picker selectedValue={localVisitaId} onValueChange={setLocalVisitaId}>
                <Picker.Item label={piscinas.length ? 'Selecione o local' : 'Cadastre um local primeiro'} value="" />
                {piscinas.map((item) => <Picker.Item key={item.id} label={`${item.cliente} — ${item.endereco}`} value={item.id} />)}
              </Picker>
            </View>
            <Text style={styles.rotulo}>Tratador responsável</Text>
            <View style={styles.seletor}>
              <Picker selectedValue={tratadorUid} onValueChange={setTratadorUid}>
                <Picker.Item label={tratadores.length ? 'Selecione o tratador' : 'Convide um tratador primeiro'} value="" />
                {tratadores.map((item) => <Picker.Item key={item.id} label={item.nome || item.email} value={item.id} />)}
              </Picker>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Selecionar data da visita" onPress={() => setMostrarCalendario(true)} style={styles.campoData}>
              <Text style={dataVisita ? styles.textoData : styles.placeholderData}>{dataVisita ? formatarData(dataVisita) : 'Data da visita'}</Text>
            </Pressable>
            {mostrarCalendario && <DateTimePicker value={dataVisita || new Date()} minimumDate={inicioDoDia(new Date())} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onValueChange={(_evento, dataSelecionada) => { setDataVisita(dataSelecionada); setMostrarCalendario(false); }} onDismiss={() => setMostrarCalendario(false)} />}
            <Text style={styles.rotulo}>Tipo de serviço</Text>
            <View style={styles.seletor}><Picker selectedValue={servico} onValueChange={setServico}><Picker.Item label="Selecione o serviço" value="" /><Picker.Item label="Aplicar produtos" value="Aplicar produtos" /><Picker.Item label="Aspiração - Liberar o uso" value="Aspiração - Liberar o uso" /><Picker.Item label="Inspeção" value="Inspeção" /></Picker></View>
            {servico === 'Aplicar produtos' && <TextInput style={styles.campo} placeholder="Orientação de produtos" value={orientacao} onChangeText={setOrientacao} />}
            <Pressable accessibilityRole="button" onPress={adicionarVisita} style={({ pressed }) => [styles.botao, pressed && styles.botaoPressionado]} android_ripple={{ color: '#c65326' }}>
              <Text style={styles.textoBotao}>Adicionar visita</Text>
            </Pressable>
          </>
        )}
        <VisitasLista visitas={visitas} onAddPhoto={adicionarFoto} onCheckIn={registrarChegada} onRegisterDeparture={registrarSaida} onChangeStatus={alterarStatusVisita} onConfirmConclusion={confirmarConclusaoVisita} onChangeJustificativa={alterarJustificativaVisita} />
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function formatarData(data) {
  return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
}

function inicioDoDia(data) {
  const dia = new Date(data);
  dia.setHours(0, 0, 0, 0);
  return dia;
}

const styles = StyleSheet.create({
  areaSegura: { flex: 1, backgroundColor: '#f4f7f8' },
  teclado: { flex: 1 },
  container: { flexGrow: 1, backgroundColor: '#f4f7f8', padding: 20, paddingTop: 16 },
  cabecalho: { backgroundColor: '#123b4a', borderRadius: 14, marginBottom: 20, padding: 20 },
  titulo: { color: '#fff', fontSize: 30, fontWeight: '700' },
  subtitulo: { color: '#d5e5e9', fontSize: 15, marginTop: 6 },
  infoConta: { color: '#d5e5e9', fontSize: 13, marginTop: 14 },
  botaoSair: { alignSelf: 'flex-start', borderColor: '#d5e5e9', borderRadius: 7, borderWidth: 1, marginTop: 10, paddingHorizontal: 11, paddingVertical: 7 },
  textoBotaoSair: { color: '#fff', fontSize: 13, fontWeight: '600' },
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
  botaoDesativado: { opacity: 0.6 },
  textoBotao: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cartaoResidencia: { backgroundColor: '#fff', borderColor: '#d5dfe2', borderRadius: 14, borderWidth: 1, marginTop: 20, padding: 18 },
  tituloCartao: { color: '#123b4a', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  nomeResidencia: { color: '#252d31', fontSize: 17, fontWeight: '600', marginBottom: 4 },
  dadoResidencia: { color: '#526168', fontSize: 15, marginTop: 4 },
  secaoVisitas: { backgroundColor: '#fff', borderRadius: 14, marginTop: 24, padding: 18 },
  cartao: { backgroundColor: '#fff', borderRadius: 10, marginTop: 10, padding: 16 },
});
