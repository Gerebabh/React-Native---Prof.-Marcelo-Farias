import { act, fireEvent, render } from '@testing-library/react-native';
import VisitasLista from '../components/VisitasLista';

jest.mock('../services/fotosVisita', () => ({
  baixarFotoVisita: jest.fn(async () => 'file:///cache/foto.jpg'),
}));

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

test('mostra o custo dos produtos na visita concluída', async () => {
  const visitas = [{ id: '2', data: '17/11/2026', local: 'Cliente — Endereço', servico: 'Aplicar produtos', status: 'Executada', custoTotalProdutos: 8.67 }];
  const { getByText } = await render(<VisitasLista visitas={visitas} />);

  expect(getByText('Gasto com produtos: R$ 8,67')).toBeTruthy();
});

test('mostra uma mensagem quando a API não consegue carregar a foto', async () => {
  const { baixarFotoVisita } = require('../services/fotosVisita');
  baixarFotoVisita.mockRejectedValueOnce(new Error('HTTP 401'));
  const tela = await render(<VisitasLista
    visitas={[{
      id: 'visita-1', data: '17/11/2026', local: 'Cliente — Endereço', servico: 'Inspeção',
      fotoAntes: { arquivoId: 'foto-1', latitude: -15.79, longitude: -47.88 },
    }]}
    tokenFotos="token-teste"
  />);

  expect(await tela.findByText('Não foi possível carregar a foto. Confira a conexão e recarregue a tela.')).toBeTruthy();
});

test('mostra a foto inteira ao tocar na miniatura e permite fechar a ampliação', async () => {
  let concluirDownload;
  const { baixarFotoVisita } = require('../services/fotosVisita');
  baixarFotoVisita.mockImplementationOnce(() => new Promise((resolver) => { concluirDownload = resolver; }));
  const tela = await render(<VisitasLista
    visitas={[{
      id: 'visita-1', data: '17/11/2026', local: 'Cliente — Endereço', servico: 'Inspeção',
      fotoAntes: { arquivoId: 'foto-1', latitude: -15.79, longitude: -47.88 },
    }]}
    tokenFotos="token-teste"
  />);
  await act(async () => concluirDownload('file:///cache/foto.jpg'));
  const miniatura = await tela.findByLabelText('Foto antes do atendimento');

  expect(miniatura.props.resizeMode).toBe('contain');
  await fireEvent.press(tela.getByRole('button', { name: 'Ampliar Foto antes do atendimento' }));
  expect(tela.getByLabelText('Foto antes do atendimento ampliada')).toBeTruthy();
  await fireEvent.press(tela.getByRole('button', { name: 'Fechar foto ampliada' }));
  expect(tela.queryByLabelText('Foto antes do atendimento ampliada')).toBeNull();
});
