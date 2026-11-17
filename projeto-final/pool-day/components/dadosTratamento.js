export function montarOrientacaoTratamento(piscina) {
  const produtos = (piscina?.tratamentoPadrao || [])
    .map((item) => `${item.produto}: ${item.quantidade} ${item.unidade}`.trim())
    .join('\n');
  const observacoes = piscina?.orientacoesTratamento?.trim();

  return [produtos, observacoes].filter(Boolean).join('\n');
}
