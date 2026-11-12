jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));

jest.mock('firebase/app', () => ({
  getApp: jest.fn(() => ({ nome: 'app-teste' })),
  getApps: jest.fn(() => []),
  initializeApp: jest.fn(() => ({ nome: 'app-teste' })),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ nome: 'auth-teste' })),
  getReactNativePersistence: jest.fn(() => 'persistencia-nativa'),
  initializeAuth: jest.fn(() => ({ nome: 'auth-teste' })),
  onAuthStateChanged: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn((_banco, ...partes) => partes.join('/')),
  getDoc: jest.fn(),
  getFirestore: jest.fn(() => ({ nome: 'banco-teste' })),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({ nome: 'funcoes-teste' })),
  httpsCallable: jest.fn(() => jest.fn(async () => ({ data: { uid: 'tratador-1', email: 'tratador@poolday.com' } }))),
}));

function carregarFirebase() {
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'api-teste';
  process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = 'pool-day.test';
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = 'pool-day-teste';
  process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = 'pool-day-teste.firebasestorage.app';
  process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123';
  process.env.EXPO_PUBLIC_FIREBASE_APP_ID = 'app-teste';
  jest.resetModules();

  return {
    firebase: require('../services/firebase'),
    authSdk: require('firebase/auth'),
    firestore: require('firebase/firestore'),
    functions: require('firebase/functions'),
    storage: require('@react-native-async-storage/async-storage').default,
  };
}

function snapshot(dados) {
  return { exists: () => Boolean(dados), data: () => dados };
}

describe('serviço Firebase', () => {
  test('configura a sessão para continuar salva no aparelho', () => {
    const { firebase, authSdk, storage } = carregarFirebase();

    expect(firebase.firebaseConfigurado).toBe(true);
    expect(authSdk.getReactNativePersistence).toHaveBeenCalledWith(storage);
    expect(authSdk.initializeAuth).toHaveBeenCalledWith(
      { nome: 'app-teste' },
      { persistence: 'persistencia-nativa' }
    );
  });

  test('localiza o perfil, o papel e a empresa pelo usuário autenticado', async () => {
    const { firebase, firestore } = carregarFirebase();
    firestore.getDoc
      .mockResolvedValueOnce(snapshot({ empresaId: 'empresa-1', nome: 'Ana', email: 'ana@poolday.com' }))
      .mockResolvedValueOnce(snapshot({ papel: 'tratador', ativo: true }))
      .mockResolvedValueOnce(snapshot({ nome: 'Pool Day Brasília' }));

    await expect(firebase.buscarPerfil('uid-ana')).resolves.toEqual({
      empresaId: 'empresa-1',
      nome: 'Ana',
      email: 'ana@poolday.com',
      papel: 'tratador',
      nomeEmpresa: 'Pool Day Brasília',
    });
    expect(firestore.doc).toHaveBeenNthCalledWith(1, { nome: 'banco-teste' }, 'usuarios', 'uid-ana');
    expect(firestore.doc).toHaveBeenNthCalledWith(2, { nome: 'banco-teste' }, 'empresas', 'empresa-1', 'membros', 'uid-ana');
  });

  test('recusa perfil sem membro ativo na empresa', async () => {
    const { firebase, firestore } = carregarFirebase();
    firestore.getDoc
      .mockResolvedValueOnce(snapshot({ empresaId: 'empresa-1', nome: 'Ana' }))
      .mockResolvedValueOnce(snapshot({ papel: 'tratador', ativo: false }));

    await expect(firebase.buscarPerfil('uid-ana')).resolves.toBeNull();
    expect(firestore.getDoc).toHaveBeenCalledTimes(2);
  });

  test('cria convite pelo backend e envia e-mail para definir a senha', async () => {
    const { firebase, authSdk, functions } = carregarFirebase();

    await expect(firebase.convidarTratador('Joana', 'joana@poolday.com')).resolves.toEqual({
      uid: 'tratador-1', email: 'tratador@poolday.com',
    });
    expect(functions.httpsCallable).toHaveBeenCalledWith({ nome: 'funcoes-teste' }, 'convidarTratador');
    expect(authSdk.sendPasswordResetEmail).toHaveBeenCalledWith({ nome: 'auth-teste' }, 'tratador@poolday.com');
  });

  test('traduz falhas comuns do login para mensagens em português', () => {
    const { firebase } = carregarFirebase();

    expect(firebase.mensagemErroAutenticacao({ code: 'auth/invalid-credential' })).toBe('E-mail ou senha incorretos.');
    expect(firebase.mensagemErroAutenticacao({ code: 'auth/network-request-failed' })).toMatch(/internet/);
  });
});
