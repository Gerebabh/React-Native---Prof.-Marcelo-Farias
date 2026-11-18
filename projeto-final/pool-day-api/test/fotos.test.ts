import { readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { limparOrfaos } from '../src/limpeza.js';
import { camposValidos, criarAmbiente, formulario, jpeg, png } from './apoio.js';

type Ambiente = Awaited<ReturnType<typeof criarAmbiente>>;
let ambiente: Ambiente;

beforeEach(async () => {
  ambiente = await criarAmbiente();
});

afterEach(async () => {
  await ambiente.fechar();
});

async function enviar(uid: string | null, visitaId: string, campos = camposValidos(), arquivo?: Parameters<typeof formulario>[1]) {
  const corpo = formulario(campos, arquivo ?? { conteudo: await jpeg() });
  return ambiente.app.inject({
    method: 'POST',
    url: `/api/visitas/${visitaId}/fotos`,
    headers: { ...corpo.headers, ...(uid ? { authorization: `Bearer token-${uid}` } : {}) },
    payload: corpo.payload,
  });
}

function consultar(uid: string | null, visitaId: string, campoFoto = 'fotoAntes') {
  return ambiente.app.inject({
    method: 'GET',
    url: `/api/visitas/${visitaId}/fotos/${campoFoto}`,
    headers: uid ? { authorization: `Bearer token-${uid}` } : {},
  });
}

async function arquivosGuardados(empresaId: string, visitaId: string) {
  try {
    return await readdir(path.join(ambiente.pasta, 'empresas', empresaId, 'visitas', visitaId));
  } catch {
    return [];
  }
}

describe('envio e consulta pelo usuário atribuído', () => {
  it('tratador atribuído envia e consulta a foto', async () => {
    const envio = await enviar('tratA', 'visita1');
    expect(envio.statusCode).toBe(201);
    const corpo = envio.json();
    expect(corpo.campoFoto).toBe('fotoAntes');
    expect(corpo.foto).toMatchObject({ latitude: -15.79, longitude: -47.88, endereco: 'Rua Exemplo, 100', enviadaPorUid: 'tratA' });
    expect(corpo.foto.arquivoId).toMatch(/^[0-9a-f-]{36}$/);

    const visita = await ambiente.repositorio.obterVisita('empresaA', 'visita1');
    expect(visita?.fotoAntes).toEqual(corpo.foto);

    const consulta = await consultar('tratA', 'visita1');
    expect(consulta.statusCode).toBe(200);
    expect(consulta.headers['content-type']).toBe('image/jpeg');
    expect(consulta.headers['cache-control']).toBe('private, no-store');
    expect((await sharp(consulta.rawPayload).metadata()).format).toBe('jpeg');
  });

  it('responsável envia em visita atribuída a ele mesmo', async () => {
    expect((await enviar('respA', 'visitaDoResp')).statusCode).toBe(201);
  });

  it('não confia em empresaId, usuarioUid ou tratadorUid enviados pelo app', async () => {
    const campos = { ...camposValidos(), empresaId: 'empresaB', usuarioUid: 'respB', tratadorUid: 'respB', enviadaPorUid: 'respB' };
    const envio = await enviar('tratA', 'visita1', campos);
    expect(envio.statusCode).toBe(201);
    expect(envio.json().foto.enviadaPorUid).toBe('tratA');
    expect(await arquivosGuardados('empresaB', 'visita1')).toHaveLength(0);
    expect(await arquivosGuardados('empresaA', 'visita1')).toHaveLength(1);
  });

  it('remove os metadados EXIF da foto guardada', async () => {
    await enviar('tratA', 'visita1');
    const consulta = await consultar('tratA', 'visita1');
    expect((await sharp(consulta.rawPayload).metadata()).exif).toBeUndefined();
  });
});

describe('responsável da empresa', () => {
  it('responsável ativo consulta a foto de visita de outro tratador', async () => {
    await enviar('tratA', 'visita1');
    expect((await consultar('respA', 'visita1')).statusCode).toBe(200);
  });

  it('responsável não envia em visita atribuída a outro tratador', async () => {
    const envio = await enviar('respA', 'visita1');
    expect(envio.statusCode).toBe(403);
    expect(await arquivosGuardados('empresaA', 'visita1')).toHaveLength(0);
  });
});

describe('isolamento entre empresas e papéis', () => {
  it('usuário de outra empresa não envia nem consulta, mesmo sabendo os IDs', async () => {
    const original = await enviar('tratA', 'visita1');
    const arquivoId = original.json().foto.arquivoId;

    const envio = await enviar('respB', 'visita1');
    expect(envio.statusCode).toBe(404);
    expect(envio.json()).toEqual({ erro: 'nao-encontrado', mensagem: expect.any(String) });

    const consulta = await consultar('respB', 'visita1');
    expect(consulta.statusCode).toBe(404);
    // Conhecer o arquivoId também não adianta: não há rota que receba esse ID.
    expect((await consultar('respB', 'visita1', arquivoId)).statusCode).toBe(404);
    expect((await ambiente.app.inject({ method: 'GET', url: `/empresas/empresaA/visitas/visita1/${arquivoId}.jpg`, headers: { authorization: 'Bearer token-respB' } })).statusCode).toBe(404);
  });

  it('tratador não atribuído não consulta nem envia', async () => {
    await enviar('tratA', 'visita1');
    expect((await consultar('tratOutro', 'visita1')).statusCode).toBe(403);
    expect((await enviar('tratOutro', 'visita1')).statusCode).toBe(403);
  });

  it('membro inativo não acessa fotos, nem da visita atribuída a ele', async () => {
    expect((await enviar('tratInativo', 'visitaInativo')).statusCode).toBe(403);
    expect((await consultar('tratInativo', 'visitaInativo')).statusCode).toBe(403);
  });

  it('sem token ou com token inválido responde 401', async () => {
    expect((await enviar(null, 'visita1')).statusCode).toBe(401);
    expect((await consultar(null, 'visita1')).statusCode).toBe(401);
    const invalido = await ambiente.app.inject({ method: 'GET', url: '/api/visitas/visita1/fotos/fotoAntes', headers: { authorization: 'Bearer forjado' } });
    expect(invalido.statusCode).toBe(401);
  });

  it('usuário sem perfil no Firestore não tem acesso', async () => {
    expect((await consultar('desconhecido', 'visita1')).statusCode).toBe(403);
  });
});

describe('substituição e bloqueio após execução', () => {
  it('troca a foto com a visita aberta e apaga a anterior só depois', async () => {
    const primeira = (await enviar('tratA', 'visita1')).json().foto.arquivoId;
    const segunda = await enviar('tratA', 'visita1');
    expect(segunda.statusCode).toBe(201);
    const novoId = segunda.json().foto.arquivoId;
    expect(novoId).not.toBe(primeira);
    expect(await arquivosGuardados('empresaA', 'visita1')).toEqual([`${novoId}.jpg`]);
  });

  it('não permite enviar nem trocar foto depois da visita executada', async () => {
    const envio = await enviar('tratA', 'visitaExecutada');
    expect(envio.statusCode).toBe(409);
    expect(envio.json().erro).toBe('visita-executada');
    expect(await arquivosGuardados('empresaA', 'visitaExecutada')).toHaveLength(0);
  });

  it('a foto de uma visita executada continua visível', async () => {
    await enviar('tratA', 'visita1');
    ambiente.repositorio.visitas.get('empresaA/visita1')!.status = 'Executada';
    expect((await consultar('tratA', 'visita1')).statusCode).toBe(200);
    expect((await enviar('tratA', 'visita1')).statusCode).toBe(409);
    expect(await arquivosGuardados('empresaA', 'visita1')).toHaveLength(1);
  });

  it('não existe rota para apagar foto', async () => {
    await enviar('tratA', 'visita1');
    const exclusao = await ambiente.app.inject({ method: 'DELETE', url: '/api/visitas/visita1/fotos/fotoAntes', headers: { authorization: 'Bearer token-tratA' } });
    expect(exclusao.statusCode).toBe(404);
    expect(await arquivosGuardados('empresaA', 'visita1')).toHaveLength(1);
  });
});

describe('validação do arquivo e dos campos', () => {
  it('rejeita arquivo maior que o limite', async () => {
    await ambiente.fechar();
    ambiente = await criarAmbiente({ tamanhoMaximoBytes: 1024 });
    const grande = Buffer.concat([await jpeg(800, 800), Buffer.alloc(4096)]);
    const envio = await enviar('tratA', 'visita1', camposValidos(), { conteudo: grande });
    expect(envio.statusCode).toBe(413);
    expect(envio.json().erro).toBe('arquivo-grande');
    expect(await arquivosGuardados('empresaA', 'visita1')).toHaveLength(0);
  });

  it('rejeita PNG mesmo declarado como image/jpeg', async () => {
    const envio = await enviar('tratA', 'visita1', camposValidos(), { conteudo: await png(), tipo: 'image/jpeg', nome: 'foto.jpg' });
    expect(envio.statusCode).toBe(415);
    expect(envio.json().erro).toBe('tipo-invalido');
  });

  it('rejeita arquivo que começa como JPEG mas não abre', async () => {
    const falso = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('<?php echo 1; ?>')]);
    const envio = await enviar('tratA', 'visita1', camposValidos(), { conteudo: falso });
    expect(envio.statusCode).toBe(415);
  });

  it('rejeita campoFoto inválido, coordenadas fora da faixa e data inválida', async () => {
    expect((await enviar('tratA', 'visita1', { ...camposValidos(), campoFoto: 'fotoQualquer' as 'fotoAntes' })).statusCode).toBe(400);
    expect((await enviar('tratA', 'visita1', { ...camposValidos(), latitude: '91' })).statusCode).toBe(400);
    expect((await enviar('tratA', 'visita1', { ...camposValidos(), longitude: 'abc' })).statusCode).toBe(400);
    expect((await enviar('tratA', 'visita1', { ...camposValidos(), capturadaEm: 'ontem' })).statusCode).toBe(400);
    expect((await enviar('tratA', 'visita1', { ...camposValidos(), capturadaEm: new Date(Date.now() + 86_400_000).toISOString() })).statusCode).toBe(400);
    expect(await arquivosGuardados('empresaA', 'visita1')).toHaveLength(0);
  });

  it('rejeita envio sem arquivo ou com dois arquivos', async () => {
    const semArquivo = formulario(camposValidos());
    const resposta = await ambiente.app.inject({ method: 'POST', url: '/api/visitas/visita1/fotos', headers: { ...semArquivo.headers, authorization: 'Bearer token-tratA' }, payload: semArquivo.payload });
    expect(resposta.statusCode).toBe(400);

    const outroCampo = await enviar('tratA', 'visita1', camposValidos(), { conteudo: await jpeg(), campo: 'outro' });
    expect(outroCampo.statusCode).toBe(400);
  });

  it('rejeita corpo que não é multipart', async () => {
    const resposta = await ambiente.app.inject({
      method: 'POST',
      url: '/api/visitas/visita1/fotos',
      headers: { authorization: 'Bearer token-tratA', 'content-type': 'application/json' },
      payload: JSON.stringify({ arquivo: 'base64...' }),
    });
    expect(resposta.statusCode).toBe(400);
  });
});

describe('falhas e órfãos', () => {
  it('falha ao gravar metadados remove o arquivo novo e mantém a foto anterior', async () => {
    const original = (await enviar('tratA', 'visita1')).json().foto;
    ambiente.repositorio.falharGravacao = true;
    const envio = await enviar('tratA', 'visita1');
    expect(envio.statusCode).toBe(500);
    expect(envio.json()).toEqual({ erro: 'erro-interno', mensagem: expect.any(String) });
    expect(await arquivosGuardados('empresaA', 'visita1')).toEqual([`${original.arquivoId}.jpg`]);
    expect((await ambiente.repositorio.obterVisita('empresaA', 'visita1'))?.fotoAntes).toEqual(original);
  });

  it('a limpeza remove só arquivos sem referência com mais de 24 horas', async () => {
    const valido = (await enviar('tratA', 'visita1')).json().foto.arquivoId;
    const orfao = await ambiente.armazenamento.salvar('empresaA', 'visita1', await jpeg());
    const daVisitaApagada = await ambiente.armazenamento.salvar('empresaA', 'visitaApagada', await jpeg());

    expect(await limparOrfaos(ambiente.repositorio, ambiente.armazenamento)).toBe(0);

    const amanha = new Date(Date.now() + 25 * 60 * 60 * 1000);
    expect(await limparOrfaos(ambiente.repositorio, ambiente.armazenamento, amanha)).toBe(2);
    expect(await arquivosGuardados('empresaA', 'visita1')).toEqual([`${valido}.jpg`]);
    expect(await arquivosGuardados('empresaA', 'visitaApagada')).toHaveLength(0);
    expect(orfao).not.toBe(daVisitaApagada);
  });
});

describe('o que a API nunca revela', () => {
  it('nenhuma resposta contém caminho do servidor ou URL pública', async () => {
    const respostas = [
      await enviar('tratA', 'visita1'),
      await enviar('tratOutro', 'visita1'),
      await enviar('tratA', 'visitaExecutada'),
      await enviar('respB', 'visita1'),
      await consultar('respB', 'visita1'),
      await consultar('tratA', 'naoExiste'),
    ];
    ambiente.repositorio.falharGravacao = true;
    respostas.push(await enviar('tratA', 'visita1'));

    for (const resposta of respostas) {
      expect(resposta.body).not.toContain(ambiente.pasta);
      expect(resposta.body).not.toMatch(/https?:\/\//);
      expect(resposta.body).not.toMatch(/empresas\//);
      expect(resposta.body).not.toContain('Firestore indisponível');
    }
  });

  it('IDs com caracteres de caminho são recusados', async () => {
    expect((await consultar('tratA', '..%2F..%2Fetc')).statusCode).toBe(404);
    expect((await consultar('tratA', 'visita1', '..%2Fx')).statusCode).toBe(404);
  });
});
