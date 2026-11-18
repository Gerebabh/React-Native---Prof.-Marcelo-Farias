import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import CalculadoraProdutos from '../components/CalculadoraProdutos';

test('calcula a dose de choque por 1.000 litros sem exigir um agendamento', async () => {
  const produto = { id: 'cloro-1', nome: 'Cloro', unidade: 'kg' };
  const tela = await render(<CalculadoraProdutos produtos={[produto]} />);

  fireEvent(tela.getByLabelText('Produto para calcular'), 'valueChange', 'cloro-1');
  await fireEvent.changeText(tela.getByLabelText('Dose indicada no rótulo'), '20');
  await fireEvent.changeText(tela.getByLabelText('Litragem da piscina'), '13000');
  await fireEvent.press(tela.getByRole('button', { name: 'Calcular dose' }));

  expect(tela.getByText('Dose calculada para esta piscina: 260 g')).toBeTruthy();
});

test('pede os dados necessários antes de calcular', async () => {
  const tela = await render(<CalculadoraProdutos produtos={[{ id: 'cloro-1', nome: 'Cloro', unidade: 'kg' }]} />);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});

  fireEvent(tela.getByLabelText('Produto para calcular'), 'valueChange', 'cloro-1');
  await fireEvent.press(tela.getByRole('button', { name: 'Calcular dose' }));

  expect(Alert.alert).toHaveBeenCalledWith('Dados incompletos', 'Informe o produto, a dose do rótulo e a litragem da piscina.');
  Alert.alert.mockRestore();
});
