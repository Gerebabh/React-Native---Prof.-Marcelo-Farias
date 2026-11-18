import sharp from 'sharp';
import { ErroApi } from './erros.js';

const LIMITE_PIXELS = 40_000_000;
const LADO_MAXIMO = 2560;

function pareceJpeg(buffer: Buffer): boolean {
  return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

/**
 * Confere que o conteúdo é mesmo um JPEG que abre, aplica a rotação do EXIF,
 * limita o tamanho e regrava sem metadados (EXIF, GPS do arquivo, etc.).
 */
export async function prepararJpeg(buffer: Buffer): Promise<Buffer> {
  if (!pareceJpeg(buffer)) {
    throw new ErroApi('tipo-invalido');
  }

  try {
    const imagem = sharp(buffer, { limitInputPixels: LIMITE_PIXELS, failOn: 'error' });
    const info = await imagem.metadata();
    if (info.format !== 'jpeg') {
      throw new ErroApi('tipo-invalido');
    }
    return await imagem
      .rotate()
      .resize({ width: LADO_MAXIMO, height: LADO_MAXIMO, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
  } catch (erro) {
    if (erro instanceof ErroApi) throw erro;
    throw new ErroApi('tipo-invalido');
  }
}
