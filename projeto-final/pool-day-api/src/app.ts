import Fastify, { type FastifyBaseLogger, type FastifyInstance, type FastifyRequest } from 'fastify';
import multipart from '@fastify/multipart';
import { conferirEnvio, resolverAcesso } from './acesso.js';
import { Armazenamento, arquivoIdValido } from './armazenamento.js';
import { ErroApi } from './erros.js';
import { prepararJpeg } from './imagem.js';
import { CAMPOS_FOTO, type CampoFoto, type MetadadosFoto, type Repositorio, type VerificarToken } from './tipos.js';

export interface Dependencias {
  repositorio: Repositorio;
  armazenamento: Armazenamento;
  verificarToken: VerificarToken;
  tamanhoMaximoBytes?: number;
  logger?: boolean | FastifyBaseLogger | Record<string, unknown>;
  agora?: () => Date;
}

const TAMANHO_PADRAO = 8 * 1024 * 1024;
const TOLERANCIA_FUTURO_MS = 10 * 60 * 1000;

const ERROS_DE_REQUISICAO = new Set([
  'FST_INVALID_MULTIPART_CONTENT_TYPE',
  'FST_FILES_LIMIT',
  'FST_FIELDS_LIMIT',
  'FST_PARTS_LIMIT',
  'FST_PROTO_VIOLATION',
  'FST_ERR_CTP_INVALID_MEDIA_TYPE',
  'FST_ERR_CTP_EMPTY_JSON_BODY',
  'FST_ERR_CTP_INVALID_CONTENT_LENGTH',
]);

export function construirApp(dependencias: Dependencias): FastifyInstance {
  const { repositorio, armazenamento, verificarToken } = dependencias;
  const tamanhoMaximo = dependencias.tamanhoMaximoBytes ?? TAMANHO_PADRAO;
  const agora = dependencias.agora ?? (() => new Date());

  const loggerPadrao = {
    level: process.env.LOG_LEVEL || 'info',
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  };
  const app = Fastify({
    trustProxy: '127.0.0.1',
    bodyLimit: 64 * 1024,
    ...(dependencias.logger && typeof dependencias.logger === 'object' && 'child' in dependencias.logger
      ? { loggerInstance: dependencias.logger as FastifyBaseLogger }
      : { logger: dependencias.logger === false ? false : dependencias.logger ?? loggerPadrao }),
  });

  app.register(multipart, {
    limits: {
      fileSize: tamanhoMaximo,
      files: 1,
      fields: 10,
      fieldSize: 1024,
      parts: 12,
      headerPairs: 50,
    },
  });

  app.addHook('onSend', async (_requisicao, resposta) => {
    resposta.header('X-Content-Type-Options', 'nosniff');
    if (!resposta.hasHeader('Cache-Control')) {
      resposta.header('Cache-Control', 'no-store');
    }
  });

  app.setNotFoundHandler((_requisicao, resposta) => {
    const erro = new ErroApi('nao-encontrado');
    resposta.status(erro.status).send(erro.corpo());
  });

  app.setErrorHandler((erro, requisicao, resposta) => {
    let erroApi: ErroApi;
    const codigo = (erro as { code?: string }).code ?? '';
    const status = (erro as { statusCode?: number }).statusCode ?? 500;

    if (erro instanceof ErroApi) {
      erroApi = erro;
    } else if (codigo === 'FST_REQ_FILE_TOO_LARGE' || codigo === 'FST_ERR_CTP_BODY_TOO_LARGE' || status === 413) {
      erroApi = new ErroApi('arquivo-grande');
    } else if (ERROS_DE_REQUISICAO.has(codigo) || (status >= 400 && status < 500)) {
      erroApi = new ErroApi('dados-invalidos');
    } else {
      erroApi = new ErroApi('erro-interno');
    }

    if (erroApi.status >= 500) {
      // Só a mensagem e a pilha: nunca cabeçalhos, token ou corpo.
      requisicao.log.error({ err: { message: erro instanceof Error ? erro.message : String(erro), stack: erro instanceof Error ? erro.stack : undefined } }, 'falha ao atender requisição');
    }
    resposta.status(erroApi.status).header('Cache-Control', 'no-store').send(erroApi.corpo());
  });

  async function autenticar(requisicao: FastifyRequest): Promise<string> {
    const cabecalho = requisicao.headers.authorization;
    const correspondencia = typeof cabecalho === 'string' ? /^Bearer\s+(\S+)$/i.exec(cabecalho) : null;
    const token = correspondencia?.[1];
    if (!token) {
      throw new ErroApi('nao-autenticado');
    }
    try {
      const { uid } = await verificarToken(token);
      if (!uid) throw new Error('token sem uid');
      return uid;
    } catch {
      throw new ErroApi('nao-autenticado');
    }
  }

  app.get('/saude', async () => ({ ok: true }));

  app.post<{ Params: { visitaId: string } }>('/api/visitas/:visitaId/fotos', async (requisicao, resposta) => {
    const uid = await autenticar(requisicao);
    const acesso = await resolverAcesso(repositorio, uid, requisicao.params.visitaId);
    conferirEnvio(acesso);

    const { campos, arquivo } = await lerFormulario(requisicao);
    const dados = validarCampos(campos, agora());
    if (!arquivo) {
      throw new ErroApi('dados-invalidos', 'Envie a foto no campo "arquivo".');
    }
    const jpeg = await prepararJpeg(arquivo);

    const visitaId = requisicao.params.visitaId;
    const arquivoId = await armazenamento.salvar(acesso.empresaId, visitaId, jpeg);
    const foto: MetadadosFoto = {
      arquivoId,
      latitude: dados.latitude,
      longitude: dados.longitude,
      ...(dados.endereco ? { endereco: dados.endereco } : {}),
      capturadaEm: dados.capturadaEm,
      enviadaEm: agora().toISOString(),
      enviadaPorUid: uid,
    };

    let anterior: string | null;
    try {
      anterior = await repositorio.gravarFoto({ empresaId: acesso.empresaId, visitaId, uid, campoFoto: dados.campoFoto, foto });
    } catch (erro) {
      // Metadados não gravados: o arquivo novo sai e a foto anterior continua valendo.
      await armazenamento.remover(acesso.empresaId, visitaId, arquivoId).catch((erroRemocao: unknown) => {
        requisicao.log.error({ err: { message: String(erroRemocao) }, arquivoId }, 'não foi possível remover arquivo após falha; a limpeza diária remove');
      });
      throw erro;
    }

    if (anterior && anterior !== arquivoId && arquivoIdValido(anterior)) {
      await armazenamento.remover(acesso.empresaId, visitaId, anterior).catch((erroRemocao: unknown) => {
        requisicao.log.warn({ err: { message: String(erroRemocao) }, arquivoId: anterior }, 'foto substituída não removida; a limpeza diária remove');
      });
    }

    return resposta.status(201).send({ campoFoto: dados.campoFoto, foto });
  });

  app.get<{ Params: { visitaId: string; campoFoto: string } }>('/api/visitas/:visitaId/fotos/:campoFoto', async (requisicao, resposta) => {
    const uid = await autenticar(requisicao);
    const acesso = await resolverAcesso(repositorio, uid, requisicao.params.visitaId);
    const campoFoto = requisicao.params.campoFoto;
    if (!ehCampoFoto(campoFoto)) {
      throw new ErroApi('nao-encontrado');
    }
    const arquivoId = acesso.visita[campoFoto]?.arquivoId;
    if (!arquivoIdValido(arquivoId)) {
      throw new ErroApi('nao-encontrado');
    }
    const aberto = await armazenamento.abrir(acesso.empresaId, requisicao.params.visitaId, arquivoId);
    if (!aberto) {
      throw new ErroApi('nao-encontrado');
    }
    return resposta
      .header('Content-Type', 'image/jpeg')
      .header('Content-Length', aberto.tamanho)
      .header('Cache-Control', 'private, no-store')
      .send(aberto.fluxo);
  });

  return app;
}

function ehCampoFoto(valor: unknown): valor is CampoFoto {
  return typeof valor === 'string' && (CAMPOS_FOTO as readonly string[]).includes(valor);
}

async function lerFormulario(requisicao: FastifyRequest): Promise<{ campos: Map<string, string>; arquivo: Buffer | null }> {
  if (!requisicao.isMultipart()) {
    throw new ErroApi('dados-invalidos', 'Envie a foto como multipart/form-data.');
  }
  const campos = new Map<string, string>();
  let arquivo: Buffer | null = null;
  for await (const parte of requisicao.parts()) {
    if (parte.type === 'file') {
      if (parte.fieldname !== 'arquivo' || arquivo) {
        parte.file.resume();
        throw new ErroApi('dados-invalidos', 'Envie uma única foto no campo "arquivo".');
      }
      arquivo = await parte.toBuffer();
    } else {
      if (campos.has(parte.fieldname)) {
        throw new ErroApi('dados-invalidos');
      }
      campos.set(parte.fieldname, typeof parte.value === 'string' ? parte.value : String(parte.value));
    }
  }
  return { campos, arquivo };
}

function validarCampos(campos: Map<string, string>, agora: Date) {
  const campoFoto = campos.get('campoFoto');
  if (!ehCampoFoto(campoFoto)) {
    throw new ErroApi('dados-invalidos', 'campoFoto deve ser fotoAntes ou fotoDepois.');
  }

  const latitude = numero(campos.get('latitude'));
  const longitude = numero(campos.get('longitude'));
  if (latitude === null || latitude < -90 || latitude > 90 || longitude === null || longitude < -180 || longitude > 180) {
    throw new ErroApi('dados-invalidos', 'Latitude ou longitude inválida.');
  }

  const textoCaptura = campos.get('capturadaEm') ?? '';
  const capturada = new Date(textoCaptura);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(textoCaptura) || Number.isNaN(capturada.getTime()) || capturada.getTime() > agora.getTime() + TOLERANCIA_FUTURO_MS) {
    throw new ErroApi('dados-invalidos', 'capturadaEm deve ser uma data ISO 8601 válida.');
  }

  const endereco = campos.get('endereco')?.trim();
  if (endereco && endereco.length > 300) {
    throw new ErroApi('dados-invalidos', 'Endereço muito longo.');
  }

  return { campoFoto, latitude, longitude, capturadaEm: capturada.toISOString(), endereco: endereco || undefined };
}

function numero(texto: string | undefined): number | null {
  if (texto === undefined || texto.trim() === '') return null;
  const valor = Number(texto);
  return Number.isFinite(valor) ? valor : null;
}
