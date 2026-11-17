import { ErroApi } from './erros.js';
import type { Papel, Repositorio, Visita } from './tipos.js';

export interface Acesso {
  uid: string;
  empresaId: string;
  papel: Papel;
  visita: Visita;
}

const ID_SEGURO = /^[A-Za-z0-9_-]{1,128}$/;

export function idSeguro(valor: unknown): valor is string {
  return typeof valor === 'string' && ID_SEGURO.test(valor);
}

/**
 * Descobre empresa e papel a partir do UID verificado e confere se a pessoa
 * pode ver a visita. Nada aqui vem do corpo da requisição.
 */
export async function resolverAcesso(repositorio: Repositorio, uid: string, visitaId: string): Promise<Acesso> {
  if (!idSeguro(visitaId)) {
    throw new ErroApi('nao-encontrado');
  }

  const usuario = await repositorio.obterUsuario(uid);
  const empresaId = usuario?.empresaId;
  if (!idSeguro(empresaId)) {
    throw new ErroApi('sem-acesso');
  }

  const membro = await repositorio.obterMembro(empresaId, uid);
  if (!membro || membro.ativo !== true || (membro.papel !== 'responsavel' && membro.papel !== 'tratador')) {
    throw new ErroApi('sem-acesso');
  }
  const papel = membro.papel;

  const visita = await repositorio.obterVisita(empresaId, visitaId);
  if (!visita) {
    // Visita de outra empresa também cai aqui: não revela que o ID existe.
    throw new ErroApi('nao-encontrado');
  }

  if (papel === 'tratador' && visita.tratadorUid !== uid) {
    throw new ErroApi('sem-acesso');
  }

  return { uid, empresaId, papel, visita };
}

/** Envio exige que a visita esteja atribuída a quem envia e ainda não executada. */
export function conferirEnvio(acesso: Acesso): void {
  if (acesso.visita.tratadorUid !== acesso.uid) {
    throw new ErroApi('sem-acesso');
  }
  if (acesso.visita.status === 'Executada') {
    throw new ErroApi('visita-executada');
  }
}
