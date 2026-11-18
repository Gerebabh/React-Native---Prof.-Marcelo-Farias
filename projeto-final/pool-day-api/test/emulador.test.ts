import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { deleteApp, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { construirApp } from '../src/app.js';
import { Armazenamento } from '../src/armazenamento.js';
import { RepositorioFirestore } from '../src/repositorioFirestore.js';
import { camposValidos, formulario, jpeg } from './apoio.js';

// Roda só com os emuladores ligados: npm run test:emulador
const comEmulador = Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST);
const PROJETO = 'demo-pool-day';

describe.skipIf(!comEmulador)('API com Firebase Auth e Firestore reais (emulador)', () => {
  let firebase: App;
  let banco: Firestore;
  let app: FastifyInstance;
  let pasta: string;
  const tokens: Record<string, string> = {};

  async function criarUsuario(apelido: string): Promise<string> {
    const email = `${apelido}-${Date.now()}@teste.dev`;
    const usuario = await getAuth(firebase).createUser({ email, password: 'senha-teste-123' });
    const resposta = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=chave-falsa`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'senha-teste-123', returnSecureToken: true }),
    });
    const json = (await resposta.json()) as { idToken: string };
    tokens[apelido] = json.idToken;
    return usuario.uid;
  }

  const uids: Record<string, string> = {};

  beforeAll(async () => {
    firebase = initializeApp({ projectId: PROJETO }, `teste-${Date.now()}`);
    banco = getFirestore(firebase);
    pasta = await mkdtemp(path.join(os.tmpdir(), 'pool-day-emulador-'));
    const auth = getAuth(firebase);
    app = construirApp({
      repositorio: new RepositorioFirestore(banco),
      armazenamento: new Armazenamento(pasta),
      verificarToken: (token) => auth.verifyIdToken(token),
      logger: false,
    });
    await app.ready();

    for (const apelido of ['resp', 'trat', 'tratOutro', 'tratInativo', 'respOutra']) {
      uids[apelido] = await criarUsuario(apelido);
    }
    const membro = async (empresaId: string, apelido: string, papel: string, ativo = true) => {
      await banco.doc(`usuarios/${uids[apelido]}`).set({ empresaId, nome: apelido, email: `${apelido}@teste.dev` });
      await banco.doc(`empresas/${empresaId}/membros/${uids[apelido]}`).set({ papel, ativo, nome: apelido });
    };
    await membro('empresaA', 'resp', 'responsavel');
    await membro('empresaA', 'trat', 'tratador');
    await membro('empresaA', 'tratOutro', 'tratador');
    await membro('empresaA', 'tratInativo', 'tratador', false);
    await membro('empresaB', 'respOutra', 'responsavel');
    await banco.doc('empresas/empresaA/visitas/visita1').set({ status: 'Agendada', tratadorUid: uids.trat });
    await banco.doc('empresas/empresaA/visitas/visitaInativo').set({ status: 'Agendada', tratadorUid: uids.tratInativo });
  });

  afterAll(async () => {
    await app?.close();
    if (firebase) await deleteApp(firebase);
    if (pasta) await rm(pasta, { recursive: true, force: true });
  });

  async function enviar(apelido: string, visitaId: string) {
    const corpo = formulario(camposValidos('fotoDepois'), { conteudo: await jpeg() });
    return app.inject({ method: 'POST', url: `/api/visitas/${visitaId}/fotos`, headers: { ...corpo.headers, authorization: `Bearer ${tokens[apelido]}` }, payload: corpo.payload });
  }

  function consultar(apelido: string, visitaId: string) {
    return app.inject({ method: 'GET', url: `/api/visitas/${visitaId}/fotos/fotoDepois`, headers: { authorization: `Bearer ${tokens[apelido]}` } });
  }

  it('tratador atribuído envia; metadados vão para o documento da visita', async () => {
    const resposta = await enviar('trat', 'visita1');
    expect(resposta.statusCode).toBe(201);
    const documento = (await banco.doc('empresas/empresaA/visitas/visita1').get()).data();
    expect(documento?.fotoDepois).toEqual(resposta.json().foto);
    expect(documento?.fotoDepois.enviadaPorUid).toBe(uids.trat);
    expect(JSON.stringify(documento)).not.toContain(pasta);
  });

  it('responsável consulta; outra empresa, outro tratador e inativo são barrados', async () => {
    expect((await consultar('trat', 'visita1')).statusCode).toBe(200);
    expect((await consultar('resp', 'visita1')).statusCode).toBe(200);
    expect((await consultar('respOutra', 'visita1')).statusCode).toBe(404);
    expect((await enviar('respOutra', 'visita1')).statusCode).toBe(404);
    expect((await consultar('tratOutro', 'visita1')).statusCode).toBe(403);
    expect((await enviar('tratOutro', 'visita1')).statusCode).toBe(403);
    expect((await enviar('tratInativo', 'visitaInativo')).statusCode).toBe(403);
  });

  it('membro desativado perde o acesso no pedido seguinte, com o mesmo token', async () => {
    await banco.doc(`empresas/empresaA/membros/${uids.tratOutro}`).update({ ativo: false });
    await banco.doc('empresas/empresaA/visitas/visita1').update({ tratadorUid: uids.tratOutro });
    expect((await consultar('tratOutro', 'visita1')).statusCode).toBe(403);
    await banco.doc('empresas/empresaA/visitas/visita1').update({ tratadorUid: uids.trat });
  });

  it('visita executada bloqueia troca pela transação', async () => {
    await banco.doc('empresas/empresaA/visitas/visita1').update({ status: 'Executada' });
    const antes = (await banco.doc('empresas/empresaA/visitas/visita1').get()).data()?.fotoDepois;
    expect((await enviar('trat', 'visita1')).statusCode).toBe(409);
    expect((await banco.doc('empresas/empresaA/visitas/visita1').get()).data()?.fotoDepois).toEqual(antes);
    expect((await consultar('trat', 'visita1')).statusCode).toBe(200);
  });

  it('token forjado é recusado pelo Admin SDK', async () => {
    const resposta = await app.inject({ method: 'GET', url: '/api/visitas/visita1/fotos/fotoDepois', headers: { authorization: 'Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4In0.' } });
    expect(resposta.statusCode).toBe(401);
  });
});
