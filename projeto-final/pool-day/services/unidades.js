const unidadesPeso = ['g', 'kg'];
const unidadesVolume = ['ml', 'L'];

export function normalizarUnidade(unidade) {
  const valor = String(unidade || '').trim().toLocaleLowerCase('pt-BR');
  if (['g', 'grama', 'gramas'].includes(valor)) return 'g';
  if (['kg', 'quilo', 'quilos', 'quilograma', 'quilogramas'].includes(valor)) return 'kg';
  if (['l', 'litro', 'litros'].includes(valor)) return 'L';
  if (['ml', 'mililitro', 'mililitros'].includes(valor)) return 'ml';
  if (['un', 'un.', 'unidade', 'unidades'].includes(valor)) return 'UN';
  return '';
}

export function unidadesDaDose(unidadeEstoque) {
  const unidade = normalizarUnidade(unidadeEstoque);
  if (unidadesPeso.includes(unidade)) return unidadesPeso;
  if (unidadesVolume.includes(unidade)) return unidadesVolume;
  return unidade ? [unidade] : [];
}

export function converterParaUnidadeEstoque(quantidade, unidadeDose, unidadeEstoque) {
  const valor = Number(quantidade);
  const dose = normalizarUnidade(unidadeDose);
  const estoque = normalizarUnidade(unidadeEstoque);
  if (!Number.isFinite(valor)) return null;
  if (dose === estoque && dose) return valor;
  if (dose === 'g' && estoque === 'kg') return valor / 1000;
  if (dose === 'kg' && estoque === 'g') return valor * 1000;
  if (dose === 'ml' && estoque === 'L') return valor / 1000;
  if (dose === 'L' && estoque === 'ml') return valor * 1000;
  return null;
}
