import { render } from '@testing-library/react-native';
import App from '../App';

test('mostra o nome do aplicativo', async () => {
  const { getByText } = await render(<App />);

  expect(getByText('Pool Day')).toBeTruthy();
});
