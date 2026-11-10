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
import { doc, getDoc, getFirestore } from 'firebase/firestore';

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
