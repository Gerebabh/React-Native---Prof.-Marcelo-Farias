import { cores } from './styles/colors';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import Autenticacao from './components/Autenticacao';
import NavegacaoInferior from './components/NavegacaoInferior';
import TelaEquipe from './components/TelaEquipe';
import TelaInicio from './components/TelaInicio';
import TelaLocais from './components/TelaLocais';
import TelaVisitas from './components/TelaVisitas';
import {
  atualizarClienteAtivo,
  atualizarVisita,
  convidarTratador,
  enviarRecuperacaoSenha,
  observarClientes,
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
  const abas = responsavel
    ? [
      { id: 'inicio', titulo: 'Início' },
      { id: 'clientes', titulo: 'Clientes' },
      { id: 'visitas', titulo: 'Visitas' },
      { id: 'equipe', titulo: 'Equipe' },
    ]
    : [
      { id: 'inicio', titulo: 'Início' },
      { id: 'visitas', titulo: 'Minhas visitas' },
    ];
  const [abaSelecionada, setAbaSelecionada] = useState('inicio');
  const [mostrarFormularioCliente, setMostrarFormularioCliente] = useState(false);
  const [mostrarFormularioVisita, setMostrarFormularioVisita] = useState(false);
  const [retornarParaVisitas, setRetornarParaVisitas] = useState(false);
  const [cliente, setCliente] = useState('');
  const [endereco, setEndereco] = useState('');
  const [tipoPiscina, setTipoPiscina] = useState('');
  const [litragem, setLitragem] = useState('');
  const [clientes, setClientes] = useState([]);
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
    }, () => Alert.alert('Erro', 'Não foi possível carregar os locais da empresa.'));
    const cancelarClientes = responsavel
      ? observarClientes(perfil.empresaId, (lista) => setClientes(lista), () => Alert.alert('Erro', 'Não foi possível carregar os clientes.'))
      : undefined;
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
        setTratadorUid((atual) => !atual || atual === usuario.uid ? lista[0]?.id || usuario.uid : atual);
      }, () => Alert.alert('Erro', 'Não foi possível carregar a equipe.'))
      : undefined;

    return () => {
      cancelarPiscinas?.();
      cancelarClientes?.();
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
      setClientes((lista) => lista.some((item) => item.id === piscina.clienteId)
        ? lista
        : [...lista, { id: piscina.clienteId, nome: piscina.cliente, ativo: true }]);
      setLocalVisitaId(piscina.id);
      setCliente('');
      setEndereco('');
      setTipoPiscina('');
      setLitragem('');
      setMostrarFormularioCliente(false);

      if (retornarParaVisitas) {
        setRetornarParaVisitas(false);
        setAbaSelecionada('visitas');
        setMostrarFormularioVisita(true);
      }
    } catch (erro) {
      Alert.alert('Não foi possível salvar', 'Confira sua conexão e tente salvar o local novamente.');
    }
  }

  async function alternarClienteAtivo(clienteId) {
    const clienteAtual = clientes.find((item) => item.id === clienteId);
    if (!clienteAtual) return;
    const ativo = clienteAtual.ativo === false;

    try {
      await atualizarClienteAtivo(perfil.empresaId, clienteId, ativo);
      setClientes((lista) => lista.map((item) => item.id === clienteId ? { ...item, ativo } : item));
      if (retornarParaVisitas && ativo && piscinas.some((piscina) => piscina.clienteId === clienteId)) {
        setRetornarParaVisitas(false);
        setAbaSelecionada('visitas');
        setMostrarFormularioVisita(true);
      }
    } catch (_erro) {
      Alert.alert('Não foi possível atualizar', 'Confira sua conexão e tente alterar o status do cliente novamente.');
    }
  }

  function cadastrarClienteAntesDaVisita() {
    setRetornarParaVisitas(true);
    setMostrarFormularioCliente(clientes.length === 0 && piscinas.length === 0);
    setAbaSelecionada('clientes');
  }

  function cancelarCadastroDeCliente() {
    setMostrarFormularioCliente(false);
    setRetornarParaVisitas(false);
  }

  function iniciarNovoServico() {
    const possuiLocalAtivo = piscinas.some((piscina) => clientes.find((item) => item.id === piscina.clienteId)?.ativo !== false);

    if (!possuiLocalAtivo) {
      cadastrarClienteAntesDaVisita();
      return;
    }

    setMostrarFormularioVisita(true);
    setAbaSelecionada('visitas');
  }

  async function adicionarVisita() {
    const piscina = piscinas.find((item) => item.id === localVisitaId
      && clientes.find((clienteAtual) => clienteAtual.id === item.clienteId)?.ativo !== false);
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

    const tratador = tratadorUid === usuario.uid
      ? { nome: perfil.nome || usuario.email }
      : tratadores.find((item) => item.id === tratadorUid);
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
    setMostrarFormularioVisita(false);
  }

  function selecionarDataVisita(dataSelecionada) {
    if (dataSelecionada) setDataVisita(dataSelecionada);
    setMostrarCalendario(false);
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

  async function reenviarEmailConvite(email) {
    try {
      await enviarRecuperacaoSenha(email);
      Alert.alert('E-mail reenviado', `Enviamos novamente as instruções para ${email}.`);
    } catch (_erro) {
      Alert.alert('Não foi possível reenviar', 'Confira sua conexão e tente novamente mais tarde.');
    }
  }

  async function enviarConvite() {
    if (!nomeTratador.trim() || !emailTratador.trim()) {
      Alert.alert('Cadastro incompleto', 'Informe o nome e o e-mail do tratador.');
      return false;
    }

    setEnviandoConvite(true);
    try {
      await convidarTratador(perfil.empresaId, nomeTratador.trim(), emailTratador.trim());
      setNomeTratador('');
      setEmailTratador('');
      Alert.alert('Convite enviado', 'O tratador receberá um e-mail para definir a senha e acessar a empresa.');
      return true;
    } catch (erro) {
      if (erro.conviteCriado) {
        setNomeTratador('');
        setEmailTratador('');
        Alert.alert(
          'Conta criada',
          `A conta de ${erro.email} foi vinculada à empresa, mas o e-mail não chegou. Você pode tentar reenviar agora.`,
          [
            { text: 'Fechar', style: 'cancel' },
            { text: 'Reenviar e-mail', onPress: () => reenviarEmailConvite(erro.email) },
          ]
        );
        return false;
      }

      if (erro.contaSemVinculo) {
        Alert.alert('Cadastro incompleto', 'A conta foi criada, mas o vínculo com a empresa falhou e não pôde ser removido. Exclua essa conta no Firebase Authentication antes de tentar novamente.');
        return false;
      }

      const mensagem = erro.code === 'auth/email-already-in-use' || erro.code === 'auth/email-already-exists'
        ? 'Já existe uma conta com esse e-mail.'
        : erro.code === 'permission-denied'
          ? 'Somente o responsável ativo pode convidar tratadores. Confira também as regras do Firestore.'
          : erro.code === 'auth/network-request-failed'
            ? 'Sem conexão com a internet. Confira a rede e tente novamente.'
            : erro.code === 'auth/too-many-requests' || erro.code === 'auth/quota-exceeded'
              ? 'O limite de envios foi atingido. Aguarde e tente novamente mais tarde.'
              : 'Não foi possível concluir o convite. Confira os dados e tente novamente.';
      Alert.alert('Não foi possível enviar o convite', mensagem);
      return false;
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

  const abaAtual = abas.some((aba) => aba.id === abaSelecionada) ? abaSelecionada : 'inicio';
  const clientesAtivos = clientes.filter((item) => item.ativo !== false).length;
  const hoje = formatarData(new Date());
  const agendamentosHoje = visitas.filter((item) => item.data === hoje).length;
  const piscinasAtivas = piscinas.filter((piscina) => clientes.find((item) => item.id === piscina.clienteId)?.ativo !== false);

  return (
    <KeyboardAvoidingView style={styles.teclado} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="light" />
      <View style={styles.cabecalho}>
        <View>
          <Text style={styles.titulo}>Pool Day</Text>
          <Text style={styles.subtitulo}>Tratamento e visitas programadas</Text>
          <Text style={styles.infoConta}>{perfil.nomeEmpresa} • {perfil.nome || usuario.email}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Sair da conta" onPress={aoSair} style={styles.botaoSair}>
          <Text style={styles.textoBotaoSair}>Sair</Text>
        </Pressable>
      </View>

      <View style={styles.conteudo}>
        {abaAtual === 'inicio' && (
          <TelaInicio
            nome={perfil.nome || usuario.email}
            empresa={perfil.nomeEmpresa}
            responsavel={responsavel}
            clientesAtivos={clientesAtivos}
            agendamentosHoje={agendamentosHoje}
            funcionarios={tratadores.length}
            aoAbrirLocais={() => setAbaSelecionada('clientes')}
            aoAbrirVisitas={() => setAbaSelecionada('visitas')}
            aoAbrirEquipe={() => setAbaSelecionada('equipe')}
            aoAdicionarServico={responsavel ? iniciarNovoServico : () => setAbaSelecionada('visitas')}
          />
        )}
        {abaAtual === 'clientes' && responsavel && (
          <ScrollArea>
            <TelaLocais
              cliente={cliente} endereco={endereco} tipoPiscina={tipoPiscina} litragem={litragem} piscinas={piscinas} clientes={clientes}
              mostrarFormulario={mostrarFormularioCliente} onMostrarFormulario={() => setMostrarFormularioCliente(true)} onCancelarFormulario={cancelarCadastroDeCliente}
              onCliente={setCliente} onEndereco={setEndereco} onTipoPiscina={setTipoPiscina} onLitragem={setLitragem} onSalvar={salvarResidencia}
              onAlternarCliente={alternarClienteAtivo}
            />
          </ScrollArea>
        )}
        {abaAtual === 'equipe' && responsavel && (
          <ScrollArea>
            <TelaEquipe nome={nomeTratador} email={emailTratador} tratadores={tratadores} visitas={visitas} enviando={enviandoConvite} onNome={setNomeTratador} onEmail={setEmailTratador} onConvidar={enviarConvite} />
          </ScrollArea>
        )}
        {abaAtual === 'visitas' && (
          <TelaVisitas
            responsavel={responsavel} possuiLocalAtivo={piscinasAtivas.length > 0} temClientes={clientes.length > 0 || piscinas.length > 0}
            responsavelUid={usuario.uid} responsavelNome={perfil.nome || usuario.email}
            piscinas={piscinasAtivas} tratadores={tratadores} visitas={visitas}
            localVisitaId={localVisitaId} tratadorUid={tratadorUid} dataVisita={dataVisita} mostrarCalendario={mostrarCalendario}
            mostrarFormulario={mostrarFormularioVisita}
            servico={servico} orientacao={orientacao} onLocal={setLocalVisitaId} onTratador={setTratadorUid}
            onAbrirCalendario={() => setMostrarCalendario(true)} onSelecionarData={selecionarDataVisita}
            onFecharCalendario={() => setMostrarCalendario(false)} onServico={setServico} onOrientacao={setOrientacao}
            onAdicionarVisita={adicionarVisita} onAddPhoto={adicionarFoto} onCheckIn={registrarChegada}
            onAbrirFormulario={() => setMostrarFormularioVisita(true)} onCancelarFormulario={() => setMostrarFormularioVisita(false)}
            onCadastrarCliente={cadastrarClienteAntesDaVisita}
            onRegisterDeparture={registrarSaida} onChangeStatus={alterarStatusVisita}
            onConfirmConclusion={confirmarConclusaoVisita} onChangeJustificativa={alterarJustificativaVisita}
          />
        )}
      </View>

      <NavegacaoInferior abas={abas} abaAtual={abaAtual} aoSelecionar={setAbaSelecionada} />
    </KeyboardAvoidingView>
  );
}

function ScrollArea({ children }) {
  return <ScrollView style={styles.areaRolavel} contentContainerStyle={styles.conteudoRolavel} keyboardShouldPersistTaps="handled">{children}</ScrollView>;
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
  areaSegura: { flex: 1, backgroundColor: cores.fundoTela },
  teclado: { flex: 1 },
  cabecalho: { alignItems: 'center', backgroundColor: cores.azulEscuro, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  titulo: { color: cores.branco, fontSize: 30, fontWeight: '700' },
  subtitulo: { color: cores.azulClaro, fontSize: 14, marginTop: 2 },
  infoConta: { color: cores.azulClaro, fontSize: 12, marginTop: 7 },
  botaoSair: { borderColor: cores.azulClaro, borderRadius: 7, borderWidth: 1, marginLeft: 8, paddingHorizontal: 12, paddingVertical: 8 },
  textoBotaoSair: { color: cores.branco, fontSize: 13, fontWeight: '600' },
  conteudo: { flex: 1, backgroundColor: cores.fundoTela },
  areaRolavel: { flex: 1 },
  conteudoRolavel: { flexGrow: 1 },
});
