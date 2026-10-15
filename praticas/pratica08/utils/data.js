export function getDataFormatada(data) {
  return data.getDate() + '/' + (data.getMonth() + 1) + '/' + data.getFullYear();
}

export function filtrarRecentes(despesas, hoje = new Date()) {
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 6);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59, 999);
  return despesas.filter(item => item.data >= inicio && item.data <= fim);
}
