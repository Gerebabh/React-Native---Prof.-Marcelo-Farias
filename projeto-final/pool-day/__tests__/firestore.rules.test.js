/** @jest-environment node */

global.fetch = require('node-fetch');

const fs = require('node:fs');
const path = require('node:path');
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');
const {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} = require('firebase/firestore');

const empresaA = 'empresa-a';
const empresaB = 'empresa-b';
const usuarioResponsavelA = 'responsavel-a';
const usuarioTratadorA = 'tratador-a';
const usuarioTratadorA2 = 'tratador-a2';
const usuarioResponsavelB = 'responsavel-b';
let ambiente;

function caminhoEmpresa(empresaId, colecao, documentoId) {
  return `empresas/${empresaId}/${colecao}/${documentoId}`;
}

function firestoreDo(usuarioId) {
  return ambiente.authenticatedContext(usuarioId).firestore();
}

async function prepararDocumentos() {
  await ambiente.withSecurityRulesDisabled(async (contexto) => {
    const banco = contexto.firestore();
    const documentos = [
      ['usuarios/responsavel-a', { empresaId: empresaA, nome: 'Responsável A' }],
      ['usuarios/tratador-a', { empresaId: empresaA, nome: 'Tratador A' }],
      ['usuarios/tratador-a2', { empresaId: empresaA, nome: 'Tratador A2' }],
      ['usuarios/responsavel-b', { empresaId: empresaB, nome: 'Responsável B' }],
      [`empresas/${empresaA}`, { nome: 'Empresa A', responsavelUid: usuarioResponsavelA }],
      [`empresas/${empresaB}`, { nome: 'Empresa B', responsavelUid: usuarioResponsavelB }],
      [caminhoEmpresa(empresaA, 'membros', usuarioResponsavelA), { papel: 'responsavel', ativo: true }],
      [caminhoEmpresa(empresaA, 'membros', usuarioTratadorA), { papel: 'tratador', ativo: true }],
      [caminhoEmpresa(empresaA, 'membros', usuarioTratadorA2), { papel: 'tratador', ativo: true }],
      [caminhoEmpresa(empresaB, 'membros', usuarioResponsavelB), { papel: 'responsavel', ativo: true }],
      [caminhoEmpresa(empresaA, 'membros', 'membro-inativo'), { papel: 'tratador', ativo: false }],
      [caminhoEmpresa(empresaA, 'clientes', 'cliente-a'), { nome: 'Cliente A' }],
      [caminhoEmpresa(empresaB, 'clientes', 'cliente-b'), { nome: 'Cliente B' }],
      [caminhoEmpresa(empresaA, 'piscinas', 'piscina-a'), { cliente: 'Casa A', litragem: 13000 }],
      [caminhoEmpresa(empresaA, 'produtos', 'cloro'), { nome: 'Cloro', marca: 'HidroAll', valorUnitarioUltimaCompra: 8.67, quantidadeEstoque: 500, unidade: 'g', criadoEm: '2026-11-15', atualizadoEm: '2026-11-15' }],
      [caminhoEmpresa(empresaA, 'produtos', 'cloro-kg'), { nome: 'Cloro em kg', valorUnitarioUltimaCompra: 50, quantidadeEstoque: 10, unidade: 'kg', criadoEm: '2026-11-15', atualizadoEm: '2026-11-15' }],
      [caminhoEmpresa(empresaB, 'produtos', 'cloro-b'), { nome: 'Cloro B', valorUnitarioUltimaCompra: 8.67, quantidadeEstoque: 200, unidade: 'g', criadoEm: '2026-11-15', atualizadoEm: '2026-11-15' }],
      [caminhoEmpresa(empresaB, 'visitas', 'visita-empresa-b'), {
        localId: 'local-b', piscinaId: 'piscina-b', tratadorUid: 'tratador-b',
        status: 'Pendente', servico: 'Inspeção',
      }],
      [caminhoEmpresa(empresaA, 'visitas', 'visita-tratador-a'), {
        localId: 'local-a', piscinaId: 'piscina-a', tratadorUid: usuarioTratadorA,
        status: 'Pendente', servico: 'Inspeção', produtosAplicados: {},
      }],
      [caminhoEmpresa(empresaA, 'visitas', 'visita-aplicar'), {
        localId: 'local-a', piscinaId: 'piscina-a', tratadorUid: usuarioTratadorA,
        status: 'Pendente', servico: 'Aplicar produtos',
        produtosAplicados: { cloro: { produto: 'Cloro', quantidade: 125, unidade: 'g' } },
        estoqueBaixado: false,
      }],
      [caminhoEmpresa(empresaA, 'visitas', 'visita-excede-estoque'), {
        localId: 'local-a', piscinaId: 'piscina-a', tratadorUid: usuarioTratadorA,
        status: 'Pendente', servico: 'Aplicar produtos',
        produtosAplicados: { cloro: { produto: 'Cloro', quantidade: 600, unidade: 'g' } },
        estoqueBaixado: false,
      }],
      [caminhoEmpresa(empresaA, 'visitas', 'visita-dose-gramas'), {
        localId: 'local-a', piscinaId: 'piscina-a', tratadorUid: usuarioTratadorA,
        status: 'Pendente', servico: 'Aplicar produtos',
        produtosAplicados: { 'cloro-kg': { produto: 'Cloro em kg', quantidade: 60, unidade: 'g' } },
        estoqueBaixado: false,
      }],
      [caminhoEmpresa(empresaA, 'visitas', 'visita-tratador-a2'), {
        localId: 'local-a', piscinaId: 'piscina-a', tratadorUid: usuarioTratadorA2,
        status: 'Pendente', servico: 'Inspeção',
      }],
    ];

    await Promise.all(documentos.map(([caminho, dados]) => setDoc(doc(banco, caminho), dados)));
  });
}

beforeAll(async () => {
  // O CLI define esse valor durante emulators:exec; usamos o endereço explícito abaixo.
  delete process.env.FIREBASE_EMULATOR_HUB;
  ambiente = await initializeTestEnvironment({
    projectId: 'demo-pool-day',
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await ambiente.clearFirestore();
  await prepararDocumentos();
});

afterAll(async () => {
  if (ambiente) await ambiente.cleanup();
});

describe('regras de acesso por empresa e papel', () => {
  test('bloqueia consultas sem autenticação', async () => {
    const banco = ambiente.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(banco, caminhoEmpresa(empresaA, 'clientes', 'cliente-a'))));
  });

  test('permite o perfil do próprio usuário e bloqueia o perfil de outra pessoa', async () => {
    const banco = firestoreDo(usuarioTratadorA);
    await assertSucceeds(getDoc(doc(banco, 'usuarios/tratador-a')));
    await assertSucceeds(getDoc(doc(banco, caminhoEmpresa(empresaA, 'membros', usuarioTratadorA))));
    await assertFails(getDoc(doc(banco, 'usuarios/responsavel-b')));
  });

  test('bloqueia dados e empresa de outra empresa', async () => {
    const banco = firestoreDo(usuarioResponsavelA);
    await assertSucceeds(getDoc(doc(banco, `empresas/${empresaA}`)));
    await assertFails(getDoc(doc(banco, caminhoEmpresa(empresaB, 'clientes', 'cliente-b'))));
    await assertFails(getDoc(doc(banco, caminhoEmpresa(empresaB, 'visitas', 'visita-empresa-b'))));
    await assertFails(getDoc(doc(banco, `empresas/${empresaB}`)));
  });

  test('responsável pode consultar e manter cadastros e visitas da empresa', async () => {
    const banco = firestoreDo(usuarioResponsavelA);
    const cliente = doc(banco, caminhoEmpresa(empresaA, 'clientes', 'cliente-novo'));
    const piscina = doc(banco, caminhoEmpresa(empresaA, 'piscinas', 'piscina-a'));
    const visita = doc(banco, caminhoEmpresa(empresaA, 'visitas', 'visita-nova'));

    await assertSucceeds(setDoc(cliente, { nome: 'Novo cliente' }));
    await assertSucceeds(updateDoc(cliente, { nome: 'Cliente atualizado' }));
    await assertSucceeds(updateDoc(cliente, { ativo: false }));
    await assertSucceeds(deleteDoc(cliente));
    await assertSucceeds(updateDoc(piscina, {
      tratamentoPadrao: [{ produto: 'Cloro', quantidade: '120', unidade: 'g' }],
      orientacoesTratamento: 'Seguir o rótulo.',
    }));
    await assertSucceeds(getDoc(doc(banco, caminhoEmpresa(empresaA, 'visitas', 'visita-tratador-a'))));
    await assertSucceeds(setDoc(visita, { tratadorUid: usuarioTratadorA, status: 'Pendente' }));
  });

  test('visita não pode ser criada com foto e responsável não consegue gravar nem alterar metadados', async () => {
    const banco = firestoreDo(usuarioResponsavelA);
    const visita = doc(banco, caminhoEmpresa(empresaA, 'visitas', 'visita-foto-nova'));
    const foto = { arquivoId: 'arquivo-servidor', latitude: -15.79, longitude: -47.88 };

    await assertFails(setDoc(visita, { tratadorUid: usuarioTratadorA, status: 'Pendente', fotoAntes: foto }));
    await assertSucceeds(updateDoc(doc(banco, caminhoEmpresa(empresaA, 'visitas', 'visita-tratador-a')), { status: 'Frustrada' }));
    await assertFails(updateDoc(doc(banco, caminhoEmpresa(empresaA, 'visitas', 'visita-tratador-a')), {
      status: 'Frustrada', fotoDepois: foto,
    }));
    await assertFails(updateDoc(doc(banco, caminhoEmpresa(empresaA, 'visitas', 'visita-tratador-a')), { fotoAntes: foto }));
  });

  test('responsável pode listar a equipe, mas tratador não pode consultar outros membros', async () => {
    const equipe = collection(firestoreDo(usuarioResponsavelA), `empresas/${empresaA}/membros`);
    const resultado = await assertSucceeds(getDocs(equipe));
    expect(resultado.size).toBe(4);

    const equipeDoTratador = collection(firestoreDo(usuarioTratadorA), `empresas/${empresaA}/membros`);
    await assertFails(getDocs(equipeDoTratador));
  });

  test('tratador consulta cadastros da empresa, mas não pode alterá-los', async () => {
    const banco = firestoreDo(usuarioTratadorA);
    const cliente = doc(banco, caminhoEmpresa(empresaA, 'clientes', 'cliente-a'));
    const piscina = doc(banco, caminhoEmpresa(empresaA, 'piscinas', 'piscina-a'));

    await assertSucceeds(getDoc(cliente));
    await assertFails(setDoc(doc(banco, caminhoEmpresa(empresaA, 'clientes', 'cliente-novo')), { nome: 'Novo' }));
    await assertFails(updateDoc(cliente, { nome: 'Alterado' }));
    await assertFails(updateDoc(cliente, { ativo: false }));
    await assertFails(updateDoc(piscina, { tratamentoPadrao: [{ produto: 'Cloro', quantidade: '120', unidade: 'g' }] }));
    await assertFails(deleteDoc(cliente));
  });

  test('responsável gerencia catálogo; empresas não acessam estoque umas das outras', async () => {
    const bancoResponsavel = firestoreDo(usuarioResponsavelA);
    const bancoTratador = firestoreDo(usuarioTratadorA);
    const produto = doc(bancoResponsavel, caminhoEmpresa(empresaA, 'produtos', 'cloro'));
    const novoProduto = doc(bancoResponsavel, caminhoEmpresa(empresaA, 'produtos', 'alcalinizante'));

    await assertSucceeds(getDoc(produto));
    await assertSucceeds(setDoc(novoProduto, {
      nome: 'Alcalinizante', quantidadeEstoque: 2, unidade: 'kg', valorUnitarioUltimaCompra: 17.5, criadoEm: 'agora', atualizadoEm: 'agora',
    }));
    await assertSucceeds(setDoc(doc(bancoResponsavel, caminhoEmpresa(empresaA, 'produtos', 'pastilha')), {
      nome: 'Pastilha de Cloro 5x1', marca: 'HidroAll', quantidadeEstoque: 4, unidade: 'UN',
      valorUnitarioUltimaCompra: 8.67, criadoEm: 'agora', atualizadoEm: 'agora',
    }));
    await assertFails(setDoc(doc(bancoResponsavel, caminhoEmpresa(empresaA, 'produtos', 'sem-preco')), {
      nome: 'Produto sem preço', quantidadeEstoque: 1, unidade: 'UN', criadoEm: 'agora', atualizadoEm: 'agora',
    }));
    await assertSucceeds(updateDoc(produto, { quantidadeEstoque: 700, atualizadoEm: 'agora' }));
    await assertSucceeds(getDoc(doc(bancoTratador, caminhoEmpresa(empresaA, 'produtos', 'cloro'))));
    await assertFails(updateDoc(doc(bancoTratador, caminhoEmpresa(empresaA, 'produtos', 'cloro')), { quantidadeEstoque: 900 }));
    await assertFails(getDoc(doc(bancoResponsavel, caminhoEmpresa(empresaB, 'produtos', 'cloro-b'))));
  });

  test('tratador baixa o estoque somente ao concluir visita atribuída e sem exceder consumo', async () => {
    const banco = firestoreDo(usuarioTratadorA);
    const produto = doc(banco, caminhoEmpresa(empresaA, 'produtos', 'cloro'));
    const visita = doc(banco, caminhoEmpresa(empresaA, 'visitas', 'visita-aplicar'));
    const lote = writeBatch(banco);

    lote.update(produto, {
      quantidadeEstoque: 375, ultimaBaixaVisitaId: 'visita-aplicar', ultimaBaixaQuantidade: 125,
    });
    lote.update(visita, {
      status: 'Executada', estoqueBaixado: true, estoqueBaixadoEm: 'agora',
      custosProdutos: { cloro: { quantidadeEstoque: 125, unidadeEstoque: 'g', valorUnitario: 8.67, custoTotal: 1083.75 } },
      custoTotalProdutos: 1083.75,
    });
    await assertSucceeds(lote.commit());

    await assertFails(updateDoc(produto, { quantidadeEstoque: 250, ultimaBaixaVisitaId: 'visita-aplicar', ultimaBaixaQuantidade: 125 }));
  });

  test('não permite baixa de estoque que deixe saldo negativo', async () => {
    const banco = firestoreDo(usuarioTratadorA);
    const lote = writeBatch(banco);
    lote.update(doc(banco, caminhoEmpresa(empresaA, 'produtos', 'cloro')), {
      quantidadeEstoque: -100, ultimaBaixaVisitaId: 'visita-excede-estoque', ultimaBaixaQuantidade: 600,
    });
    lote.update(doc(banco, caminhoEmpresa(empresaA, 'visitas', 'visita-excede-estoque')), {
      status: 'Executada', estoqueBaixado: true, estoqueBaixadoEm: 'agora',
      custosProdutos: { cloro: { quantidadeEstoque: 600, unidadeEstoque: 'g', valorUnitario: 8.67, custoTotal: 5202 } },
      custoTotalProdutos: 5202,
    });

    await assertFails(lote.commit());
  });

  test('aceita a dose em gramas e desconta o equivalente em quilogramas', async () => {
    const banco = firestoreDo(usuarioTratadorA);
    const lote = writeBatch(banco);
    lote.update(doc(banco, caminhoEmpresa(empresaA, 'produtos', 'cloro-kg')), {
      quantidadeEstoque: 9.94, ultimaBaixaVisitaId: 'visita-dose-gramas', ultimaBaixaQuantidade: 0.06,
    });
    lote.update(doc(banco, caminhoEmpresa(empresaA, 'visitas', 'visita-dose-gramas')), {
      status: 'Executada', estoqueBaixado: true, estoqueBaixadoEm: 'agora',
      custosProdutos: { 'cloro-kg': { quantidadeEstoque: 0.06, unidadeEstoque: 'kg', valorUnitario: 50, custoTotal: 3 } },
      custoTotalProdutos: 3,
    });

    await assertSucceeds(lote.commit());
  });

  test('tratador só consulta visitas atribuídas ao próprio UID', async () => {
    const banco = firestoreDo(usuarioTratadorA);
    const minhasVisitas = query(
      collection(banco, `empresas/${empresaA}/visitas`),
      where('tratadorUid', '==', usuarioTratadorA)
    );

    const resultado = await assertSucceeds(getDocs(minhasVisitas));
    expect(resultado.size).toBe(4);
    await assertFails(getDoc(doc(banco, caminhoEmpresa(empresaA, 'visitas', 'visita-tratador-a2'))));
    await assertFails(getDocs(collection(banco, `empresas/${empresaA}/visitas`)));
  });

  test('tratador pode atualizar a execução da visita atribuída, mas não sua atribuição ou agendamento', async () => {
    const banco = firestoreDo(usuarioTratadorA);
    const visita = doc(banco, caminhoEmpresa(empresaA, 'visitas', 'visita-tratador-a'));

    await assertSucceeds(updateDoc(visita, { status: 'Executada', horarioChegada: '2026-11-10T12:00:00Z' }));
    await assertFails(updateDoc(visita, { fotoAntes: { arquivoId: 'arquivo-falso' } }));
    await assertFails(updateDoc(visita, { fotoDepois: { arquivoId: 'arquivo-falso' } }));
    await assertSucceeds(updateDoc(visita, { horarioSaida: '2026-11-10T13:00:00Z' }));
    await assertFails(updateDoc(visita, { tratadorUid: usuarioTratadorA2 }));
    await assertFails(updateDoc(visita, { data: '2026-11-11' }));
    await assertFails(addDoc(collection(banco, `empresas/${empresaA}/visitas`), {
      tratadorUid: usuarioTratadorA, status: 'Pendente',
    }));
    await assertFails(deleteDoc(visita));
  });

  test('metadados de foto gravados pelo servidor continuam legíveis para responsável e tratador atribuído', async () => {
    const foto = {
      arquivoId: 'arquivo-servidor', latitude: -15.79, longitude: -47.88,
      capturadaEm: '2026-11-17T14:20:00.000Z', enviadaEm: '2026-11-17T14:20:05.000Z',
      enviadaPorUid: usuarioTratadorA,
    };
    await ambiente.withSecurityRulesDisabled(async (contexto) => {
      await setDoc(doc(contexto.firestore(), caminhoEmpresa(empresaA, 'visitas', 'visita-tratador-a')), { fotoAntes: foto }, { merge: true });
    });

    await assertSucceeds(getDoc(doc(firestoreDo(usuarioResponsavelA), caminhoEmpresa(empresaA, 'visitas', 'visita-tratador-a'))));
    await assertSucceeds(getDoc(doc(firestoreDo(usuarioTratadorA), caminhoEmpresa(empresaA, 'visitas', 'visita-tratador-a'))));
  });

  test('membro inativo não acessa os dados da empresa', async () => {
    const banco = firestoreDo('membro-inativo');
    await assertFails(getDoc(doc(banco, caminhoEmpresa(empresaA, 'clientes', 'cliente-a'))));
  });

  test('responsável ativo cria perfil e vínculo de tratador no mesmo lote', async () => {
    const banco = firestoreDo(usuarioResponsavelA);
    const novoUsuario = 'tratador-novo';
    const lote = writeBatch(banco);

    lote.set(doc(banco, `usuarios/${novoUsuario}`), {
      empresaId: empresaA,
      nome: 'Novo tratador',
      email: 'novo@poolday.com',
    });
    lote.set(doc(banco, caminhoEmpresa(empresaA, 'membros', novoUsuario)), {
      nome: 'Novo tratador',
      email: 'novo@poolday.com',
      papel: 'tratador',
      ativo: true,
      criadoEm: '2026-11-12T12:00:00.000Z',
    });

    await assertSucceeds(lote.commit());
  });

  test('novo responsável cria a empresa, o perfil e o próprio vínculo no mesmo lote', async () => {
    const novoResponsavel = 'responsavel-novo';
    const empresaNova = 'empresa-nova';
    const banco = firestoreDo(novoResponsavel);
    const lote = writeBatch(banco);

    lote.set(doc(banco, `usuarios/${novoResponsavel}`), {
      empresaId: empresaNova, nome: 'Ana Silva', email: 'ana@poolday.com',
    });
    lote.set(doc(banco, `empresas/${empresaNova}`), {
      nome: 'Pool Day Brasília', responsavelUid: novoResponsavel, criadaEm: '2026-11-13T12:00:00.000Z',
    });
    lote.set(doc(banco, caminhoEmpresa(empresaNova, 'membros', novoResponsavel)), {
      nome: 'Ana Silva', email: 'ana@poolday.com', papel: 'responsavel', ativo: true, criadoEm: '2026-11-13T12:00:00.000Z',
    });

    await assertSucceeds(lote.commit());
  });

  test('não permite vincular um responsável existente a uma nova empresa', async () => {
    const banco = firestoreDo(usuarioResponsavelA);
    const empresaNova = 'empresa-invasora';
    const lote = writeBatch(banco);

    lote.set(doc(banco, 'usuarios/responsavel-a'), {
      empresaId: empresaNova, nome: 'Responsável A', email: 'responsavel-a@poolday.com',
    });
    lote.set(doc(banco, `empresas/${empresaNova}`), {
      nome: 'Empresa indevida', responsavelUid: usuarioResponsavelA, criadaEm: '2026-11-13T12:00:00.000Z',
    });
    lote.set(doc(banco, caminhoEmpresa(empresaNova, 'membros', usuarioResponsavelA)), {
      nome: 'Responsável A', email: 'responsavel-a@poolday.com', papel: 'responsavel', ativo: true,
      criadoEm: '2026-11-13T12:00:00.000Z',
    });

    await assertFails(lote.commit());
  });

  test('tratador não pode criar outro vínculo de membro', async () => {
    const banco = firestoreDo(usuarioTratadorA);
    const novoUsuario = 'tratador-bloqueado';
    const lote = writeBatch(banco);

    lote.set(doc(banco, `usuarios/${novoUsuario}`), {
      empresaId: empresaA,
      nome: 'Tratador bloqueado',
      email: 'bloqueado@poolday.com',
    });
    lote.set(doc(banco, caminhoEmpresa(empresaA, 'membros', novoUsuario)), {
      nome: 'Tratador bloqueado',
      email: 'bloqueado@poolday.com',
      papel: 'tratador',
      ativo: true,
      criadoEm: '2026-11-12T12:00:00.000Z',
    });

    await assertFails(lote.commit());
  });

  test('responsável não pode criar membro com papel de responsável', async () => {
    const banco = firestoreDo(usuarioResponsavelA);
    const novoUsuario = 'responsavel-nao-autorizado';
    const lote = writeBatch(banco);

    lote.set(doc(banco, `usuarios/${novoUsuario}`), {
      empresaId: empresaA,
      nome: 'Outro responsável',
      email: 'outro@poolday.com',
    });
    lote.set(doc(banco, caminhoEmpresa(empresaA, 'membros', novoUsuario)), {
      nome: 'Outro responsável',
      email: 'outro@poolday.com',
      papel: 'responsavel',
      ativo: true,
      criadoEm: '2026-11-12T12:00:00.000Z',
    });

    await assertFails(lote.commit());
  });

  test('responsável não pode vincular à empresa A um usuário associado à empresa B', async () => {
    const banco = firestoreDo(usuarioResponsavelA);
    const lote = writeBatch(banco);

    lote.set(doc(banco, `usuarios/${usuarioResponsavelB}`), {
      empresaId: empresaA,
      nome: 'Responsável B',
      email: 'responsavel-b@poolday.com',
    });
    lote.set(doc(banco, caminhoEmpresa(empresaA, 'membros', usuarioResponsavelB)), {
      nome: 'Responsável B',
      email: 'responsavel-b@poolday.com',
      papel: 'tratador',
      ativo: true,
      criadoEm: '2026-11-12T12:00:00.000Z',
    });

    await assertFails(lote.commit());
  });
});
