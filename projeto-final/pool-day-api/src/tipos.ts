export const CAMPOS_FOTO = ['fotoAntes', 'fotoDepois'] as const;
export type CampoFoto = (typeof CAMPOS_FOTO)[number];

export type Papel = 'responsavel' | 'tratador';

export interface MetadadosFoto {
  arquivoId: string;
  latitude: number;
  longitude: number;
  endereco?: string;
  capturadaEm: string;
  enviadaEm: string;
  enviadaPorUid: string;
}

export interface Usuario {
  empresaId?: unknown;
}

export interface Membro {
  ativo?: unknown;
  papel?: unknown;
}

export interface Visita {
  status?: unknown;
  tratadorUid?: unknown;
  fotoAntes?: { arquivoId?: unknown } | null;
  fotoDepois?: { arquivoId?: unknown } | null;
}

/** Acesso ao Firestore usado pela API. A implementação real usa o Admin SDK; os testes usam uma em memória. */
export interface Repositorio {
  obterUsuario(uid: string): Promise<Usuario | null>;
  obterMembro(empresaId: string, uid: string): Promise<Membro | null>;
  obterVisita(empresaId: string, visitaId: string): Promise<Visita | null>;
  /**
   * Grava os metadados da foto na visita de forma atômica, conferindo de novo
   * as condições de envio. Devolve o arquivoId anterior, se havia um.
   */
  gravarFoto(entrada: {
    empresaId: string;
    visitaId: string;
    uid: string;
    campoFoto: CampoFoto;
    foto: MetadadosFoto;
  }): Promise<string | null>;
}

export type VerificarToken = (token: string) => Promise<{ uid: string }>;
