import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import * as Firebase from '../services/firebase';
import Autenticacao from '../components/Autenticacao';

jest.mock('../services/firebase', () => ({
  firebaseConfigurado: true,
  observarEstadoAuth: jest.fn(),
  entrar: jest.fn(),
  sair: jest.fn(),
  enviarRecuperacaoSenha: jest.fn(),
  buscarPerfil: jest.fn(),
  mensagemErroAutenticacao: jest.fn((erro) => erro?.code === 'auth/invalid-credential'
    ? 'E-mail ou senha incorretos.'
    : 'Não foi possível acessar a conta. Tente novamente.'),
}));

describe('autenticação', () => {
  let atualizarUsuario;

  beforeEach(() => {
    jest.clearAllMocks();
    Firebase.observarEstadoAuth.mockImplementation((callback) => {
      atualizarUsuario = callback;
      callback(null);
      return jest.fn();
    });
    Firebase.sair.mockImplementation(async () => {
      atualizarUsuario(null);
    });
  });

  function renderizarApp() {
    return render(
      <Autenticacao>
        {({ usuario, perfil, aoSair }) => (
          <>
            <Text>{`Olá ${perfil.nome || usuario.email} (${perfil.papel})`}</Text>
            <Text>{perfil.nomeEmpresa}</Text>
            <TestarSair aoSair={aoSair} />
          </>
        )}
      </Autenticacao>
    );
  }

  async function pressionar(tela, nome) {
    await act(async () => {
      await fireEvent.press(tela.getByRole('button', { name: nome }));
    });
  }

  test('mostra a entrada quando não há uma sessão ativa', async () => {
    const tela = renderizarApp();

    await waitFor(() => expect(tela.getByText('Acesse o Pool Day')).toBeTruthy());
    expect(tela.queryByText(/Olá /)).toBeNull();
  });

  test('restaura a sessão que o Firebase já mantém ativa', async () => {
    Firebase.observarEstadoAuth.mockImplementation((callback) => {
      atualizarUsuario = callback;
      callback({ uid: 'usuario-salvo', email: 'ana@poolday.com' });
      return jest.fn();
    });
    Firebase.buscarPerfil.mockResolvedValue({
      empresaId: 'empresa-1', nome: 'Ana', papel: 'responsavel', nomeEmpresa: 'Pool Day Brasília',
    });

    const tela = renderizarApp();

    await waitFor(() => expect(tela.getByText('Olá Ana (responsavel)')).toBeTruthy());
    expect(Firebase.entrar).not.toHaveBeenCalled();
  });

  test('abre o app após entrar e carregar o perfil ligado à empresa', async () => {
    Firebase.entrar.mockResolvedValue({ uid: 'usuario-1', email: 'tratador@poolday.com' });
    Firebase.buscarPerfil.mockResolvedValue({
      empresaId: 'empresa-1',
      nome: 'Ana',
      papel: 'tratador',
      nomeEmpresa: 'Pool Day Brasília',
    });
    const tela = renderizarApp();

    await fireEvent.changeText(tela.getByLabelText('E-mail'), 'tratador@poolday.com');
    await fireEvent.changeText(tela.getByLabelText('Senha'), 'senha-segura');
    await pressionar(tela, 'Entrar');
    await act(async () => {
      atualizarUsuario({ uid: 'usuario-1', email: 'tratador@poolday.com' });
      await Promise.resolve();
    });

    await waitFor(() => expect(tela.getByText('Olá Ana (tratador)')).toBeTruthy());
    expect(tela.getByText('Pool Day Brasília')).toBeTruthy();
    expect(Firebase.entrar).toHaveBeenCalledWith('tratador@poolday.com', 'senha-segura');
    expect(Firebase.buscarPerfil).toHaveBeenCalledWith('usuario-1');
  });

  test('mostra uma mensagem amigável quando o login falha', async () => {
    Firebase.entrar.mockRejectedValue({ code: 'auth/invalid-credential' });
    const tela = renderizarApp();

    await fireEvent.changeText(tela.getByLabelText('E-mail'), 'erro@poolday.com');
    await fireEvent.changeText(tela.getByLabelText('Senha'), 'senha-errada');
    await pressionar(tela, 'Entrar');

    await waitFor(() => expect(tela.getByText('E-mail ou senha incorretos.')).toBeTruthy());
  });

  test('valida o e-mail e a senha antes de chamar o Firebase', async () => {
    const tela = renderizarApp();

    await pressionar(tela, 'Entrar');

    expect(tela.getByText('Informe seu e-mail e sua senha.')).toBeTruthy();
    expect(Firebase.entrar).not.toHaveBeenCalled();
  });

  test('não abre o app quando o usuário não tem perfil ativo ligado a uma empresa', async () => {
    Firebase.entrar.mockResolvedValue({ uid: 'usuario-sem-perfil', email: 'sem@poolday.com' });
    Firebase.buscarPerfil.mockResolvedValue(null);
    const tela = renderizarApp();

    await fireEvent.changeText(tela.getByLabelText('E-mail'), 'sem@poolday.com');
    await fireEvent.changeText(tela.getByLabelText('Senha'), 'senha-segura');
    await pressionar(tela, 'Entrar');
    await act(async () => {
      atualizarUsuario({ uid: 'usuario-sem-perfil', email: 'sem@poolday.com' });
      await Promise.resolve();
    });

    await waitFor(() => expect(tela.getByText('Esta conta ainda não está vinculada a uma empresa ativa. Fale com o responsável.')).toBeTruthy());
    expect(Firebase.sair).toHaveBeenCalled();
  });

  test('envia o pedido de recuperação de senha', async () => {
    const tela = renderizarApp();
    await pressionar(tela, 'Esqueci minha senha');
    await fireEvent.changeText(tela.getByLabelText('E-mail para recuperação'), 'ana@poolday.com');
    await pressionar(tela, 'Enviar instruções');

    await waitFor(() => expect(Firebase.enviarRecuperacaoSenha).toHaveBeenCalledWith('ana@poolday.com'));
  });

  test('encerra a sessão e volta para a tela de entrada', async () => {
    Firebase.entrar.mockResolvedValue({ uid: 'usuario-1', email: 'tratador@poolday.com' });
    Firebase.buscarPerfil.mockResolvedValue({
      empresaId: 'empresa-1', nome: 'Ana', papel: 'tratador', nomeEmpresa: 'Pool Day Brasília',
    });
    const tela = renderizarApp();

    await fireEvent.changeText(tela.getByLabelText('E-mail'), 'tratador@poolday.com');
    await fireEvent.changeText(tela.getByLabelText('Senha'), 'senha-segura');
    await pressionar(tela, 'Entrar');
    await act(async () => {
      atualizarUsuario({ uid: 'usuario-1', email: 'tratador@poolday.com' });
      await Promise.resolve();
    });
    await waitFor(() => expect(tela.getByText('Olá Ana (tratador)')).toBeTruthy());
    await pressionar(tela, 'Sair da conta');

    await waitFor(() => expect(tela.getByText('Acesse o Pool Day')).toBeTruthy());
    expect(Firebase.sair).toHaveBeenCalled();
  });
});

function TestarSair({ aoSair }) {
  return (
    <Pressable accessibilityRole="button" onPress={aoSair}>
      <Text>Sair da conta</Text>
    </Pressable>
  );
}
