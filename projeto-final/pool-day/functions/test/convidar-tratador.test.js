const test = require('node:test');
const assert = require('node:assert/strict');
const { convidarTratador } = require('../lib/convidar-tratador');

function criarDependencias({ papel = 'responsavel', ativo = true, empresaId = 'empresa-1', emailExistente = false, falharLote = false } = {}) {
  const documentos = new Map([
    ['usuarios/resp-1', { empresaId }],
    [`empresas/${empresaId}/membros/resp-1`, { papel, ativo }],
  ]);
  const contas = [];
  const db = {
    doc(caminho) {
      return {
        caminho,
        async get() {
          const valor = documentos.get(caminho);
          return { exists: Boolean(valor), data: () => valor };
        },
      };
    },
    batch() {
      const escritas = [];
      return {
        set(ref, dados) { escritas.push([ref.caminho, dados]); },
        async commit() {
          if (falharLote) throw new Error('Falha ao salvar os documentos.');
          for (const [caminho, dados] of escritas) documentos.set(caminho, dados);
        },
      };
    },
  };
  const auth = {
    async createUser(dados) {
      if (emailExistente) {
        const erro = new Error('E-mail já cadastrado.');
        erro.code = 'auth/email-already-exists';
        throw erro;
      }
      const usuario = { uid: 'tratador-1', ...dados };
      contas.push(usuario);
      return usuario;
    },
    async deleteUser(uid) { contas.splice(contas.findIndex((usuario) => usuario.uid === uid), 1); },
  };
  return { db, auth, documentos, contas };
}

test('responsável ativo cria conta e vincula tratador à própria empresa', async () => {
  const deps = criarDependencias();
  const resultado = await convidarTratador({ ...deps, solicitanteUid: 'resp-1', nome: '  Joana Lima  ', email: ' JOANA@EXEMPLO.COM ' });
  assert.deepEqual(resultado, { uid: 'tratador-1', nome: 'Joana Lima', email: 'joana@exemplo.com' });
  assert.deepEqual(deps.documentos.get('usuarios/tratador-1'), { empresaId: 'empresa-1', nome: 'Joana Lima', email: 'joana@exemplo.com' });
  assert.equal(deps.documentos.get('empresas/empresa-1/membros/tratador-1').papel, 'tratador');
  assert.equal(deps.contas.length, 1);
});

test('nega convite sem login ou por usuário que não é responsável ativo', async () => {
  await assert.rejects(convidarTratador({ ...criarDependencias(), nome: 'Joana', email: 'joana@example.com' }), { code: 'unauthenticated' });
  const deps = criarDependencias({ papel: 'tratador' });
  await assert.rejects(convidarTratador({ ...deps, solicitanteUid: 'resp-1', nome: 'Joana', email: 'joana@example.com' }), { code: 'permission-denied' });
  assert.equal(deps.contas.length, 0);
});

test('valida nome e e-mail antes de criar uma conta', async () => {
  const deps = criarDependencias();
  await assert.rejects(convidarTratador({ ...deps, solicitanteUid: 'resp-1', nome: ' ', email: 'inválido' }), { code: 'invalid-argument' });
  assert.equal(deps.contas.length, 0);
});

test('não cria duas contas para o mesmo e-mail', async () => {
  const deps = criarDependencias({ emailExistente: true });
  await assert.rejects(convidarTratador({ ...deps, solicitanteUid: 'resp-1', nome: 'Joana', email: 'joana@example.com' }), { code: 'already-exists' });
});

test('remove a conta criada se o vínculo com a empresa falhar', async () => {
  const deps = criarDependencias({ falharLote: true });
  await assert.rejects(convidarTratador({ ...deps, solicitanteUid: 'resp-1', nome: 'Joana', email: 'joana@example.com' }), /Falha ao salvar/);
  assert.equal(deps.contas.length, 0);
});
