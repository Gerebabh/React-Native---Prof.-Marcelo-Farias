import type { FastifyBaseLogger } from 'fastify';
import type { Armazenamento } from './armazenamento.js';
import { CAMPOS_FOTO, type Repositorio } from './tipos.js';

const UM_DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Remove arquivos que nenhuma visita referencia há mais de 24 horas:
 * fotos substituídas cuja remoção falhou, envios interrompidos e fotos de
 * visitas excluídas. A margem de 24 h evita apagar um envio em andamento.
 */
export async function limparOrfaos(repositorio: Repositorio, armazenamento: Armazenamento, agora = new Date()): Promise<number> {
  const limite = new Date(agora.getTime() - UM_DIA_MS);
  let removidos = await armazenamento.limparTemporarios(limite);

  for await (const arquivo of armazenamento.listar()) {
    if (arquivo.modificadoEm >= limite) continue;
    const visita = await repositorio.obterVisita(arquivo.empresaId, arquivo.visitaId);
    const referenciado = visita !== null && CAMPOS_FOTO.some((campo) => visita[campo]?.arquivoId === arquivo.arquivoId);
    if (!referenciado) {
      await armazenamento.remover(arquivo.empresaId, arquivo.visitaId, arquivo.arquivoId);
      removidos += 1;
    }
  }
  return removidos;
}

export function agendarLimpeza(repositorio: Repositorio, armazenamento: Armazenamento, log: FastifyBaseLogger): () => void {
  const executar = () => {
    limparOrfaos(repositorio, armazenamento)
      .then((removidos) => log.info({ removidos }, 'limpeza de fotos órfãs concluída'))
      .catch((erro: unknown) => log.error({ err: { message: erro instanceof Error ? erro.message : String(erro) } }, 'falha na limpeza de fotos órfãs'));
  };
  const inicial = setTimeout(executar, 60_000);
  const diaria = setInterval(executar, UM_DIA_MS);
  inicial.unref();
  diaria.unref();
  return () => {
    clearTimeout(inicial);
    clearInterval(diaria);
  };
}
