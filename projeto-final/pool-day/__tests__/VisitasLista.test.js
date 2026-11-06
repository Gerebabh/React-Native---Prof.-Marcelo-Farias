import { render } from '@testing-library/react-native';
import VisitasLista from '../components/VisitasLista';

test('mostra mensagem quando não há visitas programadas', async () => {
  const { getByText } = await render(<VisitasLista visitas={[]} />);

  expect(getByText('Nenhuma visita programada.')).toBeTruthy();
});

test('mostra data, serviço e orientação de produto das visitas', async () => {
  const visitas = [{
    id: '1',
    data: '10/11/2026',
    local: 'Cliente — Endereço',
    servico: 'Aspiração',
    orientacao: 'Aplicar cloro conforme medição.',
  }];
  const { getByText } = await render(<VisitasLista visitas={visitas} />);

  expect(getByText('10/11/2026')).toBeTruthy();
  expect(getByText('Cliente — Endereço')).toBeTruthy();
  expect(getByText('Aspiração')).toBeTruthy();
  expect(getByText('Aplicar cloro conforme medição.')).toBeTruthy();
});
