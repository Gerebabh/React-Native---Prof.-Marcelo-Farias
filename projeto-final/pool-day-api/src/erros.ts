export type CodigoErro =
  | 'dados-invalidos'
  | 'nao-autenticado'
  | 'sem-acesso'
  | 'nao-encontrado'
  | 'visita-executada'
  | 'arquivo-grande'
  | 'tipo-invalido'
  | 'erro-interno';

const STATUS: Record<CodigoErro, number> = {
  'dados-invalidos': 400,
  'nao-autenticado': 401,
  'sem-acesso': 403,
  'nao-encontrado': 404,
  'visita-executada': 409,
  'arquivo-grande': 413,
  'tipo-invalido': 415,
  'erro-interno': 500,
};

const MENSAGENS: Record<CodigoErro, string> = {
  'dados-invalidos': 'Os dados enviados são inválidos.',
  'nao-autenticado': 'Sua sessão expirou. Entre novamente.',
  'sem-acesso': 'Você não tem acesso a esta visita.',
  'nao-encontrado': 'Foto ou visita não encontrada.',
  'visita-executada': 'Esta visita já foi concluída e as fotos não podem ser alteradas.',
  'arquivo-grande': 'A foto é maior que o limite permitido.',
  'tipo-invalido': 'O arquivo enviado não é uma foto JPEG válida.',
  'erro-interno': 'Não foi possível concluir a operação. Tente novamente.',
};

export class ErroApi extends Error {
  readonly status: number;

  constructor(readonly codigo: CodigoErro, mensagem?: string) {
    super(mensagem ?? MENSAGENS[codigo]);
    this.name = 'ErroApi';
    this.status = STATUS[codigo];
  }

  corpo() {
    return { erro: this.codigo, mensagem: this.message };
  }
}
