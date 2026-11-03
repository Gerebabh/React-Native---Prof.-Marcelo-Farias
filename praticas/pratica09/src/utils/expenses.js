export function validate(values) {
  const errors = {};
  const amount = Number(values.amount.replace(',', '.'));
  if (values.description.trim().length < 3) errors.description = 'Mínimo de 3 caracteres.';
  if (!Number.isFinite(amount) || amount <= 0) errors.amount = 'Informe um valor maior que zero.';
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (!(values.date instanceof Date) || Number.isNaN(values.date.getTime())) errors.date = 'Selecione uma data válida.';
  else if (values.date > today) errors.date = 'A data não pode ser futura.';
  if (!values.category) errors.category = 'Selecione uma categoria.';
  return errors;
}

export function getDataFormatada(date) {
  return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
}

export function filterRecentExpenses(expenses, today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  return expenses.filter(item => item.date >= start && item.date <= end);
}
