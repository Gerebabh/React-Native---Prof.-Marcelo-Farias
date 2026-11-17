import { converterParaUnidadeEstoque, normalizarUnidade, unidadesDaDose } from '../services/unidades';

describe('conversão de unidades de produto', () => {
  test('converte gramas para quilogramas antes da baixa do estoque', () => {
    expect(converterParaUnidadeEstoque(60, 'g', 'kg')).toBe(0.06);
  });

  test('converte mililitros para litros antes da baixa do estoque', () => {
    expect(converterParaUnidadeEstoque(250, 'ml', 'L')).toBe(0.25);
  });

  test('não converte unidades de dimensões diferentes', () => {
    expect(converterParaUnidadeEstoque(60, 'g', 'L')).toBeNull();
  });

  test('oferece unidades de dose compatíveis com o estoque', () => {
    expect(unidadesDaDose('kg')).toEqual(['g', 'kg']);
    expect(unidadesDaDose('L')).toEqual(['ml', 'L']);
    expect(unidadesDaDose('UN')).toEqual(['UN']);
    expect(unidadesDaDose('unidades')).toEqual(['UN']);
  });

  test('normaliza nomes antigos de unidade gravados no cadastro', () => {
    expect(normalizarUnidade('unidade')).toBe('UN');
    expect(normalizarUnidade('Litros')).toBe('L');
  });

  test('mantém a quantidade quando a dose e o estoque usam unidade', () => {
    expect(converterParaUnidadeEstoque(2, 'UN', 'UN')).toBe(2);
    expect(converterParaUnidadeEstoque(2, 'UN', 'kg')).toBeNull();
  });
});
