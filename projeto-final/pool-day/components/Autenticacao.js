import { cores } from '../styles/colors';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  buscarPerfil,
  entrar,
  enviarRecuperacaoSenha,
  firebaseConfigurado,
  mensagemErroAutenticacao,
  observarEstadoAuth,
  sair,
} from '../services/firebase';

export default function Autenticacao({ children }) {
  const [estado, setEstado] = useState('carregando');
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [erroAcesso, setErroAcesso] = useState('');
  const [carregandoLogin, setCarregandoLogin] = useState(false);

  useEffect(() => {
    if (!firebaseConfigurado) {
      setEstado('desconectado');
      setErroAcesso(mensagemErroAutenticacao({ code: 'firebase/configuration-not-found' }));
      return undefined;
    }

    let ativo = true;
    const cancelarObservacao = observarEstadoAuth(async (usuarioAtual) => {
      if (!ativo) return;

      if (!usuarioAtual) {
        setUsuario(null);
        setPerfil(null);
        setEstado('desconectado');
        return;
      }

      setEstado('carregando-perfil');

      try {
        const perfilAtual = await buscarPerfil(usuarioAtual.uid);
        if (!ativo) return;

        if (!perfilAtual) {
          setErroAcesso('Esta conta ainda não está vinculada a uma empresa ativa. Fale com o responsável.');
          await sair();
          return;
        }

        setUsuario(usuarioAtual);
        setPerfil(perfilAtual);
        setErroAcesso('');
        setEstado('autenticado');
      } catch (erro) {
        if (!ativo) return;
        setErroAcesso(mensagemErroAutenticacao(erro));
        try {
          await sair();
        } catch (_erro) {
          setEstado('desconectado');
        }
      }
    });

    return () => {
      ativo = false;
      cancelarObservacao?.();
    };
  }, []);

  async function fazerLogin(email, senha) {
    if (!email.trim() || !senha) {
      setErroAcesso('Informe seu e-mail e sua senha.');
      return;
    }

    setErroAcesso('');
    setCarregandoLogin(true);

    try {
      await entrar(email.trim(), senha);
    } catch (erro) {
      setErroAcesso(mensagemErroAutenticacao(erro));
    } finally {
      setCarregandoLogin(false);
    }
  }

  async function recuperarSenha(email) {
    try {
      await enviarRecuperacaoSenha(email.trim());
      Alert.alert('Confira seu e-mail', 'Se houver uma conta com esse endereço, enviaremos as instruções para trocar a senha.');
      return true;
    } catch (erro) {
      return mensagemErroAutenticacao(erro);
    }
  }

  async function fazerLogout() {
    try {
      await sair();
    } catch (erro) {
      Alert.alert('Não foi possível sair', mensagemErroAutenticacao(erro));
    }
  }

  if (estado === 'carregando' || estado === 'carregando-perfil') {
    return (
      <SafeAreaView style={styles.areaCarregando}>
        <ActivityIndicator size="large" color={cores.azulPiscina} />
        <Text style={styles.textoCarregando}>Conferindo acesso...</Text>
      </SafeAreaView>
    );
  }

  if (estado === 'autenticado') {
    return children({ usuario, perfil, aoSair: fazerLogout });
  }

  return (
    <TelaLogin
      erro={erroAcesso}
      firebaseAtivo={firebaseConfigurado}
      carregando={carregandoLogin}
      onEntrar={fazerLogin}
      onRecuperarSenha={recuperarSenha}
    />
  );
}

function TelaLogin({ erro, firebaseAtivo, carregando, onEntrar, onRecuperarSenha }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarRecuperacao, setMostrarRecuperacao] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState('');
  const [erroRecuperacao, setErroRecuperacao] = useState('');
  const [enviandoRecuperacao, setEnviandoRecuperacao] = useState(false);

  async function enviarRecuperacao() {
    if (!emailRecuperacao.trim()) {
      setErroRecuperacao('Informe o e-mail da sua conta.');
      return;
    }

    setEnviandoRecuperacao(true);
    setErroRecuperacao('');
    const resultado = await onRecuperarSenha(emailRecuperacao);
    setEnviandoRecuperacao(false);

    if (resultado === true) {
      setMostrarRecuperacao(false);
      setEmailRecuperacao('');
    } else {
      setErroRecuperacao(resultado);
    }
  }

  return (
    <SafeAreaView style={styles.areaLogin}>
      <ImageBackground
        source={require('../assets/login-poolday-fundo.jpg')}
        resizeMode="cover"
        style={styles.fundo}
      >
        <StatusBar style="light" />
        <View style={styles.sobreposicao} />
        <KeyboardAvoidingView style={styles.teclado} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.conteudoLogin} keyboardShouldPersistTaps="handled">
            <View style={styles.cartaoLogin}>
              <Image source={require('../assets/logo-poolday.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="Logo Pool Day" />
              <Text style={styles.tituloLogin}>Acesse o Pool Day</Text>
              <Text style={styles.subtituloLogin}>Entre com a conta da sua empresa.</Text>

              <TextInput
                accessibilityLabel="E-mail"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="E-mail"
                style={styles.campoLogin}
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                accessibilityLabel="Senha"
                autoCapitalize="none"
                autoComplete="current-password"
                placeholder="Senha"
                secureTextEntry={!mostrarSenha}
                style={styles.campoLogin}
                value={senha}
                onChangeText={setSenha}
              />
              <Pressable accessibilityRole="button" onPress={() => setMostrarSenha((visivel) => !visivel)} style={styles.linkSenha}>
                <Text style={styles.textoLink}>{mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}</Text>
              </Pressable>

              {!!erro && <Text accessibilityRole="alert" style={styles.erro}>{erro}</Text>}

              <Pressable
                accessibilityRole="button"
                disabled={!firebaseAtivo || carregando}
                onPress={() => onEntrar(email, senha)}
                style={({ pressed }) => [styles.botaoEntrar, (!firebaseAtivo || carregando) && styles.botaoDesativado, pressed && styles.botaoPressionado]}
              >
                <Text style={styles.textoBotao}>{carregando ? 'Entrando...' : 'Entrar'}</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={!firebaseAtivo || carregando}
                onPress={() => { setEmailRecuperacao(email); setMostrarRecuperacao(true); }}
                style={styles.linkRecuperacao}
              >
                <Text style={styles.textoLink}>Esqueci minha senha</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>

      <Modal visible={mostrarRecuperacao} transparent animationType="fade" onRequestClose={() => setMostrarRecuperacao(false)}>
        <View style={styles.fundoModal}>
          <View style={styles.cartaoModal}>
            <Text style={styles.tituloModal}>Recuperar senha</Text>
            <Text style={styles.subtituloModal}>Vamos enviar as instruções para o e-mail da sua conta.</Text>
            <TextInput
              accessibilityLabel="E-mail para recuperação"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="E-mail"
              style={styles.campoLogin}
              value={emailRecuperacao}
              onChangeText={setEmailRecuperacao}
            />
            {!!erroRecuperacao && <Text accessibilityRole="alert" style={styles.erro}>{erroRecuperacao}</Text>}
            <Pressable accessibilityRole="button" disabled={enviandoRecuperacao} onPress={enviarRecuperacao} style={styles.botaoEntrar}>
              <Text style={styles.textoBotao}>{enviandoRecuperacao ? 'Enviando...' : 'Enviar instruções'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setMostrarRecuperacao(false)} style={styles.linkRecuperacao}>
              <Text style={styles.textoLink}>Voltar para o login</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  areaCarregando: { alignItems: 'center', backgroundColor: cores.fundoTela, flex: 1, justifyContent: 'center' },
  textoCarregando: { color: cores.azulEscuro, fontSize: 15, marginTop: 12 },
  areaLogin: { backgroundColor: cores.azulEscuro, flex: 1 },
  fundo: { flex: 1, justifyContent: 'center' },
  sobreposicao: { ...StyleSheet.absoluteFillObject, backgroundColor: cores.sobreposicaoLogin },
  teclado: { flex: 1, justifyContent: 'center' },
  conteudoLogin: { flexGrow: 1, justifyContent: 'center', padding: 22 },
  cartaoLogin: { alignSelf: 'center', backgroundColor: cores.cartaoLogin, borderRadius: 20, maxWidth: 430, padding: 24, width: '100%' },
  logo: { alignSelf: 'center', height: 170, marginBottom: 8, width: 220 },
  tituloLogin: { color: cores.azulEscuro, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  subtituloLogin: { color: cores.textoSecundario, fontSize: 14, marginBottom: 20, marginTop: 6, textAlign: 'center' },
  campoLogin: { backgroundColor: cores.fundoCartao, borderColor: cores.borda, borderRadius: 9, borderWidth: 1, color: cores.texto, fontSize: 16, marginTop: 10, paddingHorizontal: 13, paddingVertical: 12 },
  linkSenha: { alignSelf: 'flex-end', paddingVertical: 8 },
  textoLink: { color: cores.azulPiscina, fontSize: 14, fontWeight: '600' },
  erro: { color: cores.vermelho, fontSize: 14, marginTop: 10 },
  botaoEntrar: { alignItems: 'center', backgroundColor: cores.azulPiscina, borderRadius: 9, marginTop: 12, padding: 14 },
  botaoDesativado: { opacity: 0.55 },
  botaoPressionado: { opacity: 0.8 },
  textoBotao: { color: cores.branco, fontSize: 16, fontWeight: '700' },
  linkRecuperacao: { alignItems: 'center', padding: 14 },
  fundoModal: { alignItems: 'center', backgroundColor: cores.fundoModal, flex: 1, justifyContent: 'center', padding: 22 },
  cartaoModal: { backgroundColor: cores.branco, borderRadius: 16, maxWidth: 430, padding: 22, width: '100%' },
  tituloModal: { color: cores.azulEscuro, fontSize: 20, fontWeight: '700' },
  subtituloModal: { color: cores.textoSecundario, fontSize: 14, marginTop: 6 },
});
