import type { Firestore } from 'firebase-admin/firestore';
import { ErroApi } from './erros.js';
import type { CampoFoto, MetadadosFoto, Membro, Repositorio, Usuario, Visita } from './tipos.js';

export class RepositorioFirestore implements Repositorio {
  constructor(private readonly banco: Firestore) {}

  async obterUsuario(uid: string): Promise<Usuario | null> {
    const documento = await this.banco.doc(`usuarios/${uid}`).get();
    return documento.exists ? (documento.data() as Usuario) : null;
  }

  async obterMembro(empresaId: string, uid: string): Promise<Membro | null> {
    const documento = await this.banco.doc(`empresas/${empresaId}/membros/${uid}`).get();
    return documento.exists ? (documento.data() as Membro) : null;
  }

  async obterVisita(empresaId: string, visitaId: string): Promise<Visita | null> {
    const documento = await this.banco.doc(`empresas/${empresaId}/visitas/${visitaId}`).get();
    return documento.exists ? (documento.data() as Visita) : null;
  }

  async gravarFoto(entrada: { empresaId: string; visitaId: string; uid: string; campoFoto: CampoFoto; foto: MetadadosFoto }): Promise<string | null> {
    const { empresaId, visitaId, uid, campoFoto, foto } = entrada;
    const referenciaVisita = this.banco.doc(`empresas/${empresaId}/visitas/${visitaId}`);
    const referenciaMembro = this.banco.doc(`empresas/${empresaId}/membros/${uid}`);

    return this.banco.runTransaction(async (transacao) => {
      const [visitaDoc, membroDoc] = await transacao.getAll(referenciaVisita, referenciaMembro);
      if (!visitaDoc?.exists) {
        throw new ErroApi('nao-encontrado');
      }
      const membro = membroDoc?.data() as Membro | undefined;
      if (!membro || membro.ativo !== true) {
        throw new ErroApi('sem-acesso');
      }
      const visita = visitaDoc.data() as Visita;
      if (visita.tratadorUid !== uid) {
        throw new ErroApi('sem-acesso');
      }
      if (visita.status === 'Executada') {
        throw new ErroApi('visita-executada');
      }
      const anterior = visita[campoFoto]?.arquivoId;
      transacao.update(referenciaVisita, { [campoFoto]: foto });
      return typeof anterior === 'string' ? anterior : null;
    });
  }
}
