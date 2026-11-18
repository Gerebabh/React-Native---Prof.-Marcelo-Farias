import { readFileSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { construirApp } from './app.js';
import { Armazenamento } from './armazenamento.js';
import { agendarLimpeza } from './limpeza.js';
import { RepositorioFirestore } from './repositorioFirestore.js';

function obrigatoria(nome: string): string {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(`Variável de ambiente ${nome} não definida`);
  }
  return valor;
}

const caminhoCredencial = obrigatoria('FIREBASE_CREDENCIAL');
const credencial = JSON.parse(readFileSync(caminhoCredencial, 'utf8')) as { project_id?: string };
const projectId = process.env.FIREBASE_PROJECT_ID || credencial.project_id;
if (!projectId) {
  throw new Error('Não foi possível identificar o projeto do Firebase');
}

const firebase = initializeApp({ credential: cert(caminhoCredencial), projectId });
const auth = getAuth(firebase);
const repositorio = new RepositorioFirestore(getFirestore(firebase));
const armazenamento = new Armazenamento(obrigatoria('FOTOS_DIR'));

const app = construirApp({
  repositorio,
  armazenamento,
  // Sem checagem de revogação: o token expira em 1 h e cada pedido confere se o membro está ativo.
  verificarToken: (token) => auth.verifyIdToken(token),
  tamanhoMaximoBytes: Number(process.env.TAMANHO_MAXIMO_MB || 8) * 1024 * 1024,
});

const pararLimpeza = agendarLimpeza(repositorio, armazenamento, app.log);

const encerrar = async () => {
  pararLimpeza();
  await app.close();
  process.exit(0);
};
process.on('SIGTERM', encerrar);
process.on('SIGINT', encerrar);

await app.listen({ host: process.env.HOST || '0.0.0.0', port: Number(process.env.PORT || 3000) });
