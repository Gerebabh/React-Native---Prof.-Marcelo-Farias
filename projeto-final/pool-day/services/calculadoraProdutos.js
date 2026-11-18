function numero(valor) {
  if (typeof valor === 'number') return valor;
  if (typeof valor !== 'string' || !valor.trim()) return NaN;
  return Number(valor.trim().replace(',', '.'));
}

export function normalizarPh(valor) {
  const ph = numero(valor);
  return Number.isFinite(ph) && ph >= 0 && ph <= 14 ? ph : null;
}

export function calcularQuantidadeParaPiscina(quantidadeRotulo, volumeRotuloLitros, volumePiscinaLitros) {
  const quantidade = numero(quantidadeRotulo);
  const volumeRotulo = numero(volumeRotuloLitros);
  const volumePiscina = numero(volumePiscinaLitros);
  if (![quantidade, volumeRotulo, volumePiscina].every(Number.isFinite)
    || quantidade <= 0 || volumeRotulo <= 0 || volumePiscina <= 0) return null;
  return Number((quantidade * volumePiscina / volumeRotulo).toFixed(4));
}
