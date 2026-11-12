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
      [caminhoEmpresa(empresaA, 'visitas', 'visita-tratador-a'), {
        localId: 'local-a', piscinaId: 'piscina-a', tratadorUid: usuarioTratadorA,
        status: 'Pendente', servico: 'Inspeção',
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
    await assertFails(getDoc(doc(banco, 'usuarios/responsavel-b')));
  });

  test('bloqueia dados e empresa de outra empresa', async () => {
    const banco = firestoreDo(usuarioResponsavelA);
    await assertSucceeds(getDoc(doc(banco, `empresas/${empresaA}`)));
    await assertFails(getDoc(doc(banco, caminhoEmpresa(empresaB, 'clientes', 'cliente-b'))));
    await assertFails(getDoc(doc(banco, `empresas/${empresaB}`)));
  });

  test('responsável pode consultar e manter cadastros e visitas da empresa', async () => {
    const banco = firestoreDo(usuarioResponsavelA);
    const cliente = doc(banco, caminhoEmpresa(empresaA, 'clientes', 'cliente-novo'));
    const visita = doc(banco, caminhoEmpresa(empresaA, 'visitas', 'visita-nova'));

    await assertSucceeds(setDoc(cliente, { nome: 'Novo cliente' }));
    await assertSucceeds(updateDoc(cliente, { nome: 'Cliente atualizado' }));
    await assertSucceeds(deleteDoc(cliente));
    await assertSucceeds(getDoc(doc(banco, caminhoEmpresa(empresaA, 'visitas', 'visita-tratador-a'))));
    await assertSucceeds(setDoc(visita, { tratadorUid: usuarioTratadorA, status: 'Pendente' }));
  });

  test('tratador consulta cadastros da empresa, mas não pode alterá-los', async () => {
    const banco = firestoreDo(usuarioTratadorA);
    const cliente = doc(banco, caminhoEmpresa(empresaA, 'clientes', 'cliente-a'));

    await assertSucceeds(getDoc(cliente));
    await assertFails(setDoc(doc(banco, caminhoEmpresa(empresaA, 'clientes', 'cliente-novo')), { nome: 'Novo' }));
    await assertFails(updateDoc(cliente, { nome: 'Alterado' }));
    await assertFails(deleteDoc(cliente));
  });

  test('tratador só consulta visitas atribuídas ao próprio UID', async () => {
    const banco = firestoreDo(usuarioTratadorA);
    const minhasVisitas = query(
      collection(banco, `empresas/${empresaA}/visitas`),
      where('tratadorUid', '==', usuarioTratadorA)
    );

    const resultado = await assertSucceeds(getDocs(minhasVisitas));
    expect(resultado.size).toBe(1);
    await assertFails(getDoc(doc(banco, caminhoEmpresa(empresaA, 'visitas', 'visita-tratador-a2'))));
    await assertFails(getDocs(collection(banco, `empresas/${empresaA}/visitas`)));
  });

  test('tratador pode atualizar a execução da visita atribuída, mas não sua atribuição ou agendamento', async () => {
    const banco = firestoreDo(usuarioTratadorA);
    const visita = doc(banco, caminhoEmpresa(empresaA, 'visitas', 'visita-tratador-a'));

    await assertSucceeds(updateDoc(visita, { status: 'Executada', horarioChegada: '2026-11-10T12:00:00Z' }));
    await assertFails(updateDoc(visita, { tratadorUid: usuarioTratadorA2 }));
    await assertFails(updateDoc(visita, { data: '2026-11-11' }));
    await assertFails(addDoc(collection(banco, `empresas/${empresaA}/visitas`), {
      tratadorUid: usuarioTratadorA, status: 'Pendente',
    }));
    await assertFails(deleteDoc(visita));
  });

  test('membro inativo não acessa os dados da empresa', async () => {
    const banco = firestoreDo('membro-inativo');
    await assertFails(getDoc(doc(banco, caminhoEmpresa(empresaA, 'clientes', 'cliente-a'))));
  });
});
