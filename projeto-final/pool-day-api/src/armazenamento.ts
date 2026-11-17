import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, open, readdir, rename, rm, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import type { ReadStream } from 'node:fs';
import { idSeguro } from './acesso.js';

const ARQUIVO_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function arquivoIdValido(valor: unknown): valor is string {
  return typeof valor === 'string' && ARQUIVO_ID.test(valor);
}

export interface ArquivoGuardado {
  empresaId: string;
  visitaId: string;
  arquivoId: string;
  modificadoEm: Date;
}

/**
 * Guarda as fotos em <raiz>/empresas/{empresaId}/visitas/{visitaId}/{arquivoId}.jpg.
 * A raiz fica fora de qualquer pasta pública; os caminhos nunca saem da API.
 */
export class Armazenamento {
  constructor(private readonly raiz: string) {}

  private caminho(empresaId: string, visitaId: string, arquivoId: string): string {
    if (!idSeguro(empresaId) || !idSeguro(visitaId) || !arquivoIdValido(arquivoId)) {
      throw new Error('identificador inválido para o armazenamento');
    }
    return path.join(this.raiz, 'empresas', empresaId, 'visitas', visitaId, `${arquivoId}.jpg`);
  }

  /** Grava em um arquivo temporário e só então move para o nome final. */
  async salvar(empresaId: string, visitaId: string, conteudo: Buffer): Promise<string> {
    const arquivoId = randomUUID();
    const destino = this.caminho(empresaId, visitaId, arquivoId);
    const pastaTemporaria = path.join(this.raiz, '.tmp');
    await mkdir(pastaTemporaria, { recursive: true, mode: 0o700 });
    await mkdir(path.dirname(destino), { recursive: true, mode: 0o700 });

    const temporario = path.join(pastaTemporaria, `${arquivoId}.part`);
    const arquivo = await open(temporario, 'wx', 0o600);
    try {
      await arquivo.writeFile(conteudo);
      await arquivo.sync();
    } finally {
      await arquivo.close();
    }
    try {
      await rename(temporario, destino);
    } catch (erro) {
      await rm(temporario, { force: true });
      throw erro;
    }
    return arquivoId;
  }

  async remover(empresaId: string, visitaId: string, arquivoId: string): Promise<void> {
    await rm(this.caminho(empresaId, visitaId, arquivoId), { force: true });
  }

  /** Abre o arquivo para leitura; devolve null se não existir. */
  async abrir(empresaId: string, visitaId: string, arquivoId: string): Promise<{ fluxo: ReadStream; tamanho: number } | null> {
    const caminho = this.caminho(empresaId, visitaId, arquivoId);
    try {
      const info = await stat(caminho);
      if (!info.isFile()) return null;
      return { fluxo: createReadStream(caminho), tamanho: info.size };
    } catch (erro) {
      if ((erro as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw erro;
    }
  }

  /** Lista todos os arquivos guardados, para a limpeza de órfãos. */
  async *listar(): AsyncGenerator<ArquivoGuardado> {
    const empresas = await lerPasta(path.join(this.raiz, 'empresas'));
    for (const empresaId of empresas) {
      if (!idSeguro(empresaId)) continue;
      const visitas = await lerPasta(path.join(this.raiz, 'empresas', empresaId, 'visitas'));
      for (const visitaId of visitas) {
        if (!idSeguro(visitaId)) continue;
        const pasta = path.join(this.raiz, 'empresas', empresaId, 'visitas', visitaId);
        for (const nome of await lerPasta(pasta)) {
          const arquivoId = nome.replace(/\.jpg$/, '');
          if (!nome.endsWith('.jpg') || !arquivoIdValido(arquivoId)) continue;
          const info = await stat(path.join(pasta, nome));
          yield { empresaId, visitaId, arquivoId, modificadoEm: info.mtime };
        }
      }
    }
  }

  /** Apaga temporários esquecidos (por exemplo, após uma queda no meio do envio). */
  async limparTemporarios(maisAntigoQue: Date): Promise<number> {
    const pasta = path.join(this.raiz, '.tmp');
    let removidos = 0;
    for (const nome of await lerPasta(pasta)) {
      const caminho = path.join(pasta, nome);
      const info = await stat(caminho).catch(() => null);
      if (info && info.mtime < maisAntigoQue) {
        await unlink(caminho).catch(() => undefined);
        removidos += 1;
      }
    }
    return removidos;
  }
}

async function lerPasta(pasta: string): Promise<string[]> {
  try {
    return await readdir(pasta);
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw erro;
  }
}
