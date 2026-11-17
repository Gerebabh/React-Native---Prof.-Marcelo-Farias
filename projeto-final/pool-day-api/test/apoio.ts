import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { construirApp } from '../src/app.js';
import { Armazenamento } from '../src/armazenamento.js';
import { ErroApi } from '../src/erros.js';
import type { CampoFoto, MetadadosFoto, Membro, Repositorio, Usuario, Visita } from '../src/tipos.js';

/** Firestore em memória com as mesmas conferências da implementação real. */
export class RepositorioMemoria implements Repositorio {
  usuarios = new Map<string, Usuario>();
  membros = new Map<string, Membro>();
  visitas = new Map<string, Visita>();
  falharGravacao = false;

  async obterUsuario(uid: string) {
    return this.usuarios.get(uid) ?? null;
  }

  async obterMembro(empresaId: string, uid: string) {
    return this.membros.get(`${empresaId}/${uid}`) ?? null;
  }

  async obterVisita(empresaId: string, visitaId: string) {
    const visita = this.visitas.get(`${empresaId}/${visitaId}`);
    return visita ? structuredClone(visita) : null;
  }

  async gravarFoto({ empresaId, visitaId, uid, campoFoto, foto }: { empresaId: string; visitaId: string; uid: string; campoFoto: CampoFoto; foto: MetadadosFoto }) {
    if (this.falharGravacao) {
      throw new Error('Firestore indisponível');
    }
    const visita = this.visitas.get(`${empresaId}/${visitaId}`);
    if (!visita) throw new ErroApi('nao-encontrado');
    if (this.membros.get(`${empresaId}/${uid}`)?.ativo !== true) throw new ErroApi('sem-acesso');
    if (visita.tratadorUid !== uid) throw new ErroApi('sem-acesso');
    if (visita.status === 'Executada') throw new ErroApi('visita-executada');
    const anterior = visita[campoFoto]?.arquivoId;
    visita[campoFoto] = foto;
    return typeof anterior === 'string' ? anterior : null;
  }
}

/**
 * Cenário base: empresa A com responsável, tratador atribuído, tratador não
 * atribuído e tratador inativo; empresa B com seu responsável.
 */
export function cenario() {
  const repositorio = new RepositorioMemoria();
  const membro = (empresaId: string, uid: string, papel: string, ativo = true) => {
    repositorio.usuarios.set(uid, { empresaId });
    repositorio.membros.set(`${empresaId}/${uid}`, { papel, ativo });
  };
  membro('empresaA', 'respA', 'responsavel');
  membro('empresaA', 'tratA', 'tratador');
  membro('empresaA', 'tratOutro', 'tratador');
  membro('empresaA', 'tratInativo', 'tratador', false);
  membro('empresaB', 'respB', 'responsavel');
  repositorio.visitas.set('empresaA/visita1', { status: 'Agendada', tratadorUid: 'tratA' });
  repositorio.visitas.set('empresaA/visitaInativo', { status: 'Agendada', tratadorUid: 'tratInativo' });
  repositorio.visitas.set('empresaA/visitaDoResp', { status: 'Agendada', tratadorUid: 'respA' });
  repositorio.visitas.set('empresaA/visitaExecutada', { status: 'Executada', tratadorUid: 'tratA' });
  repositorio.visitas.set('empresaB/visitaB', { status: 'Agendada', tratadorUid: 'respB' });
  return repositorio;
}

export async function criarAmbiente(opcoes: { tamanhoMaximoBytes?: number } = {}) {
  const pasta = await mkdtemp(path.join(os.tmpdir(), 'pool-day-api-'));
  const repositorio = cenario();
  const armazenamento = new Armazenamento(pasta);
  const app = construirApp({
    repositorio,
    armazenamento,
    logger: false,
    tamanhoMaximoBytes: opcoes.tamanhoMaximoBytes,
    // Nos testes o token é "token-<uid>".
    verificarToken: async (token) => {
      if (!token.startsWith('token-')) throw new Error('token inválido');
      return { uid: token.slice('token-'.length) };
    },
  });
  await app.ready();
  return {
    app,
    repositorio,
    armazenamento,
    pasta,
    fechar: async () => {
      await app.close();
      await rm(pasta, { recursive: true, force: true });
    },
  };
}

export async function jpeg(largura = 64, altura = 48): Promise<Buffer> {
  return sharp({ create: { width: largura, height: altura, channels: 3, background: { r: 30, g: 120, b: 200 } } })
    .jpeg()
    .withMetadata({ exif: { IFD0: { Artist: 'teste' } } })
    .toBuffer();
}

export async function png(): Promise<Buffer> {
  return sharp({ create: { width: 10, height: 10, channels: 3, background: '#fff' } }).png().toBuffer();
}

/** Monta um corpo multipart/form-data à mão, como o app faria. */
export function formulario(campos: Record<string, string>, arquivo?: { conteudo: Buffer; nome?: string; tipo?: string; campo?: string }) {
  const limite = '----pooldayteste' + Math.random().toString(16).slice(2);
  const partes: Buffer[] = [];
  for (const [nome, valor] of Object.entries(campos)) {
    partes.push(Buffer.from(`--${limite}\r\nContent-Disposition: form-data; name="${nome}"\r\n\r\n${valor}\r\n`));
  }
  if (arquivo) {
    partes.push(Buffer.from(`--${limite}\r\nContent-Disposition: form-data; name="${arquivo.campo ?? 'arquivo'}"; filename="${arquivo.nome ?? 'foto.jpg'}"\r\nContent-Type: ${arquivo.tipo ?? 'image/jpeg'}\r\n\r\n`));
    partes.push(arquivo.conteudo);
    partes.push(Buffer.from('\r\n'));
  }
  partes.push(Buffer.from(`--${limite}--\r\n`));
  return { payload: Buffer.concat(partes), headers: { 'content-type': `multipart/form-data; boundary=${limite}` } };
}

export function camposValidos(campoFoto: CampoFoto = 'fotoAntes') {
  return {
    campoFoto,
    latitude: '-15.79',
    longitude: '-47.88',
    endereco: 'Rua Exemplo, 100',
    capturadaEm: new Date(Date.now() - 60_000).toISOString(),
  };
}
