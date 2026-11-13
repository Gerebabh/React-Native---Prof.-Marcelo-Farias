jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(async () => Uint8Array.from({ length: 32 }, (_valor, indice) => indice + 1)),
}));

jest.mock('firebase/app', () => ({
  getApp: jest.fn(() => ({ nome: 'app-teste', name: '[DEFAULT]' })),
  getApps: jest.fn(() => []),
  initializeApp: jest.fn((_configuracao, nome) => ({ nome: nome || 'app-teste', name: nome || '[DEFAULT]' })),
}));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(async (_auth, email) => ({ user: { uid: 'tratador-1', email } })),
  deleteUser: jest.fn(async () => {}),
  getAuth: jest.fn((app) => ({ nome: app?.name === 'pool-day-convites' ? 'auth-convite-teste' : 'auth-teste' })),
  getReactNativePersistence: jest.fn(() => 'persistencia-nativa'),
  inMemoryPersistence: 'persistencia-em-memoria',
  initializeAuth: jest.fn((app) => ({ nome: app.name === 'pool-day-convites' ? 'auth-convite-teste' : 'auth-teste' })),
  onAuthStateChanged: jest.fn(),
  sendPasswordResetEmail: jest.fn(async () => {}),
  signInWithEmailAndPassword: jest.fn(async (_auth, email) => ({ user: { uid: 'tratador-1', email } })),
  signOut: jest.fn(async () => {}),
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((_banco, ...partes) => partes.join('/')),
  doc: jest.fn((_banco, ...partes) => partes.length
    ? partes.join('/')
    : { id: 'empresa-nova', path: 'empresas/empresa-nova' }),
  getDoc: jest.fn(),
  getFirestore: jest.fn((app) => ({ nome: app?.name === 'pool-day-convites' ? 'banco-convites' : 'banco-teste' })),
  writeBatch: jest.fn(() => ({ set: jest.fn(), commit: jest.fn(async () => {}) })),
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
    appSdk: require('firebase/app'),
    firestore: require('firebase/firestore'),
    crypto: require('expo-crypto'),
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
      { nome: 'app-teste', name: '[DEFAULT]' },
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

  test('cria conta em Auth separado, grava o vínculo no Firestore e envia e-mail em português', async () => {
    const { firebase, authSdk, appSdk, firestore, crypto } = carregarFirebase();

    await expect(firebase.convidarTratador('empresa-1', '  Joana Lima  ', ' JOANA@poolday.com ')).resolves.toEqual({
      uid: 'tratador-1', nome: 'Joana Lima', email: 'joana@poolday.com',
    });

    expect(appSdk.initializeApp).toHaveBeenCalledWith(expect.any(Object), 'pool-day-convites');
    expect(authSdk.initializeAuth).toHaveBeenCalledWith(
      { nome: 'pool-day-convites', name: 'pool-day-convites' },
      { persistence: 'persistencia-em-memoria' }
    );
    expect(crypto.getRandomBytesAsync).toHaveBeenCalledWith(32);
    expect(authSdk.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      { nome: 'auth-convite-teste', languageCode: 'pt-BR' }, 'joana@poolday.com', expect.stringMatching(/^[A-Za-z0-9!@#$%*?]{32}$/)
    );
    const lote = firestore.writeBatch.mock.results[0].value;
    expect(lote.set).toHaveBeenNthCalledWith(1, 'usuarios/tratador-1', {
      empresaId: 'empresa-1', nome: 'Joana Lima', email: 'joana@poolday.com',
    });
    expect(lote.set).toHaveBeenNthCalledWith(2, 'empresas/empresa-1/membros/tratador-1', {
      nome: 'Joana Lima', email: 'joana@poolday.com', papel: 'tratador', ativo: true, criadoEm: expect.any(String),
    });
    expect(lote.commit).toHaveBeenCalled();
    expect(authSdk.sendPasswordResetEmail).toHaveBeenCalledWith(
      { nome: 'auth-teste', languageCode: 'pt-BR' }, 'joana@poolday.com'
    );
    expect(authSdk.signOut).toHaveBeenCalledWith({ nome: 'auth-convite-teste', languageCode: 'pt-BR' });
  });

  test('cadastra responsável, empresa e vínculo antes de iniciar a sessão principal', async () => {
    const { firebase, authSdk, firestore } = carregarFirebase();

    await expect(firebase.registrarResponsavel('  Ana Silva  ', ' ANA@POOLDay.com ', 'senha-forte', '  Pool Day Brasília  ')).resolves.toEqual({
      uid: 'tratador-1', email: 'ana@poolday.com',
    });

    expect(authSdk.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      { nome: 'auth-convite-teste', languageCode: 'pt-BR' }, 'ana@poolday.com', 'senha-forte'
    );
    const lote = firestore.writeBatch.mock.results[0].value;
    expect(firestore.writeBatch).toHaveBeenCalledWith({ nome: 'banco-convites' });
    expect(lote.set).toHaveBeenNthCalledWith(1, 'usuarios/tratador-1', {
      empresaId: 'empresa-nova', nome: 'Ana Silva', email: 'ana@poolday.com',
    });
    expect(lote.set).toHaveBeenNthCalledWith(2, { id: 'empresa-nova', path: 'empresas/empresa-nova' }, {
      nome: 'Pool Day Brasília', responsavelUid: 'tratador-1', criadaEm: expect.any(String),
    });
    expect(lote.set).toHaveBeenNthCalledWith(3, 'empresas/empresa-nova/membros/tratador-1', {
      nome: 'Ana Silva', email: 'ana@poolday.com', papel: 'responsavel', ativo: true, criadoEm: expect.any(String),
    });
    expect(lote.commit).toHaveBeenCalled();
    expect(authSdk.signOut).toHaveBeenCalledWith({ nome: 'auth-convite-teste', languageCode: 'pt-BR' });
    expect(authSdk.signInWithEmailAndPassword).toHaveBeenCalledWith(
      { nome: 'auth-teste', languageCode: 'pt-BR' }, 'ana@poolday.com', 'senha-forte'
    );
  });

  test('remove a conta temporária se não conseguir criar empresa e vínculo', async () => {
    const { firebase, authSdk, firestore } = carregarFirebase();
    const erro = Object.assign(new Error('Permissão negada.'), { code: 'permission-denied' });
    firestore.writeBatch.mockReturnValueOnce({ set: jest.fn(), commit: jest.fn(async () => { throw erro; }) });

    await expect(firebase.registrarResponsavel('Ana', 'ana@poolday.com', 'senha-forte', 'Pool Day')).rejects.toBe(erro);
    expect(authSdk.deleteUser).toHaveBeenCalledWith({ uid: 'tratador-1', email: 'ana@poolday.com' });
    expect(authSdk.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test('valida os campos do cadastro antes de criar a conta', async () => {
    const { firebase, authSdk } = carregarFirebase();

    await expect(firebase.registrarResponsavel('', 'email-inválido', '123', '')).rejects.toMatchObject({
      code: 'auth/missing-fields',
    });
    await expect(firebase.registrarResponsavel('Ana', 'email-inválido', 'senha-segura', 'Pool Day')).rejects.toMatchObject({
      code: 'auth/invalid-email',
    });
    await expect(firebase.registrarResponsavel('Ana', 'ana@poolday.com', '123', 'Pool Day')).rejects.toMatchObject({
      code: 'auth/weak-password',
    });
    expect(authSdk.createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test('não grava vínculo nem envia e-mail se o endereço já estiver cadastrado', async () => {
    const { firebase, authSdk, firestore } = carregarFirebase();
    const erro = Object.assign(new Error('E-mail em uso.'), { code: 'auth/email-already-in-use' });
    authSdk.createUserWithEmailAndPassword.mockRejectedValueOnce(erro);

    await expect(firebase.convidarTratador('empresa-1', 'Joana', 'joana@poolday.com')).rejects.toBe(erro);
    expect(firestore.writeBatch).not.toHaveBeenCalled();
    expect(authSdk.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  test('remove a conta do Auth quando o vínculo no Firestore falha', async () => {
    const { firebase, authSdk, firestore } = carregarFirebase();
    const erro = new Error('Falha ao gravar o vínculo.');
    firestore.writeBatch.mockReturnValueOnce({ set: jest.fn(), commit: jest.fn(async () => { throw erro; }) });

    await expect(firebase.convidarTratador('empresa-1', 'Joana', 'joana@poolday.com')).rejects.toBe(erro);
    expect(authSdk.deleteUser).toHaveBeenCalledWith({ uid: 'tratador-1', email: 'joana@poolday.com' });
    expect(authSdk.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  test('marca a conta como criada quando falha somente o envio do e-mail', async () => {
    const { firebase, authSdk, firestore } = carregarFirebase();
    const erro = Object.assign(new Error('E-mail não enviado.'), { code: 'auth/quota-exceeded' });
    authSdk.sendPasswordResetEmail.mockRejectedValueOnce(erro);

    await expect(firebase.convidarTratador('empresa-1', 'Joana', 'joana@poolday.com')).rejects.toMatchObject({
      code: 'auth/quota-exceeded', conviteCriado: true, email: 'joana@poolday.com',
    });
    expect(firestore.writeBatch.mock.results[0].value.commit).toHaveBeenCalled();
    expect(authSdk.deleteUser).not.toHaveBeenCalled();
  });

  test('traduz falhas comuns do login para mensagens em português', () => {
    const { firebase } = carregarFirebase();

    expect(firebase.mensagemErroAutenticacao({ code: 'auth/invalid-credential' })).toBe('E-mail ou senha incorretos.');
    expect(firebase.mensagemErroAutenticacao({ code: 'auth/network-request-failed' })).toMatch(/internet/);
  });
});
