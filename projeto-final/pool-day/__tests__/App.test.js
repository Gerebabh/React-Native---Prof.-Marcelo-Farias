import { Alert } from 'react-native';
import { act, fireEvent as eventos, render as renderOriginal, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Firebase from '../services/firebase';
import App from '../App';

const mockSessao = { papel: 'responsavel' };

// Envolve os eventos em act; waitFor aguarda as atualizações assíncronas do app.
const fireEvent = {
  press: async (...argumentos) => {
    await act(async () => eventos.press(...argumentos));
  },
  changeText: async (...argumentos) => {
    await act(async () => eventos.changeText(...argumentos));
  },
};

jest.mock('../services/firebase', () => ({
  atualizarClienteAtivo: jest.fn(async () => {}),
  atualizarProduto: jest.fn(async () => {}),
  atualizarTratamentoPadrao: jest.fn(async () => {}),
  atualizarVisita: jest.fn(async () => {}),
  concluirVisitaComBaixaEstoque: jest.fn(async () => ({ jaConcluida: false })),
  convidarTratador: jest.fn(async () => ({})),
  enviarRecuperacaoSenha: jest.fn(async () => {}),
  observarClientes: jest.fn((_empresaId, aoAtualizar) => { aoAtualizar([]); return jest.fn(); }),
  observarPiscinas: jest.fn((_empresaId, aoAtualizar) => { aoAtualizar([]); return jest.fn(); }),
  observarProdutos: jest.fn((_empresaId, aoAtualizar) => { aoAtualizar([]); return jest.fn(); }),
  observarTratadores: jest.fn((_empresaId, aoAtualizar) => {
    aoAtualizar([{ id: 'tratador-1', nome: 'Joana', email: 'joana@poolday.com' }]);
    return jest.fn();
  }),
  observarVisitas: jest.fn(() => jest.fn()),
  salvarPiscina: jest.fn(async (_empresaId, _usuarioId, dados) => ({
    id: 'piscina-1', localId: 'local-1', clienteId: 'cliente-1', ...dados,
  })),
  salvarProduto: jest.fn(async (_empresaId, dados) => ({ id: 'produto-novo', ...dados })),
  salvarVisita: jest.fn(async () => 'visita-cloud-1'),
}));

jest.mock('../components/Autenticacao', () => {
  return function AutenticacaoTeste({ children }) {
    return children({
      usuario: { uid: 'usuario-teste', email: 'teste@poolday.com' },
      perfil: { empresaId: 'empresa-teste', nome: 'Pessoa Teste', nomeEmpresa: 'Pool Day Teste', papel: mockSessao.papel },
      aoSair: jest.fn(),
    });
  };
});

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}), { virtual: true });

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  hasServicesEnabledAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }) => React.createElement(View, null, children),
    SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
  };
});

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  return function SeletorData({ onValueChange }) {
    return React.createElement(View, null,
      React.createElement(Text, { onPress: () => { const amanha = new Date(); amanha.setDate(amanha.getDate() + 1); onValueChange({ type: 'set' }, amanha); } }, 'Selecionar no calendário'),
      React.createElement(Text, { onPress: () => { const ontem = new Date(); ontem.setDate(ontem.getDate() - 1); onValueChange({ type: 'set' }, ontem); } }, 'Selecionar data passada')
    );
  };
});

jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  function Picker({ children, onValueChange, ...props }) {
    const items = React.Children.toArray(children).filter(React.isValidElement);
    return React.createElement(View, props, items.map((item) => React.cloneElement(item, { onValueChange })));
  }
  Picker.Item = ({ label, value, onValueChange }) => React.createElement(Text, { onPress: () => onValueChange(value) }, label);
  return { Picker };
});

describe('cadastro de cliente e visitas', () => {
  let alerta;

  beforeEach(() => {
    mockSessao.papel = 'responsavel';
    alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    Location.hasServicesEnabledAsync.mockResolvedValue(true);
    Location.getForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Location.getCurrentPositionAsync.mockResolvedValue({ coords: { latitude: -15.79, longitude: -47.88 } });
    Location.reverseGeocodeAsync.mockResolvedValue([{
      street: 'Rua das Palmeiras', streetNumber: '45', district: 'Asa Norte', city: 'Brasília', region: 'DF',
    }]);
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null });
    ImagePicker.launchCameraAsync.mockResolvedValue({ canceled: true, assets: null });
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    Firebase.convidarTratador.mockResolvedValue({ uid: 'novo-tratador' });
    Firebase.enviarRecuperacaoSenha.mockResolvedValue(undefined);
  });
  afterEach(async () => {
    // Aguarda a atualização em lote da FlatList enquanto a tela ainda está montada.
    await act(async () => new Promise((resolve) => setTimeout(resolve, 60)));
    alerta.mockRestore();
    jest.clearAllMocks();
  });

  async function render(elemento) {
    const tela = await renderOriginal(elemento);
    await fireEvent.press(tela.getByRole('tab', { name: mockSessao.papel === 'tratador' ? 'Minhas visitas' : 'Visitas' }));
    return tela;
  }

  async function preencherLocal(tela, { cliente = 'Casa da família', endereco = 'Rua das Flores, 10', piscina = true, litragem = '13000' } = {}) {
    const estavaEmVisitas = Boolean(tela.queryByText('Próximas visitas'));
    if (estavaEmVisitas && tela.queryByRole('button', { name: 'Cadastrar cliente' })) {
      await fireEvent.press(tela.getByRole('button', { name: 'Cadastrar cliente' }));
    } else if (estavaEmVisitas) {
      await fireEvent.press(tela.getByRole('tab', { name: 'Clientes' }));
    }
    if (tela.queryByRole('button', { name: 'Adicionar cliente' })) {
      await fireEvent.press(tela.getByRole('button', { name: 'Adicionar cliente' }));
    }

    const { getByPlaceholderText, getByText, getByRole } = tela;
    await fireEvent.changeText(getByPlaceholderText('Cliente'), cliente);
    await fireEvent.changeText(getByPlaceholderText('Endereço'), endereco);
    if (piscina) await fireEvent.press(getByText('Fibra'));
    await fireEvent.changeText(getByPlaceholderText('Litragem em litros (ex.: 13000)'), litragem);
    await fireEvent.press(getByRole('button', { name: 'Salvar cliente' }));
    const volumeValido = Number.isInteger(Number(litragem.trim())) && Number(litragem.trim()) > 0;
    if (cliente.trim() && endereco.trim() && piscina && volumeValido) {
      await waitFor(() => expect(Firebase.salvarPiscina).toHaveBeenCalled());
    }

    if (estavaEmVisitas) await fireEvent.press(tela.getByRole('tab', { name: 'Visitas' }));
  }

  async function renderNaAba(elemento, nomeAba) {
    const tela = await render(elemento);
    await fireEvent.press(tela.getByRole('tab', { name: nomeAba }));
    return tela;
  }

  async function renderLocais(elemento = <App />) {
    const tela = await renderNaAba(elemento, 'Clientes');
    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar cliente' }));
    return tela;
  }

  async function renderEquipe(elemento = <App />) {
    const tela = await renderNaAba(elemento, 'Equipe');
    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar tratador' }));
    return tela;
  }

  async function renderVisitas(elemento = <App />) {
    return renderNaAba(elemento, mockSessao.papel === 'tratador' ? 'Minhas visitas' : 'Visitas');
  }

  test('mostra o nome do aplicativo', async () => {
    const { getByText } = await render(<App />);
    expect(getByText('Pool Day')).toBeTruthy();
  });

  test('responsável navega entre visitas, clientes e equipe pelas abas inferiores', async () => {
    const tela = await render(<App />);

    expect(tela.getByRole('tab', { name: 'Início' })).toBeTruthy();
    expect(tela.getByRole('tab', { name: 'Clientes' })).toBeTruthy();
    expect(tela.getByRole('tab', { name: 'Visitas' })).toBeTruthy();
    expect(tela.getByRole('tab', { name: 'Equipe' })).toBeTruthy();
    expect(tela.getByText('Próximas visitas')).toBeTruthy();
    expect(tela.getByRole('button', { name: 'Cadastrar cliente' })).toBeTruthy();
    expect(tela.queryByRole('button', { name: 'Selecionar data da visita' })).toBeNull();

    await fireEvent.press(tela.getByRole('tab', { name: 'Clientes' }));
    expect(tela.getByRole('button', { name: 'Adicionar cliente' })).toBeTruthy();
    expect(tela.getByLabelText('Buscar cliente')).toBeTruthy();
    expect(tela.queryByPlaceholderText('Cliente')).toBeNull();
    expect(tela.queryByText('Próximas visitas')).toBeNull();

    await fireEvent.press(tela.getByRole('tab', { name: 'Equipe' }));
    expect(tela.getByRole('button', { name: 'Adicionar tratador' })).toBeTruthy();
    expect(tela.queryByPlaceholderText('Nome do tratador')).toBeNull();
  });

  test('responsável cadastra e edita produto do estoque', async () => {
    const tela = await renderNaAba(<App />, 'Produtos');
    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar produto' }));
    await fireEvent.changeText(tela.getByLabelText('Nome do produto'), 'Pastilha de Cloro 5x1');
    await fireEvent.changeText(tela.getByLabelText('Marca do produto'), 'HidroAll');
    await fireEvent.changeText(tela.getByLabelText('Quantidade em estoque'), '4');
    await fireEvent.press(tela.getByText('Unidade (UN)'));
    await fireEvent.changeText(tela.getByLabelText('Valor unitário da última compra'), '8,67');
    await fireEvent.press(tela.getByRole('button', { name: 'Salvar produto' }));

    await waitFor(() => expect(Firebase.salvarProduto).toHaveBeenCalledWith('empresa-teste', {
      nome: 'Pastilha de Cloro 5x1', marca: 'HidroAll', quantidadeEstoque: 4, unidade: 'UN', valorUnitarioUltimaCompra: 8.67,
    }));
    expect(tela.getByText('4 UN')).toBeTruthy();
    expect(tela.getByText('Marca: HidroAll')).toBeTruthy();
    expect(tela.getByText('R$ 8,67 / UN')).toBeTruthy();

    await fireEvent.press(tela.getByRole('button', { name: 'Editar produto: Pastilha de Cloro 5x1' }));
    await fireEvent.changeText(tela.getByLabelText('Quantidade em estoque'), '3');
    await fireEvent.press(tela.getByRole('button', { name: 'Salvar produto' }));

    await waitFor(() => expect(Firebase.atualizarProduto).toHaveBeenCalledWith('empresa-teste', 'produto-novo', {
      nome: 'Pastilha de Cloro 5x1', marca: 'HidroAll', quantidadeEstoque: 3, unidade: 'UN', valorUnitarioUltimaCompra: 8.67,
    }));
  });

  test('salva padrão da piscina usando produtos cadastrados no estoque', async () => {
    Firebase.observarClientes.mockImplementationOnce((_empresaId, aoAtualizar) => {
      aoAtualizar([{ id: 'cliente-1', nome: 'Casa da família', ativo: true }]);
      return jest.fn();
    });
    Firebase.observarPiscinas.mockImplementationOnce((_empresaId, aoAtualizar) => {
      aoAtualizar([{ id: 'piscina-1', clienteId: 'cliente-1', cliente: 'Casa da família', endereco: 'Rua das Flores, 10' }]);
      return jest.fn();
    });
    Firebase.observarProdutos.mockImplementationOnce((_empresaId, aoAtualizar) => {
      aoAtualizar([{ id: 'produto-cloro', nome: 'Cloro', quantidadeEstoque: 10, unidade: 'kg' }]);
      return jest.fn();
    });
    const tela = await renderNaAba(<App />, 'Clientes');

    await fireEvent.press(tela.getByRole('button', { name: 'Configurar padrão' }));
    await fireEvent.changeText(tela.getByLabelText('Quantidade de Cloro'), '250');
    await fireEvent.press(tela.getByText('g'));
    await fireEvent.press(tela.getByRole('button', { name: 'Salvar padrão' }));

    await waitFor(() => expect(Firebase.atualizarTratamentoPadrao).toHaveBeenCalledWith('empresa-teste', 'piscina-1', {
      tratamentoPadrao: [{ produtoId: 'produto-cloro', produto: 'Cloro', quantidade: '250', unidade: 'g' }],
      orientacoesTratamento: '',
    }));
  });

  test('responsável abre a agenda do funcionário com visitas atribuídas a ele', async () => {
    Firebase.observarVisitas.mockImplementationOnce((_empresaId, _usuarioId, _papel, aoAtualizar) => {
      aoAtualizar([
        { id: 'visita-joana', tratadorUid: 'tratador-1', data: '20/11/2026', local: 'Casa da Joana', servico: 'Inspeção', status: 'Pendente' },
        { id: 'visita-paulo', tratadorUid: 'tratador-2', data: '19/11/2026', local: 'Casa do Paulo', servico: 'Aplicar produtos', status: 'Executada' },
      ]);
      return jest.fn();
    });
    const tela = await renderNaAba(<App />, 'Equipe');

    await fireEvent.press(tela.getByRole('button', { name: 'Ver agenda de Joana' }));

    expect(tela.getByText('Agenda de Joana')).toBeTruthy();
    expect(tela.getByText('Casa da Joana')).toBeTruthy();
    expect(tela.queryByText('Casa do Paulo')).toBeNull();
    expect(tela.getByText('Status: Pendente')).toBeTruthy();
    await fireEvent.press(tela.getByRole('button', { name: '‹ Voltar para equipe' }));
    expect(tela.getByRole('button', { name: 'Ver agenda de Joana' })).toBeTruthy();
  });

  test('mostra agenda vazia quando funcionário ainda não tem visitas', async () => {
    Firebase.observarVisitas.mockImplementationOnce((_empresaId, _usuarioId, _papel, aoAtualizar) => {
      aoAtualizar([]);
      return jest.fn();
    });
    const tela = await renderNaAba(<App />, 'Equipe');

    await fireEvent.press(tela.getByRole('button', { name: 'Ver agenda de Joana' }));

    expect(tela.getByText('Nenhuma visita atribuída a este funcionário.')).toBeTruthy();
  });

  test('início permite acessar as visitas rapidamente', async () => {
    Firebase.observarTratadores.mockImplementationOnce((_empresaId, aoAtualizar) => { aoAtualizar([]); return jest.fn(); });
    const tela = await render(<App />);
    await fireEvent.press(tela.getByRole('tab', { name: 'Início' }));

    expect(tela.getByText('Acompanhe seus atendimentos e organize a rotina da piscina.')).toBeTruthy();
    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar serviço' }));
    expect(tela.getByPlaceholderText('Cliente')).toBeTruthy();
    await preencherLocal(tela);

    expect(tela.getByText('Próximas visitas')).toBeTruthy();
    expect(tela.getByRole('button', { name: 'Selecionar data da visita' })).toBeTruthy();
    expect(tela.getByText('Pessoa Teste (eu)')).toBeTruthy();
    await fireEvent.press(tela.getByRole('button', { name: 'Selecionar data da visita' }));
    await fireEvent.press(tela.getByText('Selecionar no calendário'));
    await fireEvent.press(tela.getByText('Inspeção'));
    await fireEvent.press(tela.getByText('Pessoa Teste (eu)'));
    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar visita' }));

    await waitFor(() => expect(Firebase.salvarVisita).toHaveBeenCalledWith('empresa-teste', expect.objectContaining({
      tratadorUid: 'usuario-teste', tratadorNome: 'Pessoa Teste',
    })));
  });

  test('abre o dashboard na primeira tela do aplicativo', async () => {
    const tela = await renderOriginal(<App />);

    expect(tela.getByLabelText('Clientes ativos: 0')).toBeTruthy();
    expect(tela.getByLabelText('Agendamentos de hoje: 0')).toBeTruthy();
    expect(tela.getByLabelText('Funcionários: 1')).toBeTruthy();
  });

  test('dashboard mostra zeros quando ainda não há cadastros nem visitas hoje', async () => {
    Firebase.observarClientes.mockImplementationOnce((_empresaId, aoAtualizar) => { aoAtualizar([]); return jest.fn(); });
    Firebase.observarTratadores.mockImplementationOnce((_empresaId, aoAtualizar) => { aoAtualizar([]); return jest.fn(); });
    const tela = await render(<App visitasIniciais={[]} />);
    await fireEvent.press(tela.getByRole('tab', { name: 'Início' }));

    expect(tela.getByLabelText('Clientes ativos: 0')).toBeTruthy();
    expect(tela.getByLabelText('Agendamentos de hoje: 0')).toBeTruthy();
    expect(tela.queryByLabelText(/Funcionários:/)).toBeNull();
  });

  test('dashboard conta somente clientes ativos e agendamentos de hoje', async () => {
    const hoje = new Date();
    const dataHoje = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    const dataAmanha = `${String(amanha.getDate()).padStart(2, '0')}/${String(amanha.getMonth() + 1).padStart(2, '0')}/${amanha.getFullYear()}`;
    Firebase.observarClientes.mockImplementationOnce((_empresaId, aoAtualizar) => {
      aoAtualizar([{ id: 'cliente-1', nome: 'Cliente ativo', ativo: true }, { id: 'cliente-2', nome: 'Cliente inativo', ativo: false }]);
      return jest.fn();
    });
    Firebase.observarTratadores.mockImplementationOnce((_empresaId, aoAtualizar) => {
      aoAtualizar([{ id: 'tratador-1', nome: 'Joana', ativo: true }, { id: 'tratador-2', nome: 'Paulo', ativo: true }]);
      return jest.fn();
    });
    const tela = await render(<App visitasIniciais={[
      { id: 'hoje', data: dataHoje, status: 'Pendente' },
      { id: 'amanha', data: dataAmanha, status: 'Pendente' },
    ]} />);
    await fireEvent.press(tela.getByRole('tab', { name: 'Início' }));

    expect(tela.getByLabelText('Clientes ativos: 1')).toBeTruthy();
    expect(tela.getByLabelText('Agendamentos de hoje: 1')).toBeTruthy();
    expect(tela.getByLabelText('Funcionários: 2')).toBeTruthy();

    await fireEvent.press(tela.getByLabelText('Clientes ativos: 1'));
    expect(tela.getByRole('tab', { name: 'Clientes' })).toBeTruthy();
    expect(tela.getByRole('button', { name: 'Adicionar cliente' })).toBeTruthy();
    await fireEvent.press(tela.getByRole('tab', { name: 'Início' }));
    await fireEvent.press(tela.getByLabelText('Agendamentos de hoje: 1'));
    expect(tela.getByText('Próximas visitas')).toBeTruthy();
  });

  test('responsável ativa e desativa um cliente pela tela de locais', async () => {
    Firebase.observarClientes.mockImplementationOnce((_empresaId, aoAtualizar) => {
      aoAtualizar([{ id: 'cliente-1', nome: 'Casa da família', ativo: true }]);
      return jest.fn();
    });
    const tela = await renderLocais();

    await fireEvent.press(tela.getByRole('button', { name: 'Desativar cliente: Casa da família' }));
    await waitFor(() => expect(Firebase.atualizarClienteAtivo).toHaveBeenCalledWith('empresa-teste', 'cliente-1', false));
    expect(tela.getByText('Status: Inativo')).toBeTruthy();

    await fireEvent.press(tela.getByRole('button', { name: 'Ativar cliente: Casa da família' }));
    await waitFor(() => expect(Firebase.atualizarClienteAtivo).toHaveBeenLastCalledWith('empresa-teste', 'cliente-1', true));
    expect(tela.getByText('Status: Ativo')).toBeTruthy();
  });

  test('pesquisa clientes pelo nome na lista', async () => {
    Firebase.observarClientes.mockImplementationOnce((_empresaId, aoAtualizar) => {
      aoAtualizar([
        { id: 'cliente-1', nome: 'Casa da família', ativo: true },
        { id: 'cliente-2', nome: 'Chácara do lago', ativo: true },
      ]);
      return jest.fn();
    });
    const tela = await renderNaAba(<App />, 'Clientes');

    expect(tela.getByText('Casa da família')).toBeTruthy();
    expect(tela.getByText('Chácara do lago')).toBeTruthy();
    await fireEvent.changeText(tela.getByLabelText('Buscar cliente'), 'chácara');

    expect(tela.getByText('Chácara do lago')).toBeTruthy();
    expect(tela.queryByText('Casa da família')).toBeNull();
  });

  test('pesquisa clientes pelo endereço da piscina', async () => {
    Firebase.observarClientes.mockImplementationOnce((_empresaId, aoAtualizar) => {
      aoAtualizar([
        { id: 'cliente-1', nome: 'Casa da família', ativo: true },
        { id: 'cliente-2', nome: 'Chácara do lago', ativo: true },
      ]);
      return jest.fn();
    });
    Firebase.observarPiscinas.mockImplementationOnce((_empresaId, aoAtualizar) => {
      aoAtualizar([
        { id: 'piscina-1', clienteId: 'cliente-1', cliente: 'Casa da família', endereco: 'Rua das Flores, 10' },
        { id: 'piscina-2', clienteId: 'cliente-2', cliente: 'Chácara do lago', endereco: 'Estrada do Lago, 20' },
      ]);
      return jest.fn();
    });
    const tela = await renderNaAba(<App />, 'Clientes');

    await fireEvent.changeText(tela.getByLabelText('Buscar cliente'), 'estrada do lago');

    expect(tela.getByText('Chácara do lago')).toBeTruthy();
    expect(tela.queryByText('Casa da família')).toBeNull();
  });

  test('agenda com o responsável quando a empresa ainda não tem tratadores', async () => {
    const piscina = {
      id: 'piscina-1', clienteId: 'cliente-1', cliente: 'Casa da família', endereco: 'Rua das Flores, 10',
      tipoPiscina: 'Fibra', litragem: 13000,
    };
    Firebase.observarClientes.mockImplementationOnce((_empresaId, aoAtualizar) => {
      aoAtualizar([{ id: 'cliente-1', nome: 'Casa da família', ativo: true }]);
      return jest.fn();
    });
    Firebase.observarPiscinas.mockImplementationOnce((_empresaId, aoAtualizar) => { aoAtualizar([piscina]); return jest.fn(); });
    Firebase.observarTratadores.mockImplementationOnce((_empresaId, aoAtualizar) => { aoAtualizar([]); return jest.fn(); });
    const tela = await render(<App />);

    expect(tela.getByRole('button', { name: 'Adicionar serviço' })).toBeTruthy();
    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar serviço' }));
    await fireEvent.press(tela.getByText('Casa da família — Rua das Flores, 10'));
    await fireEvent.press(tela.getByText('Pessoa Teste (eu)'));
    expect(tela.getByText('Pessoa Teste (eu)')).toBeTruthy();
    await fireEvent.press(tela.getByRole('button', { name: 'Selecionar data da visita' }));
    await fireEvent.press(tela.getByText('Selecionar no calendário'));
    await fireEvent.press(tela.getByText('Inspeção'));
    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar visita' }));

    await waitFor(() => expect(Firebase.salvarVisita).toHaveBeenCalledWith('empresa-teste', expect.objectContaining({
      tratadorUid: 'usuario-teste', tratadorNome: 'Pessoa Teste',
    })));
  });

  test.each(['Cliente', 'Endereço', 'Tipo de piscina', 'Litragem em litros (ex.: 13000)'])(
    'exige o campo %s', async (campo) => {
      const tela = await renderLocais();
      await preencherLocal(tela, {
        cliente: campo === 'Cliente' ? '' : 'Casa da família',
        endereco: campo === 'Endereço' ? '' : 'Rua das Flores, 10',
        piscina: campo !== 'Tipo de piscina',
        litragem: campo.includes('Litragem') ? '' : '13000',
      });
      expect(alerta).toHaveBeenCalledWith('Cadastro incompleto', 'Preencha todos os campos da residência e da piscina.');
    }
  );

  test.each(['0', '-500', 'abc', '13.5'])('não aceita litragem inválida "%s"', async (litragem) => {
    const tela = await renderLocais();
    await preencherLocal(tela, { litragem });
    expect(alerta).toHaveBeenCalledWith('Litragem inválida', 'Informe uma litragem inteira maior que zero.');
  });

  test('salva cliente, endereço e tipo de piscina', async () => {
    const tela = await renderLocais();
    await preencherLocal(tela);
    expect(tela.getByText('Residência cadastrada')).toBeTruthy();
    expect(tela.getByText('Casa da família')).toBeTruthy();
    expect(tela.getByText('Piscina de Fibra • 13000 L')).toBeTruthy();
    expect(tela.getByText('Status: Ativo')).toBeTruthy();
    expect(tela.getByRole('button', { name: 'Desativar cliente: Casa da família' })).toBeTruthy();
  });

  test('responsável configura as quantidades do tratamento normal da piscina', async () => {
    Firebase.observarClientes.mockImplementationOnce((_empresaId, aoAtualizar) => {
      aoAtualizar([{ id: 'cliente-1', nome: 'Casa da família', ativo: true }]);
      return jest.fn();
    });
    Firebase.observarPiscinas.mockImplementationOnce((_empresaId, aoAtualizar) => {
      aoAtualizar([{
        id: 'piscina-1', clienteId: 'cliente-1', cliente: 'Casa da família', endereco: 'Rua das Flores, 10',
        tipoPiscina: 'Fibra', litragem: 13000,
      }]);
      return jest.fn();
    });
    Firebase.observarProdutos.mockImplementationOnce((_empresaId, aoAtualizar) => {
      aoAtualizar([{ id: 'produto-cloro', nome: 'Cloro', quantidadeEstoque: 10, unidade: 'kg' }]);
      return jest.fn();
    });
    const tela = await renderNaAba(<App />, 'Clientes');

    await fireEvent.press(tela.getByRole('button', { name: 'Configurar padrão' }));
    expect(tela.getByText('Tratamento normal (sem choque)')).toBeTruthy();
    await fireEvent.changeText(tela.getByLabelText('Quantidade de Cloro'), '120');
    await fireEvent.press(tela.getByText('g'));
    await fireEvent.changeText(tela.getByLabelText('Observações do tratamento padrão'), 'Seguir as instruções do rótulo.');
    await fireEvent.press(tela.getByRole('button', { name: 'Salvar padrão' }));

    await waitFor(() => expect(Firebase.atualizarTratamentoPadrao).toHaveBeenCalledWith('empresa-teste', 'piscina-1', {
      tratamentoPadrao: [{ produtoId: 'produto-cloro', produto: 'Cloro', quantidade: '120', unidade: 'g' }],
      orientacoesTratamento: 'Seguir as instruções do rótulo.',
    }));
    expect(tela.getByText('Cloro: 120 g')).toBeTruthy();
    expect(tela.getByText('Seguir as instruções do rótulo.')).toBeTruthy();
  });

  test('não salva padrão com quantidade sem unidade ou valor inválido', async () => {
    Firebase.observarClientes.mockImplementationOnce((_empresaId, aoAtualizar) => {
      aoAtualizar([{ id: 'cliente-1', nome: 'Casa da família', ativo: true }]);
      return jest.fn();
    });
    Firebase.observarPiscinas.mockImplementationOnce((_empresaId, aoAtualizar) => {
      aoAtualizar([{ id: 'piscina-1', clienteId: 'cliente-1', cliente: 'Casa da família', endereco: 'Rua das Flores, 10' }]);
      return jest.fn();
    });
    Firebase.observarProdutos.mockImplementationOnce((_empresaId, aoAtualizar) => {
      aoAtualizar([{ id: 'produto-cloro', nome: 'Cloro', quantidadeEstoque: 10, unidade: 'kg' }]);
      return jest.fn();
    });
    const tela = await renderNaAba(<App />, 'Clientes');

    await fireEvent.press(tela.getByRole('button', { name: 'Configurar padrão' }));
    await fireEvent.changeText(tela.getByLabelText('Quantidade de Cloro'), 'zero');
    await fireEvent.press(tela.getByRole('button', { name: 'Salvar padrão' }));

    expect(alerta).toHaveBeenCalledWith('Quantidade inválida', expect.stringContaining('Cloro'));
    expect(Firebase.atualizarTratamentoPadrao).not.toHaveBeenCalled();
  });

  test('responsável consegue convidar tratador pelo nome e e-mail', async () => {
    const tela = await renderEquipe();
    await fireEvent.changeText(tela.getByPlaceholderText('Nome do tratador'), 'Joana Lima');
    await fireEvent.changeText(tela.getByPlaceholderText('E-mail do tratador'), 'joana@poolday.com');
    await fireEvent.press(tela.getByRole('button', { name: 'Convidar tratador' }));

    await waitFor(() => expect(Firebase.convidarTratador).toHaveBeenCalledWith('empresa-teste', 'Joana Lima', 'joana@poolday.com'));
    expect(tela.getByText('Joana')).toBeTruthy();
    expect(tela.getByText('joana@poolday.com')).toBeTruthy();
  });

  test('permite reenviar o e-mail quando a conta foi criada mas o convite falhou', async () => {
    Firebase.convidarTratador.mockRejectedValueOnce(Object.assign(new Error('E-mail não enviado.'), {
      conviteCriado: true,
      email: 'joana@poolday.com',
    }));
    const tela = await renderEquipe();
    await fireEvent.changeText(tela.getByPlaceholderText('Nome do tratador'), 'Joana Lima');
    await fireEvent.changeText(tela.getByPlaceholderText('E-mail do tratador'), 'joana@poolday.com');
    await fireEvent.press(tela.getByRole('button', { name: 'Convidar tratador' }));

    await waitFor(() => expect(alerta).toHaveBeenCalledWith(
      'Conta criada',
      expect.stringContaining('joana@poolday.com'),
      expect.any(Array)
    ));
    const alertaConvite = alerta.mock.calls.find(([titulo]) => titulo === 'Conta criada');
    await act(async () => alertaConvite[2][1].onPress());

    await waitFor(() => expect(Firebase.enviarRecuperacaoSenha).toHaveBeenCalledWith('joana@poolday.com'));
    expect(alerta).toHaveBeenCalledWith('E-mail reenviado', expect.stringContaining('joana@poolday.com'));
  });

  test('tratador não vê os formulários de cadastro e convite da equipe', async () => {
    mockSessao.papel = 'tratador';
    const tela = await renderVisitas(<App visitasIniciais={[]} />);

    expect(tela.getByRole('tab', { name: 'Minhas visitas' })).toBeTruthy();
    expect(tela.queryByRole('tab', { name: 'Clientes' })).toBeNull();
    expect(tela.queryByRole('tab', { name: 'Equipe' })).toBeNull();
    expect(tela.getAllByText('Minhas visitas')).toHaveLength(2);
    expect(tela.queryByText('Dados do local')).toBeNull();
    expect(tela.queryByText('Equipe de tratadores')).toBeNull();
    expect(tela.queryByRole('button', { name: 'Adicionar visita' })).toBeNull();
    expect(Firebase.observarVisitas).toHaveBeenCalledWith(
      'empresa-teste', 'usuario-teste', 'tratador', expect.any(Function), expect.any(Function)
    );
  });

  test('agenda do tratador mostra somente visitas recebidas pelo seu UID', async () => {
    mockSessao.papel = 'tratador';
    Firebase.observarVisitas.mockImplementationOnce((_empresaId, usuarioId, _papel, aoAtualizar) => {
      aoAtualizar([{ id: 'visita-propria', tratadorUid: usuarioId, data: '20/11/2026', local: 'Casa atendida', servico: 'Inspeção', status: 'Pendente' }]);
      return jest.fn();
    });
    const tela = await renderVisitas(<App visitasIniciais={[]} />);

    expect(tela.getByText('Casa atendida')).toBeTruthy();
    expect(tela.queryByText('Equipe de tratadores')).toBeNull();
    expect(Firebase.observarVisitas).toHaveBeenCalledWith(
      'empresa-teste', 'usuario-teste', 'tratador', expect.any(Function), expect.any(Function)
    );
  });

  test('cadastra visita de inspeção com data, local e serviço selecionados', async () => {
    const tela = await render(<App />);
    await preencherLocal(tela);
    await fireEvent.press(tela.getByText('Casa da família — Rua das Flores, 10'));
    await fireEvent.press(tela.getByRole('button', { name: 'Selecionar data da visita' }));
    await fireEvent.press(tela.getByText('Selecionar no calendário'));
    await fireEvent.press(tela.getByText('Inspeção'));
    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar visita' }));
    await waitFor(() => expect(Firebase.salvarVisita).toHaveBeenCalled());
    expect(Firebase.salvarVisita).toHaveBeenCalledWith('empresa-teste', expect.objectContaining({
      tratadorUid: 'tratador-1', criadaPorUid: 'usuario-teste',
    }));

    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const dataEsperada = `${String(amanha.getDate()).padStart(2, '0')}/${String(amanha.getMonth() + 1).padStart(2, '0')}/${amanha.getFullYear()}`;
    expect(tela.getByText(dataEsperada)).toBeTruthy();
    expect(tela.getAllByText('Casa da família — Rua das Flores, 10')).toHaveLength(1);
    expect(tela.getAllByText('Inspeção')).toHaveLength(1);
  });

  test('não permite adicionar visita sem data, local e serviço', async () => {
    const tela = await render(<App />);
    await preencherLocal(tela);
    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar visita' }));
    expect(alerta).toHaveBeenCalledWith('Cadastro incompleto', 'Preencha a data, o local e o tipo de serviço da visita.');
  });

  test('não permite agendar visita com data passada', async () => {
    const tela = await render(<App />);
    await preencherLocal(tela);
    await fireEvent.press(tela.getByText('Casa da família — Rua das Flores, 10'));
    await fireEvent.press(tela.getByRole('button', { name: 'Selecionar data da visita' }));
    await fireEvent.press(tela.getByText('Selecionar data passada'));
    await fireEvent.press(tela.getByText('Inspeção'));
    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar visita' }));

    expect(alerta).toHaveBeenCalledWith('Data inválida', 'A data da visita não pode ser anterior a hoje.');
    expect(tela.getByText('Nenhuma visita programada.')).toBeTruthy();
  });

  test('exige padrão de produto para serviço de aplicar produtos', async () => {
    const tela = await render(<App />);
    await preencherLocal(tela);
    await fireEvent.press(tela.getByText('Casa da família — Rua das Flores, 10'));
    await fireEvent.press(tela.getByRole('button', { name: 'Selecionar data da visita' }));
    await fireEvent.press(tela.getByText('Selecionar no calendário'));
    await fireEvent.press(tela.getByText('Aplicar produtos'));
    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar visita' }));
    expect(alerta).toHaveBeenCalledWith('Padrão de produtos necessário', expect.stringContaining('Configure os produtos'));
  });

  test('preenche orientação de aplicar produtos com o padrão salvo na piscina', async () => {
    const piscina = {
      id: 'piscina-1', clienteId: 'cliente-1', cliente: 'Casa da família', endereco: 'Rua das Flores, 10',
      tipoPiscina: 'Fibra', litragem: 13000,
      tratamentoPadrao: [{ produtoId: 'produto-cloro', produto: 'Cloro', quantidade: '120', unidade: 'g' }],
      orientacoesTratamento: 'Seguir as instruções do rótulo.',
    };
    Firebase.observarClientes.mockImplementationOnce((_empresaId, aoAtualizar) => {
      aoAtualizar([{ id: 'cliente-1', nome: 'Casa da família', ativo: true }]);
      return jest.fn();
    });
    Firebase.observarPiscinas.mockImplementationOnce((_empresaId, aoAtualizar) => { aoAtualizar([piscina]); return jest.fn(); });
    Firebase.observarProdutos.mockImplementation((_empresaId, aoAtualizar) => {
      aoAtualizar([{ id: 'produto-cloro', nome: 'Cloro', quantidadeEstoque: 10, unidade: 'kg' }]);
      return jest.fn();
    });
    const tela = await render(<App />);

    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar serviço' }));
    await fireEvent.press(tela.getByText('Casa da família — Rua das Flores, 10'));
    await fireEvent.press(tela.getByText('Aplicar produtos'));

    expect(tela.getByLabelText('Orientação de produtos').props.value).toBe('Cloro: 120 g\nSeguir as instruções do rótulo.');
    await fireEvent.press(tela.getByRole('button', { name: 'Selecionar data da visita' }));
    await fireEvent.press(tela.getByText('Selecionar no calendário'));
    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar visita' }));
    await waitFor(() => expect(Firebase.salvarVisita).toHaveBeenCalledWith('empresa-teste', expect.objectContaining({
      orientacao: 'Cloro: 120 g\nSeguir as instruções do rótulo.',
      produtosAplicados: { 'produto-cloro': { produto: 'Cloro', quantidade: 120, unidade: 'g' } },
    })));
  });

  test('desconta estoque quando a visita de aplicação é concluída', async () => {
    const visita = {
      id: 'visita-1', data: '20/11/2026', local: 'Casa da família', servico: 'Aplicar produtos', status: 'Pendente',
      produtosAplicados: { 'produto-cloro': { produto: 'Cloro', quantidade: 250, unidade: 'g' } },
    };
    const tela = await render(<App visitasIniciais={[visita]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Marcar visita como Executada' }));
    const alertaConclusao = alerta.mock.calls.find(([titulo]) => titulo === 'Deseja concluir a visita?');
    await act(async () => alertaConclusao[2][1].onPress());

    await waitFor(() => expect(Firebase.concluirVisitaComBaixaEstoque).toHaveBeenCalledWith('empresa-teste', 'visita-1'));
    expect(tela.getByText('✓ Visita concluída')).toBeTruthy();
  });

  test('mantém a visita pendente e avisa quando não há estoque suficiente', async () => {
    Firebase.concluirVisitaComBaixaEstoque.mockRejectedValueOnce(Object.assign(new Error('Estoque insuficiente para Cloro.'), {
      code: 'estoque-insuficiente',
    }));
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '20/11/2026', local: 'Casa da família', servico: 'Aplicar produtos', status: 'Pendente',
      produtosAplicados: { 'produto-cloro': { produto: 'Cloro', quantidade: 250, unidade: 'g' } },
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Marcar visita como Executada' }));
    const alertaConclusao = alerta.mock.calls.find(([titulo]) => titulo === 'Deseja concluir a visita?');
    await act(async () => alertaConclusao[2][1].onPress());

    await waitFor(() => expect(alerta).toHaveBeenCalledWith('Estoque insuficiente', 'Estoque insuficiente para Cloro.'));
    expect(tela.getByText('Status: Pendente')).toBeTruthy();
  });

  test.each(['Executada', 'Frustrada', 'Não realizada'])(
    'marca a visita como %s', async (status) => {
      const tela = await render(<App visitasIniciais={[{
        id: 'visita-1',
        data: '10/11/2026',
        local: 'Casa da família — Rua das Flores, 10',
        servico: 'Inspeção',
        orientacao: '',
        status: 'Não realizada',
      }]} />);

      await fireEvent.press(tela.getByRole('button', { name: `Marcar visita como ${status}` }));
      if (status === 'Executada') {
        const chamadaConfirmacao = alerta.mock.calls.find(([titulo]) => titulo === 'Deseja concluir a visita?');
        await act(async () => chamadaConfirmacao[2].find((botao) => botao.text === 'Sim').onPress());
      }

      expect(tela.getByText(`Status: ${status}`)).toBeTruthy();
    }
  );

  test('move a visita executada para a lista de concluídas', async () => {
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1',
      data: '10/11/2026',
      local: 'Casa da família — Rua das Flores, 10',
      servico: 'Inspeção',
      status: 'Não realizada',
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Marcar visita como Executada' }));
    const chamadaConfirmacao = alerta.mock.calls.find(([titulo]) => titulo === 'Deseja concluir a visita?');
    await act(async () => chamadaConfirmacao[2].find((botao) => botao.text === 'Sim').onPress());

    expect(tela.getByText('Visitas concluídas')).toBeTruthy();
    expect(tela.getByText('Nenhuma visita programada.')).toBeTruthy();
    expect(tela.getByText('Status: Executada')).toBeTruthy();
    expect(tela.getByText('✓ Visita concluída')).toBeTruthy();
    expect(tela.queryByRole('button', { name: 'Marcar visita como Frustrada' })).toBeNull();
  });

  test.each(['Frustrada', 'Não realizada'])(
    'permite informar o motivo quando a visita fica %s', async (status) => {
      const tela = await render(<App visitasIniciais={[{
        id: 'visita-1',
        data: '10/11/2026',
        local: 'Casa da família — Rua das Flores, 10',
        servico: 'Inspeção',
        status: 'Não realizada',
      }]} />);

      await fireEvent.press(tela.getByRole('button', { name: `Marcar visita como ${status}` }));
      await fireEvent.changeText(tela.getByLabelText('Motivo da visita'), 'Cliente não estava no local.');
      await fireEvent.press(tela.getByRole('button', { name: 'Salvar justificativa' }));

      expect(tela.getByText('Justificativa registrada.')).toBeTruthy();
      expect(tela.getByDisplayValue('Cliente não estava no local.')).toBeTruthy();
    }
  );

  test('pergunta antes de concluir e permite cancelar', async () => {
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1',
      data: '10/11/2026',
      local: 'Casa da família — Rua das Flores, 10',
      servico: 'Inspeção',
      status: 'Pendente',
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Marcar visita como Executada' }));

    const chamadaConfirmacao = alerta.mock.calls.find(([titulo]) => titulo === 'Deseja concluir a visita?');
    expect(chamadaConfirmacao[1]).toBe('A visita será concluída e as quantidades de produtos usadas serão descontadas do estoque.');
    await act(async () => chamadaConfirmacao[2].find((botao) => botao.text === 'Não').onPress());

    expect(tela.getByText('Status: Pendente')).toBeTruthy();
    expect(tela.getByRole('button', { name: 'Marcar visita como Executada' })).toBeTruthy();
  });

  test('visita pendente começa sem status de resultado selecionado', async () => {
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Inspeção', status: 'Pendente',
    }]} />);

    expect(tela.getByRole('button', { name: 'Marcar visita como Frustrada' }).props.accessibilityState).toEqual({ selected: false });
    expect(tela.queryByLabelText('Motivo da visita')).toBeNull();
  });

  test('Estou aqui registra horário e localização simulada', async () => {
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1',
      data: '10/11/2026',
      local: 'Casa da família — Rua das Flores, 10',
      servico: 'Inspeção',
      status: 'Pendente',
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Estou aqui' }));

    await waitFor(() => {
      expect(tela.getByText(/Horário de chegada:/)).toBeTruthy();
      expect(tela.getByText('Endereço da chegada: Rua das Palmeiras, 45 - Asa Norte - Brasília - DF')).toBeTruthy();
    });
    expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
    expect(Location.reverseGeocodeAsync).toHaveBeenCalledWith({ latitude: -15.79, longitude: -47.88 });
    expect(tela.queryByRole('button', { name: 'Estou aqui' })).toBeNull();
  });

  test('registra o horário de saída depois da chegada', async () => {
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Inspeção', status: 'Pendente',
      horarioChegada: '2026-11-06T10:00:00.000Z', latitude: -15.79, longitude: -47.88,
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Registrar saída' }));

    await waitFor(() => expect(tela.getByText(/Horário de saída:/)).toBeTruthy());
    expect(tela.queryByRole('button', { name: 'Registrar saída' })).toBeNull();
  });

  test('exige foto depois antes de registrar saída da aspiração', async () => {
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Aspiração - Liberar o uso', status: 'Pendente',
      horarioChegada: '2026-11-10T10:00:00.000Z', latitude: -15.79, longitude: -47.88,
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Registrar saída' }));

    expect(alerta).toHaveBeenCalledWith('Foto depois obrigatória', 'Anexe a foto depois da aspiração antes de registrar a saída.');
    expect(tela.queryByText(/Horário de saída:/)).toBeNull();
    expect(tela.getByRole('button', { name: 'Registrar saída' })).toBeTruthy();
  });

  test('permite registrar saída da aspiração com foto depois', async () => {
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Aspiração - Liberar o uso', status: 'Pendente',
      horarioChegada: '2026-11-10T10:00:00.000Z', latitude: -15.79, longitude: -47.88, fotoDepois: 'file:///foto-depois.jpg',
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Registrar saída' }));

    await waitFor(() => expect(tela.getByText(/Horário de saída:/)).toBeTruthy());
    expect(alerta).not.toHaveBeenCalled();
  });

  test('avisa quando a permissão de localização é negada', async () => {
    Location.getForegroundPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Inspeção', status: 'Pendente',
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Estou aqui' }));

    const aviso = alerta.mock.calls.find(([titulo]) => titulo === 'Acesso à localização');
    expect(aviso[1]).toBe('Para registrar a chegada, o Pool Day precisa usar o GPS do aparelho.');
    await act(async () => aviso[2].find((botao) => botao.text === 'Continuar').onPress());
    await waitFor(() => expect(alerta).toHaveBeenCalledWith('Permissão necessária', 'Permita o acesso à localização para registrar sua chegada.'));
    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
    expect(tela.getByRole('button', { name: 'Estou aqui' })).toBeTruthy();
  });

  test('avisa quando não consegue obter a localização', async () => {
    Location.getCurrentPositionAsync.mockRejectedValue(new Error('GPS indisponível'));
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Inspeção', status: 'Pendente',
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Estou aqui' }));

    await waitFor(() => expect(alerta).toHaveBeenCalledWith('Localização indisponível', 'Não foi possível obter sua localização. Verifique o GPS e tente novamente.'));
    expect(tela.getByRole('button', { name: 'Estou aqui' })).toBeTruthy();
  });

  test('avisa quando os serviços de localização estão desligados', async () => {
    Location.hasServicesEnabledAsync.mockResolvedValue(false);
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Inspeção', status: 'Pendente',
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Estou aqui' }));

    await waitFor(() => expect(alerta).toHaveBeenCalledWith('Localização desativada', 'Ative o serviço de localização do aparelho e tente novamente.'));
    expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  test('mantém as coordenadas se não encontrar um endereço', async () => {
    Location.reverseGeocodeAsync.mockResolvedValue([]);
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Inspeção', status: 'Pendente',
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Estou aqui' }));

    await waitFor(() => expect(tela.getByText('Endereço da chegada: -15.79, -47.88')).toBeTruthy());
  });

  test('mostra quando uma visita ainda não tem fotos', async () => {
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Inspeção', status: 'Pendente',
    }]} />);

    expect(tela.getByText('Nenhuma foto antes anexada.')).toBeTruthy();
    expect(tela.getByText('Nenhuma foto depois anexada.')).toBeTruthy();
  });

  test('anexa fotos do antes e depois pela galeria', async () => {
    ImagePicker.launchImageLibraryAsync
      .mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'file:///foto-antes.jpg' }] })
      .mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'file:///foto-depois.jpg' }] });
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Inspeção', status: 'Pendente',
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar foto antes' }));
    let escolha = alerta.mock.calls.find(([titulo]) => titulo === 'Foto antes do atendimento');
    await act(async () => escolha[2].find((botao) => botao.text === 'Galeria').onPress());
    await waitFor(() => expect(tela.getByLabelText('Foto antes do atendimento')).toBeTruthy());

    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar foto depois' }));
    escolha = alerta.mock.calls.find(([titulo]) => titulo === 'Foto depois do atendimento');
    await act(async () => escolha[2].find((botao) => botao.text === 'Galeria').onPress());
    await waitFor(() => expect(tela.getByLabelText('Foto depois do atendimento')).toBeTruthy());

    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledTimes(2);
  });

  test('tira foto do atendimento com a câmera', async () => {
    ImagePicker.launchCameraAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///foto-camera.jpg' }] });
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Inspeção', status: 'Pendente',
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar foto antes' }));
    const escolha = alerta.mock.calls.find(([titulo]) => titulo === 'Foto antes do atendimento');
    await act(async () => escolha[2].find((botao) => botao.text === 'Câmera').onPress());

    await waitFor(() => expect(tela.getByLabelText('Foto antes do atendimento')).toBeTruthy());
    expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
    expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
  });

  test('avisa quando a permissão da câmera é negada', async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: false });
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Inspeção', status: 'Pendente',
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar foto antes' }));
    const escolha = alerta.mock.calls.find(([titulo]) => titulo === 'Foto antes do atendimento');
    await act(async () => escolha[2].find((botao) => botao.text === 'Câmera').onPress());

    expect(alerta).toHaveBeenCalledWith('Permissão necessária', 'Permita o acesso à câmera para tirar a foto do atendimento.');
    expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
    expect(tela.getByText('Nenhuma foto antes anexada.')).toBeTruthy();
  });

});
