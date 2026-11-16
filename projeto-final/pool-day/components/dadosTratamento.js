export const produtosTratamento = [
  'Alcalinizante',
  'Elevador de pH',
  'Redutor de pH',
  'Cloro',
  'Floculante/Clarificante',
  'Algicida',
];

export function montarOrientacaoTratamento(piscina) {
  const produtos = (piscina?.tratamentoPadrao || [])
    .map((item) => `${item.produto}: ${item.quantidade} ${item.unidade}`.trim())
    .join('\n');
  const observacoes = piscina?.orientacoesTratamento?.trim();

  return [produtos, observacoes].filter(Boolean).join('\n');
}
