import { cores } from './styles/colors';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import Autenticacao from './components/Autenticacao';
import NavegacaoInferior from './components/NavegacaoInferior';
import CabecalhoApp from './components/CabecalhoApp';
import TelaEquipe from './components/TelaEquipe';
import TelaInicio from './components/TelaInicio';
import TelaLocais from './components/TelaLocais';
import TelaProdutos from './components/TelaProdutos';
import TelaVisitas from './components/TelaVisitas';
import { montarOrientacaoTratamento } from './components/dadosTratamento';
import { unidadesDaDose } from './services/unidades';
import { enviarFotoVisita } from './services/fotosVisita';
import {
  atualizarClienteAtivo,
  atualizarProduto,
  atualizarTratamentoPadrao,
  atualizarVisita,
  concluirVisitaComBaixaEstoque,
  convidarTratador,
  enviarRecuperacaoSenha,
  observarClientes,
  observarPiscinas,
  observarProdutos,
  observarTratadores,
  observarVisitas,
  obterToken,
  salvarPiscina,
  salvarProduto,
  salvarVisita,
} from './services/firebase';

export default function App(props) {
  return (
    <SafeAreaProvider>
      <Autenticacao>
        {({ usuario, perfil, aoSair, aoAtualizarPerfil }) => (
          <SafeAreaView style={styles.areaSegura}>
            <ConteudoApp {...props} usuario={usuario} perfil={perfil} aoSair={aoSair} aoAtualizarPerfil={aoAtualizarPerfil} />
          </SafeAreaView>
        )}
      </Autenticacao>
    </SafeAreaProvider>
  );
}

function ConteudoApp({ visitasIniciais = [], usuario, perfil, aoSair, aoAtualizarPerfil }) {
  const responsavel = perfil.papel === 'responsavel';
  const abas = responsavel
    ? [
      { id: 'inicio', titulo: 'Início' },
      { id: 'clientes', titulo: 'Clientes' },
      { id: 'visitas', titulo: 'Visitas' },
      { id: 'equipe', titulo: 'Equipe' },
      { id: 'produtos', titulo: 'Produtos' },
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
  const [produtos, setProdutos] = useState([]);
  const [tratadores, setTratadores] = useState([]);
  const [tratadorUid, setTratadorUid] = useState('');
  const [nomeTratador, setNomeTratador] = useState('');
  const [emailTratador, setEmailTratador] = useState('');
  const [enviandoConvite, setEnviandoConvite] = useState(false);
  const [localVisitaId, setLocalVisitaId] = useState('');
  const [visitas, setVisitas] = useState(visitasIniciais);
  const [tokenFotos, setTokenFotos] = useState('');
  const [fotoEnviando, setFotoEnviando] = useState('');
  const [dataVisita, setDataVisita] = useState(null);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [servico, setServico] = useState('');
  const [orientacao, setOrientacao] = useState('');
  const [produtosAplicados, setProdutosAplicados] = useState([]);

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
    const cancelarProdutos = observarProdutos(perfil.empresaId, (lista) => setProdutos(lista), (erro) => {
      const mensagem = erro?.code === 'permission-denied'
        ? 'O Firebase bloqueou o acesso ao estoque. Publique as regras atuais do Firestore e tente novamente.'
        : 'Confira sua conexão e tente carregar o estoque novamente.';
      Alert.alert('Não foi possível carregar o estoque', mensagem);
    });

    return () => {
      cancelarPiscinas?.();
      cancelarClientes?.();
      cancelarVisitas?.();
      cancelarTratadores?.();
      cancelarProdutos?.();
    };
  }, [perfil.empresaId, perfil.papel, responsavel, usuario.uid]);

  useEffect(() => {
    let ativo = true;
    if (abaSelecionada === 'visitas') {
      obterToken().then((token) => {
        if (ativo) setTokenFotos(token);
      }).catch(() => {
        if (ativo) setTokenFotos('');
      });
    }
    return () => { ativo = false; };
  }, [abaSelecionada, usuario.uid]);

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

  async function salvarTratamentoPadrao(piscinaId, dados) {
    try {
      await atualizarTratamentoPadrao(perfil.empresaId, piscinaId, dados);
      setPiscinas((lista) => lista.map((piscina) => piscina.id === piscinaId ? { ...piscina, ...dados } : piscina));
      return true;
    } catch (erro) {
      Alert.alert('Não foi possível salvar', 'Confira sua conexão e tente salvar o padrão de tratamento novamente.');
      return false;
    }
  }

  async function salvarProdutoNoEstoque(dados) {
    const nome = dados.nome.trim();
    const marca = (dados.marca || '').trim();
    const unidade = dados.unidade.trim();
    const quantidadeEstoque = Number(dados.quantidadeEstoque.replace(',', '.'));
    const valorUnitarioUltimaCompra = Number(dados.valorUnitarioUltimaCompra.replace(',', '.'));

    if (!nome || !unidade || !dados.quantidadeEstoque.trim()) {
      Alert.alert('Cadastro incompleto', 'Informe o nome, a quantidade em estoque e a unidade do produto.');
      return false;
    }
    if (!Number.isFinite(quantidadeEstoque) || quantidadeEstoque < 0) {
      Alert.alert('Quantidade inválida', 'Informe uma quantidade em estoque igual ou maior que zero.');
      return false;
    }

    if (!Number.isFinite(valorUnitarioUltimaCompra) || valorUnitarioUltimaCompra <= 0) {
      Alert.alert('Valor inválido', 'Informe o valor unitário da última compra, maior que zero.');
      return false;
    }

    const produto = { nome, marca, quantidadeEstoque, unidade, valorUnitarioUltimaCompra };
    if (!unidadesDaDose(unidade).length) {
      Alert.alert('Unidade inválida', 'Escolha uma unidade válida para controlar o estoque.');
      return false;
    }
    try {
      if (dados.id) {
        await atualizarProduto(perfil.empresaId, dados.id, produto);
        setProdutos((lista) => lista.map((item) => item.id === dados.id ? { ...item, ...produto } : item));
      } else {
        const novoProduto = await salvarProduto(perfil.empresaId, produto);
        setProdutos((lista) => lista.some((item) => item.id === novoProduto.id) ? lista : [...lista, novoProduto]);
      }
      return true;
    } catch (erro) {
      const mensagem = erro?.code === 'permission-denied'
        ? 'O Firebase bloqueou o cadastro. Publique as regras atuais do Firestore e tente novamente.'
        : 'Confira sua conexão e tente salvar o produto novamente.';
      Alert.alert('Não foi possível salvar', mensagem);
      return false;
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

    const produtosDaVisita = produtosAplicados.map((item) => ({
      ...item,
      quantidade: Number(item.quantidade.replace(',', '.')),
    }));
    if (servico === 'Aplicar produtos' && (produtosDaVisita.length === 0
      || produtosDaVisita.some((item) => !Number.isFinite(item.quantidade) || item.quantidade <= 0))) {
      Alert.alert('Padrão de produtos necessário', 'Configure os produtos e as quantidades no cadastro desta piscina antes de agendar a aplicação.');
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
      produtosAplicados: servico === 'Aplicar produtos'
        ? Object.fromEntries(produtosDaVisita.map((item) => [item.produtoId, {
          produto: item.produto,
          quantidade: item.quantidade,
          unidade: item.unidade,
        }]))
        : {},
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
    setProdutosAplicados([]);
    setTratadorUid('');
    setMostrarFormularioVisita(false);
  }

  function selecionarDataVisita(dataSelecionada) {
    if (dataSelecionada) setDataVisita(dataSelecionada);
    setMostrarCalendario(false);
  }

  function selecionarLocalVisita(piscinaId) {
    setLocalVisitaId(piscinaId);
    if (servico === 'Aplicar produtos') {
      const piscina = piscinas.find((item) => item.id === piscinaId);
      setOrientacao(montarOrientacaoTratamento(piscina));
      setProdutosAplicados(carregarProdutosPiscina(piscina, produtos));
    }
  }

  function selecionarServico(servicoSelecionado) {
    setServico(servicoSelecionado);
    if (servicoSelecionado === 'Aplicar produtos') {
      const piscina = piscinas.find((item) => item.id === localVisitaId);
      setOrientacao(montarOrientacaoTratamento(piscina));
      setProdutosAplicados(carregarProdutosPiscina(piscina, produtos));
    } else {
      setOrientacao('');
      setProdutosAplicados([]);
    }
  }

  function alterarQuantidadeProduto(produtoId, quantidade) {
    setProdutosAplicados((lista) => lista.map((item) => item.produtoId === produtoId ? { ...item, quantidade } : item));
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
      'A visita será concluída e as quantidades de produtos usadas serão descontadas do estoque.',
      [
        { text: 'Não', style: 'cancel', onPress: () => {} },
        { text: 'Sim', onPress: () => concluirVisita(id) },
      ]
    );
  }

  async function concluirVisita(id) {
    try {
      const resultado = await concluirVisitaComBaixaEstoque(perfil.empresaId, id);
      setVisitas((listaAtual) => listaAtual.map((visita) => visita.id === id
        ? { ...visita, status: 'Executada', ...resultado }
        : visita));
    } catch (erro) {
      const titulo = erro.code === 'estoque-insuficiente' ? 'Estoque insuficiente'
        : erro.code === 'produtos-nao-configurados' ? 'Padrão de produtos necessário'
          : erro.code === 'preco-nao-configurado' ? 'Valor da compra necessário'
          : 'Não foi possível concluir';
      Alert.alert(titulo, erro.message || 'Confira o estoque e tente novamente.');
    }
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
      const localizacao = await obterLocalizacaoAtual();
      const chegada = {
        horarioChegada: new Date().toISOString(),
        latitude: localizacao.latitude,
        longitude: localizacao.longitude,
        enderecoChegada: localizacao.endereco || `${localizacao.latitude.toFixed(2)}, ${localizacao.longitude.toFixed(2)}`,
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

  async function obterLocalizacaoAtual() {
    const localizacao = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return {
      latitude: localizacao.coords.latitude,
      longitude: localizacao.coords.longitude,
      endereco: await obterEndereco(localizacao.coords),
    };
  }

  async function registrarSaida(id) {
    const visita = visitas.find((item) => item.id === id);

    if (visita?.servico === 'Aspiração - Liberar o uso' && !visita.fotoDepois?.arquivoId) {
      Alert.alert('Foto depois obrigatória', 'Anexe a foto depois da aspiração antes de registrar a saída.');
      return;
    }

    const horarioSaida = new Date().toISOString();
    await atualizarDadosVisita(id, { horarioSaida });
  }

  function adicionarFoto(id, campoFoto) {
    const visita = visitas.find((item) => item.id === id);
    if (visita?.status === 'Executada') return;
    const etapa = campoFoto === 'fotoAntes' ? 'antes' : 'depois';
    tirarFoto(id, campoFoto, etapa);
  }

  async function tirarFoto(id, campoFoto, etapa) {
    try {
      const permissao = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissao.granted) {
        Alert.alert('Permissão necessária', 'Permita o acesso à câmera para tirar a foto do atendimento.');
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!resultado.canceled && resultado.assets?.[0]?.uri) {
        const capturadaEm = new Date().toISOString();
        const localizacao = await obterLocalizacaoFoto();
        if (!localizacao) return;
        await salvarFotoVisita(id, campoFoto, resultado.assets[0].uri, capturadaEm, localizacao);
      }
    } catch (erro) {
      if (erro?.code === 'localizacao-negada' || erro?.code === 'localizacao-indisponivel') {
        Alert.alert('Localização necessária', erro.message || 'Ative o GPS e permita o acesso à localização para salvar a foto.');
      } else {
        Alert.alert(`Não foi possível tirar a foto ${etapa}`, 'Verifique a câmera do aparelho e tente novamente.');
      }
    }
  }

  async function obterLocalizacaoFoto() {
    if (!await Location.hasServicesEnabledAsync()) {
      const erro = new Error('Ative o serviço de localização do aparelho e tente novamente.');
      erro.code = 'localizacao-indisponivel';
      throw erro;
    }
    let permissao = await Location.getForegroundPermissionsAsync();
    if (permissao.status !== 'granted') permissao = await Location.requestForegroundPermissionsAsync();
    if (permissao.status !== 'granted') {
      const erro = new Error('Permita o acesso à localização para registrar a foto.');
      erro.code = 'localizacao-negada';
      throw erro;
    }
    try {
      const localizacao = await obterLocalizacaoAtual();
      return { ...localizacao, endereco: localizacao.endereco || undefined };
    } catch (_erro) {
      const erro = new Error('Não foi possível obter sua localização. Verifique o GPS e tente novamente.');
      erro.code = 'localizacao-indisponivel';
      throw erro;
    }
  }

  async function salvarFotoVisita(id, campoFoto, uri, capturadaEm, localizacao) {
    const chaveEnvio = `${id}-${campoFoto}`;
    setFotoEnviando(chaveEnvio);
    try {
      const foto = await enviarFotoVisita(id, campoFoto, { uri, capturadaEm, ...localizacao });
      setVisitas((lista) => lista.map((visita) => visita.id === id ? { ...visita, [campoFoto]: foto } : visita));
    } catch (erro) {
      const mensagens = {
        'visita-executada': 'Esta visita já foi concluída e as fotos não podem ser alteradas.',
        'sem-acesso': 'Você não tem acesso a esta visita.',
        'nao-encontrado': 'Você não tem acesso a esta visita.',
        'arquivo-grande': 'A foto ultrapassa o limite de 8 MB. Tire outra foto e tente novamente.',
        'tipo-invalido': 'A foto não está em um formato JPEG válido. Tire outra foto e tente novamente.',
        'dados-invalidos': 'Confira a foto e a localização do aparelho e tente novamente.',
        'nao-autenticado': 'Sua sessão expirou. Entre novamente e tente enviar a foto.',
      };
      if (__DEV__ && !mensagens[erro?.code]) {
        console.warn('Falha ao enviar foto para a API:', {
          codigo: erro?.code || 'sem-codigo',
          detalhe: erro?.message || 'sem-detalhe',
        });
      }

      const erroTemporario = !mensagens[erro?.code]
        || erro?.code === 'erro-interno'
        || /^http-5\d\d$/.test(erro?.code || '');
      if (erroTemporario) {
        Alert.alert(
          'Falha ao enviar a foto',
          'A foto não foi confirmada pelo servidor. Verifique sua conexão e tente novamente. Você pode repetir sem tirar outra foto.',
          [
            { text: 'Agora não', style: 'cancel' },
            { text: 'Tentar novamente', onPress: () => salvarFotoVisita(id, campoFoto, uri, capturadaEm, localizacao) },
          ],
        );
        return;
      }

      Alert.alert('Não foi possível enviar a foto', mensagens[erro?.code] || 'Confira sua conexão e tente novamente.');
    } finally {
      setFotoEnviando('');
    }
  }

  const abaAtual = abas.some((aba) => aba.id === abaSelecionada) ? abaSelecionada : 'inicio';
  const clientesAtivos = clientes.filter((item) => item.ativo !== false).length;
  const hoje = formatarData(new Date());
  const agendamentosHoje = visitas.filter((item) => item.data === hoje).length;
  const visitasAtrasadas = visitas.filter((item) => item.status !== 'Executada' && dataEhAnteriorAHoje(item.data)).length;
  const piscinasAtivas = piscinas.filter((piscina) => clientes.find((item) => item.id === piscina.clienteId)?.ativo !== false);

  return (
    <KeyboardAvoidingView style={styles.teclado} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="light" />
      <CabecalhoApp usuario={usuario} perfil={perfil} aoSair={aoSair} aoAtualizarPerfil={aoAtualizarPerfil} />

      <View style={styles.conteudo}>
        {abaAtual === 'inicio' && (
          <TelaInicio
            nome={perfil.nome || usuario.email}
            empresa={perfil.nomeEmpresa}
            responsavel={responsavel}
            clientesAtivos={clientesAtivos}
            agendamentosHoje={agendamentosHoje}
            visitasAtrasadas={visitasAtrasadas}
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
              produtos={produtos} onAbrirProdutos={() => setAbaSelecionada('produtos')}
              onAlternarCliente={alternarClienteAtivo} onSalvarTratamento={salvarTratamentoPadrao}
            />
          </ScrollArea>
        )}
        {abaAtual === 'equipe' && responsavel && (
          <ScrollArea>
            <TelaEquipe nome={nomeTratador} email={emailTratador} tratadores={tratadores} visitas={visitas} enviando={enviandoConvite} onNome={setNomeTratador} onEmail={setEmailTratador} onConvidar={enviarConvite} />
          </ScrollArea>
        )}
        {abaAtual === 'produtos' && responsavel && (
          <ScrollArea>
            <TelaProdutos produtos={produtos} onSalvar={salvarProdutoNoEstoque} />
          </ScrollArea>
        )}
        {abaAtual === 'visitas' && (
          <TelaVisitas
            responsavel={responsavel} possuiLocalAtivo={piscinasAtivas.length > 0} temClientes={clientes.length > 0 || piscinas.length > 0}
            responsavelUid={usuario.uid} responsavelNome={perfil.nome || usuario.email}
            piscinas={piscinasAtivas} tratadores={tratadores} visitas={visitas}
            localVisitaId={localVisitaId} tratadorUid={tratadorUid} dataVisita={dataVisita} mostrarCalendario={mostrarCalendario}
            mostrarFormulario={mostrarFormularioVisita}
            servico={servico} orientacao={orientacao} produtosAplicados={produtosAplicados}
            onQuantidadeProduto={alterarQuantidadeProduto} onLocal={selecionarLocalVisita} onTratador={setTratadorUid}
            onAbrirCalendario={() => setMostrarCalendario(true)} onSelecionarData={selecionarDataVisita}
            onFecharCalendario={() => setMostrarCalendario(false)} onServico={selecionarServico} onOrientacao={setOrientacao}
            onAdicionarVisita={adicionarVisita} onAddPhoto={adicionarFoto} onCheckIn={registrarChegada}
            tokenFotos={tokenFotos} fotoEnviando={fotoEnviando}
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

function dataEhAnteriorAHoje(valor) {
  const [dia, mes, ano] = String(valor || '').split('/').map(Number);
  if (!dia || !mes || !ano) return false;
  const dataVisita = new Date(ano, mes - 1, dia);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return dataVisita < hoje;
}

function inicioDoDia(data) {
  const dia = new Date(data);
  dia.setHours(0, 0, 0, 0);
  return dia;
}

function carregarProdutosPiscina(piscina, produtos) {
  return (piscina?.tratamentoPadrao || []).flatMap((item) => {
    const nome = item.produto?.trim().toLocaleLowerCase('pt-BR');
    const produto = produtos.find((cadastrado) => cadastrado.id === item.produtoId
      || cadastrado.nome.trim().toLocaleLowerCase('pt-BR') === nome);
    return produto ? [{
      produtoId: produto.id,
      produto: produto.nome,
      quantidade: String(item.quantidade || ''),
      unidade: unidadesDaDose(produto.unidade).includes(item.unidade)
        ? item.unidade
        : unidadesDaDose(produto.unidade)[0],
    }] : [];
  });
}

const styles = StyleSheet.create({
  areaSegura: { flex: 1, backgroundColor: cores.fundoTela },
  teclado: { flex: 1 },
  conteudo: { flex: 1, backgroundColor: cores.fundoTela },
  areaRolavel: { flex: 1 },
  conteudoRolavel: { flexGrow: 1 },
});
