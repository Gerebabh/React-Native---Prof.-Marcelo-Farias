import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import App from '../App';

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}), { virtual: true });

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  hasServicesEnabledAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }) => React.createElement(View, null, children),
    SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
  };
});

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  return function SeletorData({ onValueChange }) {
    return React.createElement(View, null,
      React.createElement(Text, { onPress: () => onValueChange({ type: 'set' }, new Date(2026, 10, 10)) }, 'Selecionar no calendário'),
      React.createElement(Text, { onPress: () => { const ontem = new Date(); ontem.setDate(ontem.getDate() - 1); onValueChange({ type: 'set' }, ontem); } }, 'Selecionar data passada')
    );
  };
});

jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  function Picker({ children, onValueChange }) {
    const items = React.Children.toArray(children).filter(React.isValidElement);
    return React.createElement(View, null, items.map((item) => React.cloneElement(item, { onValueChange })));
  }
  Picker.Item = ({ label, value, onValueChange }) => React.createElement(Text, { onPress: () => onValueChange(value) }, label);
  return { Picker };
});

describe('cadastro de cliente e visitas', () => {
  let alerta;

  beforeEach(() => {
    alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    Location.hasServicesEnabledAsync.mockResolvedValue(true);
    Location.getForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Location.getCurrentPositionAsync.mockResolvedValue({ coords: { latitude: -15.79, longitude: -47.88 } });
    Location.reverseGeocodeAsync.mockResolvedValue([{
      street: 'Rua das Palmeiras', streetNumber: '45', district: 'Asa Norte', city: 'Brasília', region: 'DF',
    }]);
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null });
    ImagePicker.launchCameraAsync.mockResolvedValue({ canceled: true, assets: null });
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true });
  });
  afterEach(() => {
    alerta.mockRestore();
    jest.clearAllMocks();
  });

  async function preencherLocal(tela, { cliente = 'Casa da família', endereco = 'Rua das Flores, 10', piscina = true, litragem = '13000' } = {}) {
    const { getByPlaceholderText, getByText, getByRole } = tela;
    await fireEvent.changeText(getByPlaceholderText('Cliente'), cliente);
    await fireEvent.changeText(getByPlaceholderText('Endereço'), endereco);
    if (piscina) await fireEvent.press(getByText('Fibra'));
    await fireEvent.changeText(getByPlaceholderText('Litragem em litros (ex.: 13000)'), litragem);
    await fireEvent.press(getByRole('button', { name: 'Salvar residência' }));
  }

  test('mostra o nome do aplicativo', async () => {
    const { getByText } = await render(<App />);
    expect(getByText('Pool Day')).toBeTruthy();
  });

  test.each(['Cliente', 'Endereço', 'Tipo de piscina', 'Litragem em litros (ex.: 13000)'])(
    'exige o campo %s', async (campo) => {
      const tela = await render(<App />);
      await preencherLocal(tela, {
        cliente: campo === 'Cliente' ? '' : 'Casa da família',
        endereco: campo === 'Endereço' ? '' : 'Rua das Flores, 10',
        piscina: campo !== 'Tipo de piscina',
        litragem: campo.includes('Litragem') ? '' : '13000',
      });
      expect(alerta).toHaveBeenCalledWith('Cadastro incompleto', 'Preencha todos os campos da residência e da piscina.');
    }
  );

  test.each(['0', '-500', 'abc', '13.5'])('não aceita litragem inválida "%s"', async (litragem) => {
    const tela = await render(<App />);
    await preencherLocal(tela, { litragem });
    expect(alerta).toHaveBeenCalledWith('Litragem inválida', 'Informe uma litragem inteira maior que zero.');
  });

  test('salva cliente, endereço e tipo de piscina', async () => {
    const tela = await render(<App />);
    await preencherLocal(tela);
    expect(tela.getByText('Residência cadastrada')).toBeTruthy();
    expect(tela.getByText('Casa da família')).toBeTruthy();
    expect(tela.getByText('Piscina de Fibra • 13000 L')).toBeTruthy();
  });

  test('cadastra visita com data, local e serviço selecionados', async () => {
    const tela = await render(<App />);
    await preencherLocal(tela);
    await fireEvent.press(tela.getByText('Casa da família — Rua das Flores, 10'));
    await fireEvent.press(tela.getByRole('button', { name: 'Selecionar data da visita' }));
    await fireEvent.press(tela.getByText('Selecionar no calendário'));
    await fireEvent.press(tela.getByText('Aplicar produtos'));
    await fireEvent.changeText(tela.getByPlaceholderText('Orientação de produtos'), 'Aplicar cloro após a medição.');
    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar visita' }));

    expect(tela.getByText('10/11/2026')).toBeTruthy();
    expect(tela.getAllByText('Casa da família — Rua das Flores, 10')).toHaveLength(2);
    expect(tela.getAllByText('Aplicar produtos')).toHaveLength(2);
    expect(tela.getByText('Aplicar cloro após a medição.')).toBeTruthy();
  });

  test('não permite adicionar visita sem data, local e serviço', async () => {
    const tela = await render(<App />);
    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar visita' }));
    expect(alerta).toHaveBeenCalledWith('Cadastro incompleto', 'Preencha a data, o local e o tipo de serviço da visita.');
  });

  test('não permite agendar visita com data passada', async () => {
    const tela = await render(<App />);
    await preencherLocal(tela);
    await fireEvent.press(tela.getByText('Casa da família — Rua das Flores, 10'));
    await fireEvent.press(tela.getByRole('button', { name: 'Selecionar data da visita' }));
    await fireEvent.press(tela.getByText('Selecionar data passada'));
    await fireEvent.press(tela.getByText('Inspeção'));
    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar visita' }));

    expect(alerta).toHaveBeenCalledWith('Data inválida', 'A data da visita não pode ser anterior a hoje.');
    expect(tela.getByText('Nenhuma visita programada.')).toBeTruthy();
  });

  test('exige orientação para serviço de aplicar produtos', async () => {
    const tela = await render(<App />);
    await preencherLocal(tela);
    await fireEvent.press(tela.getByText('Casa da família — Rua das Flores, 10'));
    await fireEvent.press(tela.getByRole('button', { name: 'Selecionar data da visita' }));
    await fireEvent.press(tela.getByText('Selecionar no calendário'));
    await fireEvent.press(tela.getByText('Aplicar produtos'));
    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar visita' }));
    expect(alerta).toHaveBeenCalledWith('Orientação necessária', 'Informe os produtos ou orientações desta visita.');
  });

  test.each(['Executada', 'Frustrada', 'Não realizada'])(
    'marca a visita como %s', async (status) => {
      const tela = await render(<App visitasIniciais={[{
        id: 'visita-1',
        data: '10/11/2026',
        local: 'Casa da família — Rua das Flores, 10',
        servico: 'Inspeção',
        orientacao: '',
        status: 'Não realizada',
      }]} />);

      await fireEvent.press(tela.getByRole('button', { name: `Marcar visita como ${status}` }));
      if (status === 'Executada') {
        const chamadaConfirmacao = alerta.mock.calls.find(([titulo]) => titulo === 'Deseja concluir a visita?');
        await act(async () => chamadaConfirmacao[2].find((botao) => botao.text === 'Sim').onPress());
      }

      expect(tela.getByText(`Status: ${status}`)).toBeTruthy();
    }
  );

  test('move a visita executada para a lista de concluídas', async () => {
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1',
      data: '10/11/2026',
      local: 'Casa da família — Rua das Flores, 10',
      servico: 'Inspeção',
      status: 'Não realizada',
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Marcar visita como Executada' }));
    const chamadaConfirmacao = alerta.mock.calls.find(([titulo]) => titulo === 'Deseja concluir a visita?');
    await act(async () => chamadaConfirmacao[2].find((botao) => botao.text === 'Sim').onPress());

    expect(tela.getByText('Visitas concluídas')).toBeTruthy();
    expect(tela.getByText('Nenhuma visita programada.')).toBeTruthy();
    expect(tela.getByText('Status: Executada')).toBeTruthy();
    expect(tela.getByText('✓ Visita concluída')).toBeTruthy();
    expect(tela.queryByRole('button', { name: 'Marcar visita como Frustrada' })).toBeNull();
  });

  test.each(['Frustrada', 'Não realizada'])(
    'permite informar o motivo quando a visita fica %s', async (status) => {
      const tela = await render(<App visitasIniciais={[{
        id: 'visita-1',
        data: '10/11/2026',
        local: 'Casa da família — Rua das Flores, 10',
        servico: 'Inspeção',
        status: 'Não realizada',
      }]} />);

      await fireEvent.press(tela.getByRole('button', { name: `Marcar visita como ${status}` }));
      await fireEvent.changeText(tela.getByLabelText('Motivo da visita'), 'Cliente não estava no local.');
      await fireEvent.press(tela.getByRole('button', { name: 'Salvar justificativa' }));

      expect(tela.getByText('Justificativa registrada.')).toBeTruthy();
      expect(tela.getByDisplayValue('Cliente não estava no local.')).toBeTruthy();
    }
  );

  test('pergunta antes de concluir e permite cancelar', async () => {
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1',
      data: '10/11/2026',
      local: 'Casa da família — Rua das Flores, 10',
      servico: 'Inspeção',
      status: 'Pendente',
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Marcar visita como Executada' }));

    const chamadaConfirmacao = alerta.mock.calls.find(([titulo]) => titulo === 'Deseja concluir a visita?');
    expect(chamadaConfirmacao[1]).toBe('A visita será movida para Visitas concluídas e não poderá ser alterada.');
    await act(async () => chamadaConfirmacao[2].find((botao) => botao.text === 'Não').onPress());

    expect(tela.getByText('Status: Pendente')).toBeTruthy();
    expect(tela.getByRole('button', { name: 'Marcar visita como Executada' })).toBeTruthy();
  });

  test('visita pendente começa sem status de resultado selecionado', async () => {
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Inspeção', status: 'Pendente',
    }]} />);

    expect(tela.getByRole('button', { name: 'Marcar visita como Frustrada' }).props.accessibilityState).toEqual({ selected: false });
    expect(tela.queryByLabelText('Motivo da visita')).toBeNull();
  });

  test('Estou aqui registra horário e localização simulada', async () => {
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1',
      data: '10/11/2026',
      local: 'Casa da família — Rua das Flores, 10',
      servico: 'Inspeção',
      status: 'Pendente',
    }]} />);

    await act(async () => {
      await fireEvent.press(tela.getByRole('button', { name: 'Estou aqui' }));
    });

    await waitFor(() => {
      expect(tela.getByText(/Horário de chegada:/)).toBeTruthy();
      expect(tela.getByText('Endereço da chegada: Rua das Palmeiras, 45 - Asa Norte - Brasília - DF')).toBeTruthy();
    });
    expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
    expect(Location.reverseGeocodeAsync).toHaveBeenCalledWith({ latitude: -15.79, longitude: -47.88 });
    expect(tela.queryByRole('button', { name: 'Estou aqui' })).toBeNull();
  });

  test('registra o horário de saída depois da chegada', async () => {
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Inspeção', status: 'Pendente',
      horarioChegada: '2026-11-06T10:00:00.000Z', latitude: -15.79, longitude: -47.88,
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Registrar saída' }));

    expect(tela.getByText(/Horário de saída:/)).toBeTruthy();
    expect(tela.queryByRole('button', { name: 'Registrar saída' })).toBeNull();
  });

  test('exige foto depois antes de registrar saída da aspiração', async () => {
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Aspiração - Liberar o uso', status: 'Pendente',
      horarioChegada: '2026-11-10T10:00:00.000Z', latitude: -15.79, longitude: -47.88,
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Registrar saída' }));

    expect(alerta).toHaveBeenCalledWith('Foto depois obrigatória', 'Anexe a foto depois da aspiração antes de registrar a saída.');
    expect(tela.queryByText(/Horário de saída:/)).toBeNull();
    expect(tela.getByRole('button', { name: 'Registrar saída' })).toBeTruthy();
  });

  test('permite registrar saída da aspiração com foto depois', async () => {
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Aspiração - Liberar o uso', status: 'Pendente',
      horarioChegada: '2026-11-10T10:00:00.000Z', latitude: -15.79, longitude: -47.88, fotoDepois: 'file:///foto-depois.jpg',
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Registrar saída' }));

    expect(tela.getByText(/Horário de saída:/)).toBeTruthy();
    expect(alerta).not.toHaveBeenCalled();
  });

  test('avisa quando a permissão de localização é negada', async () => {
    Location.getForegroundPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Inspeção', status: 'Pendente',
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Estou aqui' }));

    const aviso = alerta.mock.calls.find(([titulo]) => titulo === 'Acesso à localização');
    expect(aviso[1]).toBe('Para registrar a chegada, o Pool Day precisa usar o GPS do aparelho.');
    await act(async () => aviso[2].find((botao) => botao.text === 'Continuar').onPress());
    await waitFor(() => expect(alerta).toHaveBeenCalledWith('Permissão necessária', 'Permita o acesso à localização para registrar sua chegada.'));
    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
    expect(tela.getByRole('button', { name: 'Estou aqui' })).toBeTruthy();
  });

  test('avisa quando não consegue obter a localização', async () => {
    Location.getCurrentPositionAsync.mockRejectedValue(new Error('GPS indisponível'));
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Inspeção', status: 'Pendente',
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Estou aqui' }));

    await waitFor(() => expect(alerta).toHaveBeenCalledWith('Localização indisponível', 'Não foi possível obter sua localização. Verifique o GPS e tente novamente.'));
    expect(tela.getByRole('button', { name: 'Estou aqui' })).toBeTruthy();
  });

  test('avisa quando os serviços de localização estão desligados', async () => {
    Location.hasServicesEnabledAsync.mockResolvedValue(false);
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Inspeção', status: 'Pendente',
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Estou aqui' }));

    await waitFor(() => expect(alerta).toHaveBeenCalledWith('Localização desativada', 'Ative o serviço de localização do aparelho e tente novamente.'));
    expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  test('mantém as coordenadas se não encontrar um endereço', async () => {
    Location.reverseGeocodeAsync.mockResolvedValue([]);
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Inspeção', status: 'Pendente',
    }]} />);

    await act(async () => {
      await fireEvent.press(tela.getByRole('button', { name: 'Estou aqui' }));
    });

    await waitFor(() => expect(tela.getByText('Endereço da chegada: -15.79, -47.88')).toBeTruthy());
  });

  test('mostra quando uma visita ainda não tem fotos', async () => {
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Inspeção', status: 'Pendente',
    }]} />);

    expect(tela.getByText('Nenhuma foto antes anexada.')).toBeTruthy();
    expect(tela.getByText('Nenhuma foto depois anexada.')).toBeTruthy();
  });

  test('anexa fotos do antes e depois pela galeria', async () => {
    ImagePicker.launchImageLibraryAsync
      .mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'file:///foto-antes.jpg' }] })
      .mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'file:///foto-depois.jpg' }] });
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Inspeção', status: 'Pendente',
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar foto antes' }));
    let escolha = alerta.mock.calls.find(([titulo]) => titulo === 'Foto antes do atendimento');
    await act(async () => escolha[2].find((botao) => botao.text === 'Galeria').onPress());
    await waitFor(() => expect(tela.getByLabelText('Foto antes do atendimento')).toBeTruthy());

    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar foto depois' }));
    escolha = alerta.mock.calls.find(([titulo]) => titulo === 'Foto depois do atendimento');
    await act(async () => escolha[2].find((botao) => botao.text === 'Galeria').onPress());
    await waitFor(() => expect(tela.getByLabelText('Foto depois do atendimento')).toBeTruthy());

    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledTimes(2);
  });

  test('tira foto do atendimento com a câmera', async () => {
    ImagePicker.launchCameraAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///foto-camera.jpg' }] });
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Inspeção', status: 'Pendente',
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar foto antes' }));
    const escolha = alerta.mock.calls.find(([titulo]) => titulo === 'Foto antes do atendimento');
    await act(async () => escolha[2].find((botao) => botao.text === 'Câmera').onPress());

    await waitFor(() => expect(tela.getByLabelText('Foto antes do atendimento')).toBeTruthy());
    expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
    expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
  });

  test('avisa quando a permissão da câmera é negada', async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: false });
    const tela = await render(<App visitasIniciais={[{
      id: 'visita-1', data: '10/11/2026', local: 'Casa da família', servico: 'Inspeção', status: 'Pendente',
    }]} />);

    await fireEvent.press(tela.getByRole('button', { name: 'Adicionar foto antes' }));
    const escolha = alerta.mock.calls.find(([titulo]) => titulo === 'Foto antes do atendimento');
    await act(async () => escolha[2].find((botao) => botao.text === 'Câmera').onPress());

    expect(alerta).toHaveBeenCalledWith('Permissão necessária', 'Permita o acesso à câmera para tirar a foto do atendimento.');
    expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
    expect(tela.getByText('Nenhuma foto antes anexada.')).toBeTruthy();
  });

});
