function falha(codigo, mensagem) {
  const erro = new Error(mensagem);
  erro.code = codigo;
  return erro;
}

async function convidarTratador({ db, auth, solicitanteUid, nome, email }) {
  const nomeTratador = typeof nome === 'string' ? nome.trim() : '';
  const emailTratador = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!solicitanteUid) throw falha('unauthenticated', 'Entre na sua conta para convidar um tratador.');
  if (!nomeTratador || !emailTratador || !/^\S+@\S+\.\S+$/.test(emailTratador)) {
    throw falha('invalid-argument', 'Informe nome e e-mail válidos para o tratador.');
  }

  const perfilSnapshot = await db.doc(`usuarios/${solicitanteUid}`).get();
  if (!perfilSnapshot.exists) throw falha('permission-denied', 'O perfil do responsável não foi encontrado.');
  const empresaId = perfilSnapshot.data().empresaId;
  if (!empresaId) throw falha('permission-denied', 'O responsável não está associado a uma empresa.');

  const membroSnapshot = await db.doc(`empresas/${empresaId}/membros/${solicitanteUid}`).get();
  const membro = membroSnapshot.exists ? membroSnapshot.data() : null;
  if (!membro || membro.ativo !== true || membro.papel !== 'responsavel') {
    throw falha('permission-denied', 'Somente o responsável ativo pode convidar tratadores.');
  }

  let usuario;
  try {
    usuario = await auth.createUser({ email: emailTratador, displayName: nomeTratador });
  } catch (erro) {
    if (erro.code === 'auth/email-already-exists') throw falha('already-exists', 'Já existe uma conta com esse e-mail.');
    throw erro;
  }

  try {
    const lote = db.batch();
    lote.set(db.doc(`usuarios/${usuario.uid}`), { empresaId, nome: nomeTratador, email: emailTratador });
    lote.set(db.doc(`empresas/${empresaId}/membros/${usuario.uid}`), {
      nome: nomeTratador,
      email: emailTratador,
      papel: 'tratador',
      ativo: true,
      criadoEm: new Date().toISOString(),
    });
    await lote.commit();
  } catch (erro) {
    await auth.deleteUser(usuario.uid);
    throw erro;
  }

  return { uid: usuario.uid, email: emailTratador, nome: nomeTratador };
}

module.exports = { convidarTratador };
