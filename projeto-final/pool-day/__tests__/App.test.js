import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import App from '../App';

describe('cadastro da residência', () => {
  let alerta;

  beforeEach(() => {
    alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alerta.mockRestore();
  });

  test('mostra o nome do aplicativo', async () => {
    const { getByText } = await render(<App />);

    expect(getByText('Pool Day')).toBeTruthy();
  });

  test.each([
    ['Nome da residência', 'Casa'],
    ['Endereço', 'Rua das Flores, 10'],
    ['Tipo de piscina', 'Fibra'],
    ['Litragem em litros (ex.: 13000)', '13000'],
  ])('exige o campo %s', async (campoVazio) => {
    const { getByPlaceholderText, getByRole } = await render(<App />);
    const campos = [
      ['Nome da residência', 'Casa'],
      ['Endereço', 'Rua das Flores, 10'],
      ['Tipo de piscina', 'Fibra'],
      ['Litragem em litros (ex.: 13000)', '13000'],
    ];

    for (const [placeholder, valor] of campos) {
      if (placeholder !== campoVazio) {
        await fireEvent.changeText(getByPlaceholderText(placeholder), valor);
      }
    }

    await fireEvent.press(getByRole('button', { name: 'Salvar residência' }));

    expect(alerta).toHaveBeenCalledWith(
      'Cadastro incompleto',
      'Preencha todos os campos da residência e da piscina.'
    );
  });

  test.each(['0', '-500', 'abc', '13.5'])(
    'não aceita a litragem inválida "%s"',
    async (litragem) => {
      const { getByPlaceholderText, getByRole } = await render(<App />);

      await fireEvent.changeText(getByPlaceholderText('Nome da residência'), 'Casa');
      await fireEvent.changeText(getByPlaceholderText('Endereço'), 'Rua das Flores, 10');
      await fireEvent.changeText(getByPlaceholderText('Tipo de piscina'), 'Fibra');
      await fireEvent.changeText(getByPlaceholderText('Litragem em litros (ex.: 13000)'), litragem);
      await fireEvent.press(getByRole('button', { name: 'Salvar residência' }));

      expect(alerta).toHaveBeenCalledWith(
        'Litragem inválida',
        'Informe uma litragem inteira maior que zero.'
      );
    }
  );

  test('salva e mostra os dados válidos da residência e da piscina', async () => {
    const { getByPlaceholderText, getByRole, getByText } = await render(<App />);

    await fireEvent.changeText(getByPlaceholderText('Nome da residência'), 'Casa da família');
    await fireEvent.changeText(getByPlaceholderText('Endereço'), 'Rua das Flores, 10');
    await fireEvent.changeText(getByPlaceholderText('Tipo de piscina'), 'Fibra');
    await fireEvent.changeText(getByPlaceholderText('Litragem em litros (ex.: 13000)'), '13000');
    await fireEvent.press(getByRole('button', { name: 'Salvar residência' }));

    expect(getByText('Residência cadastrada')).toBeTruthy();
    expect(getByText('Casa da família')).toBeTruthy();
    expect(getByText('Endereço: Rua das Flores, 10')).toBeTruthy();
    expect(getByText('Piscina de Fibra • 13000 L')).toBeTruthy();
  });
});
