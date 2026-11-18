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
  getAuth: jest.fn((app) => {
    const auth = { nome: app?.name === 'pool-day-convites' ? 'auth-convite-teste' : 'auth-teste' };
    if (app?.name !== 'pool-day-convites') Object.defineProperty(auth, 'currentUser', {
      value: { getIdToken: jest.fn(async () => 'token-firebase') }, enumerable: false,
    });
    return auth;
  }),
  getReactNativePersistence: jest.fn(() => 'persistencia-nativa'),
  inMemoryPersistence: 'persistencia-em-memoria',
  initializeAuth: jest.fn((app) => {
    const auth = { nome: app.name === 'pool-day-convites' ? 'auth-convite-teste' : 'auth-teste' };
    if (app.name !== 'pool-day-convites') Object.defineProperty(auth, 'currentUser', {
      value: { getIdToken: jest.fn(async () => 'token-firebase') }, enumerable: false,
    });
    return auth;
  }),
  onAuthStateChanged: jest.fn(),
  sendPasswordResetEmail: jest.fn(async () => {}),
  signInWithEmailAndPassword: jest.fn(async (_auth, email) => ({ user: { uid: 'tratador-1', email } })),
  signOut: jest.fn(async () => {}),
}));

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(async () => ({ id: 'produto-novo' })),
  collection: jest.fn((_banco, ...partes) => partes.join('/')),
  doc: jest.fn((_banco, ...partes) => partes.length
    ? partes.join('/')
    : { id: 'empresa-nova', path: 'empresas/empresa-nova' }),
  getDoc: jest.fn(),
  getFirestore: jest.fn((app) => ({ nome: app?.name === 'pool-day-convites' ? 'banco-convites' : 'banco-teste' })),
  onSnapshot: jest.fn((_referencia, aoAtualizar) => {
    aoAtualizar({ docs: [] });
    return jest.fn();
  }),
  runTransaction: jest.fn(async (_banco, callback) => callback({ get: jest.fn(), update: jest.fn() })),
  updateDoc: jest.fn(async () => {}),
  writeBatch: jest.fn(() => ({ set: jest.fn(), commit: jest.fn(async () => {}) })),
}));

function carregarFirebase() {
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'api-teste';
  process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = 'pool-day.test';
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = 'pool-day-teste';
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

  test('obtém o token atual do Firebase Authentication', async () => {
    const { firebase } = carregarFirebase();
    await expect(firebase.obterToken()).resolves.toBe('token-firebase');
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

  test('acompanha os clientes cadastrados da empresa', () => {
    const { firebase, firestore } = carregarFirebase();
    const cliente = { id: 'cliente-1', data: () => ({ nome: 'Casa da família', ativo: true }) };
    firestore.onSnapshot.mockImplementationOnce((_referencia, aoAtualizar) => {
      aoAtualizar({ docs: [cliente] });
      return 'cancelar-observacao';
    });
    const aoAtualizar = jest.fn();

    expect(firebase.observarClientes('empresa-1', aoAtualizar)).toBe('cancelar-observacao');
    expect(firestore.collection).toHaveBeenCalledWith({ nome: 'banco-teste' }, 'empresas', 'empresa-1', 'clientes');
    expect(aoAtualizar).toHaveBeenCalledWith([{ id: 'cliente-1', nome: 'Casa da família', ativo: true }]);
  });

  test('altera o status ativo do cliente no Firestore', async () => {
    const { firebase, firestore } = carregarFirebase();

    await firebase.atualizarClienteAtivo('empresa-1', 'cliente-1', false);

    expect(firestore.updateDoc).toHaveBeenCalledWith('empresas/empresa-1/clientes/cliente-1', { ativo: false });
  });

  test('salva o padrão de tratamento no documento da piscina', async () => {
    const { firebase, firestore } = carregarFirebase();
    const dados = {
      tratamentoPadrao: [{ produto: 'Cloro', quantidade: '120', unidade: 'g' }],
      orientacoesTratamento: 'Seguir o rótulo.',
    };

    await firebase.atualizarTratamentoPadrao('empresa-1', 'piscina-1', dados);

    expect(firestore.updateDoc).toHaveBeenCalledWith('empresas/empresa-1/piscinas/piscina-1', dados);
  });

  test('cadastra e atualiza produtos no estoque da empresa', async () => {
    const { firebase, firestore } = carregarFirebase();
    const dados = { nome: 'Cloro', quantidadeEstoque: 10, unidade: 'kg' };

    await expect(firebase.salvarProduto('empresa-1', dados)).resolves.toMatchObject({ id: 'produto-novo', ...dados });
    await firebase.atualizarProduto('empresa-1', 'produto-novo', { ...dados, quantidadeEstoque: 8 });

    expect(firestore.addDoc).toHaveBeenCalledWith('empresas/empresa-1/produtos', expect.objectContaining(dados));
    expect(firestore.updateDoc).toHaveBeenCalledWith('empresas/empresa-1/produtos/produto-novo', expect.objectContaining({ quantidadeEstoque: 8 }));
  });

  test('baixa os produtos uma única vez e marca a visita como executada', async () => {
    const { firebase, firestore } = carregarFirebase();
    firestore.runTransaction.mockImplementationOnce(async (_banco, callback) => {
      const transacao = {
        get: jest.fn(async (referencia) => referencia.endsWith('/visita-1')
          ? snapshot({ status: 'Pendente', servico: 'Aplicar produtos', produtosAplicados: { cloro: { produto: 'Cloro', quantidade: 2, unidade: 'kg' } } })
          : snapshot({ nome: 'Cloro', quantidadeEstoque: 8, unidade: 'kg', valorUnitarioUltimaCompra: 20 })),
        update: jest.fn(),
      };
      const resultado = await callback(transacao);
      expect(transacao.update).toHaveBeenNthCalledWith(1, 'empresas/empresa-1/produtos/cloro', expect.objectContaining({ quantidadeEstoque: 6 }));
      expect(transacao.update).toHaveBeenNthCalledWith(2, 'empresas/empresa-1/visitas/visita-1', expect.objectContaining({
        status: 'Executada', estoqueBaixado: true, custoTotalProdutos: 40,
        custosProdutos: { cloro: expect.objectContaining({ quantidadeEstoque: 2, unidadeEstoque: 'kg', valorUnitario: 20, custoTotal: 40 }) },
      }));
      return resultado;
    });

    await expect(firebase.concluirVisitaComBaixaEstoque('empresa-1', 'visita-1')).resolves.toEqual(expect.objectContaining({ jaConcluida: false, estoqueBaixado: true, custoTotalProdutos: 40 }));
  });

  test('converte 60 gramas para 0,06 quilograma ao baixar o estoque', async () => {
    const { firebase, firestore } = carregarFirebase();
    firestore.runTransaction.mockImplementationOnce(async (_banco, callback) => {
      const transacao = {
        get: jest.fn(async (referencia) => referencia.endsWith('/visita-1')
          ? snapshot({ status: 'Pendente', servico: 'Aplicar produtos', produtosAplicados: { cloro: { produto: 'Cloro', quantidade: 60, unidade: 'g' } } })
          : snapshot({ nome: 'Cloro', quantidadeEstoque: 10, unidade: 'kg', valorUnitarioUltimaCompra: 200 })),
        update: jest.fn(),
      };
      const resultado = await callback(transacao);
      expect(transacao.update).toHaveBeenNthCalledWith(1, 'empresas/empresa-1/produtos/cloro', expect.objectContaining({
        quantidadeEstoque: 9.94,
        ultimaBaixaQuantidade: 0.06,
      }));
      expect(transacao.update).toHaveBeenNthCalledWith(2, 'empresas/empresa-1/visitas/visita-1', expect.objectContaining({ custoTotalProdutos: 12 }));
      return resultado;
    });

    await expect(firebase.concluirVisitaComBaixaEstoque('empresa-1', 'visita-1')).resolves.toEqual(expect.objectContaining({ jaConcluida: false, estoqueBaixado: true, custoTotalProdutos: 12 }));
  });

  test('calcula o custo de uma pastilha como uma unidade de estoque', async () => {
    const { firebase, firestore } = carregarFirebase();
    firestore.runTransaction.mockImplementationOnce(async (_banco, callback) => {
      const transacao = {
        get: jest.fn(async (referencia) => referencia.endsWith('/visita-1')
          ? snapshot({ status: 'Pendente', servico: 'Aplicar produtos', produtosAplicados: { pastilha: { produto: 'Pastilha de Cloro 5x1', quantidade: 1, unidade: 'UN' } } })
          : snapshot({ nome: 'Pastilha de Cloro 5x1', quantidadeEstoque: 4, unidade: 'UN', valorUnitarioUltimaCompra: 8.67 })),
        update: jest.fn(),
      };
      const resultado = await callback(transacao);
      expect(transacao.update).toHaveBeenNthCalledWith(1, 'empresas/empresa-1/produtos/pastilha', expect.objectContaining({ quantidadeEstoque: 3 }));
      expect(resultado.custosProdutos.pastilha.custoTotal).toBe(8.67);
      expect(resultado.custoTotalProdutos).toBe(8.67);
      return resultado;
    });

    await expect(firebase.concluirVisitaComBaixaEstoque('empresa-1', 'visita-1')).resolves.toEqual(expect.objectContaining({ custoTotalProdutos: 8.67 }));
  });

  test('não conclui visita quando o estoque é insuficiente ou quando já foi concluída', async () => {
    const { firebase, firestore } = carregarFirebase();
    firestore.runTransaction.mockImplementationOnce(async (_banco, callback) => callback({
      get: jest.fn(async (referencia) => referencia.endsWith('/visita-1')
        ? snapshot({ status: 'Pendente', servico: 'Aplicar produtos', produtosAplicados: { cloro: { produto: 'Cloro', quantidade: 2, unidade: 'kg' } } })
        : snapshot({ nome: 'Cloro', quantidadeEstoque: 1, unidade: 'kg', valorUnitarioUltimaCompra: 20 })),
      update: jest.fn(),
    }));
    await expect(firebase.concluirVisitaComBaixaEstoque('empresa-1', 'visita-1')).rejects.toMatchObject({ code: 'estoque-insuficiente' });

    firestore.runTransaction.mockImplementationOnce(async (_banco, callback) => callback({
      get: jest.fn(async () => snapshot({ status: 'Executada', estoqueBaixado: true })),
      update: jest.fn(),
    }));
    await expect(firebase.concluirVisitaComBaixaEstoque('empresa-1', 'visita-1')).resolves.toEqual({
      jaConcluida: true, estoqueBaixado: true, custosProdutos: {}, custoTotalProdutos: 0,
    });
  });

  test('cria cliente novo com status ativo', async () => {
    const { firebase, firestore } = carregarFirebase();

    await firebase.salvarPiscina('empresa-1', 'responsavel-1', {
      cliente: 'Casa da família', endereco: 'Rua das Flores, 10', tipoPiscina: 'Fibra', litragem: 13000,
    });

    const lote = firestore.writeBatch.mock.results[0].value;
    expect(lote.set).toHaveBeenNthCalledWith(1, expect.any(Object), expect.objectContaining({
      nome: 'Casa da família', ativo: true, criadaPorUid: 'responsavel-1',
    }));
    expect(lote.commit).toHaveBeenCalled();
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
