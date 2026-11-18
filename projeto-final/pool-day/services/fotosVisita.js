import { obterToken } from './firebase';
import { File } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';

function enderecoDaApi(visitaId, sufixo = '') {
  const apiFotos = (process.env.EXPO_PUBLIC_API_FOTOS_URL || '').replace(/\/$/, '');
  if (!apiFotos) {
    const erro = new Error('A API de fotos não está configurada.');
    erro.code = 'api-nao-configurada';
    throw erro;
  }
  return `${apiFotos}/api/visitas/${encodeURIComponent(visitaId)}/fotos${sufixo}`;
}

async function lerResposta(resposta) {
  let dados;
  try {
    dados = await resposta.json();
  } catch (_erro) {
    dados = {};
  }
  if (!resposta.ok) {
    const erro = new Error(dados.mensagem || 'Não foi possível enviar a foto. Tente novamente.');
    erro.code = dados.erro || `http-${resposta.status}`;
    throw erro;
  }
  return dados;
}

export async function enviarFotoVisita(visitaId, campoFoto, dados) {
  const token = await obterToken();
  const corpo = new FormData();
  const arquivo = new File(dados.uri);
  corpo.append('arquivo', arquivo, 'foto.jpg');
  corpo.append('campoFoto', campoFoto);
  corpo.append('latitude', String(dados.latitude));
  corpo.append('longitude', String(dados.longitude));
  corpo.append('capturadaEm', dados.capturadaEm);
  if (dados.endereco) corpo.append('endereco', dados.endereco.slice(0, 300));

  const resposta = await fetch(enderecoDaApi(visitaId), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: corpo,
  });
  return (await lerResposta(resposta)).foto;
}

export async function baixarFotoVisita(visitaId, campoFoto, arquivoId, token) {
  const nomeArquivo = `foto-${encodeURIComponent(visitaId)}-${campoFoto}-${encodeURIComponent(arquivoId)}.jpg`;
  const destino = `${FileSystem.cacheDirectory}${nomeArquivo}`;
  const resposta = await FileSystem.downloadAsync(
    enderecoDaApi(visitaId, `/${campoFoto}`),
    destino,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (resposta.status !== 200) {
    await FileSystem.deleteAsync(resposta.uri, { idempotent: true }).catch(() => {});
    const erro = new Error(`HTTP ${resposta.status}`);
    erro.code = `http-${resposta.status}`;
    throw erro;
  }

  return resposta.uri;
}
