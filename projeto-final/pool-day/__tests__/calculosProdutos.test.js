import { calcularQuantidadeParaPiscina, normalizarPh } from '../services/calculadoraProdutos';

describe('cálculo de produto proporcional à litragem', () => {
  test('ajusta a dose do rótulo para a litragem da piscina', () => {
    expect(calcularQuantidadeParaPiscina(20, 10000, 13000)).toBe(26);
  });

  test('aceita números decimais digitados com vírgula', () => {
    expect(calcularQuantidadeParaPiscina('2,5', '1000', '13000')).toBe(32.5);
  });

  test.each([
    [0, 10000, 13000],
    [20, 0, 13000],
    [20, 10000, 0],
    ['texto', 10000, 13000],
  ])('recusa valores inválidos: dose %s, volume do rótulo %s, piscina %s', (dose, volumeRotulo, piscina) => {
    expect(calcularQuantidadeParaPiscina(dose, volumeRotulo, piscina)).toBeNull();
  });
});

describe('validação de pH medido', () => {
  test('aceita a faixa de 0 a 14 e decimal com vírgula', () => {
    expect(normalizarPh('7,2')).toBe(7.2);
    expect(normalizarPh('0')).toBe(0);
    expect(normalizarPh('14')).toBe(14);
  });

  test.each(['', 'texto', '-0,1', '14,1'])('recusa medição inválida: %s', (valor) => {
    expect(normalizarPh(valor)).toBeNull();
  });
});
