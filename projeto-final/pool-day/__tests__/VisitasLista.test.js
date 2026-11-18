import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
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
  const tela = await render(<VisitasLista visitas={visitas} />);
  const { getByText } = tela;

  await fireEvent.press(tela.getByRole('button', { name: /^Expandir visita:/ }));

  expect(getByText('10/11/2026')).toBeTruthy();
  expect(getByText('Cliente — Endereço')).toBeTruthy();
  expect(getByText('Aspiração')).toBeTruthy();
  expect(getByText('Aplicar cloro conforme medição.')).toBeTruthy();
});

test('registra o pH informado na visita', async () => {
  const onSalvarPh = jest.fn(async () => true);
  const tela = await render(<VisitasLista
    visitas={[{ id: 'visita-ph', data: '18/11/2026', local: 'Casa', servico: 'Aplicar produtos', horarioChegada: '2026-11-18T12:00:00.000Z', enderecoChegada: 'Brasília' }]}
    onSalvarPh={onSalvarPh}
  />);

  await fireEvent.press(tela.getByRole('button', { name: /^Expandir visita:/ }));

  await fireEvent.changeText(tela.getByLabelText('pH medido na visita'), '7,2');
  await act(async () => {
    await fireEvent.press(tela.getByRole('button', { name: 'Registrar pH' }));
  });

  await waitFor(() => expect(onSalvarPh).toHaveBeenCalledWith('visita-ph', 7.2));
  expect(tela.getByText('Medição registrada: pH 7,2.')).toBeTruthy();
});

test('mostra o custo dos produtos na visita concluída', async () => {
  const visitas = [{ id: '2', data: '17/11/2026', local: 'Cliente — Endereço', servico: 'Aplicar produtos', status: 'Executada', custoTotalProdutos: 8.67 }];
  const tela = await render(<VisitasLista visitas={visitas} />);
  await fireEvent.press(tela.getByRole('button', { name: /^Expandir visita:/ }));

  expect(tela.getByText('Gasto com produtos: R$ 8,67')).toBeTruthy();
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

  await fireEvent.press(tela.getByRole('button', { name: /^Expandir visita:/ }));

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
  await fireEvent.press(tela.getByRole('button', { name: /^Expandir visita:/ }));
  await act(async () => concluirDownload('file:///cache/foto.jpg'));
  const miniatura = await tela.findByLabelText('Foto antes do atendimento');

  expect(miniatura.props.resizeMode).toBe('contain');
  await fireEvent.press(tela.getByRole('button', { name: 'Ampliar Foto antes do atendimento' }));
  expect(tela.getByLabelText('Foto antes do atendimento ampliada')).toBeTruthy();
  await fireEvent.press(tela.getByRole('button', { name: 'Fechar foto ampliada' }));
  expect(tela.queryByLabelText('Foto antes do atendimento ampliada')).toBeNull();
});

test('mantém cada visita recolhida e abre ou fecha seus detalhes ao tocar no cartão', async () => {
  const tela = await render(<VisitasLista visitas={[{
    id: 'visita-compacta', data: '18/11/2026', local: 'Casa da família', servico: 'Inspeção',
  }]} />);

  expect(tela.getByText('Inspeção')).toBeTruthy();
  expect(tela.queryByRole('button', { name: 'Estou aqui' })).toBeNull();
  await fireEvent.press(tela.getByRole('button', { name: 'Expandir visita: Casa da família, 18/11/2026' }));
  expect(tela.getByRole('button', { name: 'Estou aqui' })).toBeTruthy();
  await fireEvent.press(tela.getByRole('button', { name: 'Recolher visita: Casa da família, 18/11/2026' }));
  expect(tela.queryByRole('button', { name: 'Estou aqui' })).toBeNull();
});

test('ordena as visitas a fazer da data mais próxima para a mais distante', async () => {
  const tela = await render(<VisitasLista visitas={[
    { id: 'visita-antiga', data: '02/11/2026', local: 'Casa antiga', servico: 'Inspeção' },
    { id: 'visita-recente', data: '18/11/2026', local: 'Casa recente', servico: 'Aspiração' },
    { id: 'visita-meio', data: '10/11/2026', local: 'Casa do meio', servico: 'Aplicar produtos' },
  ]} />);

  const locais = tela.getAllByText(/Casa (recente|do meio|antiga)/).map((item) => item.props.children);
  expect(locais).toEqual(['Casa antiga', 'Casa do meio', 'Casa recente']);
});
