import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRandomBytesAsync } from 'expo-crypto';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  getReactNativePersistence,
  inMemoryPersistence,
  initializeAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

const configuracao = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigurado = Boolean(configuracao.apiKey && configuracao.projectId && configuracao.appId);

let auth = null;
let authConvites = null;
let banco = null;
let bancoConvites = null;

if (firebaseConfigurado) {
  const aplicativo = getApps().length ? getApp() : initializeApp(configuracao);

  try {
    auth = initializeAuth(aplicativo, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (erro) {
    if (erro.code !== 'auth/already-initialized') throw erro;
    auth = getAuth(aplicativo);
  }

  auth.languageCode = 'pt-BR';

  const aplicativoConvites = getApps().find((item) => item.name === 'pool-day-convites')
    || initializeApp(configuracao, 'pool-day-convites');
  try {
    authConvites = initializeAuth(aplicativoConvites, { persistence: inMemoryPersistence });
  } catch (erro) {
    if (erro.code !== 'auth/already-initialized') throw erro;
    authConvites = getAuth(aplicativoConvites);
  }
  authConvites.languageCode = 'pt-BR';

  banco = getFirestore(aplicativo);
  bancoConvites = getFirestore(aplicativoConvites);
}

function verificarConfiguracao() {
  if (!firebaseConfigurado || !auth || !authConvites || !banco || !bancoConvites) {
    const erro = new Error('Configure o Firebase antes de usar a autenticação.');
    erro.code = 'firebase/configuration-not-found';
    throw erro;
  }
}

export function observarEstadoAuth(callback) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

export async function entrar(email, senha) {
  verificarConfiguracao();
  const resultado = await signInWithEmailAndPassword(auth, email, senha);
  return resultado.user;
}

export async function sair() {
  verificarConfiguracao();
  await signOut(auth);
}

export async function enviarRecuperacaoSenha(email) {
  verificarConfiguracao();
  await sendPasswordResetEmail(auth, email);
}

export async function registrarResponsavel(nome, email, senha, nomeEmpresa) {
  verificarConfiguracao();
  const nomeResponsavel = typeof nome === 'string' ? nome.trim() : '';
  const emailResponsavel = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const senhaResponsavel = typeof senha === 'string' ? senha : '';
  const empresa = typeof nomeEmpresa === 'string' ? nomeEmpresa.trim() : '';

  if (!nomeResponsavel || !emailResponsavel || !senhaResponsavel || !empresa) {
    const erro = new Error('Preencha todos os campos para criar sua conta e empresa.');
    erro.code = 'auth/missing-fields';
    throw erro;
  }

  if (!/^\S+@\S+\.\S+$/.test(emailResponsavel)) {
    const erro = new Error('Informe um e-mail válido.');
    erro.code = 'auth/invalid-email';
    throw erro;
  }

  if (nomeResponsavel.length > 100 || empresa.length > 100 || emailResponsavel.length > 254) {
    const erro = new Error('Confira o tamanho do nome, do e-mail e do nome da empresa.');
    erro.code = 'auth/invalid-argument';
    throw erro;
  }

  if (senhaResponsavel.length < 6) {
    const erro = new Error('A senha precisa ter pelo menos 6 caracteres.');
    erro.code = 'auth/weak-password';
    throw erro;
  }

  let usuarioCriado = null;

  try {
    const resultado = await createUserWithEmailAndPassword(authConvites, emailResponsavel, senhaResponsavel);
    usuarioCriado = resultado.user;

    try {
      const empresaRef = doc(collection(bancoConvites, 'empresas'));
      const empresaId = empresaRef.id;
      const dataCriacao = new Date().toISOString();
      const lote = writeBatch(bancoConvites);

      lote.set(doc(bancoConvites, 'usuarios', usuarioCriado.uid), {
        empresaId,
        nome: nomeResponsavel,
        email: emailResponsavel,
      });
      lote.set(empresaRef, {
        nome: empresa,
        responsavelUid: usuarioCriado.uid,
        criadaEm: dataCriacao,
      });
      lote.set(doc(bancoConvites, 'empresas', empresaId, 'membros', usuarioCriado.uid), {
        nome: nomeResponsavel,
        email: emailResponsavel,
        papel: 'responsavel',
        ativo: true,
        criadoEm: dataCriacao,
      });

      await lote.commit();
    } catch (erro) {
      try {
        await deleteUser(usuarioCriado);
      } catch (_erroAoRemoverConta) {
        erro.contaSemVinculo = true;
        erro.email = emailResponsavel;
      }
      throw erro;
    }

    try {
      await signOut(authConvites);
      const sessao = await signInWithEmailAndPassword(auth, emailResponsavel, senhaResponsavel);
      return sessao.user;
    } catch (erro) {
      erro.cadastroConcluido = true;
      erro.email = emailResponsavel;
      throw erro;
    }
  } finally {
    if (usuarioCriado) {
      try {
        await signOut(authConvites);
      } catch (_erroAoEncerrarSessaoTemporaria) {
        // A sessão temporária só é usada para concluir o cadastro sem trocar o login atual.
      }
    }
  }
}

async function gerarSenhaTemporaria() {
  const bytes = await getRandomBytesAsync(32);
  const minusculas = 'abcdefghijklmnopqrstuvwxyz';
  const maiusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numeros = '0123456789';
  const simbolos = '!@#$%*?';
  const todos = minusculas + maiusculas + numeros + simbolos;
  const senha = [
    minusculas[bytes[0] % minusculas.length],
    maiusculas[bytes[1] % maiusculas.length],
    numeros[bytes[2] % numeros.length],
    simbolos[bytes[3] % simbolos.length],
  ];

  for (let indice = 4; indice < bytes.length; indice += 1) {
    senha.push(todos[bytes[indice] % todos.length]);
  }

  return senha.join('');
}

export async function convidarTratador(empresaId, nome, email) {
  verificarConfiguracao();
  const nomeTratador = typeof nome === 'string' ? nome.trim() : '';
  const emailTratador = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!empresaId || !nomeTratador || !/^\S+@\S+\.\S+$/.test(emailTratador)) {
    const erro = new Error('Informe o nome, o e-mail e a empresa do tratador.');
    erro.code = 'auth/invalid-email';
    throw erro;
  }

  const senhaTemporaria = await gerarSenhaTemporaria();
  let usuarioCriado = null;

  try {
    const resultado = await createUserWithEmailAndPassword(authConvites, emailTratador, senhaTemporaria);
    usuarioCriado = resultado.user;

    try {
      const lote = writeBatch(banco);
      lote.set(doc(banco, 'usuarios', usuarioCriado.uid), {
        empresaId,
        nome: nomeTratador,
        email: emailTratador,
      });
      lote.set(doc(banco, 'empresas', empresaId, 'membros', usuarioCriado.uid), {
        nome: nomeTratador,
        email: emailTratador,
        papel: 'tratador',
        ativo: true,
        criadoEm: new Date().toISOString(),
      });
      await lote.commit();
    } catch (erro) {
      try {
        await deleteUser(usuarioCriado);
      } catch (_erroAoRemoverConta) {
        erro.contaSemVinculo = true;
        erro.email = emailTratador;
      }
      throw erro;
    }

    try {
      await sendPasswordResetEmail(auth, emailTratador);
    } catch (erro) {
      erro.conviteCriado = true;
      erro.email = emailTratador;
      throw erro;
    }

    return { uid: usuarioCriado.uid, nome: nomeTratador, email: emailTratador };
  } finally {
    if (usuarioCriado) {
      try {
        await signOut(authConvites);
      } catch (_erroAoEncerrarSessaoConvite) {
        // A conta convidada usa uma sessão separada e temporária.
      }
    }
  }
}

export function observarTratadores(empresaId, aoAtualizar, aoErro) {
  verificarConfiguracao();
  const referencia = query(
    collection(banco, 'empresas', empresaId, 'membros'),
    where('papel', '==', 'tratador')
  );
  return onSnapshot(referencia, (snapshot) => {
    aoAtualizar(snapshot.docs
      .map((documento) => ({ id: documento.id, ...documento.data() }))
      .filter((membro) => membro.ativo === true));
  }, aoErro);
}

export function observarPiscinas(empresaId, aoAtualizar, aoErro) {
  verificarConfiguracao();
  const referencia = collection(banco, 'empresas', empresaId, 'piscinas');
  return onSnapshot(referencia, (snapshot) => {
    aoAtualizar(snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() })));
  }, aoErro);
}

export function observarVisitas(empresaId, usuarioId, papel, aoAtualizar, aoErro) {
  verificarConfiguracao();
  const referencia = collection(banco, 'empresas', empresaId, 'visitas');
  const consulta = papel === 'tratador'
    ? query(referencia, where('tratadorUid', '==', usuarioId))
    : referencia;
  return onSnapshot(consulta, (snapshot) => {
    aoAtualizar(snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() })));
  }, aoErro);
}

export async function salvarPiscina(empresaId, usuarioId, dados) {
  verificarConfiguracao();
  const lote = writeBatch(banco);
  const cliente = doc(collection(banco, 'empresas', empresaId, 'clientes'));
  const local = doc(collection(banco, 'empresas', empresaId, 'locais'));
  const piscina = doc(collection(banco, 'empresas', empresaId, 'piscinas'));

  lote.set(cliente, {
    nome: dados.cliente,
    criadaPorUid: usuarioId,
    criadaEm: new Date().toISOString(),
  });
  lote.set(local, {
    clienteId: cliente.id,
    cliente: dados.cliente,
    endereco: dados.endereco,
    criadaPorUid: usuarioId,
  });
  lote.set(piscina, {
    localId: local.id,
    clienteId: cliente.id,
    cliente: dados.cliente,
    endereco: dados.endereco,
    tipoPiscina: dados.tipoPiscina,
    litragem: dados.litragem,
    criadaPorUid: usuarioId,
  });

  await lote.commit();
  return { id: piscina.id, localId: local.id, clienteId: cliente.id, ...dados };
}

export async function salvarVisita(empresaId, dados) {
  verificarConfiguracao();
  const referencia = await addDoc(collection(banco, 'empresas', empresaId, 'visitas'), dados);
  return referencia.id;
}

export async function atualizarVisita(empresaId, visitaId, dados) {
  verificarConfiguracao();
  await updateDoc(doc(banco, 'empresas', empresaId, 'visitas', visitaId), dados);
}

export async function buscarPerfil(usuarioId) {
  verificarConfiguracao();
  const perfilSnapshot = await getDoc(doc(banco, 'usuarios', usuarioId));

  if (!perfilSnapshot.exists()) return null;

  const perfil = perfilSnapshot.data();
  if (!perfil.empresaId) return null;

  const membroSnapshot = await getDoc(doc(banco, 'empresas', perfil.empresaId, 'membros', usuarioId));
  if (!membroSnapshot.exists()) return null;

  const membro = membroSnapshot.data();
  if (!membro.ativo || !['responsavel', 'tratador'].includes(membro.papel)) return null;

  const empresaSnapshot = await getDoc(doc(banco, 'empresas', perfil.empresaId));
  if (!empresaSnapshot.exists()) return null;
  const empresa = empresaSnapshot.data();

  return {
    empresaId: perfil.empresaId,
    nome: perfil.nome || '',
    email: perfil.email || '',
    papel: membro.papel,
    nomeEmpresa: empresa.nome || '',
  };
}

export function mensagemErroAutenticacao(erro) {
  const mensagens = {
    'firebase/configuration-not-found': 'A autenticação ainda não foi configurada. Confira as instruções do projeto.',
    'auth/invalid-email': 'Informe um e-mail válido.',
    'auth/missing-fields': 'Preencha todos os campos para criar sua conta e empresa.',
    'auth/invalid-argument': 'Confira o tamanho do nome, do e-mail e do nome da empresa.',
    'auth/email-already-in-use': 'Este e-mail já está cadastrado. Tente entrar ou recuperar a senha.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/user-not-found': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/user-disabled': 'Esta conta está desativada. Fale com o responsável.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
    'auth/network-request-failed': 'Sem conexão com a internet. Verifique a rede e tente novamente.',
    'auth/operation-not-allowed': 'O acesso por e-mail e senha ainda não está habilitado no Firebase.',
    'permission-denied': 'Não foi possível carregar o perfil da empresa. Verifique as regras do Firestore.',
  };

  return mensagens[erro?.code] || 'Não foi possível acessar a conta. Tente novamente.';
}
