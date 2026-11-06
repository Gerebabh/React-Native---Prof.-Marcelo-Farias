import { Alert } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import App from '../App';

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

  beforeEach(() => { alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => {}); });
  afterEach(() => { alerta.mockRestore(); });

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
});
