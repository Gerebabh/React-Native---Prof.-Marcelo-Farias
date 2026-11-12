import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
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
import { getFunctions, httpsCallable } from 'firebase/functions';

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
let banco = null;
let funcoes = null;

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

  banco = getFirestore(aplicativo);
  funcoes = getFunctions(aplicativo, 'southamerica-east1');
}

function verificarConfiguracao() {
  if (!firebaseConfigurado || !auth || !banco) {
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

export async function convidarTratador(nome, email) {
  verificarConfiguracao();
  const resultado = await httpsCallable(funcoes, 'convidarTratador')({ nome, email });

  try {
    await sendPasswordResetEmail(auth, resultado.data.email);
  } catch (erro) {
    erro.conviteCriado = true;
    throw erro;
  }

  return resultado.data;
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
