const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { HttpsError, onCall } = require('firebase-functions/v2/https');
const { convidarTratador: criarConvite } = require('./lib/convidar-tratador');

initializeApp();

exports.convidarTratador = onCall({ region: 'southamerica-east1' }, async (request) => {
  try {
    return await criarConvite({
      db: getFirestore(),
      auth: getAuth(),
      solicitanteUid: request.auth?.uid,
      nome: request.data?.nome,
      email: request.data?.email,
    });
  } catch (erro) {
    const codigos = ['unauthenticated', 'invalid-argument', 'permission-denied', 'already-exists'];
    const codigo = codigos.includes(erro.code) ? erro.code : 'internal';
    throw new HttpsError(codigo, erro.message || 'Não foi possível convidar o tratador.');
  }
});
